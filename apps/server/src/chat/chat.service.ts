import { Injectable, Logger } from "@nestjs/common";
import { Observable, Subject, map, finalize } from "rxjs";
import { PrismaService } from "../prisma/prisma.service";
import { ProjectService } from "../project/project.service";
import { ClaudeCliService, ClaudeStreamEvent } from "./claude-cli.service";
import { Role } from "@prisma/client";
import { randomUUID } from "crypto";
import { getSystemPrompt } from "./prompts";

export interface ChatStreamEvent {
  type: string;
  data: unknown;
}

export interface ActiveSessionState {
  projectId: string;
  sessionId: string;
  isStreaming: boolean;
  currentTool: string | null;
  toolInput: Record<string, unknown> | null;
  streamingContent: string;
  startedAt: number;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private activeSessions: Map<string, ActiveSessionState> = new Map();

  constructor(
    private prisma: PrismaService,
    private projectService: ProjectService,
    private claudeCliService: ClaudeCliService
  ) {}

  async getMessages(projectId: string, limit = 50, offset = 0) {
    return this.prisma.message.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
      take: limit,
      skip: offset,
    });
  }

  getActiveSession(projectId: string): ActiveSessionState | null {
    return this.activeSessions.get(projectId) || null;
  }

  sendMessage(
    projectId: string,
    content: string
  ): Observable<MessageEvent> {
    const sessionId = randomUUID();

    // Initialize active session state
    this.activeSessions.set(projectId, {
      projectId,
      sessionId,
      isStreaming: true,
      currentTool: null,
      toolInput: null,
      streamingContent: "",
      startedAt: Date.now(),
    });

    return new Observable((subscriber) => {
      (async () => {
        try {
          // Save user message
          const userMessage = await this.prisma.message.create({
            data: {
              projectId,
              role: Role.USER,
              content,
            },
          });

          subscriber.next({
            data: JSON.stringify({
              type: "user_message",
              messageId: userMessage.id,
            }),
          } as MessageEvent);

          // Get project info and path
          const project = await this.prisma.project.findUnique({
            where: { id: projectId },
          });

          if (!project) {
            throw new Error("Project not found");
          }

          const projectPath = await this.projectService.getProjectPath(projectId);

          // Build prompt with system context based on project type and backend framework
          const systemPrompt = getSystemPrompt(
            project.projectType,
            project.backendFramework
          );

          // If no session exists, include recent conversation history as context
          let conversationContext = "";
          if (!project.claudeSessionId) {
            conversationContext = await this.buildContextFromHistory(projectId);
            if (conversationContext) {
              this.logger.log(
                `Including conversation history context (no existing session)`
              );
            }
          }

          const fullPrompt = `[System Context]\n${systemPrompt}\n\n${conversationContext}[User Request]\n${content}`;

          // Execute Claude CLI with session resumption if available
          let fullResponse = "";
          let totalCost = 0;
          let newClaudeSessionId: string | null = null;
          const toolActivities: Array<{
            name: string;
            input?: Record<string, unknown>;
            status: "completed";
          }> = [];

          const cliStream = this.claudeCliService.executePrompt(
            projectPath,
            fullPrompt,
            sessionId,
            project.claudeSessionId || undefined
          );

          cliStream.subscribe({
            next: (event: ClaudeStreamEvent) => {
              this.logger.debug(`Sending SSE event: ${event.type}`);

              // Capture Claude session ID for conversation continuity
              if (event.type === "init" && event.sessionId) {
                newClaudeSessionId = event.sessionId;
                this.logger.log(`New Claude session ID: ${newClaudeSessionId}`);
              }

              // Update active session state
              const session = this.activeSessions.get(projectId);
              if (session) {
                if (event.type === "tool_use" && event.tool) {
                  session.currentTool = event.tool.name;
                  session.toolInput = event.tool.input || null;
                  // Track tool activities
                  toolActivities.push({
                    name: event.tool.name,
                    input: event.tool.input,
                    status: "completed",
                  });
                } else if (event.type === "tool_result") {
                  session.currentTool = null;
                  session.toolInput = null;
                } else if (event.type === "text" && event.content) {
                  session.streamingContent += event.content;
                  fullResponse += event.content;
                }
              }

              if (event.type === "complete" && event.cost) {
                totalCost = event.cost;
              }

              subscriber.next({
                data: JSON.stringify(event),
              } as MessageEvent);
            },
            error: async (error) => {
              this.logger.error(`Claude CLI error: ${error.message}`);
              this.activeSessions.delete(projectId);

              subscriber.next({
                data: JSON.stringify({
                  type: "error",
                  error: error.message,
                }),
              } as MessageEvent);
              subscriber.complete();
            },
            complete: async () => {
              // Clean up active session
              this.activeSessions.delete(projectId);

              // Save Claude session ID for conversation continuity
              if (newClaudeSessionId) {
                await this.prisma.project.update({
                  where: { id: projectId },
                  data: { claudeSessionId: newClaudeSessionId },
                });
                this.logger.log(`Saved Claude session ID for project ${projectId}`);
              }

              // Save assistant message with tool activities
              if (fullResponse || toolActivities.length > 0) {
                const assistantMessage = await this.prisma.message.create({
                  data: {
                    projectId,
                    role: Role.ASSISTANT,
                    content: fullResponse,
                    metadata: JSON.stringify({
                      cost: totalCost,
                      toolActivities: toolActivities,
                    }),
                  },
                });

                subscriber.next({
                  data: JSON.stringify({
                    type: "assistant_message",
                    messageId: assistantMessage.id,
                  }),
                } as MessageEvent);
              }

              subscriber.complete();
            },
          });
        } catch (error) {
          this.logger.error(`Chat error: ${error}`);
          this.activeSessions.delete(projectId);

          subscriber.next({
            data: JSON.stringify({
              type: "error",
              error: error instanceof Error ? error.message : "Unknown error",
            }),
          } as MessageEvent);
          subscriber.complete();
        }
      })();
    });
  }

  stopChat(sessionId: string): boolean {
    return this.claudeCliService.stopSession(sessionId);
  }

  async resetSession(projectId: string): Promise<void> {
    await this.prisma.project.update({
      where: { id: projectId },
      data: { claudeSessionId: null },
    });
    this.logger.log(`Session reset for project ${projectId}`);
  }

  private async buildContextFromHistory(
    projectId: string,
    maxMessages = 10
  ): Promise<string> {
    const messages = await this.prisma.message.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: maxMessages,
    });

    if (messages.length === 0) {
      return "";
    }

    // Reverse to get chronological order
    const chronological = messages.reverse();

    const contextLines = chronological.map((msg) => {
      const role = msg.role === "USER" ? "User" : "Assistant";
      // Truncate long messages to avoid token limits
      const content =
        msg.content.length > 500
          ? msg.content.substring(0, 500) + "..."
          : msg.content;
      return `${role}: ${content}`;
    });

    return `[Previous Conversation Context]\n${contextLines.join("\n\n")}\n\n[End of Context]\n\n`;
  }
}
