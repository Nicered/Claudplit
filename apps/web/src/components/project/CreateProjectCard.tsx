"use client";

import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CreateProjectCardProps {
  onClick: () => void;
}

export function CreateProjectCard({ onClick }: CreateProjectCardProps) {
  return (
    <Card
      className="cursor-pointer border-dashed transition-colors hover:border-primary hover:bg-muted/50"
      onClick={onClick}
    >
      <CardContent className="flex h-full min-h-[120px] flex-col items-center justify-center gap-2 p-6">
        <div className="rounded-full bg-muted p-3">
          <Plus className="h-6 w-6 text-muted-foreground" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          새 프로젝트
        </span>
      </CardContent>
    </Card>
  );
}
