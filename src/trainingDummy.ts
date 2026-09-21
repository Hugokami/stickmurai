import { Enemy } from './enemy';
import { callbacks } from './callbacks';
import { globals } from './globals';

let cachedDummyCanvas: HTMLCanvasElement | null = null;

function getOrCreateDummyCanvas(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (cachedDummyCanvas) return cachedDummyCanvas;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 80;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Center is (40, 60)
    ctx.save();
    ctx.translate(40, 60);

    // 1. Wooden vertical post
    ctx.fillStyle = '#6b4226';
    ctx.fillRect(-6, -20, 12, 70);

    // 2. Wooden crossbar (arms)
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(-35, -22, 70, 8);

    // 3. Straw torso (bundled straw layers)
    ctx.fillStyle = '#d4a373';
    ctx.beginPath();
    ctx.ellipse(0, -5, 22, 32, 0, 0, Math.PI * 2);
    ctx.fill();

    // Straw texture lines
    ctx.strokeStyle = '#bc8a5f';
    ctx.lineWidth = 2;
    for (let i = -16; i <= 16; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, -32);
      ctx.lineTo(i + (i > 0 ? 3 : -3), 20);
      ctx.stroke();
    }

    // 4. Straw head bundle
    ctx.fillStyle = '#deb887';
    ctx.beginPath();
    ctx.ellipse(0, -42, 14, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head band (cloth)
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(-14, -45, 28, 5);

    // 5. Hemp rope belt / bindings around waist
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-18, 5);
    ctx.lineTo(18, 5);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-17, 10);
    ctx.lineTo(17, 10);
    ctx.stroke();

    // 6. Bullseye target mark on chest
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, -10, 10, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(0, -10, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    cachedDummyCanvas = canvas;
    return canvas;
  } catch (_e) {
    return null;
  }
}

export class TrainingDummy extends Enemy {
  override isTrainingDummy = true;
  mode: 'stationary' | 'sparring' = 'stationary';
  startX: number;
  startY: number;
  sparringCadenceTimer = 3.0;
  override chargeTimeMax = 1.2;
  lastHitTime = 0;

  constructor(x: number, y: number, target: any) {
    super(x, y, target);
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.hp = 1000;
    this.maxHp = 1000;
    this.hpDelayed = 1000;
    this.posture = 0;
    this.maxPosture = 100;
    this.state = 'idle';
    this.subType = 'samurai';
  }

  resetDummy() {
    this.x = this.startX;
    this.y = this.startY;
    this.vx = 0;
    this.vy = 0;
    this.hp = 1000;
    this.maxHp = 1000;
    this.hpDelayed = 1000;
    this.posture = 0;
    this.postureBrokenTimer = 0;
    this.stunTimer = 0;
    this.burnTimer = 0;
    this.chillTimer = 0;
    this.knockbackTimer = 0;
    this.state = 'idle';
    this.stateTime = 0;
    this.sparringCadenceTimer = 3.0;
    this.attackLanded = false;
  }

  setMode(mode: 'stationary' | 'sparring') {
    this.mode = mode;
    this.state = 'idle';
    this.stateTime = 0;
    this.attackLanded = false;
    this.sparringCadenceTimer = 3.0;
  }

