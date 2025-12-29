import { Controller, Get, Param, Query } from "@nestjs/common";
import { FileService, FileNode } from "./file.service";

@Controller("projects/:projectId/files")
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get()
  async getFileTree(
    @Param("projectId") projectId: string,
    @Query("path") relativePath?: string
  ): Promise<FileNode[]> {
    return this.fileService.getFileTree(projectId, relativePath);
  }

  @Get("content")
  async getFileContent(
    @Param("projectId") projectId: string,
    @Query("path") filePath: string
  ): Promise<{ content: string; language: string }> {
    return this.fileService.getFileContent(projectId, filePath);
  }
}
