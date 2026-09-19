/**
 * Core collision detection and geometric resolution routines.
 */

/**
 * Calculates perpendicular distance from point (px, py) to line segment (x1, y1)-(x2, y2).
 */
export function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

/**
 * Checks whether a point is inside a circle.
 */
export function pointInCircle(px: number, py: number, cx: number, cy: number, radius: number): boolean {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= radius * radius;
}

/**
 * Checks whether a line segment intersects with a circle.
 */
export function circleIntersectsSegment(cx: number, cy: number, radius: number, x1: number, y1: number, x2: number, y2: number): boolean {
  return distToSegment(cx, cy, x1, y1, x2, y2) <= radius;
}

/**
 * Checks whether two circles overlap.
 */
export function circlesOverlap(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const totalR = r1 + r2;
  return dx * dx + dy * dy <= totalR * totalR;
}

/**
 * Resolves overlap between two circles, providing displacement vector.
 */
export function resolveCircleOverlap(
  x1: number, y1: number, r1: number,
  x2: number, y2: number, r2: number
): { overlap: number; nx: number; ny: number } | null {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const totalR = r1 + r2;
  if (dist >= totalR || dist === 0) return null;
  return {
    overlap: totalR - dist,
    nx: dx / dist,
    ny: dy / dist
  };
}

/**
 * Segment-segment intersection test.
 */
export function checkLineIntersection(
  x1: number, y1: number, x2: number, y2: number,
  x3: number, y3: number, x4: number, y4: number
): { x: number; y: number } | null {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denom === 0) return null;

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      x: x1 + ua * (x2 - x1),
      y: y1 + ua * (y2 - y1)
    };
  }
  return null;
}

/**
 * Checks if a point lies within a directional corridor defined by a segment and optional endpoint caps.
 */
export function isPointInCorridor(
  px: number, py: number,
  sx: number, sy: number,
  ex: number, ey: number,
  corridorWidth: number,
  endpointRadius?: number
): boolean {
  const cap = endpointRadius ?? corridorWidth;
  if (Math.hypot(px - sx, py - sy) <= cap || Math.hypot(px - ex, py - ey) <= cap) {
    return true;
  }
  return distToSegment(px, py, sx, sy, ex, ey) <= corridorWidth;
}

/**
 * Filters a list of entities within a corridor.
 */
export function getEntitiesInCorridor<T extends { x: number; y: number; state?: string }>(
  entities: T[],
  sx: number, sy: number,
  ex: number, ey: number,
  corridorWidth: number,
  endpointRadius?: number
): T[] {
  const cap = endpointRadius ?? corridorWidth;
  const result: T[] = [];
  for (let i = 0; i < entities.length; i++) {
    const e = entities[i];
    if (e.state === 'dead') continue;
    if (Math.hypot(e.x - sx, e.y - sy) <= cap || Math.hypot(e.x - ex, e.y - ey) <= cap || distToSegment(e.x, e.y, sx, sy, ex, ey) <= corridorWidth) {
      result.push(e);
    }
  }
  return result;
}

/**
 * Filters a list of entities within a radial burst.
 */
export function getEntitiesInRadius<T extends { x: number; y: number; state?: string }>(
  entities: T[],
  cx: number, cy: number,
  radius: number
): T[] {
  const rSq = radius * radius;
  const result: T[] = [];
  for (let i = 0; i < entities.length; i++) {
    const e = entities[i];
    if (e.state === 'dead') continue;
    const dx = e.x - cx;
    const dy = e.y - cy;
    if (dx * dx + dy * dy <= rSq) {
      result.push(e);
    }
  }
  return result;
}
