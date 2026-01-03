import { Module } from "@nestjs/common";
import { TestingController } from "./testing.controller";
import { TestingService } from "./testing.service";
import { ProjectModule } from "../project/project.module";
import { PreviewModule } from "../preview/preview.module";

@Module({
  imports: [ProjectModule, PreviewModule],
  controllers: [TestingController],
  providers: [TestingService],
  exports: [TestingService],
})
export class TestingModule {}
