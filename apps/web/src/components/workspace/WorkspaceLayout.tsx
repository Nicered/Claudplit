"use client";

import { useState } from "react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { PreviewPanel } from "@/components/preview/PreviewPanel";
import { FileExplorer } from "@/components/file/FileExplorer";
import { FolderTree, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WorkspaceLayoutProps {
  projectId: string;
}

export function WorkspaceLayout({ projectId }: WorkspaceLayoutProps) {
  const [showFileExplorer, setShowFileExplorer] = useState(false);

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* File Explorer Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowFileExplorer(!showFileExplorer)}
        className="absolute left-4 top-16 z-10 h-8 w-8 bg-background shadow-sm border"
        title={showFileExplorer ? "파일 탐색기 닫기" : "파일 탐색기 열기"}
      >
        {showFileExplorer ? (
          <X className="h-4 w-4" />
        ) : (
          <FolderTree className="h-4 w-4" />
        )}
      </Button>

      {/* File Explorer Panel */}
      {showFileExplorer && (
        <div className="w-64 border-r bg-muted/30 flex-shrink-0">
          <FileExplorer projectId={projectId} />
        </div>
      )}

      {/* Chat Panel */}
      <div
        className="border-r flex-1"
        style={{ maxWidth: showFileExplorer ? "calc(50% - 8rem)" : "50%" }}
      >
        <ChatPanel projectId={projectId} />
      </div>

      {/* Preview Panel */}
      <div
        className="flex-1"
        style={{ maxWidth: showFileExplorer ? "calc(50% - 8rem)" : "50%" }}
      >
        <PreviewPanel projectId={projectId} />
      </div>
    </div>
  );
}
