"use client";

import { Plus, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";

interface CreateProjectCardProps {
  onClick: () => void;
}

export function CreateProjectCard({ onClick }: CreateProjectCardProps) {
  const { t } = useTranslation();

  return (
    <Card
      className="group relative cursor-pointer overflow-hidden border-2 border-dashed transition-all hover:border-primary hover:shadow-lg"
      onClick={onClick}
    >
      {/* Gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="relative flex h-full min-h-[140px] flex-col items-center justify-center gap-3 p-6">
        <div className="relative">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
            <Plus className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
          </div>
          <Sparkles className="absolute -right-1 -top-1 h-4 w-4 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <div className="text-center">
          <span className="font-medium text-muted-foreground transition-colors group-hover:text-foreground">
            {t("project.create")}
          </span>
          <p className="mt-1 text-xs text-muted-foreground/70">
            {t("project.createDescription")}
          </p>
        </div>
      </div>
    </Card>
  );
}
