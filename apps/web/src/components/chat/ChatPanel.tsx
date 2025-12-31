"use client";

import { useEffect, useState } from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { useChatStore } from "@/stores/useChatStore";
import { Button } from "@/components/ui/button";
import { RotateCcw, MessageSquarePlus } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { api } from "@/lib/api";

interface ChatPanelProps {
  projectId: string;
}

export function ChatPanel({ projectId }: ChatPanelProps) {
  const { t } = useTranslation();
  const [isResetting, setIsResetting] = useState(false);
  const {
    messages,
    isStreaming,
    streamingBlocks,
    messageQueue,
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

  const handleResetSession = async () => {
    if (isResetting || isStreaming) return;

    setIsResetting(true);
    try {
      await api.post(`/projects/${projectId}/chat/reset`);
      // Optionally refresh messages or show a toast
    } catch (error) {
      console.error("Failed to reset session:", error);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Chat Header */}
      <div className="flex h-12 items-center justify-between border-b px-4">
        <span className="text-sm font-medium">{t("chat.title")}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetSession}
          disabled={isResetting || isStreaming}
          title={t("chat.newConversation")}
          className="gap-1.5"
        >
          <MessageSquarePlus className="h-4 w-4" />
          <span className="hidden sm:inline">{t("chat.newConversation")}</span>
        </Button>
      </div>

      <MessageList
        messages={messages}
        streamingBlocks={streamingBlocks}
        isStreaming={isStreaming}
        projectId={projectId}
      />
      <MessageInput
        onSend={handleSend}
        isStreaming={isStreaming}
        queueCount={messageQueue.length}
      />
    </div>
  );
}
