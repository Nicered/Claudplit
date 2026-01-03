import { Module } from "@nestjs/common";
import { ProjectContextService } from "./project-context.service";
import { ProjectContextController } from "./project-context.controller";
import { ProjectModule } from "../project/project.module";

@Module({
  imports: [ProjectModule],
  controllers: [ProjectContextController],
  providers: [ProjectContextService],
  exports: [ProjectContextService],
})
export class ProjectContextModule {}
