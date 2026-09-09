import { safeStorage } from './storage';

let reduced = safeStorage.getItem('stickmurai_reduced_motion') === 'on';
export const reducedMotion = () => reduced;
export function setReducedMotion(value: boolean) {
  reduced = value;
  safeStorage.setItem('stickmurai_reduced_motion', value ? 'on' : 'off');
  document.documentElement.classList.toggle('reduced-motion', value);
}

let sfxVolume = .5;
function readSfxVolume() {
  try {
    const value = JSON.parse(safeStorage.getItem('stickmurai_qol') || '{}').sfx;
    if (typeof value === 'number' && Number.isFinite(value)) sfxVolume = Math.max(0, Math.min(1, value));
  } catch { /* Retain the last valid preference. */ }
}
readSfxVolume();
window.addEventListener('qol-audio', readSfxVolume);
export const getSfxVolume = () => sfxVolume;

// Local-only bounded diagnostics; never collect accounts, tokens or save data.
const diagnostics: string[] = [];
let lastSpike = 0;
export function recordDiagnostic(message: string) {
  diagnostics.push(`${new Date().toISOString()} ${message.slice(0, 180)}`);
  if (diagnostics.length > 30) diagnostics.shift();
}
export function recordFrameTime(ms: number) {
  if (ms > 50 && performance.now() - lastSpike > 5000 && !document.hidden) {
    lastSpike = performance.now();
    recordDiagnostic(`Slow frame: ${Math.round(ms)}ms`);
  }
}
export const readDiagnostics = () => diagnostics.slice();
