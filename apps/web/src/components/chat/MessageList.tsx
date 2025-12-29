"use client";

import { useEffect, useRef } from "react";
import { MessageItem } from "./MessageItem";
import { StreamingMessage } from "./StreamingMessage";
import type { ChatMessage } from "@claudeship/shared";
import type { StreamingBlock } from "@/stores/useChatStore";

interface MessageListProps {
  messages: ChatMessage[];
  streamingBlocks?: StreamingBlock[];
  isStreaming?: boolean;
}

export function MessageList({
  messages,
  streamingBlocks = [],
  isStreaming,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingBlocks]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && !isStreaming && (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p className="text-lg font-medium">안녕하세요!</p>
            <p className="text-sm">무엇을 만들어 드릴까요?</p>
          </div>
        </div>
      )}

      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}

      {/* Show streaming blocks if there are any (during or after streaming) */}
      {streamingBlocks.length > 0 && (
        <StreamingMessage blocks={streamingBlocks} isStreaming={isStreaming} />
      )}

      <div ref={bottomRef} />
    </div>
  );
}
