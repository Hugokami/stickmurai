import { globals } from './globals';
import { anims } from './assets';
import { callbacks } from './callbacks';

const isMobile = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

const tintCache = new Map<string, HTMLCanvasElement>();

export function getTintedImage(img: HTMLImageElement, hexColor: string): HTMLCanvasElement | HTMLImageElement {
  if (hexColor[0] !== '#') return img;
  const key = img.src + '_' + hexColor;
  const cached = tintCache.get(key);
  if (cached) {
    tintCache.delete(key);
    tintCache.set(key, cached); // refresh insertion order (LRU)
    return cached;
  }

  if (tintCache.size >= 150) {
    const oldestKey = tintCache.keys().next().value;
    if (oldestKey !== undefined) {
      tintCache.delete(oldestKey);
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width; canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d')!;
  
  // Draw original
  ctx.drawImage(img, 0, 0);
  
  // Color overlay
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = hexColor;
  // Use a slight transparency so we don't completely lose sprite details
  ctx.globalAlpha = 0.8;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Restore alpha and blend mode
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(img, 0, 0);

  tintCache.set(key, canvas);
  return canvas;
}

export class Entity {
  x = 0; y = 0; vx = 0; vy = 0;
  yOffset = 0; yVelocity = 0; // Simulated vertical juggle height physics
  type: 'sword' | 'fighter' | 'pistol' = 'sword';
  subType?: string;
  state = 'idle'; stateTime = 0;
  animFrame = 0; animTimer = 0; fps = 15;
  dir = 1; scaleMult = 1;

  setState(newState: string) {
    if (this.state !== newState) {
      this.state = newState; this.stateTime = 0; this.animFrame = 0; this.animTimer = 0;
    }
  }

  update(dt: number) {
    this.x += this.vx * dt; this.y += this.vy * dt; this.stateTime += dt;
    if (this.yOffset < 0 || this.yVelocity !== 0) {
      this.yOffset += this.yVelocity * dt;
      const gravity = (this.subType === 'player' && this.yOffset < 0) ? 700 : 1600;
      this.yVelocity += gravity * dt;
      if (this.yOffset >= 0) {
        this.yOffset = 0;
        this.yVelocity = 0;
      }
    }
    const animState = this.state === 'charge' ? 'idle' : this.state;
    const currentAnim = anims[this.type][animState as keyof typeof anims['sword']];
    if (currentAnim && currentAnim.length > 0) {
      let currentFps = this.fps;
      if (this.state === 'attack') {
         let attackDuration = this.type === 'sword' ? globals.playerStats.attackCooldownBase : 0.4;
         if (this.type === 'sword' && globals.flowState === 'awakened') attackDuration *= 0.5;
         currentFps = currentAnim.length / attackDuration;
      }
      this.animTimer += dt;
      if (this.animTimer > 1 / currentFps) {
        this.animTimer = 0; this.animFrame++;
        if (this.state === 'dead' && this.animFrame >= currentAnim.length) {
          this.animFrame = currentAnim.length - 1;
        } else {
          this.animFrame = this.animFrame % currentAnim.length;
        }
      }
    }
  }
  
  draw(ctx: CanvasRenderingContext2D, cx: number, cy: number, alpha = 1, colorTint = 'none') {
    const animState = this.state === 'charge' ? 'idle' : this.state;
    const currentAnim = anims[this.type][animState as keyof typeof anims['sword']];
    if (!currentAnim || currentAnim.length === 0) return;
    const img = currentAnim[this.animFrame];
    if (!img || !img.complete || img.naturalWidth === 0) return;
    
    const rx = (this.x - cx + globals.vw/2) | 0;
    const ry = (this.y - cy + globals.vh/2 + (this.yOffset || 0)) | 0;
    const scale = 0.5 * this.scaleMult;
    const buffer = Math.max(img.width, img.height) * scale + 60;
    if (rx < -buffer || rx > globals.vw + buffer || ry < -buffer || ry > globals.vh + buffer) {
      return;
    }
    
    ctx.save(); 
    ctx.translate(rx, ry);

    // Draw motion blur ghost trail for dashing player
    if (this.subType === 'player' && this.state === 'dash' && (this.vx !== 0 || this.vy !== 0)) {
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy) || 0.001;
      const cos = this.vx / speed;
      const sin = this.vy / speed;
      let trailColor = '#00ffff';
      if (globals.flowState === 'storm_god') trailColor = '#fbbf24';
      else if (globals.flowState === 'awakened') trailColor = '#c084fc';
      
      const ghostImg = getTintedImage(img, trailColor);
      
      // Far ghost
      ctx.save();
      ctx.globalAlpha = alpha * 0.22;
      ctx.translate(-cos * 22, -sin * 22);
      ctx.scale(this.dir, 1);
      ctx.drawImage(ghostImg, -img.width/2 * scale, -img.height/2 * scale, img.width * scale, img.height * scale);
      ctx.restore();

      // Near ghost
      ctx.save();
      ctx.globalAlpha = alpha * 0.42;
      ctx.translate(-cos * 11, -sin * 11);
      ctx.scale(this.dir, 1);
      ctx.drawImage(ghostImg, -img.width/2 * scale, -img.height/2 * scale, img.width * scale, img.height * scale);
      ctx.restore();
    }

    ctx.scale(this.dir, 1); 
    ctx.globalAlpha = alpha;
    
    let drawImg: any = img;
    if (colorTint !== 'none') {
      if (colorTint[0] === '#') {
        drawImg = getTintedImage(img, colorTint);
      } else {
        ctx.filter = colorTint;
      }
    }
    
    ctx.drawImage(drawImg, -img.width/2 * scale, -img.height/2 * scale, img.width * scale, img.height * scale);
    ctx.restore();
  }
}

export class Afterimage extends Entity {
  life!: number; maxLife!: number; colorTint!: string;

  constructor(source: Entity, colorTint: string = 'none') {
    super();
    this.init(source, colorTint);
  }

  init(source: Entity, colorTint: string = 'none') {
    this.x = source.x; this.y = source.y; this.vx = 0; this.vy = 0;
    this.yOffset = source.yOffset || 0; this.yVelocity = source.yVelocity || 0;
    this.dir = source.dir; this.type = source.type;
    this.subType = source.subType;
    this.state = source.state; this.stateTime = 0;
    this.animFrame = source.animFrame; this.animTimer = 0;
    this.scaleMult = source.scaleMult;
    this.colorTint = colorTint;
    this.life = 0.4; this.maxLife = 0.4;
  }

  static pool: Afterimage[] = [];

  static acquire(source: Entity, colorTint: string = 'none'): Afterimage {
    const inst = Afterimage.pool.pop();
    if (inst) {
      inst.init(source, colorTint);
      return inst;
    }
    return new Afterimage(source, colorTint);
  }

  static release(inst: Afterimage) {
    if (Afterimage.pool.length < 150) {
      Afterimage.pool.push(inst);
    }
  }

  update(dt: number) { this.life -= dt; }
  draw(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    const ratio = Math.max(0, this.life / this.maxLife);
    const easeOutQuad = ratio * (2 - ratio);
    super.draw(ctx, cx, cy, easeOutQuad * 0.5, this.colorTint);
  }
}

const particlePool: Particle[] = [];

export class Particle {
  x!: number; y!: number; vx!: number; vy!: number;
  life!: number; maxLife!: number; color!: string; size!: number;
  gravity!: number; friction!: number;

  constructor(x: number, y: number, color: string, speed: number, life: number, size: number = 3, angle?: number, gravity = 0, friction = 0.95) {
    this.init(x, y, color, speed, life, size, angle, gravity, friction);
  }

  init(x: number, y: number, color: string, speed: number, life: number, size: number = 3, angle?: number, gravity = 0, friction = 0.95) {
    this.x = x; this.y = y;
    const a = angle !== undefined ? angle : Math.random() * Math.PI * 2;
    const v = Math.random() * speed;
    this.vx = Math.cos(a) * v; this.vy = Math.sin(a) * v;
    this.life = this.maxLife = life; this.color = color; this.size = size;
    this.gravity = gravity;
    this.friction = friction;
  }

  static acquire(x: number, y: number, color: string, speed: number, life: number, size: number = 3, angle?: number, gravity = 0, friction = 0.95): Particle {
    const p = particlePool.pop();
    if (p) {
      p.init(x, y, color, speed, life, size, angle, gravity, friction);
      return p;
    }
    return new Particle(x, y, color, speed, life, size, angle, gravity, friction);
  }

  static release(p: Particle) {
    if (particlePool.length < 500) {
      particlePool.push(p);
    }
  }

  update(dt: number) {
    this.vy += this.gravity * dt;
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.life -= dt; this.vx *= this.friction; this.vy *= this.friction;
  }
  draw(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    const rx = (this.x - cx + globals.vw/2) | 0;
    const ry = (this.y - cy + globals.vh/2) | 0;
    const buffer = 40;
    if (rx < -buffer || rx > globals.vw + buffer || ry < -buffer || ry > globals.vh + buffer) {
      return;
    }
    
    ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
    const speedSq = this.vx * this.vx + this.vy * this.vy;
    if (speedSq > 2500) {
      ctx.lineWidth = this.size;
      ctx.strokeStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - this.vx * 0.04, ry - this.vy * 0.04);
      ctx.stroke();
    } else {
      ctx.fillStyle = this.color;
      ctx.fillRect(rx - this.size, ry - this.size, this.size * 2, this.size * 2);
    }
    ctx.globalAlpha = 1;
  }
}

