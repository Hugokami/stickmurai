import { globals } from './globals';

/**
 * Checks if the current environment is CrazyGames portal / iframe / SDK wrapper.
 * Fullscreen is strictly disallowed inside CrazyGames to avoid iframe violations.
 */
export function isCrazyGames(): boolean {
  if (typeof window === 'undefined') return false;
  if ((window as any).isCrazyGames) return true;
  if ((window as any).CrazyGames?.SDK || (window as any).crazygames?.SDK) return true;
  if (typeof document !== 'undefined' && document.documentElement?.classList?.contains('crazygames')) return true;
  const host = window.location?.hostname?.toLowerCase() || '';
  const search = window.location?.search?.toLowerCase() || '';
  const ref = (typeof document !== 'undefined' ? document.referrer : '').toLowerCase();
  return host.includes('crazygames') || search.includes('crazygames') || ref.includes('crazygames');
}

/**
 * Checks whether the browser supports standard or vendor-prefixed Fullscreen API.
 */
export function isFullscreenSupported(): boolean {
  if (isCrazyGames()) return false;
  if (typeof document === 'undefined') return false;
  const doc = document as any;
  const docEl = document.documentElement as any;
  return !!(
    doc.fullscreenEnabled ||
    doc.webkitFullscreenEnabled ||
    doc.mozFullScreenEnabled ||
    doc.msFullscreenEnabled ||
    docEl.requestFullscreen ||
    docEl.webkitRequestFullscreen ||
    docEl.mozRequestFullScreen ||
    docEl.msRequestFullscreen
  );
}

/**
 * Checks whether the document is currently in fullscreen mode.
 */
export function isFullscreenActive(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as any;
  return !!(
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  );
}

/**
 * Requests fullscreen on documentElement with optional landscape orientation lock.
 */
export async function requestFullscreen(): Promise<boolean> {
  if (isCrazyGames() || isFullscreenActive()) return false;
  try {
    const docEl = document.documentElement as any;
    const req = docEl.requestFullscreen ||
                docEl.webkitRequestFullscreen ||
                docEl.mozRequestFullScreen ||
                docEl.msRequestFullscreen;
    if (req) {
      const p = req.call(docEl);
      if (p && typeof p.then === 'function') {
        await p;
      }
      try {
        if (screen.orientation && (screen.orientation as any).lock) {
          await (screen.orientation as any).lock('landscape');
        }
      } catch (_) {}
      updateFullscreenUI();
      return true;
    }
  } catch (err) {
    console.warn('[Fullscreen] Request error:', err);
  }
  return false;
}

/**
 * Exits fullscreen mode.
 */
export async function exitFullscreen(): Promise<boolean> {
  if (isCrazyGames() || !isFullscreenActive()) return false;
  try {
    const doc = document as any;
    const exit = doc.exitFullscreen ||
                 doc.webkitExitFullscreen ||
                 doc.mozCancelFullScreen ||
                 doc.msExitFullscreen;
    if (exit) {
      const p = exit.call(doc);
      if (p && typeof p.then === 'function') {
        await p;
      }
      updateFullscreenUI();
      return true;
    }
  } catch (err) {
    console.warn('[Fullscreen] Exit error:', err);
  }
  return false;
}

/**
 * Toggles fullscreen mode on or off.
 */
export async function toggleFullscreen(): Promise<boolean> {
  if (isFullscreenActive()) {
    return exitFullscreen();
  } else {
    return requestFullscreen();
  }
}

/**
 * Synchronizes fullscreen UI elements across HUD, pause menu, main menu, and settings.
 */
export function updateFullscreenUI(): void {
  if (typeof document === 'undefined') return;
  const isCg = isCrazyGames();
  const hudBtn = document.getElementById('fullscreen-hud-btn');
  const pauseBtn = document.getElementById('pause-fullscreen-btn');
  const menuBtn = document.getElementById('menu-fullscreen-btn');
  const settingsBtn = document.getElementById('settings-fullscreen-btn');
  const settingsRow = document.getElementById('setting-fullscreen-row');

  if (isCg) {
    if (hudBtn) hudBtn.style.display = 'none';
    if (pauseBtn) pauseBtn.style.display = 'none';
    if (menuBtn) menuBtn.style.display = 'none';
    if (settingsRow) settingsRow.style.display = 'none';
    return;
  }

  const active = isFullscreenActive();
  const isJa = globals.currentLang === 'ja';

  if (hudBtn) {
    hudBtn.style.display = 'flex';
    hudBtn.innerHTML = active ? '🗗' : '⛶';
    hudBtn.title = active ? (isJa ? '全画面解除' : 'Exit Fullscreen') : (isJa ? '全画面表示' : 'Fullscreen');
    if (active) {
      hudBtn.classList.add('is-fullscreen');
    } else {
      hudBtn.classList.remove('is-fullscreen');
    }
  }

  if (pauseBtn) {
    pauseBtn.style.display = 'block';
    pauseBtn.textContent = active 
      ? (isJa ? '🗗 全画面解除' : '🗗 Exit Fullscreen') 
      : (isJa ? '⛶ 全画面表示' : '⛶ Fullscreen');
  }

  if (menuBtn) {
    menuBtn.style.display = 'block';
    menuBtn.textContent = active 
      ? (isJa ? '🗗 全画面解除' : '🗗 Exit Fullscreen') 
      : (isJa ? '⛶ 全画面表示' : '⛶ Fullscreen');
  }

  if (settingsBtn) {
    settingsBtn.textContent = active 
      ? (isJa ? '解除' : 'Exit') 
      : (isJa ? '有効' : 'Enter');
  }
}

/**
 * Initializes fullscreen event listeners, buttons, and keyboard shortcuts.
 */
export function initFullscreen(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  if (isCrazyGames()) {
    document.documentElement.classList.add('crazygames');
    updateFullscreenUI();
    return;
  }

  const bindBtn = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const handler = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFullscreen();
    };
    el.addEventListener('click', handler);
    el.addEventListener('touchend', handler);
  };

  bindBtn('fullscreen-hud-btn');
  bindBtn('pause-fullscreen-btn');
  bindBtn('menu-fullscreen-btn');
  bindBtn('settings-fullscreen-btn');

  const fsEvents = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
  fsEvents.forEach((ev) => {
    document.addEventListener(ev, () => {
      updateFullscreenUI();
    });
  });

  // Keyboard shortcut: F11 or Alt+Enter toggles fullscreen
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (isCrazyGames()) return;
    if (e.key === 'F11' || (e.altKey && e.key === 'Enter')) {
      e.preventDefault();
      toggleFullscreen();
    }
  });

  updateFullscreenUI();
}
