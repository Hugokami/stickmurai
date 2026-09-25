export const arena = { left: -2300, right: 3700, top: -1750, bottom: 2450 } as const;

export function clampToArena(actor: { x: number; y: number }) {
  actor.x = Math.max(arena.left + 48, Math.min(arena.right - 48, actor.x));
  actor.y = Math.max(arena.top + 48, Math.min(arena.bottom - 48, actor.y));
}