const floatingTextPool: FloatingText[] = [];

export class FloatingText {
  x!: number; y!: number; text!: string; color!: string; life = 1.2; maxLife = 1.2; size!: number;
  isFrozenDuringTimeStop = false;

  constructor(x: number, y: number, text: string, color: string = '#ffffff', size: number = 20) {
    this.init(x, y, text, color, size);
  }

  init(x: number, y: number, text: string, color: string = '#ffffff', size: number = 20) {
    this.x = x; this.y = y; this.text = text; this.color = color; this.size = size;
    this.life = 1.2; this.maxLife = 1.2;
    this.isFrozenDuringTimeStop = false;
  }

  static acquire(x: number, y: number, text: string, color: string = '#ffffff', size: number = 20): FloatingText {
    const f = floatingTextPool.pop();
    if (f) {
      f.init(x, y, text, color, size);
      return f;
    }
    return new FloatingText(x, y, text, color, size);
  }

  static release(f: FloatingText) {
    if (floatingTextPool.length < 100) {
      floatingTextPool.push(f);
    }
  }

  update(dt: number) {
    if (this.isFrozenDuringTimeStop && (globals.flowState === 'awakened' || globals.zenFieldActiveTimer > 0)) {
      return;
    }
    this.y -= 40 * dt;
    this.life -= dt;
  }
  draw(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    if (globals.floatingTextEnabled === 'off') return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
    ctx.font = `bold ${this.size}px Arial`;
    ctx.textAlign = 'center';
    
    // Removed CPU-heavy shadowBlur for FloatingText to optimize performance
    
    if (this.color === '#ff003c') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.strokeText(this.text, this.x - cx + globals.vw/2, this.y - cy + globals.vh/2);
      ctx.fillStyle = this.color;
    } else if (this.color.startsWith('neon-')) {
      const neonHex = this.color.substring(5);
      ctx.strokeStyle = neonHex;
      ctx.lineWidth = 4;
      ctx.strokeText(this.text, this.x - cx + globals.vw/2, this.y - cy + globals.vh/2);
      ctx.fillStyle = '#ffffff';
    } else {
      ctx.fillStyle = this.color;
    }
    
    ctx.fillText(this.text, this.x - cx + globals.vw/2, this.y - cy + globals.vh/2);
    ctx.restore();
  }
}

export class GroundScar {
  x: number;
  y: number;
  angle: number;
  length: number;
  life: number;
  maxLife: number;
  color: string;

  constructor(x: number, y: number, angle: number, length: number, color = '#121212') {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.length = length;
    
    // fade scars faster on touch to save frames
    this.life = isMobile ? 1.0 : 2.0;
    this.maxLife = isMobile ? 1.0 : 2.0;
    this.color = color;
  }

  update(dt: number) {
    this.life -= dt;
  }

