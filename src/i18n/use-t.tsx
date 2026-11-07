"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { getLang, restoreLang, subscribeLang } from "./lang";
import {
  DEFAULT_LANG,
  formatNumberFor,
  makeT,
  type Lang,
  type TFunction,
} from "./translate";

export function useLang(): Lang {
  return useSyncExternalStore(subscribeLang, getLang, () => DEFAULT_LANG);
}

/** Translator for the current language, plus number formatting that follows it. */
export function useT(): {
  t: TFunction;
  lang: Lang;
  formatNumber: (value: number, maximumFractionDigits?: number) => string;
} {
  const lang = useLang();
  const t = useMemo(() => makeT(lang), [lang]);
  const formatNumber = useCallback(
    (value: number, maximumFractionDigits = 0) =>
      formatNumberFor(lang, value, maximumFractionDigits),
    [lang],
  );
  return { t, lang, formatNumber };
}

/** Restores the saved language after hydration. Render it once, in the providers. */
export function LangSync() {
  useEffect(() => restoreLang(), []);
  return null;
}
