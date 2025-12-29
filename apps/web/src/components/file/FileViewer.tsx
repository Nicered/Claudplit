"use client";

import { X, Copy, Check, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Highlight, themes } from "prism-react-renderer";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

interface FileViewerProps {
  path: string;
  content: string;
  language: string;
  onClose: () => void;
}

const languageMap: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  py: "python",
  json: "json",
  md: "markdown",
  css: "css",
  scss: "scss",
  html: "markup",
  prisma: "graphql",
  sql: "sql",
  sh: "bash",
  bash: "bash",
  yml: "yaml",
  yaml: "yaml",
  env: "bash",
  gitignore: "bash",
};

function getLanguage(extension: string): string {
  return languageMap[extension] || "typescript";
}

function getFileName(path: string): string {
  return path.split("/").pop() || path;
}

export function FileViewer({ path, content, language, onClose }: FileViewerProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const fileName = getFileName(path);
  const prismLanguage = getLanguage(language);
  const lines = content.split("\n");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-4 z-50 flex flex-col rounded-lg border bg-background shadow-lg md:inset-8 lg:inset-16">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-medium">{fileName}</span>
            <span className="text-xs text-muted-foreground">{path}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-2">
              {lines.length} lines
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleCopy}
              title={copied ? "Copied!" : "Copy"}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClose}
              title={t("common.close")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <Highlight theme={themes.vsDark} code={content} language={prismLanguage}>
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
              <pre
                className="text-sm leading-relaxed"
                style={{
                  ...style,
                  margin: 0,
                  padding: "1rem",
                  background: "transparent",
                  minHeight: "100%",
                }}
              >
                <code className={className}>
                  {tokens.map((line, i) => {
                    const lineProps = getLineProps({ line, key: i });
                    return (
                      <div
                        key={i}
                        {...lineProps}
                        className="table-row hover:bg-muted/30"
                      >
                        <span className="table-cell select-none pr-4 text-right text-muted-foreground/50 w-12">
                          {i + 1}
                        </span>
                        <span className="table-cell">
                          {line.map((token, key) => (
                            <span key={key} {...getTokenProps({ token, key })} />
                          ))}
                        </span>
                      </div>
                    );
                  })}
                </code>
              </pre>
            )}
          </Highlight>
        </div>
      </div>
    </div>
  );
}