  override update(dt: number) {
    // 1. Finite 1000 HP training bar: replenish on lethal hit without death/reward
    if (this.hp <= 0) {
      this.hp = this.maxHp;
      this.hpDelayed = this.maxHp;
    }

    // Delayed HP bar interpolation
    if (this.hpDelayed > this.hp) {
      this.hpDelayed = Math.max(this.hp, this.hpDelayed - (this.maxHp * dt * 0.8));
    } else {
      this.hpDelayed = this.hp;
    }

    // 2. Position spring back: clamp recoil to 10 units max and spring back
    const dx = this.startX - this.x;
    const dy = this.startY - this.y;
    const distFromStart = Math.hypot(dx, dy);
    if (distFromStart > 10) {
      const angle = Math.atan2(dy, dx);
      this.x = this.startX - Math.cos(angle) * 10;
      this.y = this.startY - Math.sin(angle) * 10;
    }
    // Damped spring back to home position
    this.x += (this.startX - this.x) * Math.min(1, dt * 10);
    this.y += (this.startY - this.y) * Math.min(1, dt * 10);
    this.vx = 0;
    this.vy = 0;

    // 3. Timers & status effects
    if (this.hitFlash > 0) this.hitFlash = Math.max(0, this.hitFlash - dt);
    if (this.stunTimer > 0) this.stunTimer = Math.max(0, this.stunTimer - dt);
    if (this.knockbackTimer > 0) this.knockbackTimer = Math.max(0, this.knockbackTimer - dt);

    // Posture broken handling
    if (this.postureBrokenTimer > 0) {
      this.postureBrokenTimer = Math.max(0, this.postureBrokenTimer - dt);
      this.state = 'stunned';
      if (this.postureBrokenTimer === 0) {
        this.posture = 0;
        this.state = 'idle';
      }
      return;
    }

    // Passive posture recovery when not hit recently
    if (this.posture > 0) {
      this.posture = Math.max(0, this.posture - (20 * dt));
    }

    // 4. Sparring vs Stationary lifecycle
    if (this.mode === 'stationary') {
      this.state = 'idle';
      this.stateTime = 0;
      this.attackLanded = false;
      return;
    }

    // Sparring mode: predictable melee cadence (one attack per 3s, 1.2s windup)
    if (this.state === 'idle') {
      this.sparringCadenceTimer -= dt;
      if (this.sparringCadenceTimer <= 0) {
        this.state = 'charge';
        this.stateTime = 0;
        this.chargeTimeMax = 1.2;
        this.attackLanded = false;
        if (this.target) {
          this.targetAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
        }
      }
    } else if (this.state === 'charge') {
      this.stateTime += dt;
      if (this.target) {
        this.targetAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      }
      if (this.stateTime >= this.chargeTimeMax) {
        this.state = 'attack';
        this.stateTime = 0;
        this.lungeDuration = 0.5;
        this.lungeSpeed = 350;
        this.lungeCos = Math.cos(this.targetAngle);
        this.lungeSin = Math.sin(this.targetAngle);
      }
    } else if (this.state === 'attack') {
      this.stateTime += dt;
      // Strike window
      if (!this.attackLanded && this.stateTime >= 0.1 && this.stateTime <= 0.35) {
        if (this.target) {
          const d = Math.hypot(this.target.x - this.x, this.target.y - this.y);
          if (d <= 140) {
            this.attackLanded = true;
            callbacks.checkPlayerHit?.(this, 1);
          }
        }
      }
      if (this.stateTime >= this.lungeDuration) {
        this.state = 'idle';
        this.stateTime = 0;
        this.sparringCadenceTimer = 3.0; // Reset cadence
      }
    }
  }

  override draw(ctx: CanvasRenderingContext2D, cx = 0, cy = 0, _alpha = 1, _tint: string | null = null) {
    if (!ctx) return;
    const rx = (this.x - cx + globals.vw / 2) | 0;
    const ry = (this.y - cy + globals.vh / 2 + (this.yOffset || 0)) | 0;
    ctx.save();
    ctx.translate(rx, ry);

    // Sparring telegraph windup
    if (this.state === 'charge') {
      const progress = Math.min(1, this.stateTime / this.chargeTimeMax);
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, 80 * progress, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.4 + 0.6 * progress})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();

      // Threat cone towards target
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 140, this.targetAngle - 0.4, this.targetAngle + 0.4);
      ctx.closePath();
      ctx.fillStyle = `rgba(249, 115, 22, ${0.15 * progress})`;
      ctx.fill();
      ctx.restore();
    }

    // Cached straw art
    const sprite = getOrCreateDummyCanvas();
    if (sprite) {
      if (this.hitFlash > 0) {
        ctx.filter = 'brightness(2.5)';
      }
      ctx.drawImage(sprite, -40, -60);
      ctx.filter = 'none';
    } else {
      // Fallback procedural straw drawing
      ctx.fillStyle = '#d4a373';
      ctx.fillRect(-15, -35, 30, 50);
      ctx.fillStyle = '#6b4226';
      ctx.fillRect(-4, 15, 8, 25);
    }

    // Floating training HP bar
    const barWidth = 60;
    const barHeight = 6;
    const barY = -75;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(-barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2);

    // Delayed red bar
    const delayedPct = Math.max(0, Math.min(1, this.hpDelayed / this.maxHp));
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-barWidth / 2, barY, barWidth * delayedPct, barHeight);

    // Active health bar (green)
    const hpPct = Math.max(0, Math.min(1, this.hp / this.maxHp));
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(-barWidth / 2, barY, barWidth * hpPct, barHeight);

    // Posture bar (orange) if posture > 0
    if (this.posture > 0) {
      const pPct = Math.min(1, this.posture / this.maxPosture);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(-barWidth / 2 - 1, barY + barHeight + 2, barWidth + 2, 4);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(-barWidth / 2, barY + barHeight + 3, barWidth * pPct, 2);
    }

    ctx.restore();
  }
}
