"use client";

import { X, FileText, Loader2 } from "lucide-react";
import { AttachedFile } from "@/stores/useChatStore";

interface FilePreviewProps {
  files: AttachedFile[];
  onRemove: (id: string) => void;
}

export function FilePreview({ files, onRemove }: FilePreviewProps) {
  if (files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 pb-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="group relative flex items-center gap-2 rounded-lg border bg-muted/50 p-2"
        >
          {file.preview ? (
            <img
              src={file.preview}
              alt={file.file.name}
              className="h-12 w-12 rounded object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="max-w-[120px] truncate text-xs font-medium">
              {file.file.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatFileSize(file.file.size)}
            </span>
          </div>
          {file.status === "uploading" && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {file.status === "error" && (
            <span className="text-xs text-destructive">{file.error}</span>
          )}
          <button
            onClick={() => onRemove(file.id)}
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
