import { Module } from "@nestjs/common";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { ClaudeCliService } from "./claude-cli.service";
import { ProjectModule } from "../project/project.module";

@Module({
  imports: [ProjectModule],
  controllers: [ChatController],
  providers: [ChatService, ClaudeCliService],
  exports: [ChatService, ClaudeCliService],
})
export class ChatModule {}
