"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { useProjectStore } from "@/stores/useProjectStore";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { currentProject, fetchProject, isLoading, error } = useProjectStore();

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
    }
  }, [projectId, fetchProject]);

  if (isLoading && !currentProject) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (error || !currentProject) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <p className="text-lg font-medium">프로젝트를 찾을 수 없습니다</p>
          <p className="text-sm text-muted-foreground mt-1">
            {error || "프로젝트가 삭제되었거나 존재하지 않습니다."}
          </p>
        </div>
        <Button onClick={() => router.push("/")} variant="outline">
          홈으로 돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        title={currentProject.name}
        showBack
        backHref="/"
      />
      <WorkspaceLayout projectId={projectId} />
    </div>
  );
}
