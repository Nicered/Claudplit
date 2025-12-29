"use client";

import { ChatPanel } from "@/components/chat/ChatPanel";
import { PreviewPanel } from "@/components/preview/PreviewPanel";

interface WorkspaceLayoutProps {
  projectId: string;
}

export function WorkspaceLayout({ projectId }: WorkspaceLayoutProps) {
  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Chat Panel - 50% */}
      <div className="w-1/2 border-r">
        <ChatPanel projectId={projectId} />
      </div>

      {/* Preview Panel - 50% */}
      <div className="w-1/2">
        <PreviewPanel projectId={projectId} />
      </div>
    </div>
  );
}
