import { Module } from "@nestjs/common";
import { DatabaseController } from "./database.controller";
import { DatabaseService } from "./database.service";
import { ProjectModule } from "../project/project.module";

@Module({
  imports: [ProjectModule],
  controllers: [DatabaseController],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
