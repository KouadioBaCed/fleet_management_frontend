import { useCallback } from 'react';
import { useLanguage } from '@/store/settingsStore';
import { fr, type TranslationKeys } from './locales/fr';
import { en } from './locales/en';

// Available translations
const translations: Record<string, TranslationKeys> = {
  fr,
  en,
};

// Type-safe nested key access
type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}.${NestedKeyOf<T[K]>}` | K
          : K
        : never;
    }[keyof T]
  : never;

export type TranslationKey = NestedKeyOf<TranslationKeys>;

// Get nested value from object using dot notation
function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.');
  let result = obj;

  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return path; // Return the key itself if not found
    }
  }

  return typeof result === 'string' ? result : path;
}

// Replace placeholders in translation string
function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;

  return str.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key]?.toString() ?? `{${key}}`;
  });
}

/**
 * Hook to get translations based on current language
 */
export function useTranslation() {
  const language = useLanguage();

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const currentTranslations = translations[language] || translations.fr;
      const value = getNestedValue(currentTranslations, key);
      return interpolate(value, params);
    },
    [language]
  );

  return { t, language };
}

/**
 * Get translation outside of React components
 * Note: This uses the stored language preference from localStorage
 */
export function getTranslation(key: string, params?: Record<string, string | number>): string {
  // Try to get language from localStorage
  let language = 'fr';
  try {
    const stored = localStorage.getItem('user_preferences');
    if (stored) {
      const prefs = JSON.parse(stored);
      language = prefs.language || 'fr';
    }
  } catch {
    // Use default
  }

  const currentTranslations = translations[language] || translations.fr;
  const value = getNestedValue(currentTranslations, key);
  return interpolate(value, params);
}

// Export translations for direct access if needed
export { fr, en };
export type { TranslationKeys };
