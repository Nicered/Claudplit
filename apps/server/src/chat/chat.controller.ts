import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Sse,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { ChatService } from "./chat.service";
import { SendMessageDto } from "./dto/send-message.dto";

@Controller("projects/:projectId")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get("messages")
  getMessages(
    @Param("projectId") projectId: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string
  ) {
    return this.chatService.getMessages(
      projectId,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0
    );
  }

  @Get("chat/status")
  getActiveSession(@Param("projectId") projectId: string) {
    const session = this.chatService.getActiveSession(projectId);
    if (!session) {
      return { isStreaming: false };
    }
    return {
      isStreaming: session.isStreaming,
      currentTool: session.currentTool,
      toolInput: session.toolInput,
      streamingContent: session.streamingContent,
      startedAt: session.startedAt,
    };
  }

  @Post("chat")
  @Sse()
  sendMessage(
    @Param("projectId") projectId: string,
    @Body() dto: SendMessageDto
  ): Observable<MessageEvent> {
    return this.chatService.sendMessage(projectId, dto.content);
  }

  @Post("chat/reset")
  async resetSession(@Param("projectId") projectId: string) {
    await this.chatService.resetSession(projectId);
    return { success: true, message: "Session reset successfully" };
  }
}
