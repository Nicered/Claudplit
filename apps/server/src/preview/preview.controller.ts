import { Controller, Get, Post, Param } from "@nestjs/common";
import { PreviewService } from "./preview.service";

@Controller("projects/:projectId/preview")
export class PreviewController {
  constructor(private readonly previewService: PreviewService) {}

  @Get("status")
  getStatus(@Param("projectId") projectId: string) {
    return this.previewService.getStatus(projectId);
  }

  @Get("ready")
  checkReady(@Param("projectId") projectId: string) {
    return this.previewService.checkProjectReady(projectId);
  }

  @Post("start")
  start(@Param("projectId") projectId: string) {
    return this.previewService.start(projectId);
  }

  @Post("stop")
  stop(@Param("projectId") projectId: string) {
    return this.previewService.stop(projectId);
  }
}
