import { borderPropImages } from './assets';

export interface BorderDecorItem {
  type: 'fence' | 'torigate' | 'stoneLamp' | 'statue' | 'bridge';
  x: number;
  y: number;
  w: number;
  h: number;
  flip?: boolean;
}

export const BORDER_DECORATIONS: readonly BorderDecorItem[] = [
  // -------------------------------------------------------------
  // 1. NORTH BORDER (y = -1750, span x: -2300 to 3700)
  // -------------------------------------------------------------
  // North-West Shrine Corner (x: -2260 to -1750)
  { type: 'statue', x: -2260, y: -1780, w: 180, h: 212 },
  { type: 'stoneLamp', x: -2170, y: -1720, w: 90, h: 121 },
  { type: 'torigate', x: -2060, y: -1860, w: 420, h: 376 },
  { type: 'stoneLamp', x: -1880, y: -1720, w: 90, h: 121 },
  { type: 'statue', x: -1780, y: -1780, w: 180, h: 212, flip: true },

  // NW Fence Run
  { type: 'fence', x: -1580, y: -1740, w: 390, h: 195 },
  { type: 'stoneLamp', x: -1205, y: -1710, w: 80, h: 108 },
  { type: 'fence', x: -1200, y: -1740, w: 390, h: 195, flip: true },
  { type: 'stoneLamp', x: -825, y: -1710, w: 80, h: 108 },
  { type: 'fence', x: -820, y: -1740, w: 390, h: 195 },

  // North Scenic Bridge Crossing
  { type: 'bridge', x: -410, y: -1780, w: 500, h: 290 },
  { type: 'fence', x: 80, y: -1740, w: 390, h: 195, flip: true },
  { type: 'stoneLamp', x: 460, y: -1710, w: 80, h: 108 },

  // North Grand Gateway (centered around player spawn X = 700)
  { type: 'stoneLamp', x: 570, y: -1720, w: 90, h: 121 },
  { type: 'statue', x: 650, y: -1780, w: 190, h: 223 },
  { type: 'torigate', x: 850, y: -1890, w: 480, h: 430 },
  { type: 'statue', x: 1340, y: -1780, w: 190, h: 223, flip: true },
  { type: 'stoneLamp', x: 1540, y: -1720, w: 90, h: 121 },

  // NE Fence Run
  { type: 'fence', x: 1640, y: -1740, w: 390, h: 195 },
  { type: 'stoneLamp', x: 2015, y: -1710, w: 80, h: 108 },
  { type: 'fence', x: 2020, y: -1740, w: 390, h: 195, flip: true },

  // North-East Scenic Bridge
  { type: 'bridge', x: 2400, y: -1780, w: 500, h: 290, flip: true },
  { type: 'fence', x: 2890, y: -1740, w: 390, h: 195 },
  { type: 'stoneLamp', x: 3270, y: -1710, w: 80, h: 108 },

  // North-East Corner Shrine
  { type: 'statue', x: 3380, y: -1780, w: 180, h: 212 },
  { type: 'torigate', x: 3540, y: -1860, w: 420, h: 376, flip: true },

  // -------------------------------------------------------------
  // 2. SOUTH BORDER (y = 2450, span x: -2300 to 3700)
  // -------------------------------------------------------------
  // South-West Corner Shrine
  { type: 'torigate', x: -2250, y: 2220, w: 420, h: 376 },
  { type: 'stoneLamp', x: -2060, y: 2340, w: 90, h: 121 },
  { type: 'statue', x: -1960, y: 2280, w: 180, h: 212, flip: true },

  // SW Fence Run
  { type: 'fence', x: -1760, y: 2320, w: 390, h: 195 },
  { type: 'stoneLamp', x: -1385, y: 2340, w: 80, h: 108 },
  { type: 'fence', x: -1380, y: 2320, w: 390, h: 195, flip: true },
  { type: 'stoneLamp', x: -1005, y: 2340, w: 80, h: 108 },

  // South Scenic Bridge
  { type: 'bridge', x: -980, y: 2260, w: 500, h: 290 },
  { type: 'fence', x: -470, y: 2320, w: 390, h: 195 },
  { type: 'stoneLamp', x: -95, y: 2340, w: 80, h: 108 },
  { type: 'fence', x: -90, y: 2320, w: 390, h: 195, flip: true },
  { type: 'stoneLamp', x: 290, y: 2340, w: 80, h: 108 },

  // South Grand Gateway (aligned with player spawn X = 700)
  { type: 'stoneLamp', x: 490, y: 2340, w: 90, h: 121 },
  { type: 'statue', x: 570, y: 2280, w: 190, h: 223 },
  { type: 'torigate', x: 770, y: 2200, w: 480, h: 430 },
  { type: 'statue', x: 1260, y: 2280, w: 190, h: 223, flip: true },
  { type: 'stoneLamp', x: 1460, y: 2340, w: 90, h: 121 },

  // SE Fence Run
  { type: 'fence', x: 1570, y: 2320, w: 390, h: 195 },
  { type: 'stoneLamp', x: 1945, y: 2340, w: 80, h: 108 },
  { type: 'fence', x: 1950, y: 2320, w: 390, h: 195, flip: true },

  // South-East Scenic Bridge
  { type: 'bridge', x: 2350, y: 2260, w: 500, h: 290, flip: true },
  { type: 'fence', x: 2840, y: 2320, w: 390, h: 195 },
  { type: 'stoneLamp', x: 3220, y: 2340, w: 80, h: 108 },

  // South-East Corner Shrine
  { type: 'statue', x: 3320, y: 2280, w: 180, h: 212 },
  { type: 'torigate', x: 3520, y: 2220, w: 420, h: 376, flip: true },

  // -------------------------------------------------------------
  // 3. WEST BORDER (x = -2300, span y: -1500 to 2100)
  // -------------------------------------------------------------
  { type: 'bridge', x: -2270, y: -1250, w: 460, h: 267 },
  { type: 'stoneLamp', x: -2250, y: -970, w: 85, h: 114 },
  { type: 'fence', x: -2280, y: -840, w: 360, h: 180 },
  { type: 'stoneLamp', x: -2250, y: -650, w: 85, h: 114 },
  { type: 'fence', x: -2280, y: -520, w: 360, h: 180, flip: true },
  { type: 'stoneLamp', x: -2250, y: -330, w: 85, h: 114 },

  // West Grand Gateway (aligned with player spawn Y = 350)
  { type: 'statue', x: -2260, y: -160, w: 180, h: 212 },
  { type: 'stoneLamp', x: -2240, y: 60, w: 90, h: 121 },
  { type: 'torigate', x: -2280, y: 190, w: 460, h: 410 },
  { type: 'stoneLamp', x: -2240, y: 610, w: 90, h: 121 },
  { type: 'statue', x: -2260, y: 740, w: 180, h: 212, flip: true },

  // West Lower Run
  { type: 'fence', x: -2280, y: 970, w: 360, h: 180 },
  { type: 'stoneLamp', x: -2250, y: 1160, w: 85, h: 114 },
  { type: 'bridge', x: -2270, y: 1280, w: 460, h: 267 },
  { type: 'stoneLamp', x: -2250, y: 1560, w: 85, h: 114 },
  { type: 'fence', x: -2280, y: 1690, w: 360, h: 180, flip: true },
  { type: 'stoneLamp', x: -2250, y: 1880, w: 85, h: 114 },
  { type: 'fence', x: -2280, y: 2000, w: 360, h: 180 },

  // -------------------------------------------------------------
  // 4. EAST BORDER (x = 3700, span y: -1500 to 2100)
  // -------------------------------------------------------------
  { type: 'bridge', x: 3410, y: -1250, w: 460, h: 267, flip: true },
  { type: 'stoneLamp', x: 3600, y: -970, w: 85, h: 114 },
  { type: 'fence', x: 3420, y: -840, w: 360, h: 180, flip: true },
  { type: 'stoneLamp', x: 3600, y: -650, w: 85, h: 114 },
  { type: 'fence', x: 3420, y: -520, w: 360, h: 180 },
  { type: 'stoneLamp', x: 3600, y: -330, w: 85, h: 114 },

  // East Grand Gateway (aligned with player spawn Y = 350)
  { type: 'statue', x: 3580, y: -160, w: 180, h: 212 },
  { type: 'stoneLamp', x: 3600, y: 60, w: 90, h: 121 },
  { type: 'torigate', x: 3420, y: 190, w: 460, h: 410, flip: true },
  { type: 'stoneLamp', x: 3600, y: 610, w: 90, h: 121 },
  { type: 'statue', x: 3580, y: 740, w: 180, h: 212, flip: true },

  // East Lower Run
  { type: 'fence', x: 3420, y: 970, w: 360, h: 180, flip: true },
  { type: 'stoneLamp', x: 3600, y: 1160, w: 85, h: 114 },
  { type: 'bridge', x: 3410, y: 1280, w: 460, h: 267, flip: true },
  { type: 'stoneLamp', x: 3600, y: 1560, w: 85, h: 114 },
  { type: 'fence', x: 3420, y: 1690, w: 360, h: 180 },
  { type: 'stoneLamp', x: 3600, y: 1880, w: 85, h: 114 },
  { type: 'fence', x: 3420, y: 2000, w: 360, h: 180, flip: true }
] as const;

