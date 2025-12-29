"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTranslation } from "@/lib/i18n";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  backHref?: string;
}

export function Header({ title, showBack, backHref = "/" }: HeaderProps) {
  const { t } = useTranslation();
  const displayTitle = title || t("common.appName");

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {showBack && (
            <Link href={backHref}>
              <Button variant="ghost" size="sm">
                ← {t("header.home")}
              </Button>
            </Link>
          )}
          <h1 className="font-semibold">{displayTitle}</h1>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Link href="/settings">
            <Button variant="ghost" size="icon" title={t("header.settings")}>
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
