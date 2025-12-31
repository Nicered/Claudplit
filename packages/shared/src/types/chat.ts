export enum Role {
  USER = "USER",
  ASSISTANT = "ASSISTANT",
  SYSTEM = "SYSTEM",
}

export type ChatMode = "ask" | "build";

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

export interface AskUserQuestionOption {
  label: string;
  description?: string;
}

export interface AskUserQuestion {
  question: string;
  header?: string;
  options: AskUserQuestionOption[];
  multiSelect?: boolean;
}

export interface AskUserQuestionData {
  questions: AskUserQuestion[];
}

export interface SendMessageInput {
  content: string;
  mode?: ChatMode;
}

export type StreamEventType =
  | "init"
  | "text"
  | "tool_use"
  | "tool_result"
  | "permission_request"
  | "ask_user_question"
  | "complete"
  | "error";

export interface StreamEvent {
  type: StreamEventType;
  content?: string;
  tool?: ToolUseInfo;
  askUserQuestion?: AskUserQuestionData;
  error?: string;
  messageId?: string;
}
