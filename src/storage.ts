/**
 * Safe localStorage wrapper that protects against SecurityError exceptions
 * thrown by WebKit in private browsing mode, iframes, and restricted in-app browsers (Telegram, LINE, etc.).
 * Also integrates directly with CrazyGames Data Module for cross-device cloud saves.
 */
let temporary: Map<string, string | null> | null = null;
/** Practice writes are kept in memory and discarded on exit. */
export function setPracticeStorage(enabled: boolean) { temporary = enabled ? new Map() : null; }

function getCrazyData(): any {
  if (typeof window !== 'undefined') {
    try {
      return (window as any).CrazyGames?.SDK?.data || (window as any).crazygames?.SDK?.data || null;
    } catch {
      return null;
    }
  }
  return null;
}

export const safeStorage = {
  getItem(key: string): string | null {
    if (temporary?.has(key)) return temporary.get(key) ?? null;

    // 1. Try CrazyGames Data module if available
    try {
      const cgData = getCrazyData();
      if (cgData && typeof cgData.getItem === 'function') {
        const cloudVal = cgData.getItem(key);
        if (cloudVal !== null && cloudVal !== undefined) {
          return String(cloudVal);
        }
      }
    } catch {
      // Ignore CrazyGames Data errors gracefully
    }

    // 2. Standard localStorage
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

    // 1. Write to standard localStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // QuotaExceededError or SecurityError ignored gracefully
    }

    // 2. Sync to CrazyGames Data module for cloud save
    try {
      const cgData = getCrazyData();
      if (cgData && typeof cgData.setItem === 'function') {
        cgData.setItem(key, String(value));
      }
    } catch {
      // Ignore CrazyGames Data errors gracefully
    }
  },

  removeItem(key: string): void {
    if (temporary) { temporary.set(key, null); return; }

    // 1. Remove from localStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // SecurityError ignored gracefully
    }

    // 2. Remove from CrazyGames Data module
    try {
      const cgData = getCrazyData();
      if (cgData && typeof cgData.removeItem === 'function') {
        cgData.removeItem(key);
      }
    } catch {
      // Ignore CrazyGames Data errors gracefully
    }
  }
};
