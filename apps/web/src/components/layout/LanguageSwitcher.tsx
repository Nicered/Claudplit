"use client";

import { useTranslation, type Locale } from "@/lib/i18n";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();

  const toggleLocale = () => {
    const newLocale: Locale = locale === "en" ? "ko" : "en";
    setLocale(newLocale);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLocale}
      className="flex items-center gap-1.5"
      title={t("language.select")}
    >
      <Globe className="h-4 w-4" />
      <span className="text-sm">{locale === "en" ? "EN" : "KO"}</span>
    </Button>
  );
}
