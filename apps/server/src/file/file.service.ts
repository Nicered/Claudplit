import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { ProjectService } from "../project/project.service";
import * as fs from "fs/promises";
import * as path from "path";
import { randomUUID } from "crypto";

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
  size?: number;
  extension?: string;
}

export interface UploadedFile {
  id: string;
  originalName: string;
  fileName: string;
  path: string;
  mimeType: string;
  size: number;
}

@Injectable()
export class FileService {
  private readonly ignoreList = [
    "node_modules",
    ".git",
    "__pycache__",
    "venv",
    ".venv",
    ".next",
    "dist",
    ".cache",
    ".turbo",
    "coverage",
    ".nyc_output",
  ];

  constructor(private projectService: ProjectService) {}

  async getFileTree(
    projectId: string,
    relativePath?: string
  ): Promise<FileNode[]> {
    const projectPath = await this.projectService.getProjectPath(projectId);
    const targetPath = relativePath
      ? path.join(projectPath, relativePath)
      : projectPath;

    // Security: Prevent directory traversal
    if (!targetPath.startsWith(projectPath)) {
      throw new NotFoundException("Invalid path");
    }

    try {
      await fs.access(targetPath);
    } catch {
      return [];
    }

    return this.scanDirectory(targetPath, projectPath);
  }

  private async scanDirectory(
    dirPath: string,
    basePath: string
  ): Promise<FileNode[]> {
    let items;
    try {
      items = await fs.readdir(dirPath, { withFileTypes: true });
    } catch {
      return [];
    }

    const nodes: FileNode[] = [];

    for (const item of items) {
      if (this.ignoreList.includes(item.name)) continue;
      if (item.name.startsWith(".")) continue;

      const fullPath = path.join(dirPath, item.name);
      const relativePath = path.relative(basePath, fullPath);

      if (item.isDirectory()) {
        const children = await this.scanDirectory(fullPath, basePath);
        nodes.push({
          name: item.name,
          path: relativePath,
          type: "directory",
          children,
        });
      } else {
        try {
          const stats = await fs.stat(fullPath);
          nodes.push({
            name: item.name,
            path: relativePath,
            type: "file",
            size: stats.size,
            extension: path.extname(item.name).slice(1) || undefined,
          });
        } catch {
          // Skip files that can't be read
        }
      }
    }

    // Sort: directories first, then files (alphabetically)
    return nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  async getFileContent(
    projectId: string,
    filePath: string
  ): Promise<{ content: string; language: string }> {
    const projectPath = await this.projectService.getProjectPath(projectId);
    const fullPath = path.join(projectPath, filePath);

    // Security: Prevent directory traversal
    if (!fullPath.startsWith(projectPath)) {
      throw new NotFoundException("Invalid file path");
    }

    try {
      const content = await fs.readFile(fullPath, "utf-8");
      const extension = path.extname(filePath).slice(1);
      const language = this.getLanguageFromExtension(extension);
      return { content, language };
    } catch {
      throw new NotFoundException("File not found");
    }
  }

  private getLanguageFromExtension(ext: string): string {
    const languageMap: Record<string, string> = {
      ts: "typescript",
      tsx: "typescript",
      js: "javascript",
      jsx: "javascript",
      py: "python",
      json: "json",
      md: "markdown",
      css: "css",
      scss: "scss",
      html: "html",
      yaml: "yaml",
      yml: "yaml",
      prisma: "prisma",
      sql: "sql",
      sh: "bash",
      env: "dotenv",
    };
    return languageMap[ext] || "plaintext";
  }

  private readonly allowedMimeTypes = [
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  async uploadFiles(
    projectId: string,
    files: Express.Multer.File[]
  ): Promise<UploadedFile[]> {
    const projectPath = await this.projectService.getProjectPath(projectId);
    const uploadsDir = path.join(projectPath, "uploads");

    await fs.mkdir(uploadsDir, { recursive: true });

    const uploadedFiles: UploadedFile[] = [];

    for (const file of files) {
      if (!this.allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `File type not allowed: ${file.mimetype}`
        );
      }

      const id = randomUUID().slice(0, 8);
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "-");
      const fileName = `${id}-${sanitizedName}`;
      const filePath = path.join(uploadsDir, fileName);

      await fs.writeFile(filePath, file.buffer);

      uploadedFiles.push({
        id,
        originalName: file.originalname,
        fileName,
        path: `uploads/${fileName}`,
        mimeType: file.mimetype,
        size: file.size,
      });
    }

    return uploadedFiles;
  }

  async getUploadedFilePath(
    projectId: string,
    relativePath: string
  ): Promise<string> {
    const projectPath = await this.projectService.getProjectPath(projectId);
    const fullPath = path.join(projectPath, relativePath);

    if (!fullPath.startsWith(projectPath)) {
      throw new BadRequestException("Invalid file path");
    }

    try {
      await fs.access(fullPath);
      return fullPath;
    } catch {
      throw new NotFoundException("File not found");
    }
  }
}
