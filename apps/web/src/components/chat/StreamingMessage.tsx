"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { StreamingBlock } from "@/stores/useChatStore";
import {
  FileText,
  FolderSearch,
  Terminal,
  Edit3,
  Search,
  Globe,
  CheckCircle2,
  Loader2,
  ListTodo,
  Bot,
} from "lucide-react";

interface StreamingMessageProps {
  blocks: StreamingBlock[];
  isStreaming?: boolean;
}

const toolIcons: Record<string, React.ReactNode> = {
  Read: <FileText className="h-4 w-4" />,
  Glob: <FolderSearch className="h-4 w-4" />,
  Grep: <Search className="h-4 w-4" />,
  Bash: <Terminal className="h-4 w-4" />,
  Edit: <Edit3 className="h-4 w-4" />,
  Write: <Edit3 className="h-4 w-4" />,
  WebFetch: <Globe className="h-4 w-4" />,
  WebSearch: <Globe className="h-4 w-4" />,
  TodoWrite: <ListTodo className="h-4 w-4" />,
  Task: <Bot className="h-4 w-4" />,
};

function getToolDisplayName(name: string): string {
  const displayNames: Record<string, string> = {
    Read: "파일 읽기",
    Glob: "파일 검색",
    Grep: "내용 검색",
    Bash: "명령어 실행",
    Edit: "파일 수정",
    Write: "파일 생성",
    WebFetch: "웹 페이지 가져오기",
    WebSearch: "웹 검색",
    Task: "에이전트 실행",
    TodoWrite: "작업 목록 업데이트",
  };
  return displayNames[name] || name;
}

function getToolDescription(block: StreamingBlock): string {
  const input = block.tool?.input;
  const name = block.tool?.name;

  if (!input || !name) return "";

  if (name === "Read" && input.file_path) {
    const path = input.file_path as string;
    const fileName = path.split("/").pop();
    return fileName || "";
  }

  if (name === "Glob" && input.pattern) {
    return input.pattern as string;
  }

  if (name === "Grep" && input.pattern) {
    return input.pattern as string;
  }

  if (name === "Bash" && input.command) {
    const cmd = input.command as string;
    return cmd.length > 50 ? cmd.substring(0, 50) + "..." : cmd;
  }

  if ((name === "Edit" || name === "Write") && input.file_path) {
    const path = input.file_path as string;
    const fileName = path.split("/").pop();
    return fileName || "";
  }

  return "";
}

function TextBlock({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
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
        {content}
      </ReactMarkdown>
    </div>
  );
}

function ToolUseBlock({ block }: { block: StreamingBlock }) {
  const isRunning = block.status === "running";
  const toolName = block.tool?.name || "Unknown";

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
        isRunning
          ? "bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800"
          : "bg-muted border border-border"
      }`}
    >
      {isRunning ? (
        <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
      ) : (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      )}
      <span className={isRunning ? "text-blue-700 dark:text-blue-300" : "text-muted-foreground"}>
        {toolIcons[toolName] || <Terminal className="h-4 w-4" />}
      </span>
      <span className={`font-medium ${isRunning ? "text-blue-800 dark:text-blue-200" : ""}`}>
        {getToolDisplayName(toolName)}
      </span>
      {getToolDescription(block) && (
        <span className={`truncate ${isRunning ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`}>
          {getToolDescription(block)}
        </span>
      )}
    </div>
  );
}

export function StreamingMessage({ blocks, isStreaming = true }: StreamingMessageProps) {
  const hasBlocks = blocks.length > 0;

  return (
    <div className="flex gap-3 p-4 rounded-lg bg-background">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
        AI
      </div>
      <div className="flex-1 space-y-2 overflow-hidden">
        {/* Render blocks in order */}
        {blocks.map((block) => {
          if (block.type === "text") {
            return <TextBlock key={block.id} content={block.content || ""} />;
          }
          if (block.type === "tool_use") {
            return <ToolUseBlock key={block.id} block={block} />;
          }
          return null;
        })}

        {/* Show thinking state when streaming but no blocks yet */}
        {isStreaming && !hasBlocks && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">AI가 생각 중...</span>
          </div>
        )}

        {/* Show cursor only while streaming */}
        {isStreaming && hasBlocks && (
          <span className="inline-block w-2 h-4 bg-primary animate-pulse" />
        )}
      </div>
    </div>
  );
}