  draw(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    const rx = this.x - cx + globals.vw/2;
    const ry = this.y - cy + globals.vh/2;
    const buffer = this.length || 150;
    if (rx < -buffer || rx > globals.vw + buffer || ry < -buffer || ry > globals.vh + buffer) {
      return;
    }
    
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life / this.maxLife) * 0.45;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    const dx = Math.cos(this.angle) * this.length * 0.5;
    const dy = Math.sin(this.angle) * this.length * 0.5;
    ctx.moveTo(rx - dx, ry - dy);
    ctx.lineTo(rx + dx, ry + dy);
    ctx.stroke();
    
    // Core white scratch
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(rx - dx * 0.8, ry - dy * 0.8);
    ctx.lineTo(rx + dx * 0.8, ry + dy * 0.8);
    ctx.stroke();
    
    ctx.restore();
  }
}

export class Projectile {
  x!: number; y!: number; vx!: number; vy!: number; angle!: number;
  life = 2.0;
  isEnemy!: boolean;
  isDeflected = false;
  hitEnemies = new Set<any>();
  damage!: number;
  isHuge!: boolean;
  isEcho!: boolean;
  shooter?: any;
  enhancedType!: string;

  constructor(x: number, y: number, angle: number, isEnemy = false, damage = 1, isHuge = false, isEcho = false, enhancedType = '') {
    this.init(x, y, angle, isEnemy, damage, isHuge, isEcho, enhancedType);
  }

