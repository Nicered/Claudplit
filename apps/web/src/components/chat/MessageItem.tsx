"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import type { ChatMessage, Role } from "@claudeship/shared";
import {
  FileText,
  FolderSearch,
  Terminal,
  Edit3,
  Search,
  Globe,
  CheckCircle2,
  ListTodo,
  Bot,
} from "lucide-react";

interface ToolActivity {
  name: string;
  input?: Record<string, unknown>;
  status: "completed";
}

interface MessageItemProps {
  message: ChatMessage;
}

const toolIcons: Record<string, React.ReactNode> = {
  Read: <FileText className="h-3 w-3" />,
  Glob: <FolderSearch className="h-3 w-3" />,
  Grep: <Search className="h-3 w-3" />,
  Bash: <Terminal className="h-3 w-3" />,
  Edit: <Edit3 className="h-3 w-3" />,
  Write: <Edit3 className="h-3 w-3" />,
  WebFetch: <Globe className="h-3 w-3" />,
  WebSearch: <Globe className="h-3 w-3" />,
  TodoWrite: <ListTodo className="h-3 w-3" />,
  Task: <Bot className="h-3 w-3" />,
};

const toolDisplayNames: Record<string, string> = {
  Read: "파일 읽기",
  Glob: "파일 검색",
  Grep: "내용 검색",
  Bash: "명령어 실행",
  Edit: "파일 수정",
  Write: "파일 생성",
  WebFetch: "웹 페이지",
  WebSearch: "웹 검색",
  Task: "에이전트",
  TodoWrite: "작업 목록",
};

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === "USER";

  // Parse metadata for tool activities
  let toolActivities: ToolActivity[] = [];
  if (!isUser && message.metadata) {
    try {
      // Handle both string (from DB) and object (parsed) metadata
      const metadata = typeof message.metadata === "string"
        ? JSON.parse(message.metadata)
        : message.metadata;
      toolActivities = metadata.toolActivities || [];
    } catch {
      // Ignore parse errors
    }
  }

  return (
    <div
      className={cn(
        "flex gap-3 p-4 rounded-lg",
        isUser ? "bg-muted/50" : "bg-background"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground"
        )}
      >
        {isUser ? "U" : "AI"}
      </div>
      <div className="flex-1 space-y-2 overflow-hidden">
        {/* Tool activities summary */}
        {toolActivities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {toolActivities.slice(0, 10).map((activity, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground"
              >
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                {toolIcons[activity.name] || <Terminal className="h-3 w-3" />}
                {toolDisplayNames[activity.name] || activity.name}
              </span>
            ))}
            {toolActivities.length > 10 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
                +{toolActivities.length - 10}개
              </span>
            )}
          </div>
        )}

        <div className="prose prose-sm dark:prose-invert max-w-none">
          {isUser ? (
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                pre: ({ children }) => (
                  <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-sm">
                    {children}
                  </pre>
                ),
                code: ({ className, children, ...props }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm" {...props}>
                      {children}
                    </code>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
}
