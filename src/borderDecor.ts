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
 * Japanese Shrine Border Decorations.
 * All props are positioned strictly INSIDE the arena boundaries [arena.left + PAD, arena.right - PAD, arena.top + PAD, arena.bottom - PAD].
 * Zero props outside the boundary perimeter.
 */
export const BORDER_DECORATIONS: readonly BorderDecorItem[] = [
  // --- NORTH COURTYARD GATEWAY (X: 800) ---
  { type: 'stoneLamp', x: 500, y: arena.top + PAD, w: 80, h: 108 },
  { type: 'statue', x: 600, y: arena.top + PAD, w: 160, h: 188 },
  { type: 'torigate', x: 800, y: arena.top + PAD, w: 380, h: 360 },
  { type: 'statue', x: 1220, y: arena.top + PAD, w: 160, h: 188, flip: true },
  { type: 'stoneLamp', x: 1420, y: arena.top + PAD, w: 80, h: 108 },

  // --- SOUTH GRAND GATEWAY (X: 800) ---
  { type: 'stoneLamp', x: 500, y: arena.bottom - PAD - 108, w: 80, h: 108 },
  { type: 'statue', x: 600, y: arena.bottom - PAD - 188, w: 160, h: 188 },
  { type: 'torigate', x: 800, y: arena.bottom - PAD - 360, w: 380, h: 360 },
  { type: 'statue', x: 1220, y: arena.bottom - PAD - 188, w: 160, h: 188, flip: true },
  { type: 'stoneLamp', x: 1420, y: arena.bottom - PAD - 108, w: 80, h: 108 },

  // --- WEST BORDER SHRINE (Y: 180) ---
  { type: 'stoneLamp', x: arena.left + PAD + 20, y: 180 - 320, w: 80, h: 108 },
  { type: 'statue', x: arena.left + PAD, y: 180 - 200, w: 150, h: 176 },
  { type: 'torigate', x: arena.left + PAD, y: 180, w: 340, h: 340 },
  { type: 'statue', x: arena.left + PAD, y: 180 + 340 + 24, w: 150, h: 176 },
  { type: 'stoneLamp', x: arena.left + PAD + 20, y: 180 + 340 + 220, w: 80, h: 108 },

  // --- EAST BORDER SHRINE (Y: 180) ---
  { type: 'stoneLamp', x: arena.right - PAD - 100, y: 180 - 320, w: 80, h: 108 },
  { type: 'statue', x: arena.right - PAD - 150, y: 180 - 200, w: 150, h: 176, flip: true },
  { type: 'torigate', x: arena.right - PAD - 340, y: 180, w: 340, h: 340 },
  { type: 'statue', x: arena.right - PAD - 150, y: 180 + 340 + 24, w: 150, h: 176, flip: true },
  { type: 'stoneLamp', x: arena.right - PAD - 100, y: 180 + 340 + 220, w: 80, h: 108 },

  // --- NORTH PERIMETER LANTERNS & GUARDIANS ---
  { type: 'statue', x: -1800, y: arena.top + PAD, w: 160, h: 188 },
  { type: 'stoneLamp', x: -1400, y: arena.top + PAD, w: 80, h: 108 },
  { type: 'stoneLamp', x: -800, y: arena.top + PAD, w: 80, h: 108 },
  { type: 'stoneLamp', x: -200, y: arena.top + PAD, w: 80, h: 108 },
  { type: 'stoneLamp', x: 2000, y: arena.top + PAD, w: 80, h: 108 },
  { type: 'stoneLamp', x: 2600, y: arena.top + PAD, w: 80, h: 108 },
  { type: 'statue', x: 3100, y: arena.top + PAD, w: 160, h: 188, flip: true },

  // --- SOUTH PERIMETER LANTERNS & GUARDIANS ---
  { type: 'statue', x: -1800, y: arena.bottom - PAD - 188, w: 160, h: 188 },
  { type: 'stoneLamp', x: -1400, y: arena.bottom - PAD - 108, w: 80, h: 108 },
  { type: 'stoneLamp', x: -800, y: arena.bottom - PAD - 108, w: 80, h: 108 },
  { type: 'stoneLamp', x: -200, y: arena.bottom - PAD - 108, w: 80, h: 108 },
  { type: 'stoneLamp', x: 2000, y: arena.bottom - PAD - 108, w: 80, h: 108 },
  { type: 'stoneLamp', x: 2600, y: arena.bottom - PAD - 108, w: 80, h: 108 },
  { type: 'statue', x: 3100, y: arena.bottom - PAD - 188, w: 160, h: 188, flip: true },

  // --- FOUR SACRED CORNERS ---
  { type: 'statue', x: arena.left + PAD, y: arena.top + PAD, w: 160, h: 188 },
  { type: 'stoneLamp', x: arena.left + PAD + 190, y: arena.top + PAD, w: 80, h: 108 },

  { type: 'statue', x: arena.right - PAD - 160, y: arena.top + PAD, w: 160, h: 188, flip: true },
  { type: 'stoneLamp', x: arena.right - PAD - 270, y: arena.top + PAD, w: 80, h: 108 },

  { type: 'statue', x: arena.left + PAD, y: arena.bottom - PAD - 188, w: 160, h: 188 },
  { type: 'stoneLamp', x: arena.left + PAD + 190, y: arena.bottom - PAD - 108, w: 80, h: 108 },

  { type: 'statue', x: arena.right - PAD - 160, y: arena.bottom - PAD - 188, w: 160, h: 188, flip: true },
  { type: 'stoneLamp', x: arena.right - PAD - 270, y: arena.bottom - PAD - 108, w: 80, h: 108 },
];

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
  }
}
