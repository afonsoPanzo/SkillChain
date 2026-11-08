/**
 * Demo-mode flag. Lives in sessionStorage so it survives a reload but not a
 * new browser session. Storage is optional: if it is blocked, demo mode still
 * works for the current page.
 */
const KEY = "skillchain.demo";

let active = false;
let loaded = false;
const listeners = new Set<() => void>();

function readStored(): boolean {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function isDemoActive(): boolean {
  if (!loaded) {
    // On the server there is no sessionStorage: readStored() returns false.
    loaded = true;
    active = readStored();
  }
  return active;
}

export function subscribeDemo(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setDemoActive(value: boolean) {
  loaded = true;
  active = value;
  try {
    if (value) sessionStorage.setItem(KEY, "1");
    else sessionStorage.removeItem(KEY);
  } catch {
    // Blocked storage: the flag only lasts for this page.
  }
  listeners.forEach((listener) => listener());
}
