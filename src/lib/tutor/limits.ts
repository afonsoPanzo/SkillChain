/** Largest request body the tutor accepts, in bytes. */
export const MAX_BODY_BYTES = 1024;

/** In-memory cache with an expiry and a size cap. Lives as long as the server instance. */
export class TtlCache<T> {
  private entries = new Map<string, { value: T; expires: number }>();

  constructor(private maxEntries = 500) {}

  get(key: string, now = Date.now()): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expires <= now) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number, now = Date.now()) {
    if (this.entries.size >= this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
    this.entries.set(key, { value, expires: now + ttlMs });
  }
}

/** Fixed-window request counter per key (the client IP). */
export class RateLimiter {
  private windows = new Map<string, { start: number; count: number }>();

  constructor(
    private limit = 10,
    private windowMs = 5 * 60_000,
    private maxKeys = 2000,
  ) {}

  /** Returns false once `key` has used up its requests in the current window. */
  allow(key: string, now = Date.now()): boolean {
    const current = this.windows.get(key);
    if (!current || now - current.start >= this.windowMs) {
      if (this.windows.size >= this.maxKeys) this.windows.clear();
      this.windows.set(key, { start: now, count: 1 });
      return true;
    }
    current.count += 1;
    return current.count <= this.limit;
  }
}

/** Client IP from the proxy headers, or a shared bucket when unknown. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "unknown";
}
