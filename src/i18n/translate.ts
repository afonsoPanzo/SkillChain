import { en, type TKey } from "./en";
import { pt } from "./pt";

export type Lang = "en" | "pt";
export const LANGS: readonly Lang[] = ["en", "pt"];
export const DEFAULT_LANG: Lang = "en";

export type { TKey };
export type Params = Record<string, string | number>;
export type TFunction = (key: TKey, params?: Params) => string;

export const DICTIONARIES: Record<Lang, Record<TKey, string>> = { en, pt };

/** BCP 47 locale used for numbers: "0.5" in English, "0,5" in Portuguese. */
export const LOCALES: Record<Lang, string> = { en: "en-US", pt: "pt-PT" };

/** Looks up `key` and replaces `{name}` placeholders. */
export function translate(lang: Lang, key: TKey, params?: Params): string {
  const text = DICTIONARIES[lang][key];
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

export function makeT(lang: Lang): TFunction {
  return (key, params) => translate(lang, key, params);
}

/** Dictionary key of an item name. Item ids are checked by the parity test. */
export function itemKey(id: number): TKey {
  return `item.${id}` as TKey;
}

export function isLang(value: unknown): value is Lang {
  return value === "en" || value === "pt";
}

/** Formats a number following the language (en: 0.5, pt: 0,5). */
export function formatNumberFor(lang: Lang, value: number, maximumFractionDigits = 0): string {
  return value.toLocaleString(LOCALES[lang], { maximumFractionDigits });
}