  init(x: number, y: number, angle: number, isEnemy = false, damage = 1, isHuge = false, isEcho = false, enhancedType = '') {
    this.x = x; this.y = y; this.angle = angle; this.isEnemy = isEnemy;
    this.damage = damage;
    this.isHuge = isHuge;
    this.isEcho = isEcho;
    this.enhancedType = enhancedType;
    this.isDeflected = false;
    this.hitEnemies.clear();
    this.life = 2.0;
    this.shooter = undefined;
    const speed = isEnemy ? 800 : (isEcho ? 2800 : 3000);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  static pool: Projectile[] = [];

  static acquire(x: number, y: number, angle: number, isEnemy = false, damage = 1, isHuge = false, isEcho = false, enhancedType = ''): Projectile {
    const inst = Projectile.pool.pop();
    if (inst) {
      inst.init(x, y, angle, isEnemy, damage, isHuge, isEcho, enhancedType);
      return inst;
    }
    return new Projectile(x, y, angle, isEnemy, damage, isHuge, isEcho, enhancedType);
  }

  static release(inst: Projectile) {
    if (Projectile.pool.length < 100) {
      Projectile.pool.push(inst);
    }
  }
  update(dt: number) {
    if ((this as any).isHoming && globals.player && globals.player.state !== 'dead') {
      const dx = globals.player.x - this.x;
      const dy = globals.player.y - this.y;
      const targetAngle = Math.atan2(dy, dx);
      
      let diff = targetAngle - this.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      
      this.angle += diff * Math.min(1.0, 3.5 * dt);
      const homingSpeed = 550;
      this.vx = Math.cos(this.angle) * homingSpeed;
      this.vy = Math.sin(this.angle) * homingSpeed;
    }

    this.x += this.vx * dt; this.y += this.vy * dt;
    this.life -= dt;
    
    // Void Stance pulling logic
    if (globals.voidStanceActive && !this.isEnemy) {
      const pullRadius = this.isHuge ? 350 : 200;
      const pullSpeed = 400;
      globals.enemies.forEach(e => {
        if (e.state === 'dead') return;
        const dx = this.x - e.x;
        const dy = this.y - e.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < pullRadius * pullRadius) {
          const dist = Math.sqrt(distSq) || 0.001;
          if (dist > 10) {
            const pullRatio = Math.min(1, pullSpeed * dt / dist);
            e.x += dx * pullRatio;
            e.y += dy * pullRatio;
          }
        }
      });
    }

    // Shield (Wind Aegis) pulling and bullet deflection logic
    if (this.enhancedType === 'shield' && !this.isEnemy) {
      const pullRadius = 260;
      const pullSpeed = 600;
      globals.enemies.forEach(e => {
        if (e.state === 'dead') return;
        const dx = this.x - e.x;
        const dy = this.y - e.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < pullRadius * pullRadius) {
          const dist = Math.sqrt(distSq) || 0.001;
          if (dist > 10) {
            const pullRatio = Math.min(1, pullSpeed * dt / dist);
            e.x += dx * pullRatio;
            e.y += dy * pullRatio;
          }
        }
      });

      // Deflect enemy bullets
      globals.projectiles.forEach(p => {
        if (p.isEnemy) {
          const dx = this.x - p.x;
          const dy = this.y - p.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 180 * 180) {
            p.isEnemy = false;
            p.angle = this.angle + (Math.random() - 0.5) * 0.4;
            const deflectSpeed = 2000;
            p.vx = Math.cos(p.angle) * deflectSpeed;
            p.vy = Math.sin(p.angle) * deflectSpeed;
            p.isDeflected = true;
            p.damage = (globals.playerStats.deflectedDmg || 1) + 2;
          }
        }
      });
    }

    // Gravity Well Iaijutsu pulling logic
    if (this.enhancedType === 'gravity' && !this.isEnemy) {
      const pullRadius = 300;
      const pullSpeed = 450;
      globals.enemies.forEach(e => {
        if (e.state === 'dead') return;
        const dx = this.x - e.x;
        const dy = this.y - e.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < pullRadius * pullRadius) {
          const dist = Math.sqrt(distSq) || 0.001;
          if (dist > 10) {
            const pullRatio = Math.min(1, pullSpeed * dt / dist);
            e.x += dx * pullRatio;
            e.y += dy * pullRatio;
          }
        }
      });
    }

    // Spawn cool trailing particles for player's shockwave projectile
    if (!this.isEnemy && (this.isHuge || globals.voidStanceActive || this.enhancedType)) {
      const particleSpawnChance = isMobile ? 0.35 : 0.7;
      if (Math.random() < particleSpawnChance) {
        const offsetAngle = this.angle + Math.PI/2;
        const sideOffsetRange = this.enhancedType ? (this.isHuge ? 200 : 100) : (this.isHuge ? 160 : 60);
        const sideOffset = (Math.random() - 0.5) * sideOffsetRange;
        const px = this.x + Math.cos(offsetAngle) * sideOffset;
        const py = this.y + Math.sin(offsetAngle) * sideOffset;
        
        let pColor = Math.random() > 0.5 ? '#00ffff' : '#ffffff';
        if (globals.voidStanceActive) {
          pColor = Math.random() > 0.5 ? '#8833ff' : '#ff00ff';
        }

        // Custom colors for enhanced projectiles
        if (this.enhancedType === 'dragon') {
          pColor = Math.random() > 0.5 ? '#ff4400' : '#ffa500';
        } else if (this.enhancedType === 'shield') {
          pColor = Math.random() > 0.5 ? '#00ffc8' : '#ffffff';
        } else if (this.enhancedType === 'firewheel') {
          pColor = Math.random() > 0.5 ? '#ff8800' : '#ffcc00';
        } else if (this.enhancedType === 'gravity') {
          pColor = Math.random() > 0.5 ? '#c084fc' : '#8a2be2';
        } else if (this.enhancedType === 'parry') {
          pColor = Math.random() > 0.5 ? '#ffd700' : '#ffffff';
        } else if (this.enhancedType === 'decoy') {
          pColor = Math.random() > 0.5 ? '#aa66ff' : '#8a2be2';
        } else if (this.enhancedType === 'shadow_awakening') {
          pColor = Math.random() > 0.5 ? '#d8b4fe' : '#aa66ff';
        } else if (this.enhancedType === 'storm_god') {
          pColor = Math.random() > 0.5 ? '#fbbf24' : '#fef08a';
        } else if (this.enhancedType === 'zen_field') {
          pColor = Math.random() > 0.5 ? '#22d3ee' : '#e0f2fe';
        }

        // Tail wind particles moving backwards
        globals.particles.push(Particle.acquire(
          px, py,
          pColor,
          180,
          0.3 + Math.random() * 0.2,
          1.5 + Math.random() * 2,
          this.angle + Math.PI + (Math.random() - 0.5) * 0.4,
          0,
          0.92
        ));
      }
    }
  }
  draw(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    const rx = this.x - cx + globals.vw/2;
    const ry = this.y - cy + globals.vh/2;
    const buffer = this.isHuge ? 350 : 80;
    if (rx < -buffer || rx > globals.vw + buffer || ry < -buffer || ry > globals.vh + buffer) {
      return;
    }
    
    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(this.angle);
    
    if (this.isEnemy) {
      const tint = (this as any).colorTint;
      let primary = '#ff0000';
      let secondary = '#ffff00';
      
      if (tint === '#ff4400') {
        primary = '#ff4400';
        secondary = '#ffb700';
      } else if (tint === '#a855f7') {
        primary = '#a855f7';
        secondary = '#d8b4fe';
      } else if (tint === '#f43f5e') {
        primary = '#f43f5e';
        secondary = '#fda4af';
      }

      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI*2);
      ctx.fillStyle = primary;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI*2);
      ctx.fillStyle = secondary;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI*2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    } else if (this.isDeflected) {
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI*2);
      ctx.fillStyle = '#00ffff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI*2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    } else {
      ctx.save();
      const isUlt = globals.flowState === 'awakened';
      
      let projSize = (globals.playerStats.iaijutsuRangeMult || 1.0) * 1.3;
      if (this.isHuge) {
        projSize *= 1.9; // Even larger!
      }
      if (this.isEcho) {
        projSize *= 0.5; // Half size
      }
      
      if (this.enhancedType === 'dragon') {
        projSize *= 1.6;
      } else if (this.enhancedType === 'shadow_awakening') {
        projSize *= 1.4;
      } else if (this.enhancedType === 'storm_god') {
        projSize *= 1.45;
      } else if (this.enhancedType === 'shield') {
        projSize *= 1.3;
      }
      ctx.scale(projSize, projSize);

      let shadowCol = isUlt ? '#ffd700' : '#00ffff';
      let strokeCol = isUlt ? '#ffffff' : '#00ffff';
      let colorBase = isUlt ? 'rgba(255, 215, 0, ' : 'rgba(0, 255, 255, ';
      
      const isEnhanceActive = (globals.selectedSkill === 'enhance' || globals.selectedSkill === 'firewheel') && globals.enhanceActiveTimer > 0;
      if (isEnhanceActive) {
        shadowCol = '#ff4400';
        strokeCol = '#ff6600';
        colorBase = 'rgba(255, 68, 0, ';
      }

      if (this.enhancedType === 'dragon') {
        shadowCol = '#ff1100';
        strokeCol = '#ffa500';
        colorBase = 'rgba(255, 68, 0, ';
      } else if (this.enhancedType === 'shield') {
        shadowCol = '#00ffc8';
        strokeCol = '#ffffff';
        colorBase = 'rgba(0, 255, 200, ';
      } else if (this.enhancedType === 'firewheel') {
        shadowCol = '#ff8800';
        strokeCol = '#ffcc00';
        colorBase = 'rgba(255, 136, 0, ';
      } else if (this.enhancedType === 'gravity') {
        shadowCol = '#c084fc';
        strokeCol = '#8a2be2';
        colorBase = 'rgba(192, 132, 252, ';
      } else if (this.enhancedType === 'parry') {
        shadowCol = '#ffd700';
        strokeCol = '#ffffff';
        colorBase = 'rgba(255, 215, 0, ';
      } else if (this.enhancedType === 'decoy') {
        shadowCol = '#aa66ff';
        strokeCol = '#8a2be2';
        colorBase = 'rgba(170, 102, 255, ';
      } else if (this.enhancedType === 'shadow_awakening') {
        shadowCol = '#d8b4fe';
        strokeCol = '#aa66ff';
        colorBase = 'rgba(216, 180, 254, ';
      } else if (this.enhancedType === 'storm_god') {
        shadowCol = '#fbbf24';
        strokeCol = '#ffffff';
        colorBase = 'rgba(251, 191, 36, ';
      } else if (this.enhancedType === 'zen_field') {
        shadowCol = '#22d3ee';
        strokeCol = '#e0f2fe';
        colorBase = 'rgba(34, 211, 238, ';
      }

      // Draw outer low-opacity glow outline
      ctx.save();
      ctx.strokeStyle = shadowCol;
      ctx.lineWidth = 14;
      ctx.globalAlpha = 0.35;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, 150, -Math.PI/2.3, Math.PI/2.3);
      ctx.arc(35, 0, 120, Math.PI/2.6, -Math.PI/2.6, true);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
      
      // Draw inner sharp outline
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, 150, -Math.PI/2.3, Math.PI/2.3);
      ctx.arc(35, 0, 120, Math.PI/2.6, -Math.PI/2.6, true);
      ctx.closePath();
      ctx.stroke();

      
      const grad = ctx.createLinearGradient(-30, 0, 160, 0);
      grad.addColorStop(0, colorBase + '0)');
      grad.addColorStop(0.3, colorBase + '0.85)');
      grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
      grad.addColorStop(0.7, colorBase + '0.85)');
      grad.addColorStop(1, colorBase + '0)');
      
      ctx.fillStyle = grad;
      ctx.fill();

      
      ctx.beginPath();
      ctx.arc(10, 0, 135, -Math.PI/2.4, Math.PI/2.4);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      
      ctx.strokeStyle = isUlt ? 'rgba(255,215,0,0.45)' : 'rgba(0,255,255,0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = -3; i <= 3; i++) {
        const arcAngle = (i / 4) * (Math.PI / 2.4);
        const radiusStart = 150;
        const radiusEnd = 150 + 20 + Math.random() * 20;
        ctx.moveTo(Math.cos(arcAngle) * radiusStart, Math.sin(arcAngle) * radiusStart);
        ctx.lineTo(Math.cos(arcAngle - 0.1) * radiusEnd, Math.sin(arcAngle - 0.1) * radiusEnd);
      }
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  }
}

