import { Module, OnModuleDestroy } from "@nestjs/common";
import { PreviewController } from "./preview.controller";
import { PreviewService } from "./preview.service";
import { ProjectModule } from "../project/project.module";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [ProjectModule, PrismaModule],
  controllers: [PreviewController],
  providers: [PreviewService],
  exports: [PreviewService],
})
export class PreviewModule implements OnModuleDestroy {
  constructor(private previewService: PreviewService) {}

  async onModuleDestroy() {
    await this.previewService.stopAll();
  }
}
