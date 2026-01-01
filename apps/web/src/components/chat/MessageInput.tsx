"use client";

import { useState, useRef, KeyboardEvent, DragEvent, ChangeEvent } from "react";
import { Send, Clock, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { ModeToggle } from "./ModeToggle";
import { FilePreview } from "./FilePreview";
import { useChatStore } from "@/stores/useChatStore";

interface MessageInputProps {
  onSend: (content: string, attachments?: string[]) => void;
  projectId: string;
  disabled?: boolean;
  isStreaming?: boolean;
  queueCount?: number;
}

const ALLOWED_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;

export function MessageInput({ onSend, projectId, disabled, isStreaming, queueCount = 0 }: MessageInputProps) {
  const { t } = useTranslation();
  const { mode, attachedFiles, addFiles, removeFile, uploadFiles, isUploading } = useChatStore();
  const [content, setContent] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getPlaceholder = () => {
    if (isStreaming) return t("chat.queuePlaceholder");
    return mode === "ask" ? t("chat.askPlaceholder") : t("chat.placeholder");
  };

  const handleFilesSelected = (files: File[]) => {
    const validFiles = files.filter((file) => {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        console.warn(`File type not allowed: ${file.type}`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        console.warn(`File too large: ${file.name}`);
        return false;
      }
      return true;
    });

    const remaining = MAX_FILES - attachedFiles.length;
    if (remaining <= 0) return;

    addFiles(validFiles.slice(0, remaining));
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFilesSelected(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleSubmit = async () => {
    if ((!content.trim() && attachedFiles.length === 0) || disabled || isUploading) return;

    // Upload files first if any
    let attachments: string[] = [];
    if (attachedFiles.length > 0) {
      attachments = await uploadFiles(projectId);
    }

    onSend(content.trim(), attachments.length > 0 ? attachments : undefined);
    setContent("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  return (
    <div
      className={`border-t bg-background ${isDragging ? "ring-2 ring-ring ring-offset-2" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="p-4 pb-2">
        <ModeToggle />
      </div>
      <FilePreview files={attachedFiles} onRemove={removeFile} />
      <div className="flex items-end gap-2 px-4 pb-4">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_FILE_TYPES.join(",")}
          onChange={handleFileInputChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || attachedFiles.length >= MAX_FILES}
          className="h-10 w-10 shrink-0"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder={getPlaceholder()}
            disabled={disabled}
            rows={1}
            className="w-full resize-none rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={(!content.trim() && attachedFiles.length === 0) || disabled || isUploading}
          size="icon"
          className="h-10 w-10 shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      {(isStreaming || isUploading) && (
        <div className="px-4 pb-4 flex items-center gap-2 text-xs text-muted-foreground">
          {isUploading ? (
            <span className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
              {t("chat.uploading")}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-500" />
              {t("chat.thinking")}
            </span>
          )}
          {queueCount > 0 && (
            <span className="flex items-center gap-1 text-blue-500">
              <Clock className="h-3 w-3" />
              {t("chat.queueCount", { count: queueCount })}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