export class Shockwave {
  x: number; y: number; color: string;
  radius = 0; maxRadius = 500; life = 0.5; maxLife = 0.5;
  constructor(x: number, y: number, color: string) {
    this.x = x; this.y = y; this.color = color;
    
    // Automatically register a radial wind force blowing outward from the center
    globals.windForces.push({
      x: x,
      y: y,
      radius: 450,
      strength: 2.2,
      life: 0.3,
      maxLife: 0.3
    });
  }
  update(dt: number) {
    this.life -= dt; this.radius += (this.maxRadius - this.radius) * 20 * dt;
  }
  draw(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    const rx = this.x - cx + globals.vw/2;
    const ry = this.y - cy + globals.vh/2;
    const buffer = this.radius + 50;
    if (rx < -buffer || rx > globals.vw + buffer || ry < -buffer || ry > globals.vh + buffer) {
      return;
    }
    
    ctx.save(); ctx.translate(rx, ry);
    const p = Math.max(0, this.life / this.maxLife);
    
    // draw enso circle
    const startAngle = -Math.PI / 4;
    const totalAngle = Math.PI * 1.85; // leaves an open gap
    ctx.strokeStyle = this.color;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    const steps = 45;
    for (let i = 0; i <= steps; i++) {
      const angle = startAngle + (i / steps) * totalAngle;
      // add noise jitter
      const radiusJitter = (Math.sin(angle * 6) * 6 + Math.cos(angle * 14) * 3) * (this.radius / 180);
      const r = this.radius + radiusJitter;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      
      const brushFactor = Math.sin((i / steps) * Math.PI); // thick center, tapered ends
      ctx.lineWidth = Math.max(2, (26 * brushFactor + 4) * p);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // inner zen overlay
    ctx.strokeStyle = `rgba(30, 30, 35, ${p * 0.4})`;
    ctx.lineWidth = 4 * p;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.9, 0, Math.PI * 2);
    ctx.stroke();
    
    // expansion glow
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.92, 0, Math.PI*2);
    ctx.fillStyle = `rgba(255, 255, 255, ${p * 0.06})`; ctx.fill();

    // sumi-e burst lines
    ctx.strokeStyle = `rgba(20, 20, 25, ${p * 0.5})`; ctx.lineWidth = 3;
    ctx.beginPath();
    for(let i=0; i<12; i++) {
      const a = (i / 12) * Math.PI * 2 + Math.sin(p * 2);
      ctx.moveTo(Math.cos(a) * this.radius * 0.25, Math.sin(a) * this.radius * 0.25);
      ctx.lineTo(Math.cos(a) * this.radius * 1.5, Math.sin(a) * this.radius * 1.5);
    }
    ctx.stroke();
    ctx.restore();
  }
}

export class Slash {
  x!: number; y!: number; angle!: number; sizeMult!: number; isEnhanced!: boolean;
  colorTint?: string;
  isCircular = false;
  life = 0.25; maxLife = 0.25;
  owner?: any;
  offsetX = 0;
  offsetY = 0;

  constructor(x: number, y: number, angle: number, sizeMult: number, isEnhanced = false, colorTint?: string, isCircular = false, owner?: any) {
    this.init(x, y, angle, sizeMult, isEnhanced, colorTint, isCircular, owner);
  }

  init(x: number, y: number, angle: number, sizeMult: number, isEnhanced = false, colorTint?: string, isCircular = false, owner?: any) {
    this.x = x; this.y = y; this.angle = angle; this.sizeMult = sizeMult; this.isEnhanced = isEnhanced;
    this.colorTint = colorTint;
    this.isCircular = isCircular;
    this.owner = owner;
    this.life = 0.25; this.maxLife = 0.25;
    
    if (owner) {
      this.offsetX = x - owner.x;
      this.offsetY = y - owner.y;
    } else {
      this.offsetX = 0;
      this.offsetY = 0;
    }
    
    // Automatically register a directional wind force in the slash's direction
    const windX = Math.cos(angle);
    const windY = Math.sin(angle);
    globals.windForces.push({
      x: x,
      y: y,
      radius: 350 * sizeMult,
      strength: isEnhanced ? 2.5 : 1.8,
      dirX: windX,
      dirY: windY,
      life: 0.35,
      maxLife: 0.35
    });

    // Push GroundScar
    const maxScars = isMobile ? 15 : 50;
    const scarColor = isEnhanced ? '#2e1f23' : '#121212';
    globals.groundScars.push(new GroundScar(x, y, angle, 160 * sizeMult, scarColor));
    while (globals.groundScars.length > maxScars) {
      globals.groundScars.shift();
    }
  }

