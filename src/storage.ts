/**
 * Safe localStorage wrapper that protects against SecurityError exceptions
 * thrown by WebKit in private browsing mode, iframes, and restricted in-app browsers (Telegram, LINE, etc.).
 */
export const safeStorage = {
  getItem(key: string): string | null {
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
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // QuotaExceededError or SecurityError ignored gracefully
    }
  },

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // SecurityError ignored gracefully
    }
  }
};
