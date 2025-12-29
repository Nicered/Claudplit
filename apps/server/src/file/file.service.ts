import { Injectable, NotFoundException } from "@nestjs/common";
import { ProjectService } from "../project/project.service";
import * as fs from "fs/promises";
import * as path from "path";

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
  size?: number;
  extension?: string;
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
}
