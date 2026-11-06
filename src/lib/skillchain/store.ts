/**
 * Tiny invalidation channel: after a confirmed transaction every query hook
 * re-reads its data from the backend.
 */
let version = 0;
const listeners = new Set<() => void>();

export function subscribeData(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getDataVersion() {
  return version;
}

export function invalidateData() {
  version += 1;
  listeners.forEach((listener) => listener());
}
