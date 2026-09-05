/** Pure helpers shared by settings, input and save validation. */
export const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
export class ActionBuffer {
  private pending = new Map<string, number>();
  queue(action: string, now: number, windowMs: number) { this.pending.set(action, now + windowMs); }
  consume(action: string, now: number, ready: boolean) {
    const expiry = this.pending.get(action);
    if (expiry === undefined) return false;
    if (now > expiry) { this.pending.delete(action); return false; }
    if (!ready) return false;
    this.pending.delete(action); return true;
  }
  clear() { this.pending.clear(); }
}

const numericKeys = ['stickmurai_magatama', 'stickmurai_current_stage', 'stickmurai_max_stage'];
const listKeys = ['stickmurai_unlocked_heroes', 'stickmurai_unlocked_skills', 'stickmurai_fusions', 'stickmurai_seals', 'stickmurai_cleared_stages', 'stickmurai_redeemed_codes'];
const objectKeys = ['stickmurai_campaign_upgrades', 'stickmurai_stage_stars', 'highScores', 'stickmurai_stage_bests'];
export const SAVE_KEYS = [...numericKeys, ...listKeys, ...objectKeys, 'stickmurai_selected_hero', 'stickmurai_selected_skill'];
export interface SaveFile { game: 'stickmurai'; version: 1; savedAt: string; data: Record<string, string> }
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const integer = (v: unknown, max = 1e9) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 && v <= max;
export function validateSave(text: string): SaveFile {
  if (text.length > 1_000_000) throw Error('Save file is too large.');
  const file: unknown = JSON.parse(text);
  if (!record(file) || file.game !== 'stickmurai' || file.version !== 1 || !record(file.data) || typeof file.savedAt !== 'string') throw Error('This is not a supported Stickmurai save.');
  const data = Object.create(null) as Record<string, string>;
  for (const [key, value] of Object.entries(file.data)) {
    if (!SAVE_KEYS.includes(key) || typeof value !== 'string' || value.length > 200000) throw Error('Save contains an unsupported field.');
    if (numericKeys.includes(key)) {
      if (!/^\d+$/.test(value) || !integer(Number(value)) || (key.includes('stage') && Number(value) < 1)) throw Error('Invalid progression value.');
    } else if (listKeys.includes(key)) {
      const a: unknown = JSON.parse(value);
      const numbers = key.endsWith('_seals') || key.endsWith('_cleared_stages');
      if (!Array.isArray(a) || a.length > 10000 || a.some(v => numbers ? !integer(v, 1e6) : typeof v !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(v))) throw Error('Invalid unlock list.');
    } else if (objectKeys.includes(key)) {
      const o: unknown = JSON.parse(value);
      if (!record(o) || Object.keys(o).length > 10000) throw Error('Invalid records.');
      for (const [k, v] of Object.entries(o)) {
        if (!/^[a-zA-Z0-9_-]{1,60}$/.test(k) || ['__proto__','constructor','prototype'].includes(k)) throw Error('Invalid record name.');
        if (key === 'stickmurai_stage_bests') {
          if (!record(v) || Object.keys(v).some(x => !['time','damage','combo'].includes(x)) || !['time','damage','combo'].every(x => typeof v[x] === 'number' && Number.isFinite(v[x]) && Number(v[x]) >= 0 && Number(v[x]) <= 1e9)) throw Error('Invalid personal best.');
        } else if (!integer(v, key === 'stickmurai_stage_stars' ? 3 : 1e9)) throw Error('Invalid upgrade record.');
      }
    } else if (!/^[a-zA-Z0-9_-]{1,80}$/.test(value)) throw Error('Invalid selection.');
    data[key] = value;
  }
  if (!Object.keys(data).length) throw Error('Save is empty.');
  if (Number(data.stickmurai_current_stage || 1) > Number(data.stickmurai_max_stage || 1)) throw Error('Selected stage exceeds unlocked stage.');
  return {game: 'stickmurai', version: 1, savedAt: file.savedAt, data};
}
