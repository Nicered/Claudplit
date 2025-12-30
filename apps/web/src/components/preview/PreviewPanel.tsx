"use client";

import { useEffect, useState, useRef } from "react";
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
    clearError,
  } = usePreviewStore();

  // Track previous ready state to detect ready transitions
  const prevReadyRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Mark as mounted after first render
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reset state when project changes
  useEffect(() => {
    prevReadyRef.current = false;
    retryCountRef.current = 0;
    clearError();
  }, [projectId, clearError]);

  // Poll for status updates
  useEffect(() => {
    if (!isMounted) return;

    fetchStatus(projectId);
    checkProjectReady(projectId);

    // Poll every 2 seconds
    const interval = setInterval(() => {
      // Always fetch status to detect URL changes (e.g., after server restart)
      fetchStatus(projectId);

      // Only check ready status when not running
      if (status !== "running" && status !== "starting") {
        checkProjectReady(projectId);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [projectId, fetchStatus, checkProjectReady, status, isMounted]);

  // Auto-start preview when project becomes ready
  useEffect(() => {
    if (!isMounted || isLoading || status === "starting") return;

    const wasReady = prevReadyRef.current;
    const isNowReady = projectReady.ready;

    // Detect ready transition (false -> true)
    if (!wasReady && isNowReady) {
      retryCountRef.current = 0; // Reset retry count on new ready state
    }

    prevReadyRef.current = isNowReady;

    // Auto-start when ready and stopped
    if (isNowReady && status === "stopped" && retryCountRef.current < maxRetries) {
      retryCountRef.current++;
      startPreview(projectId);
    }

    // Auto-retry on error after delay (if still ready)
    if (isNowReady && status === "error" && retryCountRef.current < maxRetries) {
      const retryTimeout = setTimeout(() => {
        if (projectReady.ready && retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          clearError();
          startPreview(projectId);
        }
      }, 3000); // Wait 3 seconds before retry

      return () => clearTimeout(retryTimeout);
    }
  }, [isMounted, projectReady.ready, status, isLoading, projectId, startPreview, clearError]);

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
            <div className="text-center text-muted-foreground max-w-sm">
              <Package className="mx-auto h-8 w-8 mb-3 text-muted-foreground/50" />
              <p className="font-medium mb-3">{t("preview.notReady")}</p>

              <div className="text-xs space-y-3">
                {/* Frontend Status */}
                <div className="border rounded-lg p-2">
                  <p className="font-medium mb-1.5 text-foreground">
                    {projectReady.isFullstack ? "Frontend" : "Project"}
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${projectReady.frontend.hasPackageJson ? "bg-green-500" : "bg-gray-300 animate-pulse"}`} />
                      <span>package.json</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${projectReady.frontend.hasDevScript ? "bg-green-500" : "bg-gray-300"}`} />
                      <span>dev script</span>
                    </div>
                  </div>
                </div>

                {/* Backend Status (for fullstack) */}
                {projectReady.isFullstack && projectReady.backend && (
                  <div className="border rounded-lg p-2">
                    <p className="font-medium mb-1.5 text-foreground">Backend</p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${projectReady.backend.hasPackageJson ? "bg-green-500" : "bg-gray-300 animate-pulse"}`} />
                        <span>package.json</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${projectReady.backend.hasDevScript ? "bg-green-500" : "bg-gray-300"}`} />
                        <span>dev script</span>
                      </div>
                    </div>
                  </div>
                )}
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
