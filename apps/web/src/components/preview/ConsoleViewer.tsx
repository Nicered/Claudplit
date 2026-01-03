"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Trash2, Download, Filter, AlertCircle, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:14000";

interface LogEntry {
  id: string;
  timestamp: number;
  level: "stdout" | "stderr";
  source: "frontend" | "backend";
  message: string;
}

interface ConsoleViewerProps {
  projectId: string;
  isRunning: boolean;
}

type FilterType = "all" | "frontend" | "backend" | "error";

export function ConsoleViewer({ projectId, isRunning }: ConsoleViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [autoScroll, setAutoScroll] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch initial logs
  useEffect(() => {
    if (!isRunning) {
      setLogs([]);
      return;
    }

    const fetchLogs = async () => {
      try {
        const response = await fetch(`${API_BASE}/projects/${projectId}/preview/logs`);
        if (response.ok) {
          const initialLogs = await response.json();
          setLogs(initialLogs);
        }
      } catch (error) {
        console.error("Failed to fetch logs:", error);
      }
    };

    fetchLogs();
  }, [projectId, isRunning]);

  // Subscribe to log stream
  useEffect(() => {
    if (!isRunning) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const eventSource = new EventSource(
      `${API_BASE}/projects/${projectId}/preview/logs/stream`
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "log" && data.entry) {
          setLogs((prev) => {
            const newLogs = [...prev, data.entry];
            // Keep max 1000 logs
            if (newLogs.length > 1000) {
              return newLogs.slice(-1000);
            }
            return newLogs;
          });
        }
      } catch {
        // Ignore parse errors
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      eventSourceRef.current = null;
    };

    eventSourceRef.current = eventSource;

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [projectId, isRunning]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    // Enable auto-scroll if scrolled near bottom
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 50);
  }, []);

  const handleClear = async () => {
    try {
      await fetch(`${API_BASE}/projects/${projectId}/preview/logs`, {
        method: "DELETE",
      });
      setLogs([]);
    } catch (error) {
      console.error("Failed to clear logs:", error);
    }
  };

  const handleDownload = () => {
    const content = filteredLogs
      .map((log) => {
        const time = new Date(log.timestamp).toISOString();
        return `[${time}] [${log.source}] [${log.level}] ${log.message}`;
      })
      .join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `console-${projectId}-${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter((log) => {
    switch (filter) {
      case "frontend":
        return log.source === "frontend";
      case "backend":
        return log.source === "backend";
      case "error":
        return log.level === "stderr";
      default:
        return true;
    }
  });

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (!isRunning) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Terminal className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p className="text-sm">Start the preview to see console output</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex h-10 items-center justify-between border-b px-2">
        <div className="flex items-center gap-1">
          <Button
            variant={filter === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
            className="h-7 px-2 text-xs"
          >
            All
          </Button>
          <Button
            variant={filter === "frontend" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("frontend")}
            className="h-7 px-2 text-xs"
          >
            Frontend
          </Button>
          <Button
            variant={filter === "backend" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("backend")}
            className="h-7 px-2 text-xs"
          >
            Backend
          </Button>
          <Button
            variant={filter === "error" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("error")}
            className="h-7 px-2 text-xs text-red-500"
          >
            <AlertCircle className="h-3 w-3 mr-1" />
            Errors
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-7 w-7 p-0"
            title="Download logs"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-7 w-7 p-0"
            title="Clear logs"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Log Output */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto bg-zinc-950 p-2 font-mono text-xs"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex h-full items-center justify-center text-zinc-500">
            <span>No logs yet...</span>
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`flex gap-2 ${
                  log.level === "stderr" ? "text-red-400" : "text-zinc-300"
                }`}
              >
                <span className="text-zinc-600 shrink-0">
                  {formatTime(log.timestamp)}
                </span>
                <span
                  className={`shrink-0 px-1 rounded text-[10px] ${
                    log.source === "frontend"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-green-500/20 text-green-400"
                  }`}
                >
                  {log.source === "frontend" ? "FE" : "BE"}
                </span>
                <span className="whitespace-pre-wrap break-all">
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