  static pool: Slash[] = [];

  static acquire(x: number, y: number, angle: number, sizeMult: number, isEnhanced = false, colorTint?: string, isCircular = false, owner?: any): Slash {
    const inst = Slash.pool.pop();
    if (inst) {
      inst.init(x, y, angle, sizeMult, isEnhanced, colorTint, isCircular, owner);
      return inst;
    }
    return new Slash(x, y, angle, sizeMult, isEnhanced, colorTint, isCircular, owner);
  }

  static release(inst: Slash) {
    if (Slash.pool.length < 100) {
      Slash.pool.push(inst);
    }
  }
  update(dt: number) {
    this.life -= dt;
    if (this.owner && this.owner.state !== 'dead') {
      this.x = this.owner.x + this.offsetX;
      this.y = this.owner.y + this.offsetY;
    }
  }
  draw(_ctx: CanvasRenderingContext2D, _cx: number, _cy: number) {
    // Slash animations are removed as requested. User will re-add individually later.
  }
}

export class AnimatedEffect {
  x: number;
  y: number;
  frames: HTMLImageElement[];
  life: number;
  maxLife: number;
  scale: number;
  rotation: number;
  type?: string;

  constructor(x: number, y: number, frames: HTMLImageElement[], duration = 0.4, scale = 1.0, rotation = 0, type?: string) {
    this.x = x;
    this.y = y;
    this.frames = frames;
    this.maxLife = duration;
    this.life = duration;
    this.scale = scale;
    this.rotation = rotation;
    this.type = type;
  }

  update(dt: number) {
    this.life -= dt;
  }

