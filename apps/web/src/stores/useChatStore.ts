import { create } from "zustand";
import { api } from "@/lib/api";
import { Role, type ChatMessage, type StreamEvent } from "@claudplit/shared";

export interface StreamingBlock {
  id: string;
  type: "text" | "tool_use" | "tool_result";
  content?: string;
  tool?: {
    name: string;
    input?: Record<string, unknown>;
  };
  status?: "running" | "completed" | "error";
  result?: string;
}

interface ActiveSessionStatus {
  isStreaming: boolean;
  currentTool: string | null;
  toolInput: Record<string, unknown> | null;
  streamingContent: string;
  startedAt: number;
}

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingBlocks: StreamingBlock[];
  error: string | null;

  fetchMessages: (projectId: string) => Promise<void>;
  fetchActiveSession: (projectId: string) => Promise<void>;
  sendMessage: (projectId: string, content: string) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isStreaming: false,
  streamingBlocks: [],
  error: null,

  fetchMessages: async (projectId: string) => {
    try {
      const messages = await api.get<ChatMessage[]>(
        `/projects/${projectId}/messages`
      );
      set({ messages, error: null });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch messages",
      });
    }
  },

  fetchActiveSession: async (projectId: string) => {
    try {
      const status = await api.get<ActiveSessionStatus>(
        `/projects/${projectId}/chat/status`
      );

      const currentState = get();

      if (status.isStreaming) {
        // Only update if we're not already streaming locally (avoid overwriting local state)
        if (!currentState.isStreaming) {
          // Recovering from page refresh - restore state from server
          const blocks: StreamingBlock[] = [];
          if (status.streamingContent) {
            blocks.push({
              id: "text-recovery",
              type: "text",
              content: status.streamingContent,
            });
          }
          if (status.currentTool) {
            blocks.push({
              id: `tool-${Date.now()}`,
              type: "tool_use",
              tool: {
                name: status.currentTool,
                input: status.toolInput || undefined,
              },
              status: "running",
            });
          }

          set({
            isStreaming: true,
            streamingBlocks: blocks,
          });
        }
        // If already streaming locally, don't overwrite - local SSE stream is handling it
      } else {
        // Only reset if we were previously streaming
        if (currentState.isStreaming) {
          // Refresh messages when streaming ends
          await get().fetchMessages(projectId);
          set({
            isStreaming: false,
            streamingBlocks: [],
          });
        }
      }
    } catch (error) {
      // Ignore errors for status check
    }
  },

  sendMessage: async (projectId: string, content: string) => {
    // Optimistic update: add user message immediately
    const optimisticUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      projectId,
      role: Role.USER,
      content,
      createdAt: new Date(),
    };

    set((state) => ({
      messages: [...state.messages, optimisticUserMessage],
      isStreaming: true,
      streamingBlocks: [],
      error: null
    }));

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:14000/api"}/projects/${projectId}/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              console.log("[SSE Event]", data.type, data);

              if (data.type === "text" && data.content) {
                // Add text block
                const textBlock: StreamingBlock = {
                  id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  type: "text",
                  content: data.content,
                };
                set((state) => ({
                  streamingBlocks: [...state.streamingBlocks, textBlock],
                }));
              } else if (data.type === "tool_use" && data.tool) {
                // Add tool_use block
                const toolBlock: StreamingBlock = {
                  id: `tool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  type: "tool_use",
                  tool: {
                    name: data.tool.name,
                    input: data.tool.input,
                  },
                  status: "running",
                };
                set((state) => ({
                  streamingBlocks: [...state.streamingBlocks, toolBlock],
                }));
              } else if (data.type === "tool_result") {
                // Update the last running tool_use block with result
                set((state) => {
                  const blocks = [...state.streamingBlocks];
                  // Find the last running tool_use block
                  for (let i = blocks.length - 1; i >= 0; i--) {
                    if (blocks[i].type === "tool_use" && blocks[i].status === "running") {
                      blocks[i] = {
                        ...blocks[i],
                        status: "completed",
                        result: data.content,
                      };
                      break;
                    }
                  }
                  return { streamingBlocks: blocks };
                });
              } else if (data.type === "error") {
                set({ error: data.error });
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }

      // Refresh messages after streaming completes
      await get().fetchMessages(projectId);
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to send message",
      });
    } finally {
      // Keep streamingBlocks visible, only mark streaming as done
      set({ isStreaming: false });
    }
  },

  addMessage: (message: ChatMessage) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  clearMessages: () => {
    set({ messages: [], streamingBlocks: [] });
  },

  clearError: () => {
    set({ error: null });
  },
}));
