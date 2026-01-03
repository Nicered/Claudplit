"use client";

import { useEffect, useState, useCallback } from "react";
import {
  GitBranch,
  RotateCcw,
  Plus,
  RefreshCw,
  AlertCircle,
  Clock,
  FileText,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

interface Checkpoint {
  id: string;
  hash: string;
  message: string;
  author: string;
  timestamp: number;
  filesChanged: number;
  insertions: number;
  deletions: number;
}

interface FileDiff {
  path: string;
  status: "added" | "modified" | "deleted";
  additions: number;
  deletions: number;
  diff: string;
}

interface CheckpointPanelProps {
  projectId: string;
}

export function CheckpointPanel({ projectId }: CheckpointPanelProps) {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null);
  const [diff, setDiff] = useState<FileDiff[] | null>(null);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch checkpoints
  const fetchCheckpoints = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.get<Checkpoint[]>(
        `/projects/${projectId}/checkpoints`
      );
      setCheckpoints(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load checkpoints");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Check for changes
  const checkStatus = useCallback(async () => {
    try {
      const result = await api.get<{ hasChanges: boolean }>(
        `/projects/${projectId}/checkpoints/status`
      );
      setHasChanges(result.hasChanges);
    } catch {
      // Ignore
    }
  }, [projectId]);

  useEffect(() => {
    fetchCheckpoints();
    checkStatus();
  }, [fetchCheckpoints, checkStatus]);

  // Poll for changes
  useEffect(() => {
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const handleSelectCheckpoint = async (checkpoint: Checkpoint) => {
    setSelectedCheckpoint(checkpoint);
    setExpandedFiles(new Set());

    try {
      const result = await api.get<{ files: FileDiff[] }>(
        `/projects/${projectId}/checkpoints/diff?from=${checkpoint.hash}`
      );
      setDiff(result.files);
    } catch {
      setDiff(null);
    }
  };

  const handleCreateCheckpoint = async () => {
    if (!newMessage.trim()) {
      setError("Please enter a checkpoint message");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await api.post(`/projects/${projectId}/checkpoints`, {
        message: newMessage,
      });
      setNewMessage("");
      await fetchCheckpoints();
      await checkStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create checkpoint");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (checkpoint: Checkpoint) => {
    if (
      !confirm(
        `Restore to "${checkpoint.message}"? This will discard current changes.`
      )
    ) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await api.post(`/projects/${projectId}/checkpoints/${checkpoint.hash}/restore`);
      await fetchCheckpoints();
      await checkStatus();
      setSelectedCheckpoint(null);
      setDiff(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to restore checkpoint");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFileExpand = (path: string) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFiles(newExpanded);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  if (isLoading && checkpoints.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" />
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-medium flex items-center gap-2">
          <GitBranch className="h-4 w-4" />
          Checkpoints
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchCheckpoints}
          disabled={isLoading}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Create Checkpoint */}
      {hasChanges && (
        <div className="border-b p-4 space-y-2">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Checkpoint message..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateCheckpoint();
              }}
            />
            <Button onClick={handleCreateCheckpoint} disabled={isLoading} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            You have unsaved changes
          </p>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Timeline */}
        <div className="w-72 border-r overflow-auto">
          <div className="p-2 space-y-1">
            {/* Current state */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="w-3 h-3 rounded-full bg-primary mt-1" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Current State</p>
                <p className="text-xs text-muted-foreground">
                  {hasChanges ? "Unsaved changes" : "No changes"}
                </p>
              </div>
            </div>

            {/* Checkpoints */}
            {checkpoints.map((checkpoint, i) => (
              <button
                key={checkpoint.hash}
                onClick={() => handleSelectCheckpoint(checkpoint)}
                className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                  selectedCheckpoint?.hash === checkpoint.hash
                    ? "bg-muted"
                    : "hover:bg-muted/50"
                }`}
              >
                <div className="relative">
                  <div className="w-3 h-3 rounded-full bg-muted-foreground/30 mt-1" />
                  {i < checkpoints.length - 1 && (
                    <div className="absolute top-4 left-1.5 w-px h-full bg-muted-foreground/20" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{checkpoint.message}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(checkpoint.timestamp)}
                  </div>
                  {checkpoint.filesChanged > 0 && (
                    <div className="flex items-center gap-2 text-xs mt-1">
                      <span className="text-green-500">+{checkpoint.insertions}</span>
                      <span className="text-red-500">-{checkpoint.deletions}</span>
                      <span className="text-muted-foreground">
                        {checkpoint.filesChanged} files
                      </span>
                    </div>
                  )}
                </div>
              </button>
            ))}

            {checkpoints.length === 0 && (
              <p className="text-sm text-muted-foreground px-3 py-2">
                No checkpoints yet
              </p>
            )}
          </div>
        </div>

        {/* Diff Viewer */}
        <div className="flex-1 overflow-auto">
          {selectedCheckpoint && diff ? (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{selectedCheckpoint.message}</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedCheckpoint.timestamp).toLocaleString()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestore(selectedCheckpoint)}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Restore
                </Button>
              </div>

              {diff.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No differences from current state
                </p>
              ) : (
                <div className="space-y-2">
                  {diff.map((file) => (
                    <div key={file.path} className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleFileExpand(file.path)}
                        className="w-full flex items-center gap-2 p-3 hover:bg-muted/50 text-left"
                      >
                        {expandedFiles.has(file.path) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <FileText className="h-4 w-4" />
                        <span className="flex-1 font-mono text-sm truncate">
                          {file.path}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            file.status === "added"
                              ? "bg-green-500/20 text-green-500"
                              : file.status === "deleted"
                                ? "bg-red-500/20 text-red-500"
                                : "bg-yellow-500/20 text-yellow-500"
                          }`}
                        >
                          {file.status}
                        </span>
                        <span className="text-xs text-green-500">+{file.additions}</span>
                        <span className="text-xs text-red-500">-{file.deletions}</span>
                      </button>
                      {expandedFiles.has(file.path) && (
                        <pre className="bg-zinc-950 p-4 text-xs font-mono overflow-x-auto max-h-96">
                          {file.diff.split("\n").map((line, i) => (
                            <div
                              key={i}
                              className={
                                line.startsWith("+") && !line.startsWith("+++")
                                  ? "text-green-400 bg-green-500/10"
                                  : line.startsWith("-") && !line.startsWith("---")
                                    ? "text-red-400 bg-red-500/10"
                                    : line.startsWith("@@")
                                      ? "text-blue-400"
                                      : "text-zinc-400"
                              }
                            >
                              {line}
                            </div>
                          ))}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <div className="text-center">
                <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Select a checkpoint to view changes</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
