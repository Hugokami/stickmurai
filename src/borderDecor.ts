import { arena } from './arena';
import { borderPropImages } from './assets';

export type BorderDecorType = 'torigate' | 'statue' | 'stoneLamp';

export interface BorderDecorItem {
  readonly type: BorderDecorType;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly flip?: boolean;
}

const PAD = 50;

/**
 * Japanese Shrine Border & Interior Decorations.
 * All props are positioned strictly INSIDE the arena boundaries [arena.left + PAD, arena.right - PAD, arena.top + PAD, arena.bottom - PAD].
 * Stone lamps are distributed uniformly across the entire battlefield, scaled compactly, with hard impassable circular collision boundaries.
 */
export const BORDER_DECORATIONS: readonly BorderDecorItem[] = [
  // --- NORTH SACRED PERIMETER GATES & GUARDIANS ---
  { type: 'statue', x: arena.left + PAD, y: arena.top + PAD, w: 160, h: 188 },
  { type: 'torigate', x: 800, y: arena.top + PAD, w: 380, h: 360 },
  { type: 'statue', x: 1300, y: arena.top + PAD, w: 160, h: 188, flip: true },
  { type: 'statue', x: arena.right - PAD - 160, y: arena.top + PAD, w: 160, h: 188, flip: true },

  // --- SOUTH SACRED PERIMETER GATES & GUARDIANS ---
  { type: 'statue', x: arena.left + PAD, y: arena.bottom - PAD - 188, w: 160, h: 188 },
  { type: 'torigate', x: 800, y: arena.bottom - PAD - 360, w: 380, h: 360 },
  { type: 'statue', x: 1300, y: arena.bottom - PAD - 188, w: 160, h: 188, flip: true },
  { type: 'statue', x: arena.right - PAD - 160, y: arena.bottom - PAD - 188, w: 160, h: 188, flip: true },

  // --- WEST & EAST BORDER SHRINES ---
  { type: 'statue', x: arena.left + PAD, y: 180 - 200, w: 150, h: 176 },
  { type: 'torigate', x: arena.left + PAD, y: 180, w: 340, h: 340 },
  { type: 'statue', x: arena.left + PAD, y: 180 + 340 + 24, w: 150, h: 176 },

  { type: 'statue', x: arena.right - PAD - 150, y: 180 - 200, w: 150, h: 176, flip: true },
  { type: 'torigate', x: arena.right - PAD - 340, y: 180, w: 340, h: 340 },
  { type: 'statue', x: arena.right - PAD - 150, y: 180 + 340 + 24, w: 150, h: 176, flip: true },

  // --- UNIFORMLY SCATTERED STONE LAMPS ACROSS THE WHOLE BATTLEFIELD (COMPACT W: 48, H: 65) ---
  // Row 0 (Y: -1450)
  { type: 'stoneLamp', x: -1950, y: -1450, w: 48, h: 65 },
  { type: 'stoneLamp', x: -1050, y: -1450, w: 48, h: 65 },
  { type: 'stoneLamp', x: -150, y: -1450, w: 48, h: 65 },
  { type: 'stoneLamp', x: 750, y: -1450, w: 48, h: 65 },
  { type: 'stoneLamp', x: 1650, y: -1450, w: 48, h: 65 },
  { type: 'stoneLamp', x: 2550, y: -1450, w: 48, h: 65 },
  { type: 'stoneLamp', x: 3450, y: -1450, w: 48, h: 65 },

  // Row 1 (Y: -600)
  { type: 'stoneLamp', x: -1870, y: -600, w: 48, h: 65 },
  { type: 'stoneLamp', x: -970, y: -600, w: 48, h: 65 },
  { type: 'stoneLamp', x: -70, y: -600, w: 48, h: 65 },
  { type: 'stoneLamp', x: 830, y: -600, w: 48, h: 65 },
  { type: 'stoneLamp', x: 1730, y: -600, w: 48, h: 65 },
  { type: 'stoneLamp', x: 2630, y: -600, w: 48, h: 65 },
  { type: 'stoneLamp', x: 3450, y: -600, w: 48, h: 65 },

  // Row 2 (Y: 250) - Clears player spawn (700, 350)
  { type: 'stoneLamp', x: -1950, y: 250, w: 48, h: 65 },
  { type: 'stoneLamp', x: -1050, y: 250, w: 48, h: 65 },
  { type: 'stoneLamp', x: -150, y: 250, w: 48, h: 65 },
  { type: 'stoneLamp', x: 1150, y: 250, w: 48, h: 65 },
  { type: 'stoneLamp', x: 1750, y: 250, w: 48, h: 65 },
  { type: 'stoneLamp', x: 2550, y: 250, w: 48, h: 65 },
  { type: 'stoneLamp', x: 3450, y: 250, w: 48, h: 65 },

  // Row 3 (Y: 1100)
  { type: 'stoneLamp', x: -1870, y: 1100, w: 48, h: 65 },
  { type: 'stoneLamp', x: -970, y: 1100, w: 48, h: 65 },
  { type: 'stoneLamp', x: -70, y: 1100, w: 48, h: 65 },
  { type: 'stoneLamp', x: 830, y: 1100, w: 48, h: 65 },
  { type: 'stoneLamp', x: 1730, y: 1100, w: 48, h: 65 },
  { type: 'stoneLamp', x: 2630, y: 1100, w: 48, h: 65 },
  { type: 'stoneLamp', x: 3450, y: 1100, w: 48, h: 65 },

  // Row 4 (Y: 1950)
  { type: 'stoneLamp', x: -1950, y: 1950, w: 48, h: 65 },
  { type: 'stoneLamp', x: -1050, y: 1950, w: 48, h: 65 },
  { type: 'stoneLamp', x: -150, y: 1950, w: 48, h: 65 },
  { type: 'stoneLamp', x: 750, y: 1950, w: 48, h: 65 },
  { type: 'stoneLamp', x: 1650, y: 1950, w: 48, h: 65 },
  { type: 'stoneLamp', x: 2550, y: 1950, w: 48, h: 65 },
  { type: 'stoneLamp', x: 3450, y: 1950, w: 48, h: 65 },
];

