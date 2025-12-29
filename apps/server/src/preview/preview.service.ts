import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { spawn, ChildProcess } from "child_process";
import { ProjectService } from "../project/project.service";
import * as net from "net";
import * as fs from "fs";
import * as path from "path";

export interface PreviewInfo {
  projectId: string;
  port: number;
  pid: number;
  status: "stopped" | "starting" | "running" | "error";
  process?: ChildProcess;
}

export interface PreviewStatus {
  status: "stopped" | "starting" | "running" | "error";
  url?: string;
  error?: string;
}

@Injectable()
export class PreviewService {
  private readonly logger = new Logger(PreviewService.name);
  private previews: Map<string, PreviewInfo> = new Map();
  private readonly portRange = { min: 3001, max: 3099 };

  constructor(private projectService: ProjectService) {}

  async getStatus(projectId: string): Promise<PreviewStatus> {
    const preview = this.previews.get(projectId);
    if (!preview) {
      return { status: "stopped" };
    }

    return {
      status: preview.status,
      url:
        preview.status === "running"
          ? `http://localhost:${preview.port}`
          : undefined,
    };
  }

  async checkProjectReady(projectId: string): Promise<{
    ready: boolean;
    hasPackageJson: boolean;
    hasNodeModules: boolean;
    hasDevScript: boolean;
  }> {
    try {
      const projectPath = await this.projectService.getProjectPath(projectId);
      const packageJsonPath = path.join(projectPath, "package.json");
      const nodeModulesPath = path.join(projectPath, "node_modules");

      const hasPackageJson = fs.existsSync(packageJsonPath);
      const hasNodeModules = fs.existsSync(nodeModulesPath);

      let hasDevScript = false;
      if (hasPackageJson) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
          hasDevScript = !!packageJson.scripts?.dev;
        } catch {
          // Invalid package.json
        }
      }

      return {
        ready: hasPackageJson && hasDevScript,
        hasPackageJson,
        hasNodeModules,
        hasDevScript,
      };
    } catch {
      return {
        ready: false,
        hasPackageJson: false,
        hasNodeModules: false,
        hasDevScript: false,
      };
    }
  }

  async start(projectId: string): Promise<PreviewStatus> {
    // Check if already running
    const existing = this.previews.get(projectId);
    if (existing && existing.status === "running") {
      return {
        status: "running",
        url: `http://localhost:${existing.port}`,
      };
    }

    try {
      const projectPath = await this.projectService.getProjectPath(projectId);

      // Check if package.json exists
      const packageJsonPath = path.join(projectPath, "package.json");
      if (!fs.existsSync(packageJsonPath)) {
        return {
          status: "error",
          error: "프로젝트가 아직 준비되지 않았습니다. AI가 작업을 완료할 때까지 기다려주세요.",
        };
      }

      // Read and validate package.json
      let packageJson: { scripts?: Record<string, string> };
      try {
        packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      } catch (e) {
        return {
          status: "error",
          error: "package.json 파일을 읽을 수 없습니다.",
        };
      }

      // Check if dev script exists
      if (!packageJson.scripts?.dev) {
        return {
          status: "error",
          error: "package.json에 dev 스크립트가 없습니다.",
        };
      }

      // Check if node_modules exists
      const nodeModulesPath = path.join(projectPath, "node_modules");
      if (!fs.existsSync(nodeModulesPath)) {
        // Try to install dependencies first
        this.logger.log(`Installing dependencies for project ${projectId}`);
        try {
          await this.installDependencies(projectPath);
        } catch (e) {
          return {
            status: "error",
            error: "의존성 설치에 실패했습니다. 터미널에서 npm install을 실행해주세요.",
          };
        }
      }

      const port = await this.findAvailablePort();

      this.logger.log(
        `Starting preview for project ${projectId} on port ${port}`
      );

      const previewInfo: PreviewInfo = {
        projectId,
        port,
        pid: 0,
        status: "starting",
      };

      this.previews.set(projectId, previewInfo);

      // Start the dev server
      const proc = spawn("npm", ["run", "dev", "--", "--port", String(port)], {
        cwd: projectPath,
        shell: true,
        env: { ...process.env, PORT: String(port) },
      });

      previewInfo.process = proc;
      previewInfo.pid = proc.pid || 0;

      proc.stdout.on("data", (data: Buffer) => {
        const output = data.toString();
        this.logger.debug(`[Preview ${projectId}] ${output}`);

        // Check if server is ready
        if (
          output.includes("Ready") ||
          output.includes("started") ||
          output.includes("localhost")
        ) {
          previewInfo.status = "running";
        }
      });

      proc.stderr.on("data", (data: Buffer) => {
        const output = data.toString();
        this.logger.debug(`[Preview ${projectId} stderr] ${output}`);
      });

      proc.on("close", (code) => {
        this.logger.log(`Preview for ${projectId} closed with code ${code}`);
        this.previews.delete(projectId);
      });

      proc.on("error", (error) => {
        this.logger.error(`Preview error for ${projectId}: ${error.message}`);
        previewInfo.status = "error";
      });

      // Wait for server to start
      await this.waitForServer(port, 30000);
      previewInfo.status = "running";

      return {
        status: "running",
        url: `http://localhost:${port}`,
      };
    } catch (error) {
      this.logger.error(`Failed to start preview: ${error}`);
      this.previews.delete(projectId);
      return {
        status: "error",
        error: error instanceof Error ? error.message : "Failed to start preview",
      };
    }
  }

  async stop(projectId: string): Promise<PreviewStatus> {
    const preview = this.previews.get(projectId);
    if (!preview || !preview.process) {
      return { status: "stopped" };
    }

    this.logger.log(`Stopping preview for project ${projectId}`);

    preview.process.kill("SIGTERM");
    this.previews.delete(projectId);

    return { status: "stopped" };
  }

  getPreviewPort(projectId: string): number | null {
    const preview = this.previews.get(projectId);
    return preview?.status === "running" ? preview.port : null;
  }

  async stopAll(): Promise<void> {
    for (const [projectId, preview] of this.previews) {
      if (preview.process) {
        preview.process.kill("SIGTERM");
      }
    }
    this.previews.clear();
  }

  private async findAvailablePort(): Promise<number> {
    for (let port = this.portRange.min; port <= this.portRange.max; port++) {
      const isAvailable = await this.isPortAvailable(port);
      if (isAvailable) {
        return port;
      }
    }
    throw new Error("No available port found");
  }

  private isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.listen(port, () => {
        server.close(() => resolve(true));
      });
      server.on("error", () => resolve(false));
    });
  }

  private waitForServer(port: number, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const check = () => {
        const socket = new net.Socket();

        socket.setTimeout(1000);
        socket.once("connect", () => {
          socket.destroy();
          resolve();
        });
        socket.once("timeout", () => {
          socket.destroy();
          retry();
        });
        socket.once("error", () => {
          socket.destroy();
          retry();
        });

        socket.connect(port, "localhost");
      };

      const retry = () => {
        if (Date.now() - startTime > timeout) {
          reject(new Error("Server start timeout"));
        } else {
          setTimeout(check, 500);
        }
      };

      check();
    });
  }

  private installDependencies(projectPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn("npm", ["install"], {
        cwd: projectPath,
        shell: true,
        env: { ...process.env },
      });

      proc.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`npm install exited with code ${code}`));
        }
      });

      proc.on("error", (error) => {
        reject(error);
      });

      // Timeout after 60 seconds
      setTimeout(() => {
        if (!proc.killed) {
          proc.kill("SIGTERM");
          reject(new Error("npm install timeout"));
        }
      }, 60000);
    });
  }
}
