"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProjectType, BackendFramework } from "@claudplit/shared";

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    projectType: ProjectType;
    backendFramework: BackendFramework;
  }) => void;
  isLoading?: boolean;
}

export function CreateProjectModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [projectType, setProjectType] = useState<ProjectType>(ProjectType.WEB);
  const [backendFramework, setBackendFramework] = useState<BackendFramework>(
    BackendFramework.NONE
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), projectType, backendFramework });
    setName("");
    setProjectType(ProjectType.WEB);
    setBackendFramework(BackendFramework.NONE);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>새 프로젝트 생성</DialogTitle>
            <DialogDescription>
              프로젝트 이름과 스택을 선택하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                프로젝트 이름
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="my-awesome-app"
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">프로젝트 유형</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={projectType === ProjectType.WEB ? "default" : "outline"}
                  className="h-16 flex-col gap-1"
                  onClick={() => setProjectType(ProjectType.WEB)}
                >
                  <span className="text-xl">🌐</span>
                  <span className="text-xs">웹앱</span>
                </Button>
                <Button
                  type="button"
                  variant={projectType === ProjectType.NATIVE ? "default" : "outline"}
                  className="h-16 flex-col gap-1"
                  onClick={() => setProjectType(ProjectType.NATIVE)}
                >
                  <span className="text-xl">📱</span>
                  <span className="text-xs">네이티브 앱</span>
                </Button>
              </div>
            </div>

            {projectType === ProjectType.WEB && (
              <div className="grid gap-2">
                <label className="text-sm font-medium">백엔드 스택</label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={
                      backendFramework === BackendFramework.NONE
                        ? "default"
                        : "outline"
                    }
                    className="h-20 flex-col gap-1"
                    onClick={() => setBackendFramework(BackendFramework.NONE)}
                  >
                    <span className="text-lg">⚡</span>
                    <span className="text-xs text-center leading-tight">
                      프론트엔드
                      <br />
                      전용
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant={
                      backendFramework === BackendFramework.EXPRESS
                        ? "default"
                        : "outline"
                    }
                    className="h-20 flex-col gap-1"
                    onClick={() => setBackendFramework(BackendFramework.EXPRESS)}
                  >
                    <span className="text-lg">🟢</span>
                    <span className="text-xs text-center leading-tight">
                      Express
                      <br />
                      (Node.js)
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant={
                      backendFramework === BackendFramework.FASTAPI
                        ? "default"
                        : "outline"
                    }
                    className="h-20 flex-col gap-1"
                    onClick={() => setBackendFramework(BackendFramework.FASTAPI)}
                  >
                    <span className="text-lg">🐍</span>
                    <span className="text-xs text-center leading-tight">
                      FastAPI
                      <br />
                      (Python)
                    </span>
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button type="submit" disabled={!name.trim() || isLoading}>
              {isLoading ? "생성 중..." : "생성"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
