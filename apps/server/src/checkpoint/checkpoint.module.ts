import { Module } from "@nestjs/common";
import { CheckpointController } from "./checkpoint.controller";
import { CheckpointService } from "./checkpoint.service";
import { ProjectModule } from "../project/project.module";

@Module({
  imports: [ProjectModule],
  controllers: [CheckpointController],
  providers: [CheckpointService],
  exports: [CheckpointService],
})
export class CheckpointModule {}
