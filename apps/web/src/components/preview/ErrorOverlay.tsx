"use client";

import { X, ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export interface ErrorInfo {
  type: "compile" | "runtime" | "network";
  message: string;
  stack?: string;
  location?: {
    file: string;
    line: number;
    column: number;
  };
}

interface ErrorOverlayProps {
  error: ErrorInfo;
  onDismiss: () => void;
}

export function ErrorOverlay({ error, onDismiss }: ErrorOverlayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = [
      error.message,
      error.location ? `at ${error.location.file}:${error.location.line}:${error.location.column}` : "",
      error.stack || "",
    ].filter(Boolean).join("\n\n");

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const errorTypeLabels = {
    compile: "Compilation Error",
    runtime: "Runtime Error",
    network: "Network Error",
  };

  const errorTypeColors = {
    compile: "text-red-500",
    runtime: "text-orange-500",
    network: "text-yellow-500",
  };

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-auto">
      <div className="min-h-full p-6">
        <div className="max-w-2xl mx-auto bg-zinc-900 rounded-lg border border-red-500/50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-red-500/10 border-b border-red-500/30">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className={`font-medium ${errorTypeColors[error.type]}`}>
                {errorTypeLabels[error.type]}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 px-2 text-zinc-400 hover:text-white"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-7 px-2 text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Error Message */}
          <div className="p-4 space-y-4">
            <p className="text-lg font-mono text-red-400 whitespace-pre-wrap">
              {error.message}
            </p>

            {/* Location */}
            {error.location && (
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <ExternalLink className="h-4 w-4" />
                <code className="bg-zinc-800 px-2 py-0.5 rounded">
                  {error.location.file}:{error.location.line}:{error.location.column}
                </code>
              </div>
            )}

            {/* Stack Trace */}
            {error.stack && (
              <div className="mt-4">
                <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wide">Stack Trace</p>
                <pre className="bg-zinc-950 p-3 rounded-lg text-xs text-zinc-400 overflow-x-auto font-mono">
                  {error.stack}
                </pre>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-zinc-800/50 border-t border-zinc-700 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={onDismiss}
              className="text-zinc-300"
            >
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Parse error from stderr log message
 */
export function parseErrorFromLog(message: string): ErrorInfo | null {
  // Skip common non-error messages
  if (message.includes("Compiling...") ||
      message.includes("Ready in") ||
      message.includes("Compiled successfully") ||
      message.includes("Fast Refresh") ||
      message.includes("○ Compiling") ||
      message.includes("✓ Compiled")) {
    return null;
  }

  // Next.js / TypeScript error pattern
  // Example: "Error: Cannot find module 'xxx'"
  // Example: "./src/components/Test.tsx:10:5"
  const nextjsErrorPattern = /(?:Error|TypeError|SyntaxError|ReferenceError):\s*(.+)/;
  const locationPattern = /(?:\.\/)?([^:]+):(\d+):(\d+)/;

  const errorMatch = message.match(nextjsErrorPattern);

  if (errorMatch) {
    const locationMatch = message.match(locationPattern);

    return {
      type: "compile",
      message: errorMatch[1],
      stack: message,
      location: locationMatch ? {
        file: locationMatch[1],
        line: parseInt(locationMatch[2], 10),
        column: parseInt(locationMatch[3], 10),
      } : undefined,
    };
  }

  // Check for "Failed to compile" message
  if (message.includes("Failed to compile") || message.includes("Compilation failed")) {
    return {
      type: "compile",
      message: "Failed to compile. Check the console for more details.",
      stack: message,
    };
  }

  // Check for module not found errors
  const moduleNotFound = message.match(/Module not found:\s*(.+)/);
  if (moduleNotFound) {
    const locationMatch = message.match(locationPattern);
    return {
      type: "compile",
      message: moduleNotFound[1],
      stack: message,
      location: locationMatch ? {
        file: locationMatch[1],
        line: parseInt(locationMatch[2], 10),
        column: parseInt(locationMatch[3], 10),
      } : undefined,
    };
  }

  return null;
}
