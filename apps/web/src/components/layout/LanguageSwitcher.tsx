"use client";

import { useTranslation, type Locale } from "@/lib/i18n";
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
      size="icon"
      onClick={toggleLocale}
      className="h-9 w-9 text-xs font-medium"
      title={t("language.select")}
    >
      {locale === "en" ? "EN" : "KO"}
    </Button>
  );
}