export function drawBorderDecorations(
  ctx: CanvasRenderingContext2D,
  camX: number,
  camY: number,
  halfW: number,
  halfH: number
) {
  const minX = camX - halfW;
  const maxX = camX + halfW;
  const minY = camY - halfH;
  const maxY = camY + halfH;

  // First pass: contact shadows under visible props
  for (let i = 0; i < BORDER_DECORATIONS.length; i++) {
    const item = BORDER_DECORATIONS[i];
    if (
      item.x + item.w < minX ||
      item.x > maxX ||
      item.y + item.h < minY ||
      item.y > maxY
    ) {
      continue;
    }

    const { type, x, y, w, h } = item;
    const base_y = y + h;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    ctx.beginPath();

    if (type === 'torigate') {
      const lx = x + w * 0.17;
      const rx = x + w * 0.83;
      ctx.ellipse(lx, base_y - 2, 38, 14, 0, 0, Math.PI * 2);
      ctx.ellipse(rx, base_y - 2, 38, 14, 0, 0, Math.PI * 2);
    } else if (type === 'statue') {
      ctx.ellipse(x + w * 0.5, base_y - 4, 60, 16, 0, 0, Math.PI * 2);
    } else if (type === 'stoneLamp') {
      ctx.ellipse(x + w * 0.5, base_y - 3, 30, 12, 0, 0, Math.PI * 2);
    } else if (type === 'fence') {
      ctx.ellipse(x + w * 0.5, base_y - 4, w * 0.44, 14, 0, 0, Math.PI * 2);
    } else if (type === 'bridge') {
      ctx.ellipse(x + w * 0.18, base_y - 4, 52, 18, 0, 0, Math.PI * 2);
      ctx.ellipse(x + w * 0.82, base_y - 4, 52, 18, 0, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  // Second pass: draw sprites
  for (let i = 0; i < BORDER_DECORATIONS.length; i++) {
    const item = BORDER_DECORATIONS[i];
    if (
      item.x + item.w < minX ||
      item.x > maxX ||
      item.y + item.h < minY ||
      item.y > maxY
    ) {
      continue;
    }

    const img = borderPropImages[item.type];
    if (!img || !img.complete || img.naturalWidth === 0) continue;

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