  draw(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    if (this.life <= 0) return;
    const progress = Math.max(0, Math.min(0.99, 1 - (this.life / this.maxLife)));
    const rx = Math.round(this.x - cx + globals.vw/2);
    const ry = Math.round(this.y - cy + globals.vh/2);

    ctx.save();
    ctx.translate(rx, ry);

    if (this.type) {
      if (this.type === 'fire_rune') {
        ctx.beginPath();
        ctx.arc(0, 0, 45 * this.scale, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 68, 0, ${progress})`;
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.stroke();
      } else if (this.type === 'fire_pillar') {
        const grad = ctx.createLinearGradient(-15 * this.scale, 0, 15 * this.scale, 0);
        grad.addColorStop(0, `rgba(255, 68, 0, ${1 - progress})`);
        grad.addColorStop(0.5, `rgba(255, 165, 0, ${(1 - progress) * 1.5})`);
        grad.addColorStop(1, `rgba(255, 68, 0, ${1 - progress})`);
        ctx.fillStyle = grad;
        ctx.fillRect(-20 * this.scale * (1 - progress), -150 * this.scale, 40 * this.scale * (1 - progress), 170 * this.scale);
      } else if (this.type === 'ice_spike') {
        ctx.beginPath();
        ctx.moveTo(0, 5);
        ctx.lineTo(-12 * this.scale, 5);
        ctx.lineTo(0, -45 * this.scale * Math.sin(progress * Math.PI));
        ctx.lineTo(12 * this.scale, 5);
        ctx.closePath();
        const grad = ctx.createLinearGradient(-12, 0, 12, 0);
        grad.addColorStop(0, `rgba(96, 165, 250, ${1 - progress})`);
        grad.addColorStop(1, `rgba(224, 242, 254, ${1 - progress})`);
        ctx.fillStyle = grad;
        ctx.fill();
      } else if (this.type === 'ice_shield') {
        ctx.beginPath();
        ctx.arc(0, 0, 40 * this.scale, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(96, 165, 250, ${(1 - progress) * 0.75})`;
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.fillStyle = `rgba(96, 165, 250, ${(1 - progress) * 0.15})`;
        ctx.fill();
      } else if (this.type === 'star_rune') {
        ctx.beginPath();
        ctx.arc(0, 0, 50 * this.scale, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(244, 63, 94, ${progress})`;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 8]);
        ctx.stroke();
      } else if (this.type === 'meteor_blast') {
        ctx.beginPath();
        ctx.arc(0, 0, 75 * this.scale * progress, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(244, 63, 94, ${1 - progress})`;
        ctx.lineWidth = 4 * (1 - progress);
        ctx.stroke();
      } else if (this.type === 'necro_portal') {
        ctx.beginPath();
        ctx.arc(0, 0, 30 * this.scale * Math.sin(progress * Math.PI), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(168, 85, 247, ${1 - progress})`;
        ctx.lineWidth = 4;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    if (this.frames.length > 0) {
      const frameIdx = Math.floor(progress * this.frames.length);
      const img = this.frames[frameIdx];
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
      }
    }
    ctx.restore();
  }
}

export class Decoy extends Entity {
  life = 4.0;
  maxLife = 4.0;
  attackTimer = 0;

  constructor(x: number, y: number) {
    super();
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.yOffset = 0;
    this.yVelocity = 0;
    this.type = 'sword'; // uses player's model type
    this.state = 'idle';
    this.stateTime = 0;
    this.animFrame = 0;
    this.animTimer = 0;
    this.life = 4.0;
    this.maxLife = 4.0;
    this.attackTimer = 0;
  }

  update(dt: number) {
    super.update(dt);
    this.life -= dt;

    // Periodic spinning slash attack every 1.0s
    this.attackTimer += dt;
    if (this.attackTimer >= 1.0) {
      this.attackTimer = 0;
      this.performAttack();
    }
  }

  performAttack() {
    globals.slashes.push(Slash.acquire(this.x, this.y, Math.random() * Math.PI * 2, 1.2, false, 'rgba(192, 132, 252, ALPHA)', true));
    
    // Deal 3 damage + knockback to nearby enemies in 180px radius
    const enemies = globals.enemies;
    const len = enemies.length;
    for (let i = 0; i < len; i++) {
      const e = enemies[i];
      if (e.state === 'dead') continue;
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < 32400) {
        if (callbacks.hitEnemy) {
          callbacks.hitEnemy(e, 3);
        } else {
          e.hp -= 3;
          e.hitFlash = 0.15;
          if (e.hp <= 0) e.setState('dead');
        }
        
        // knockback
        const dist = Math.sqrt(distSq) || 0.001;
        e.vx = (dx / dist) * 800;
        e.vy = (dy / dist) * 800;
        e.stunTimer = Math.max(e.stunTimer || 0, 0.6);
        
        for (let j = 0; j < 5; j++) {
          globals.particles.push(Particle.acquire(e.x, e.y, '#c084fc', 150, 0.3, 1.5));
        }
      }
    }
  }

  explode() {
    globals.shockwaves.push(new Shockwave(this.x, this.y, '#c084fc'));
    for (let i = 0; i < 20; i++) {
      globals.particles.push(Particle.acquire(this.x, this.y, '#c084fc', 300, 0.5, 2.5 + Math.random() * 2, Math.random() * Math.PI * 2));
    }
    
    const enemies = globals.enemies;
    const len = enemies.length;
    for (let i = 0; i < len; i++) {
      const e = enemies[i];
      if (e.state === 'dead') continue;
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < 40000) {
        if (callbacks.hitEnemy) {
          callbacks.hitEnemy(e, 8);
        } else {
          e.hp -= 8;
          e.hitFlash = 0.15;
          if (e.hp <= 0) e.setState('dead');
        }
        e.stunTimer = Math.max(e.stunTimer || 0, 1.5);
        // extra knockback
        const dist = Math.sqrt(distSq) || 0.001;
        e.vx = (dx / dist) * 1200;
        e.vy = (dy / dist) * 1200;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    // Drawn as a purple holographic clone
    super.draw(ctx, cx, cy, (this.life / this.maxLife) * 0.75, '#c084fc');
  }
}

export class Collectible {
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  type: 'exp' | 'heart';
  value: number;
  life = 12.0;

  constructor(x: number, y: number, type: 'exp' | 'heart', value = 1) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.value = value;
    // Spawn with a small upward/outward pop
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 2.5;
    const speed = 150 + Math.random() * 200;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt: number) {
    // Physics decay
    this.vx *= Math.exp(-4 * dt);
    this.vy *= Math.exp(-4 * dt);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;

    // Pull to player logic
    const dx = globals.player.x - this.x;
    const dy = globals.player.y - this.y;
    const distSq = dx * dx + dy * dy;
    
    let baseRadius = 120;
    let pullSpeed = 450;
    const isPlayerDashing = globals.player && globals.player.state === 'dash';
    
    if (isPlayerDashing && this.type === 'exp') {
      baseRadius = 500;
      pullSpeed = 2500;
    }
    
    const magRadius = globals.playerStats.magneticDrawLevel ? Math.max(800, baseRadius) : baseRadius;
    
    if (distSq < magRadius * magRadius && globals.player.state !== 'dead') {
      const dist = Math.sqrt(distSq) || 0.001;
      const actualPullSpeed = globals.playerStats.magneticDrawLevel ? Math.max(1000, pullSpeed) : pullSpeed;
      let force;
      if (isPlayerDashing && this.type === 'exp') {
        force = actualPullSpeed;
      } else {
        force = (1 - dist / magRadius) * actualPullSpeed + 250;
      }
      this.x += (dx / dist) * force * dt;
      this.y += (dy / dist) * force * dt;
    }
  }

  draw(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    const rx = this.x - cx + globals.vw/2;
    const ry = this.y - cy + globals.vh/2;
    if (rx < -40 || rx > globals.vw + 40 || ry < -40 || ry > globals.vh + 40) return;

    ctx.save();
    ctx.translate(rx, ry);
    
    const bob = Math.sin(performance.now() / 150 + this.x) * 4;
    ctx.translate(0, bob);

    if (this.type === 'exp') {
      // EXP Gem (Gold diamond)
      ctx.fillStyle = '#ffd700';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      // Removed CPU-heavy shadowBlur
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(6, 0);
      ctx.lineTo(0, 9);
      ctx.lineTo(-6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // Red Heart
      ctx.fillStyle = '#ff3366';
      // Removed CPU-heavy shadowBlur
      ctx.beginPath();
      ctx.arc(-4, -2, 4.5, 0, Math.PI * 2);
      ctx.arc(4, -2, 4.5, 0, Math.PI * 2);
      ctx.moveTo(-8.5, -2);
      ctx.lineTo(0, 7.5);
      ctx.lineTo(8.5, -2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}

export class LightningBeam {
  x: number;
  y: number;
  startY: number;
  life = 0.35;
  maxLife = 0.35;
  segments: { x: number, y: number }[] = [];
  branches: { x: number, y: number }[][] = [];

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.startY = y - 700;
    this.generatePath();
  }

  generatePath() {
    let curX = this.x + (Math.random() - 0.5) * 80;
    let curY = this.startY;
    this.segments.push({ x: curX, y: curY });

    const steps = 25;
    const stepSize = (this.y - this.startY) / steps;

    for (let i = 1; i <= steps; i++) {
      curY = this.startY + i * stepSize;
      if (i === steps) {
        curX = this.x;
      } else {
        curX += (Math.random() - 0.5) * 45;
      }
      this.segments.push({ x: curX, y: curY });

      // Occasionally generate a side branch
      if (Math.random() < 0.22 && i < steps - 3) {
        const branch: { x: number, y: number }[] = [];
        let bx = curX;
        let by = curY;
        branch.push({ x: bx, y: by });
        const branchSteps = 5 + Math.floor(Math.random() * 6);
        const branchAngle = Math.PI / 2 + (Math.random() - 0.5) * 1.2; // roughly downwards and left/right
        const branchLength = 20 + Math.random() * 20;
        for (let j = 0; j < branchSteps; j++) {
          bx += Math.cos(branchAngle) * branchLength + (Math.random() - 0.5) * 15;
          by += Math.sin(branchAngle) * branchLength + (Math.random() - 0.5) * 15;
          branch.push({ x: bx, y: by });
        }
        this.branches.push(branch);
      }
    }
  }

  update(dt: number) {
    this.life -= dt;
  }

  draw(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    const rx = globals.vw / 2 - cx;
    const ry = globals.vh / 2 - cy;

    ctx.save();
    
    // Set glow effect
    // Removed CPU-heavy shadowBlur
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const alpha = Math.max(0, this.life / this.maxLife);

    // Draw main beam
    // 1st pass: Outer golden aura
    ctx.strokeStyle = `rgba(251, 191, 36, ${alpha * 0.9})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(this.segments[0].x + rx, this.segments[0].y + ry);
    for (let i = 1; i < this.segments.length; i++) {
      ctx.lineTo(this.segments[i].x + rx, this.segments[i].y + ry);
    }
    ctx.stroke();

    // 2nd pass: Inner white-hot core
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(this.segments[0].x + rx, this.segments[0].y + ry);
    for (let i = 1; i < this.segments.length; i++) {
      ctx.lineTo(this.segments[i].x + rx, this.segments[i].y + ry);
    }
    ctx.stroke();

    // Draw branches
    this.branches.forEach(branch => {
      // Outer aura
      ctx.strokeStyle = `rgba(245, 158, 11, ${alpha * 0.7})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(branch[0].x + rx, branch[0].y + ry);
      for (let i = 1; i < branch.length; i++) {
        ctx.lineTo(branch[i].x + rx, branch[i].y + ry);
      }
      ctx.stroke();

      // Inner core
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(branch[0].x + rx, branch[0].y + ry);
      for (let i = 1; i < branch.length; i++) {
        ctx.lineTo(branch[i].x + rx, branch[i].y + ry);
      }
      ctx.stroke();
    });

    ctx.restore();
  }
}

export class PvPShockwave {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isHostile: boolean;
  speed: number;
  rallyIndex: number;
  life = 3.0;
  radius = 50;

  constructor(x: number, y: number, vx: number, vy: number, isHostile: boolean, speed: number, rallyIndex: number) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.isHostile = isHostile;
    this.speed = speed;
    this.rallyIndex = rallyIndex;
  }

  update(dt: number) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    
    // Spawn trailing particles
    if (Math.random() > (isMobile ? 0.6 : 0.3)) {
      let color = '#00ffff';
      if (this.rallyIndex >= 8) color = '#ff00ff';
      else if (this.rallyIndex >= 4) color = '#f59e0b';
      
      const speed = 50 + Math.random() * 100;
      const angle = Math.atan2(this.vy, this.vx) + Math.PI + (Math.random() - 0.5) * 0.5;
      globals.particles.push(Particle.acquire(
        this.x + (Math.random() - 0.5) * 20,
        this.y + (Math.random() - 0.5) * 20,
        color,
        speed,
        0.3 + Math.random() * 0.2,
        2 + Math.random() * 2,
        angle
      ));
    }
  }

  draw(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    ctx.save();
    ctx.translate(this.x - cx + globals.vw/2, this.y - cy + globals.vh/2);

    // Choose dynamic color palette based on rally index
    let primaryColor = '#00f6ff'; // cyan neon
    let secondaryColor = '#0088ff';
    let sparkColor = '#ffffff';
    
    if (this.rallyIndex >= 8) {
      primaryColor = '#ff007f'; // deep hot pink
      secondaryColor = '#9a00ff'; // intense violet
      sparkColor = '#ffbfe0';
    } else if (this.rallyIndex >= 4) {
      primaryColor = '#ff8c00'; // dark gold/orange
      secondaryColor = '#ff3c00'; // intense neon red
      sparkColor = '#ffe3b3';
    }

    const angle = Math.atan2(this.vy, this.vx);
    const radius = 45;
    const thicknessMult = 1.0 + Math.min(2.0, this.rallyIndex * 0.12);

    // 1. Draw Trailing Ribbons (Afterimages)
    for (let i = 1; i <= 3; i++) {
      const trailAlpha = 0.25 / i;
      const trailOffset = -this.vx * 0.008 * i;
      
      ctx.save();
      ctx.translate(trailOffset, 0);
      ctx.strokeStyle = secondaryColor;
      ctx.lineWidth = (this.rallyIndex >= 8 ? 6 : (this.rallyIndex >= 4 ? 4 : 2)) * thicknessMult;
      ctx.globalAlpha = trailAlpha;
      ctx.beginPath();
      ctx.arc(0, 0, radius - i * 3, angle - Math.PI / 3, angle + Math.PI / 3);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Main Glowing Outer Aura
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = (this.rallyIndex >= 8 ? 14 : (this.rallyIndex >= 4 ? 10 : 7)) * thicknessMult;
    ctx.lineCap = 'round';
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 20 + this.rallyIndex * 3;
    
    ctx.beginPath();
    ctx.arc(0, 0, radius, angle - Math.PI / 2.8, angle + Math.PI / 2.8);
    ctx.stroke();

    // 3. Middle Crescent (Slightly smaller, solid secondary color)
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = (this.rallyIndex >= 8 ? 7 : (this.rallyIndex >= 4 ? 5 : 3)) * thicknessMult;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, 0, radius, angle - Math.PI / 3, angle + Math.PI / 3);
    ctx.stroke();

    // 4. Inner Bright Core (Pure white heat line)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = (this.rallyIndex >= 8 ? 3.5 : (this.rallyIndex >= 4 ? 2.5 : 1.5)) * thicknessMult;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(0, 0, radius, angle - Math.PI / 4, angle + Math.PI / 4);
    ctx.stroke();

    // 5. Crackling Energy Sparks / Lightning Tendrils (especially at higher rallies)
    if (this.rallyIndex >= 2) {
      ctx.strokeStyle = sparkColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const sparkCount = this.rallyIndex >= 6 ? 4 : 2;
      for (let j = 0; j < sparkCount; j++) {
        // Find a point on the arc to sprout lightning
        const sparkAngle = angle + (Math.random() - 0.5) * (Math.PI * 0.6);
        const startX = Math.cos(sparkAngle) * radius;
        const startY = Math.sin(sparkAngle) * radius;
        
        ctx.moveTo(startX, startY);
        let curX = startX;
        let curY = startY;
        const length = 10 + Math.random() * 20;
        
        // Draw 3-step zigzag spark
        for (let step = 0; step < 3; step++) {
          const stepAngle = sparkAngle + (Math.random() - 0.5) * 1.2;
          const stepDist = length / 3;
          curX += Math.cos(stepAngle) * stepDist;
          curY += Math.sin(stepAngle) * stepDist;
          ctx.lineTo(curX, curY);
        }
      }
      ctx.stroke();
    }

    ctx.restore();
  }
}


