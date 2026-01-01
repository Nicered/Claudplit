import { create } from "zustand";
import { api, type UploadedFile } from "@/lib/api";
import { Role, type ChatMessage, type StreamEvent, type ChatMode, type AskUserQuestionData } from "@claudeship/shared";

export interface AttachedFile {
  id: string;
  file: File;
  preview?: string;
  uploadedPath?: string;
  status: "pending" | "uploading" | "uploaded" | "error";
  error?: string;
}

export interface StreamingBlock {
  id: string;
  type: "text" | "tool_use" | "tool_result" | "ask_user_question";
  content?: string;
  tool?: {
    name: string;
    input?: Record<string, unknown>;
  };
  askUserQuestion?: AskUserQuestionData;
  status?: "running" | "completed" | "error" | "waiting";
  result?: string;
}

export interface QueuedMessage {
  id: string;
  content: string;
  status: "queued" | "processing";
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
  messageQueue: QueuedMessage[];
  isProcessingQueue: boolean;
  mode: ChatMode;
  pendingQuestion: AskUserQuestionData | null;
  attachedFiles: AttachedFile[];
  isUploading: boolean;

  fetchMessages: (projectId: string) => Promise<void>;
  fetchActiveSession: (projectId: string) => Promise<void>;
  sendMessage: (projectId: string, content: string, fromQueue?: boolean) => Promise<void>;
  queueMessage: (projectId: string, content: string) => void;
  processQueue: (projectId: string) => Promise<void>;
  respondToQuestion: (projectId: string, answers: Record<string, string>) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  clearError: () => void;
  setMode: (mode: ChatMode) => void;
  addFiles: (files: File[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  uploadFiles: (projectId: string) => Promise<string[]>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isStreaming: false,
  streamingBlocks: [],
  error: null,
  messageQueue: [],
  isProcessingQueue: false,
  mode: "build",
  pendingQuestion: null,
  attachedFiles: [],
  isUploading: false,

  setMode: (mode: ChatMode) => set({ mode }),

  addFiles: (files: File[]) => {
    const newFiles: AttachedFile[] = files.map((file) => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      status: "pending" as const,
    }));
    set((state) => ({
      attachedFiles: [...state.attachedFiles, ...newFiles],
    }));
  },

  removeFile: (id: string) => {
    set((state) => {
      const file = state.attachedFiles.find((f) => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return {
        attachedFiles: state.attachedFiles.filter((f) => f.id !== id),
      };
    });
  },

  clearFiles: () => {
    const files = get().attachedFiles;
    files.forEach((f) => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    set({ attachedFiles: [] });
  },

  uploadFiles: async (projectId: string): Promise<string[]> => {
    const pendingFiles = get().attachedFiles.filter((f) => f.status === "pending");
    if (pendingFiles.length === 0) {
      return get().attachedFiles
        .filter((f) => f.status === "uploaded" && f.uploadedPath)
        .map((f) => f.uploadedPath!);
    }

    set({ isUploading: true });

    try {
      set((state) => ({
        attachedFiles: state.attachedFiles.map((f) =>
          f.status === "pending" ? { ...f, status: "uploading" as const } : f
        ),
      }));

      const result = await api.uploadFiles(
        projectId,
        pendingFiles.map((f) => f.file)
      );

      const uploadedPaths: string[] = [];
      set((state) => ({
        attachedFiles: state.attachedFiles.map((f) => {
          if (f.status === "uploading") {
            const uploaded = result.files.find(
              (u) => u.originalName === f.file.name
            );
            if (uploaded) {
              uploadedPaths.push(uploaded.path);
              return { ...f, status: "uploaded" as const, uploadedPath: uploaded.path };
            }
          }
          return f;
        }),
      }));

      return [
        ...get().attachedFiles
          .filter((f) => f.status === "uploaded" && f.uploadedPath)
          .map((f) => f.uploadedPath!),
      ];
    } catch (error) {
      set((state) => ({
        attachedFiles: state.attachedFiles.map((f) =>
          f.status === "uploading"
            ? { ...f, status: "error" as const, error: (error as Error).message }
            : f
        ),
        error: error instanceof Error ? error.message : "Failed to upload files",
      }));
      return [];
    } finally {
      set({ isUploading: false });
    }
  },

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
          // Recovering from page refresh - connect to the subscribe endpoint to receive updates
          set({
            isStreaming: true,
            streamingBlocks: [],
          });

          // Connect to SSE subscribe endpoint
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:14000/api"}/projects/${projectId}/chat/subscribe`
          );

          if (!response.ok) {
            throw new Error("Failed to subscribe to session");
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error("No response body");
          }

          const decoder = new TextDecoder();
          let buffer = "";

          const processStream = async () => {
            try {
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
                      console.log("[SSE Subscribe Event]", data.type, data);

                      if (data.type === "no_active_session") {
                        // No active session, just finish
                        break;
                      }

                      if (data.type === "text" && data.content) {
                        const textBlock: StreamingBlock = {
                          id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                          type: "text",
                          content: data.content,
                        };
                        set((state) => ({
                          streamingBlocks: [...state.streamingBlocks, textBlock],
                        }));
                      } else if (data.type === "tool_use" && data.tool) {
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
                        set((state) => {
                          const blocks = [...state.streamingBlocks];
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
            } finally {
              // Refresh messages after streaming completes
              await get().fetchMessages(projectId);
              set({ isStreaming: false });
            }
          };

          processStream();
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
      console.error("Failed to fetch active session:", error);
    }
  },

  // Queue a message while streaming is in progress
  queueMessage: (projectId: string, content: string) => {
    const queuedMessage: QueuedMessage = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      status: "queued",
    };

    // Add to queue and also add as a user message for immediate display
    const optimisticUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      projectId,
      role: Role.USER,
      content,
      createdAt: new Date(),
    };

    set((state) => ({
      messageQueue: [...state.messageQueue, queuedMessage],
      messages: [...state.messages, optimisticUserMessage],
    }));
  },