export interface StoneLampObstacle {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

/**
 * Hard physical collision obstacles for stone lamps.
 * Positioned at the base of the lamp with radius 20px.
 */
export const STONE_LAMP_OBSTACLES: readonly StoneLampObstacle[] = BORDER_DECORATIONS
  .filter(item => item.type === 'stoneLamp')
  .map(item => ({
    x: item.x + item.w * 0.5,
    y: item.y + item.h * 0.78,
    radius: 20
  }));

/**
 * Solid circular collision resolver preventing player and enemies from penetrating or passing through stone lamps.
 * Clamps actor position outside the barrier and projects tangent velocity so motion remains responsive.
 */
export function resolveStoneLampCollisions(
  actor: { x: number; y: number; vx?: number; vy?: number },
  actorRadius = 22
): boolean {
  let collided = false;
  for (let i = 0; i < STONE_LAMP_OBSTACLES.length; i++) {
    const lamp = STONE_LAMP_OBSTACLES[i];
    const dx = actor.x - lamp.x;
    const dy = actor.y - lamp.y;
    const minDist = actorRadius + lamp.radius;
    const distSq = dx * dx + dy * dy;
    if (distSq < minDist * minDist) {
      collided = true;
      const dist = Math.sqrt(distSq) || 0.001;
      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = minDist - dist;
      actor.x += nx * overlap;
      actor.y += ny * overlap;
      if (typeof actor.vx === 'number' && typeof actor.vy === 'number') {
        const dot = actor.vx * nx + actor.vy * ny;
        if (dot < 0) {
          actor.vx -= dot * nx;
          actor.vy -= dot * ny;
        }
      }
    }
  }
  return collided;
}

/**
 * Renders shrine border decorations with frustum culling and native soft contact shadows.
 * Zero filter / shadowBlur usage (preserves 60 FPS invariant).
 */
export function drawBorderDecorations(
  ctx: CanvasRenderingContext2D,
  camX: number,
  camY: number,
  halfW: number,
  halfH: number
): void {
  const viewLeft = camX - halfW - 200;
  const viewRight = camX + halfW + 200;
  const viewTop = camY - halfH - 200;
  const viewBottom = camY + halfH + 200;

  for (let i = 0; i < BORDER_DECORATIONS.length; i++) {
    const item = BORDER_DECORATIONS[i];
    if (
      item.x + item.w < viewLeft ||
      item.x > viewRight ||
      item.y + item.h < viewTop ||
      item.y > viewBottom
    ) {
      continue;
    }

    const img = borderPropImages[item.type];
    if (!img || !img.complete || img.naturalWidth === 0) continue;

    // Natural contact shadow (layered ellipses)
    const footX = item.x + item.w * 0.5;
    const footY = item.y + item.h * 0.95;
    const shadowRx = item.w * 0.42;
    const shadowRy = Math.max(8, item.h * 0.08);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(footX, footY, shadowRx, shadowRy, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(footX, footY, shadowRx * 0.65, shadowRy * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Prop sprite
    if (item.flip) {
      ctx.save();
      ctx.translate(item.x + item.w, item.y);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, item.w, item.h);
      ctx.restore();
    } else {
      ctx.drawImage(img, item.x, item.y, item.w, item.h);
    }

    // Radiant flame chamber core for stone lamps
    if (item.type === 'stoneLamp') {
      const flameX = item.x + item.w * 0.5;
      const flameY = item.y + item.h * 0.42;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const fireGrad = ctx.createRadialGradient(flameX, flameY, 1, flameX, flameY, 14);
      fireGrad.addColorStop(0, 'rgba(255, 255, 230, 0.95)');
      fireGrad.addColorStop(0.35, 'rgba(255, 210, 110, 0.75)');
      fireGrad.addColorStop(0.7, 'rgba(255, 140, 30, 0.35)');
      fireGrad.addColorStop(1, 'rgba(255, 100, 20, 0)');
      ctx.fillStyle = fireGrad;
      ctx.beginPath();
      ctx.arc(flameX, flameY, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
