import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { SettingsService } from "../settings/settings.service";
import { randomUUID } from "crypto";
import * as path from "path";
import * as fs from "fs/promises";

export interface EnvVariable {
  key: string;
  value: string;
}

export interface EnvFile {
  path: string;
  variables: EnvVariable[];
}

@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService
  ) {}

  async findAll() {
    return this.prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        projectType: true,
        backendFramework: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async create(dto: CreateProjectDto) {
    // Use UUID for folder name to avoid issues with special characters
    const folderId = randomUUID();
    const projectsBasePath = await this.settingsService.getProjectsBasePath();
    const projectPath = path.join(projectsBasePath, folderId);

    // Create project directory
    await fs.mkdir(projectPath, { recursive: true });

    // Create frontend/backend directories for fullstack projects
    const isFullstack =
      dto.backendFramework &&
      dto.backendFramework !== "NONE";

    if (isFullstack) {
      await fs.mkdir(path.join(projectPath, "frontend"), { recursive: true });
      await fs.mkdir(path.join(projectPath, "backend"), { recursive: true });
    }

    // Create project in database
    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        projectType: dto.projectType,
        backendFramework: dto.backendFramework || "NONE",
        path: projectPath,
        description: dto.description,
      },
    });

    return project;
  }

  async remove(id: string) {
    const project = await this.findOne(id);

    // Delete from database
    await this.prisma.project.delete({
      where: { id },
    });

    // Optionally delete project directory
    try {
      await fs.rm(project.path, { recursive: true, force: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }
  }

  getProjectPath(id: string): Promise<string> {
    return this.findOne(id).then((project) => project.path);
  }

  // ==================== Environment Variables ====================

  /**
   * Get all .env files in a project
   */
  async getEnvFiles(projectId: string): Promise<EnvFile[]> {
    const project = await this.findOne(projectId);
    const projectPath = project.path;
    const envFiles: EnvFile[] = [];

    // Check for .env files in project root
    const rootEnvFiles = await this.findEnvFilesInDir(projectPath, "");

    // Check for fullstack projects (frontend/backend)
    const frontendPath = path.join(projectPath, "frontend");
    const backendPath = path.join(projectPath, "backend");

    try {
      await fs.access(frontendPath);
      const frontendEnvFiles = await this.findEnvFilesInDir(frontendPath, "frontend");
      envFiles.push(...frontendEnvFiles);
    } catch {
      // No frontend directory
    }

    try {
      await fs.access(backendPath);
      const backendEnvFiles = await this.findEnvFilesInDir(backendPath, "backend");
      envFiles.push(...backendEnvFiles);
    } catch {
      // No backend directory
    }

    // Add root env files if not a fullstack project
    if (envFiles.length === 0) {
      envFiles.push(...rootEnvFiles);
    }

    return envFiles;
  }

  private async findEnvFilesInDir(dirPath: string, prefix: string): Promise<EnvFile[]> {
    const envFiles: EnvFile[] = [];
    const envFileNames = [".env", ".env.local", ".env.development", ".env.production"];

    for (const fileName of envFileNames) {
      const filePath = path.join(dirPath, fileName);
      try {
        await fs.access(filePath);
        const content = await fs.readFile(filePath, "utf-8");
        const variables = this.parseEnvFile(content);
        envFiles.push({
          path: prefix ? `${prefix}/${fileName}` : fileName,
          variables,
        });
      } catch {
        // File doesn't exist
      }
    }

    return envFiles;
  }

  private parseEnvFile(content: string): EnvVariable[] {
    const variables: EnvVariable[] = [];
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        variables.push({ key, value });
      }
    }

    return variables;
  }

  /**
   * Get a specific .env file
   */
  async getEnvFile(projectId: string, envPath: string): Promise<EnvFile> {
    const project = await this.findOne(projectId);
    const filePath = path.join(project.path, envPath);

    try {
      const content = await fs.readFile(filePath, "utf-8");
      const variables = this.parseEnvFile(content);
      return { path: envPath, variables };
    } catch {
      throw new NotFoundException(`Env file not found: ${envPath}`);
    }
  }

  /**
   * Update environment variables in a .env file
   */
  async updateEnvFile(projectId: string, envPath: string, variables: EnvVariable[]): Promise<EnvFile> {
    const project = await this.findOne(projectId);
    const filePath = path.join(project.path, envPath);

    // Build .env content
    const content = variables
      .map(({ key, value }) => {
        // Quote values with spaces or special characters
        if (value.includes(" ") || value.includes("=") || value.includes("#")) {
          return `${key}="${value}"`;
        }
        return `${key}=${value}`;
      })
      .join("\n");

    await fs.writeFile(filePath, content + "\n", "utf-8");

    return { path: envPath, variables };
  }

  /**
   * Create a new .env file
   */
  async createEnvFile(projectId: string, envPath: string, variables: EnvVariable[]): Promise<EnvFile> {
    const project = await this.findOne(projectId);
    const filePath = path.join(project.path, envPath);

    // Check if file already exists
    try {
      await fs.access(filePath);
      throw new Error(`Env file already exists: ${envPath}`);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") {
        throw e;
      }
    }

    return this.updateEnvFile(projectId, envPath, variables);
  }

  /**
   * Delete an environment variable from a .env file
   */
  async deleteEnvVariable(projectId: string, envPath: string, key: string): Promise<EnvFile> {
    const envFile = await this.getEnvFile(projectId, envPath);
    const variables = envFile.variables.filter((v) => v.key !== key);
    return this.updateEnvFile(projectId, envPath, variables);
  }
}
