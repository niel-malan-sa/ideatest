import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { translations, Locale, TranslationKey } from "./translations";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem("ui-language");
    return (saved === "fi" || saved === "en") ? saved : "en";
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("ui-language", l);
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    return translations[key]?.[locale] ?? key;
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
