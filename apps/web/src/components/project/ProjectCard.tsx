"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ProjectListItem } from "@claudplit/shared";
import { projectTypeLabels } from "@claudplit/shared";

interface ProjectCardProps {
  project: ProjectListItem;
  onDelete?: (id: string) => void;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return new Date(date).toLocaleDateString("ko-KR");
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  return (
    <Link href={`/project/${project.id}`}>
      <Card className="group cursor-pointer transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base">{project.name}</CardTitle>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(project.id);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{projectTypeLabels[project.projectType]}</span>
            <span>{formatRelativeTime(project.updatedAt)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
