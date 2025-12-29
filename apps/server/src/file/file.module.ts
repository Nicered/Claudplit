import { Module } from "@nestjs/common";
import { FileController } from "./file.controller";
import { FileService } from "./file.service";
import { ProjectModule } from "../project/project.module";

@Module({
  imports: [ProjectModule],
  controllers: [FileController],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
