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
import { ProjectType, BackendFramework } from "@claudeship/shared";
import { useTranslation } from "@/lib/i18n";

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
  const { t } = useTranslation();
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
            <DialogTitle>{t("project.createTitle")}</DialogTitle>
            <DialogDescription>
              {t("project.name")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                {t("project.name")}
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("project.namePlaceholder")}
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("project.type")}</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={projectType === ProjectType.WEB ? "default" : "outline"}
                  className="h-16 flex-col gap-1"
                  onClick={() => setProjectType(ProjectType.WEB)}
                >
                  <span className="text-xl">🌐</span>
                  <span className="text-xs">{t("project.typeWeb")}</span>
                </Button>
                <Button
                  type="button"
                  variant={projectType === ProjectType.NATIVE ? "default" : "outline"}
                  className="h-16 flex-col gap-1"
                  onClick={() => setProjectType(ProjectType.NATIVE)}
                >
                  <span className="text-xl">📱</span>
                  <span className="text-xs">{t("project.typeNative")}</span>
                </Button>
              </div>
            </div>

            {projectType === ProjectType.WEB && (
              <div className="grid gap-2">
                <label className="text-sm font-medium">{t("project.backendStack")}</label>
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
                      {t("project.backendNone")}
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
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={!name.trim() || isLoading}>
              {isLoading ? t("common.loading") : t("common.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
