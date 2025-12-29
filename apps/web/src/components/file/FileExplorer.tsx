"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
  extension?: string;
}

interface FileExplorerProps {
  projectId: string;
  onFileSelect?: (path: string, content: string) => void;
}

export function FileExplorer({ projectId, onFileSelect }: FileExplorerProps) {
  const { t } = useTranslation();
  const [tree, setTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadFileTree = useCallback(async () => {
    try {
      setLoading(true);
      setHasError(false);
      const res = await fetch(`${API_URL}/projects/${projectId}/files`);
      if (!res.ok) throw new Error("Failed to load files");
      const data = await res.json();
      setTree(data);
    } catch (e) {
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadFileTree();
  }, [loadFileTree]);

  const handleFileClick = async (path: string) => {
    if (!onFileSelect) return;
    try {
      const res = await fetch(
        `${API_URL}/projects/${projectId}/files/content?path=${encodeURIComponent(path)}`
      );
      if (!res.ok) throw new Error("Failed to load file");
      const data = await res.json();
      onFileSelect(path, data.content);
    } catch {
      // Ignore errors
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-sm text-muted-foreground">{t("fileExplorer.loading")}</div>
    );
  }

  if (hasError) {
    return (
      <div className="p-4">
        <p className="text-sm text-destructive mb-2">{t("fileExplorer.error")}</p>
        <Button variant="outline" size="sm" onClick={loadFileTree}>
          <RefreshCw className="h-3 w-3 mr-1" />
          {t("common.refresh")}
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex h-12 items-center justify-between px-4 border-b">
        <span className="text-sm font-medium">
          {t("fileExplorer.title")}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={loadFileTree}
          title={t("common.refresh")}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-2">
        {tree.length === 0 ? (
          <div className="text-sm text-muted-foreground px-2 py-4 text-center">
            {t("fileExplorer.empty")}
          </div>
        ) : (
          <FileTreeNode nodes={tree} onFileClick={handleFileClick} />
        )}
      </div>
    </div>
  );
}

function FileTreeNode({
  nodes,
  onFileClick,
  level = 0,
}: {
  nodes: FileNode[];
  onFileClick: (path: string) => void;
  level?: number;
}) {
  return (
    <ul className="space-y-0.5">
      {nodes.map((node) => (
        <FileTreeItem
          key={node.path}
          node={node}
          onFileClick={onFileClick}
          level={level}
        />
      ))}
    </ul>
  );
}

function FileTreeItem({
  node,
  onFileClick,
  level,
}: {
  node: FileNode;
  onFileClick: (path: string) => void;
  level: number;
}) {
  const [isOpen, setIsOpen] = useState(level < 1);
  const isDirectory = node.type === "directory";

  const handleClick = () => {
    if (isDirectory) {
      setIsOpen(!isOpen);
    } else {
      onFileClick(node.path);
    }
  };

  const getFileIcon = () => {
    if (isDirectory) {
      return isOpen ? (
        <FolderOpen className="h-4 w-4 text-blue-400 flex-shrink-0" />
      ) : (
        <Folder className="h-4 w-4 text-blue-400 flex-shrink-0" />
      );
    }

    // File type icons by extension
    const iconColor = getFileColor(node.extension);
    return <File className={cn("h-4 w-4 flex-shrink-0", iconColor)} />;
  };

  return (
    <li>
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-sm cursor-pointer",
          "hover:bg-accent text-sm"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {isDirectory && (
          <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
            {isOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </span>
        )}
        {!isDirectory && <span className="w-4 flex-shrink-0" />}
        {getFileIcon()}
        <span className="truncate">{node.name}</span>
      </div>
      {isDirectory && isOpen && node.children && (
        <FileTreeNode
          nodes={node.children}
          onFileClick={onFileClick}
          level={level + 1}
        />
      )}
    </li>
  );
}

function getFileColor(extension?: string): string {
  const colorMap: Record<string, string> = {
    ts: "text-blue-400",
    tsx: "text-blue-400",
    js: "text-yellow-400",
    jsx: "text-yellow-400",
    py: "text-green-400",
    json: "text-yellow-600",
    md: "text-gray-400",
    css: "text-purple-400",
    scss: "text-pink-400",
    html: "text-orange-400",
    prisma: "text-teal-400",
  };
  return colorMap[extension || ""] || "text-muted-foreground";
}
