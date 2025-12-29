"use client";

import { useEffect, useState } from "react";
import { Play, Square, RefreshCw, ExternalLink, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePreviewStore } from "@/stores/usePreviewStore";

interface PreviewPanelProps {
  projectId: string;
}

export function PreviewPanel({ projectId }: PreviewPanelProps) {
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
      <div className="flex items-center justify-between border-b px-4 py-2">
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
              ? "로딩 중..."
              : status === "running"
                ? "실행 중"
                : status === "starting"
                  ? "시작 중..."
                  : status === "error"
                    ? "오류"
                    : "중지됨"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {status === "running" ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleOpenExternal}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleStop}
                disabled={isLoading}
              >
                <Square className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleStart}
              disabled={!isMounted || isLoading || status === "starting" || !projectReady.ready}
              title={!projectReady.ready ? "프로젝트가 아직 준비되지 않았습니다" : "프리뷰 시작"}
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
              <p>프리뷰 시작 중...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-destructive">
              <p className="font-medium">오류 발생</p>
              <p className="text-sm">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleStart}
                className="mt-4"
              >
                다시 시도
              </Button>
            </div>
          </div>
        ) : !projectReady.ready ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-muted-foreground max-w-xs">
              <Package className="mx-auto h-8 w-8 mb-3 text-muted-foreground/50" />
              <p className="font-medium mb-2">프로젝트 준비 중...</p>
              <div className="text-xs space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${projectReady.hasPackageJson ? "bg-green-500" : "bg-gray-300 animate-pulse"}`} />
                  <span>package.json</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${projectReady.hasDevScript ? "bg-green-500" : "bg-gray-300"}`} />
                  <span>dev 스크립트</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${projectReady.hasNodeModules ? "bg-green-500" : "bg-gray-300"}`} />
                  <span>node_modules</span>
                </div>
              </div>
              <p className="text-xs mt-4">AI가 프로젝트를 생성하면 자동으로 활성화됩니다</p>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Play className="mx-auto h-8 w-8 mb-2" />
              <p>프리뷰를 시작하려면</p>
              <p>시작 버튼을 클릭하세요</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
