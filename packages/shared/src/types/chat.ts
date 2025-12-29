export enum Role {
  USER = "USER",
  ASSISTANT = "ASSISTANT",
  SYSTEM = "SYSTEM",
}

export interface ChatMessage {
  id: string;
  projectId: string;
  role: Role;
  content: string;
  metadata?: ChatMessageMetadata | string | null;  // Can be object, JSON string from DB, or null
  createdAt: Date;
}

export interface ChatMessageMetadata {
  toolUse?: ToolUseInfo[];
  cost?: number;
  model?: string;
}

export interface ToolUseInfo {
  name: string;
  input?: Record<string, unknown>;
  result?: string;
  success?: boolean;
}

export interface SendMessageInput {
  content: string;
}

export type StreamEventType =
  | "init"
  | "text"
  | "tool_use"
  | "tool_result"
  | "permission_request"
  | "complete"
  | "error";

export interface StreamEvent {
  type: StreamEventType;
  content?: string;
  tool?: ToolUseInfo;
  error?: string;
  messageId?: string;
}
