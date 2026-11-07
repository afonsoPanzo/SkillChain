import { DEFAULT_LANG, isLang, type Lang } from "./translate";

const STORAGE_KEY = "skillchain.lang";

let current: Lang = DEFAULT_LANG;
const listeners = new Set<() => void>();

function applyToDocument(lang: Lang) {
  if (typeof document !== "undefined") document.documentElement.lang = lang;
}

export function getLang(): Lang {
  return current;
}

export function subscribeLang(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function set(lang: Lang) {
  if (lang === current) return;
  current = lang;
  applyToDocument(lang);
  listeners.forEach((listener) => listener());
}

/** Changes the language, remembers it in localStorage and updates <html lang>. */
export function setLang(lang: Lang) {
  set(lang);
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Private mode or blocked storage: the choice just lasts for this visit.
  }
}

/** Reads the saved choice once on the client, after hydration. */
export function restoreLang() {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage unavailable: keep the default.
  }
  if (isLang(stored)) set(stored);
  else applyToDocument(current);
}
