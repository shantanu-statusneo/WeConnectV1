/**
 * Internationalization module for WEC-Guardian
 * Provides static translated content for each language
 */

import { en, type TranslationKeys as EN } from "./en";
import { hi, type TranslationKeys as HI } from "./hi";
import { fr, type TranslationKeys as FR } from "./fr";

export type Language = "en" | "hi" | "fr";
export type TranslationKeys = EN & HI & FR;

export const translations: Record<Language, TranslationKeys> = {
  en,
  hi,
  fr,
};

export const languageMetadata: Record<
  Language,
  { code: string; name: string; nativeName: string; langCode: string }
> = {
  en: { code: "en", name: "English", nativeName: "English", langCode: "en-US" },
  hi: { code: "hi", name: "Hindi", nativeName: "हिन्दी", langCode: "hi-IN" },
  fr: { code: "fr", name: "French", nativeName: "Français", langCode: "fr-FR" },
};

/**
 * Get translations for a specific language
 */
export function getTranslations(lang: Language): TranslationKeys {
  return translations[lang] ?? translations.en;
}

/**
 * Get language metadata
 */
export function getLanguageMetadata(lang: Language) {
  return languageMetadata[lang] ?? languageMetadata.en;
}

/**
 * List all available languages
 */
export function getAvailableLanguages() {
  return Object.keys(languageMetadata) as Language[];
}

export { en, hi, fr };
