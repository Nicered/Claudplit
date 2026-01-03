import { Injectable, Logger, NotFoundException, BadRequestException } from "@nestjs/common";
import { ProjectService } from "../project/project.service";
import { spawn } from "child_process";
import * as fs from "fs/promises";
import * as path from "path";

export interface Checkpoint {
  id: string;
  hash: string;
  message: string;
  author: string;
  timestamp: number;
  filesChanged: number;
  insertions: number;
  deletions: number;
}

export interface CheckpointDiff {
  files: FileDiff[];
}

export interface FileDiff {
  path: string;
  status: "added" | "modified" | "deleted";
  additions: number;
  deletions: number;
  diff: string;
}

@Injectable()
export class CheckpointService {
  private readonly logger = new Logger(CheckpointService.name);

  constructor(private projectService: ProjectService) {}

  /**
   * Execute git command in project directory
   */
  private executeGit(projectPath: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn("git", args, {
        cwd: projectPath,
        shell: true,
      });

      let stdout = "";
      let stderr = "";

      proc.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      proc.on("close", (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error(stderr || `git exited with code ${code}`));
        }
      });

      proc.on("error", (err) => {
        reject(err);
      });
    });
  }

  /**
   * Check if project has git initialized
   */
  private async isGitRepo(projectPath: string): Promise<boolean> {
    const gitDir = path.join(projectPath, ".git");
    try {
      await fs.access(gitDir);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Initialize git repo if not exists
   */
  async initializeGit(projectId: string): Promise<void> {
    const projectPath = await this.projectService.getProjectPath(projectId);

    if (await this.isGitRepo(projectPath)) {
      return;
    }

    await this.executeGit(projectPath, ["init"]);
    await this.executeGit(projectPath, ["config", "user.email", "claudeship@local"]);
    await this.executeGit(projectPath, ["config", "user.name", "ClaudeShip"]);

    // Create initial commit
    await this.executeGit(projectPath, ["add", "-A"]);
    await this.executeGit(projectPath, ["commit", "-m", "Initial checkpoint", "--allow-empty"]);
  }

  /**
   * Get all checkpoints (commits) for a project
   */
  async getCheckpoints(projectId: string, limit: number = 50): Promise<Checkpoint[]> {
    const projectPath = await this.projectService.getProjectPath(projectId);

    if (!(await this.isGitRepo(projectPath))) {
      return [];
    }

    try {
      // Get commit log with stats
      const logOutput = await this.executeGit(projectPath, [
        "log",
        `--max-count=${limit}`,
        "--format=%H|%s|%an|%at",
        "--shortstat",
      ]);

      if (!logOutput) {
        return [];
      }

      const lines = logOutput.split("\n");
      const checkpoints: Checkpoint[] = [];
      let i = 0;

      while (i < lines.length) {
        const line = lines[i].trim();
        if (!line) {
          i++;
          continue;
        }

        const [hash, message, author, timestamp] = line.split("|");
        if (!hash || hash.length !== 40) {
          i++;
          continue;
        }

        let filesChanged = 0;
        let insertions = 0;
        let deletions = 0;

        // Check for stat line
        if (i + 1 < lines.length) {
          const statLine = lines[i + 1].trim();
          const filesMatch = statLine.match(/(\d+) files? changed/);
          const insertMatch = statLine.match(/(\d+) insertions?\(\+\)/);
          const deleteMatch = statLine.match(/(\d+) deletions?\(-\)/);

          if (filesMatch) filesChanged = parseInt(filesMatch[1], 10);
          if (insertMatch) insertions = parseInt(insertMatch[1], 10);
          if (deleteMatch) deletions = parseInt(deleteMatch[1], 10);

          if (filesMatch || insertMatch || deleteMatch) {
            i++;
          }
        }

        checkpoints.push({
          id: hash.slice(0, 8),
          hash,
          message: message || "No message",
          author: author || "Unknown",
          timestamp: parseInt(timestamp, 10) * 1000,
          filesChanged,
          insertions,
          deletions,
        });

        i++;
      }

      return checkpoints;
    } catch (error) {
      this.logger.error(`Failed to get checkpoints: ${error}`);
      return [];
    }
  }

  /**
   * Create a new checkpoint (commit)
   */
  async createCheckpoint(projectId: string, message: string): Promise<Checkpoint> {
    const projectPath = await this.projectService.getProjectPath(projectId);

    // Initialize git if needed
    await this.initializeGit(projectId);

    // Check for changes
    const status = await this.executeGit(projectPath, ["status", "--porcelain"]);
    if (!status) {
      throw new BadRequestException("No changes to checkpoint");
    }

    // Stage all changes
    await this.executeGit(projectPath, ["add", "-A"]);

    // Commit
    await this.executeGit(projectPath, ["commit", "-m", message]);

    // Get the new commit info
    const checkpoints = await this.getCheckpoints(projectId, 1);
    return checkpoints[0];
  }

  /**
   * Auto-create checkpoint if there are changes
   */
  async autoCheckpoint(projectId: string): Promise<Checkpoint | null> {
    const projectPath = await this.projectService.getProjectPath(projectId);

    // Initialize git if needed
    await this.initializeGit(projectId);

    // Check for changes
    const status = await this.executeGit(projectPath, ["status", "--porcelain"]);
    if (!status) {
      return null;
    }

    const timestamp = new Date().toLocaleTimeString();
    const message = `Auto checkpoint at ${timestamp}`;

    return this.createCheckpoint(projectId, message);
  }

  /**
   * Get diff between two checkpoints or current state
   */
  async getDiff(
    projectId: string,
    fromHash: string,
    toHash?: string
  ): Promise<CheckpointDiff> {
    const projectPath = await this.projectService.getProjectPath(projectId);

    const args = toHash
      ? ["diff", fromHash, toHash, "--stat", "--no-color"]
      : ["diff", fromHash, "--stat", "--no-color"];

    try {
      const statOutput = await this.executeGit(projectPath, args);

      // Get detailed diff
      const diffArgs = toHash
        ? ["diff", fromHash, toHash, "--no-color"]
        : ["diff", fromHash, "--no-color"];

      const diffOutput = await this.executeGit(projectPath, diffArgs);

      const files: FileDiff[] = [];
      const diffSections = diffOutput.split(/^diff --git/m).filter(Boolean);

      for (const section of diffSections) {
        const pathMatch = section.match(/a\/(.+?) b\//);
        if (!pathMatch) continue;

        const filePath = pathMatch[1];
        let status: FileDiff["status"] = "modified";
        let additions = 0;
        let deletions = 0;

        if (section.includes("new file mode")) {
          status = "added";
        } else if (section.includes("deleted file mode")) {
          status = "deleted";
        }

        // Count additions and deletions
        const lines = section.split("\n");
        for (const line of lines) {
          if (line.startsWith("+") && !line.startsWith("+++")) {
            additions++;
          } else if (line.startsWith("-") && !line.startsWith("---")) {
            deletions++;
          }
        }

        files.push({
          path: filePath,
          status,
          additions,
          deletions,
          diff: "diff --git" + section,
        });
      }

      return { files };
    } catch (error) {
      this.logger.error(`Failed to get diff: ${error}`);
      throw new BadRequestException("Failed to get diff");
    }
  }

  /**
   * Restore to a checkpoint
   */
  async restoreCheckpoint(projectId: string, hash: string): Promise<void> {
    const projectPath = await this.projectService.getProjectPath(projectId);

    // Create a backup checkpoint first
    try {
      await this.createCheckpoint(projectId, `Backup before restore to ${hash.slice(0, 8)}`);
    } catch {
      // Ignore if no changes
    }

    // Reset to the target checkpoint
    await this.executeGit(projectPath, ["reset", "--hard", hash]);
  }

  /**
   * Get current working directory status
   */
  async getStatus(projectId: string): Promise<{
    hasChanges: boolean;
    files: { path: string; status: string }[];
  }> {
    const projectPath = await this.projectService.getProjectPath(projectId);

    if (!(await this.isGitRepo(projectPath))) {
      return { hasChanges: false, files: [] };
    }

    try {
      const status = await this.executeGit(projectPath, ["status", "--porcelain"]);

      if (!status) {
        return { hasChanges: false, files: [] };
      }

      const files = status
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          const statusCode = line.slice(0, 2).trim();
          const filePath = line.slice(3);

          let statusText = "modified";
          if (statusCode === "A" || statusCode === "??") {
            statusText = "added";
          } else if (statusCode === "D") {
            statusText = "deleted";
          } else if (statusCode === "R") {
            statusText = "renamed";
          }

          return { path: filePath, status: statusText };
        });

      return { hasChanges: files.length > 0, files };
    } catch {
      return { hasChanges: false, files: [] };
    }
  }
}
