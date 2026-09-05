/**
 * Safe localStorage wrapper that protects against SecurityError exceptions
 * thrown by WebKit in private browsing mode, iframes, and restricted in-app browsers (Telegram, LINE, etc.).
 */
let temporary: Map<string, string | null> | null = null;
/** Practice writes are kept in memory and discarded on exit. */
export function setPracticeStorage(enabled: boolean) { temporary = enabled ? new Map() : null; }
export const safeStorage = {
  getItem(key: string): string | null {
    if (temporary?.has(key)) return temporary.get(key) ?? null;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // In restricted environments, localStorage access throws SecurityError
    }
    return null;
  },

  setItem(key: string, value: string): void {
    if (temporary) { temporary.set(key, value); return; }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // QuotaExceededError or SecurityError ignored gracefully
    }
  },

  removeItem(key: string): void {
    if (temporary) { temporary.set(key, null); return; }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // SecurityError ignored gracefully
    }
  }
};
