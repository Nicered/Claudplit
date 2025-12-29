"use client";

import { useEffect } from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { useChatStore } from "@/stores/useChatStore";

interface ChatPanelProps {
  projectId: string;
}

export function ChatPanel({ projectId }: ChatPanelProps) {
  const {
    messages,
    isStreaming,
    streamingBlocks,
    fetchMessages,
    fetchActiveSession,
    sendMessage,
    clearMessages,
  } = useChatStore();

  useEffect(() => {
    clearMessages();
    fetchMessages(projectId);
    // Check for active session on mount
    fetchActiveSession(projectId);
  }, [projectId, fetchMessages, fetchActiveSession, clearMessages]);

  // Note: We don't poll during streaming because the SSE stream is the source of truth.
  // fetchActiveSession is only called on mount (above) for page refresh recovery.

  const handleSend = (content: string) => {
    sendMessage(projectId, content);
  };

  return (
    <div className="flex h-full flex-col">
      <MessageList
        messages={messages}
        streamingBlocks={streamingBlocks}
        isStreaming={isStreaming}
      />
      <MessageInput onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}
