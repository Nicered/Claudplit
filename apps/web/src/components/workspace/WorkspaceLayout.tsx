"use client";

import { useState } from "react";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { PreviewPanel } from "@/components/preview/PreviewPanel";
import { FileExplorer } from "@/components/file/FileExplorer";
import { FileViewer } from "@/components/file/FileViewer";
import { FolderTree, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

interface WorkspaceLayoutProps {
  projectId: string;
}

interface SelectedFile {
  path: string;
  content: string;
  extension: string;
}

export function WorkspaceLayout({ projectId }: WorkspaceLayoutProps) {
  const { t } = useTranslation();
  const [showFileExplorer, setShowFileExplorer] = useState(false);
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);

  const handleFileSelect = (path: string, content: string) => {
    const extension = path.split(".").pop() || "";
    setSelectedFile({ path, content, extension });
  };

  const handleCloseViewer = () => {
    setSelectedFile(null);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* File Explorer Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowFileExplorer(!showFileExplorer)}
        className="absolute left-4 top-16 z-10 h-8 w-8 p-0"
        title={showFileExplorer ? t("fileExplorer.close") : t("fileExplorer.open")}
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
          <FileExplorer projectId={projectId} onFileSelect={handleFileSelect} />
        </div>
      )}

      {/* Chat Panel - 30% width */}
      <div
        className="border-r flex-shrink-0"
        style={{ width: showFileExplorer ? "calc(30% - 8rem)" : "30%" }}
      >
        <ChatPanel projectId={projectId} />
      </div>

      {/* Preview Panel - 70% width */}
      <div
        className="flex-1"
        style={{ width: showFileExplorer ? "calc(70%)" : "70%" }}
      >
        <PreviewPanel projectId={projectId} />
      </div>

      {/* File Viewer Modal */}
      {selectedFile && (
        <FileViewer
          path={selectedFile.path}
          content={selectedFile.content}
          language={selectedFile.extension}
          onClose={handleCloseViewer}
        />
      )}
    </div>
  );
}
