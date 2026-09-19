import { globals } from './globals';

/**
 * Legacy portal check — CrazyGames deployment is discontinued.
 */
export function isCrazyGames(): boolean {
  return false;
}

/**
 * Checks whether the browser supports standard or vendor-prefixed Fullscreen API.
 */
export function isFullscreenSupported(): boolean {
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
  if (isFullscreenActive()) return false;
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
  if (!isFullscreenActive()) return false;
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
  const hudBtn = document.getElementById('fullscreen-hud-btn');
  const pauseBtn = document.getElementById('pause-fullscreen-btn');
  const menuBtn = document.getElementById('menu-fullscreen-btn');
  const settingsBtn = document.getElementById('settings-fullscreen-btn');

  // In-game HUD fullscreen button is removed from battlefield
  if (hudBtn) hudBtn.style.display = 'none';

  const active = isFullscreenActive();
  const isJa = globals.currentLang === 'ja';

  if (pauseBtn) {
    pauseBtn.style.display = 'block';
    pauseBtn.textContent = active 
      ? (isJa ? '🗗 全画面解除' : '🗗 Exit Fullscreen') 
      : (isJa ? '⛶ 全画面表示' : '⛶ Fullscreen');
  }

  if (menuBtn) {
    menuBtn.style.display = 'flex';
    menuBtn.innerHTML = `
      <svg class="grid-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
      </svg>
      <div class="grid-btn-labels">
        <span class="grid-btn-title">${active ? (isJa ? '全画面解除' : 'WINDOWED') : (isJa ? '全画面表示' : 'FULLSCREEN')}</span>
        <span class="grid-btn-sub">${active ? (isJa ? '縮小' : 'Exit') : (isJa ? '拡大' : 'Display')}</span>
      </div>
      <span class="grid-btn-chevron">›</span>
    `;
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
    if (e.key === 'F11' || (e.altKey && e.key === 'Enter')) {
      e.preventDefault();
      toggleFullscreen();
    }
  });

  updateFullscreenUI();
}
