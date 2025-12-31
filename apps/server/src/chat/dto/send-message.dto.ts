export type ChatMode = "ask" | "build";

export class SendMessageDto {
  content: string;
  mode?: ChatMode;
}
