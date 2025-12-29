import { create } from "zustand";
import { persist } from "zustand/middleware";

import en from "./translations/en.json";
import ko from "./translations/ko.json";

export type Locale = "en" | "ko";

type TranslationValue = string | Record<string, unknown>;
type Translations = Record<string, TranslationValue | Record<string, TranslationValue>>;

const translations: Record<Locale, Translations> = {
  en,
  ko,
};

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: "ko",
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: "claudeship-locale",
    }
  )
);

/**
 * Get a translation by key path (e.g., "common.loading")
 * Supports variable substitution with {varName} syntax
 */
export function t(key: string, locale?: Locale, variables?: Record<string, string | number>): string {
  const currentLocale = locale || useLocaleStore.getState().locale;
  const keys = key.split(".");

  let value: unknown = translations[currentLocale];

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      // Fallback to English
      value = translations.en;
      for (const fallbackKey of keys) {
        if (value && typeof value === "object" && fallbackKey in value) {
          value = (value as Record<string, unknown>)[fallbackKey];
        } else {
          return key; // Return key if not found
        }
      }
      break;
    }
  }

  let result = typeof value === "string" ? value : key;

  // Variable substitution
  if (variables) {
    for (const [varName, varValue] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{${varName}\\}`, "g"), String(varValue));
    }
  }

  return result;
}

/**
 * React hook for translations with automatic re-render on locale change
 */
export function useTranslation() {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);

  const translate = (key: string, variables?: Record<string, string | number>): string => {
    return t(key, locale, variables);
  };

  return {
    t: translate,
    locale,
    setLocale,
  };
}
