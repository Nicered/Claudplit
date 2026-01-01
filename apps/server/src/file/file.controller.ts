import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { FileService, FileNode, UploadedFile } from "./file.service";

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

  @Post("upload")
  @UseInterceptors(
    FilesInterceptor("files", 5, {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
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
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`File type not allowed: ${file.mimetype}`), false);
        }
      },
    })
  )
  async uploadFiles(
    @Param("projectId") projectId: string,
    @UploadedFiles() files: Express.Multer.File[]
  ): Promise<{ files: UploadedFile[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException("No files uploaded");
    }
    const uploadedFiles = await this.fileService.uploadFiles(projectId, files);
    return { files: uploadedFiles };
  }
}