  // Process the message queue sequentially
  processQueue: async (projectId: string) => {
    const state = get();

    // If already processing or queue is empty, do nothing
    if (state.isProcessingQueue || state.messageQueue.length === 0) {
      return;
    }

    set({ isProcessingQueue: true });

    while (get().messageQueue.length > 0) {
      const queue = get().messageQueue;
      const nextMessage = queue[0];

      // Mark as processing
      set((state) => ({
        messageQueue: state.messageQueue.map((m, i) =>
          i === 0 ? { ...m, status: "processing" as const } : m
        ),
      }));

      // Process the message
      await get().sendMessage(projectId, nextMessage.content, true);

      // Remove from queue
      set((state) => ({
        messageQueue: state.messageQueue.slice(1),
      }));
    }

    set({ isProcessingQueue: false });
  },

  sendMessage: async (projectId: string, content: string, fromQueue = false) => {
    const state = get();

    // If streaming and not from queue, add to queue instead
    if (state.isStreaming && !fromQueue) {
      get().queueMessage(projectId, content);
      return;
    }

    // Optimistic update: add user message immediately (only if not from queue, as queue already added it)
    if (!fromQueue) {
      const optimisticUserMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        projectId,
        role: Role.USER,
        content,
        createdAt: new Date(),
      };

      set((state) => ({
        messages: [...state.messages, optimisticUserMessage],
      }));
    }

    set({
      isStreaming: true,
      streamingBlocks: [],
      error: null
    });

    try {
      const currentMode = get().mode;
      const attachments = get().attachedFiles
        .filter((f) => f.status === "uploaded" && f.uploadedPath)
        .map((f) => f.uploadedPath!);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:14000/api"}/projects/${projectId}/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
            mode: currentMode,
            attachments: attachments.length > 0 ? attachments : undefined,
          }),
        }
      );

      // Clear attached files immediately after sending (don't wait for streaming to complete)
      if (attachments.length > 0) {
        get().clearFiles();
      }

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
              } else if (data.type === "ask_user_question" && data.askUserQuestion) {
                // Add ask_user_question block and set pending question
                const questionBlock: StreamingBlock = {
                  id: `question-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  type: "ask_user_question",
                  askUserQuestion: data.askUserQuestion,
                  status: "waiting",
                };
                set((state) => ({
                  streamingBlocks: [...state.streamingBlocks, questionBlock],
                  pendingQuestion: data.askUserQuestion,
                }));
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

      // Process next message in queue if any
      if (get().messageQueue.length > 0) {
        // Use setTimeout to avoid blocking
        setTimeout(() => get().processQueue(projectId), 100);
      }
    }
  },

  addMessage: (message: ChatMessage) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  clearMessages: () => {
    set({ messages: [], streamingBlocks: [], messageQueue: [] });
  },

  clearError: () => {
    set({ error: null });
  },

  respondToQuestion: async (projectId: string, answers: Record<string, string>) => {
    const state = get();
    if (!state.pendingQuestion) return;

    // Format the answers as a user response
    const responseContent = Object.entries(answers)
      .map(([question, answer]) => `${question}: ${answer}`)
      .join("\n");

    // Clear the pending question and update the question block status
    set((state) => {
      const blocks = [...state.streamingBlocks];
      for (let i = blocks.length - 1; i >= 0; i--) {
        if (blocks[i].type === "ask_user_question" && blocks[i].status === "waiting") {
          blocks[i] = {
            ...blocks[i],
            status: "completed",
          };
          break;
        }
      }
      return { streamingBlocks: blocks, pendingQuestion: null };
    });

    // Send the response as a new message to continue the conversation
    await get().sendMessage(projectId, responseContent);
  },
}));
