import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";

/** Translate an outcome type value (functional/emotional/social) */
export function useTranslateType() {
  const { t } = useLanguage();
  return (type: string) => {
    const key = `outcomes.${type}` as TranslationKey;
    const val = t(key);
    return val === key ? type : val;
  };
}

/** Translate a priority label */
export function useTranslatePriority() {
  const { t } = useLanguage();
  return (priority: string) => {
    const key = `priority.${priority}` as TranslationKey;
    const val = t(key);
    return val === key ? priority : val;
  };
}
