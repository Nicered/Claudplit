"use client";

import { MessageCircleQuestion, Hammer } from "lucide-react";
import { useChatStore } from "@/stores/useChatStore";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function ModeToggle() {
  const { t } = useTranslation();
  const { mode, setMode, isStreaming } = useChatStore();

  return (
    <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
      <button
        onClick={() => setMode("ask")}
        disabled={isStreaming}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors",
          mode === "ask"
            ? "bg-blue-500 text-white"
            : "text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10",
          isStreaming && "opacity-50 cursor-not-allowed"
        )}
      >
        <MessageCircleQuestion className="h-4 w-4" />
        {t("chat.modeAsk")}
      </button>
      <button
        onClick={() => setMode("build")}
        disabled={isStreaming}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors",
          mode === "build"
            ? "bg-green-500 text-white"
            : "text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10",
          isStreaming && "opacity-50 cursor-not-allowed"
        )}
      >
        <Hammer className="h-4 w-4" />
        {t("chat.modeBuild")}
      </button>
    </div>
  );
}
