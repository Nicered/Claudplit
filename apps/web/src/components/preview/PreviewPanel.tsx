"use client";

import { useEffect, useState } from "react";
import { Play, Square, RefreshCw, ExternalLink, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePreviewStore } from "@/stores/usePreviewStore";
import { useTranslation } from "@/lib/i18n";

interface PreviewPanelProps {
  projectId: string;
}

export function PreviewPanel({ projectId }: PreviewPanelProps) {
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  const {
    status,
    url,
    error,
    isLoading,
    projectReady,
    startPreview,
    stopPreview,
    refreshPreview,
    fetchStatus,
    checkProjectReady,
  } = usePreviewStore();

  // Mark as mounted after first render
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Poll for project ready status when not running
  useEffect(() => {
    if (!isMounted) return;

    fetchStatus(projectId);
    checkProjectReady(projectId);

    // Poll every 3 seconds when project is not ready
    const interval = setInterval(() => {
      if (status !== "running" && status !== "starting") {
        checkProjectReady(projectId);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [projectId, fetchStatus, checkProjectReady, status, isMounted]);

  // Auto-start preview when project becomes ready
  useEffect(() => {
    if (
      isMounted &&
      projectReady.ready &&
      status === "stopped" &&
      !isLoading &&
      !error
    ) {
      startPreview(projectId);
    }
  }, [isMounted, projectReady.ready, status, isLoading, error, projectId, startPreview]);

  const handleStart = () => startPreview(projectId);
  const handleStop = () => stopPreview(projectId);
  const handleRefresh = () => refreshPreview();
  const handleOpenExternal = () => {
    if (url) {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="flex h-full flex-col border-l">
      {/* Controls */}
      <div className="flex h-12 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              !isMounted
                ? "bg-gray-400"
                : status === "running"
                  ? "bg-green-500"
                  : status === "starting"
                    ? "bg-yellow-500 animate-pulse"
                    : status === "error"
                      ? "bg-red-500"
                      : "bg-gray-400"
            }`}
          />
          <span className="text-sm text-muted-foreground">
            {!isMounted
              ? t("common.loading")
              : status === "running"
                ? t("preview.title")
                : status === "starting"
                  ? t("preview.starting")
                  : status === "error"
                    ? t("common.error")
                    : t("preview.stop")}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {status === "running" ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenExternal}
                className="h-8 w-8 p-0"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStop}
                disabled={isLoading}
                className="h-8 w-8 p-0"
              >
                <Square className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStart}
              disabled={!isMounted || isLoading || status === "starting" || !projectReady.ready}
              title={!projectReady.ready ? t("preview.notReady") : t("preview.start")}
              className="h-8 w-8 p-0"
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Preview Frame */}
      <div className="flex-1 bg-muted/30">
        {!isMounted ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : status === "running" && url ? (
          <iframe
            key={url}
            src={url}
            className="h-full w-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
          />
        ) : status === "starting" ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-muted-foreground">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin mb-2" />
              <p>{t("preview.starting")}</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-destructive">
              <p className="font-medium">{t("common.error")}</p>
              <p className="text-sm">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleStart}
                className="mt-4"
              >
                {t("common.refresh")}
              </Button>
            </div>
          </div>
        ) : !projectReady.ready ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-muted-foreground max-w-xs">
              <Package className="mx-auto h-8 w-8 mb-3 text-muted-foreground/50" />
              <p className="font-medium mb-2">{t("preview.notReady")}</p>
              <div className="text-xs space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${projectReady.hasPackageJson ? "bg-green-500" : "bg-gray-300 animate-pulse"}`} />
                  <span>package.json</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${projectReady.hasDevScript ? "bg-green-500" : "bg-gray-300"}`} />
                  <span>dev script</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${projectReady.hasNodeModules ? "bg-green-500" : "bg-gray-300"}`} />
                  <span>node_modules</span>
                </div>
              </div>
              <p className="text-xs mt-4">{t("preview.waitForAI")}</p>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Play className="mx-auto h-8 w-8 mb-2" />
              <p>{t("preview.start")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
