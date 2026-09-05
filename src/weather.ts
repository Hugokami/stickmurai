import { globals } from './globals';

export interface WindForce {
  x: number;
  y: number;
  radius: number;
  strength: number;
  dirX?: number;
  dirY?: number;
  life: number;
  maxLife: number;
}

export class WeatherParticle {
  x!: number; y!: number; vx!: number; vy!: number;
  type!: 'sakura' | 'rain' | 'snow';
  size!: number;
  swayTime!: number;
  swaySpeed!: number;
  alpha!: number;

  constructor(x: number, y: number, type: 'sakura' | 'rain' | 'snow') {
    this.init(x, y, type);
  }

  init(x: number, y: number, type: 'sakura' | 'rain' | 'snow') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.swayTime = Math.random() * 100;
    this.swaySpeed = 1 + Math.random() * 2;
    this.alpha = 0.3 + Math.random() * 0.7;
    
    if (type === 'sakura') {
      this.vx = -50 - Math.random() * 50;
      this.vy = 80 + Math.random() * 50;
      this.size = 6 + Math.random() * 6;
    } else if (type === 'rain') {
      this.vx = -150 - Math.random() * 100;
      this.vy = 800 + Math.random() * 400;
      this.size = 1 + Math.random() * 1.5;
    } else { // snow
      this.vx = -20 - Math.random() * 30;
      this.vy = 40 + Math.random() * 30;
      this.size = 2 + Math.random() * 4;
    }
  }

  static pool: WeatherParticle[] = [];

  static acquire(x: number, y: number, type: 'sakura' | 'rain' | 'snow'): WeatherParticle {
    const p = WeatherParticle.pool.pop();
    if (p) {
      p.init(x, y, type);
      return p;
    }
    return new WeatherParticle(x, y, type);
  }

  static release(p: WeatherParticle) {
    if (WeatherParticle.pool.length < 200) {
      WeatherParticle.pool.push(p);
    }
  }

  update(dt: number, windForces: WindForce[]) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.swayTime += dt * this.swaySpeed;

    if (this.type === 'sakura') {
      this.x += Math.sin(this.swayTime) * 40 * dt;
    } else if (this.type === 'snow') {
      this.x += Math.sin(this.swayTime) * 20 * dt;
    }

    if (!windForces || windForces.length === 0) return;
    for (let i = 0; i < windForces.length; i++) {
      const force = windForces[i];
      const dx = this.x - force.x;
      const dy = this.y - force.y;
      const radSq = force.radius * force.radius;
      const distSq = dx * dx + dy * dy;
      if (distSq < radSq) {
        const dist = Math.sqrt(distSq) || 0.001;
        const factor = (1 - dist / force.radius) * force.strength;
        if (force.dirX !== undefined && force.dirY !== undefined) {
          this.x += force.dirX * factor * 800 * dt;
          this.y += force.dirY * factor * 800 * dt;
        } else {
          this.x += (dx / dist) * factor * 1000 * dt;
          this.y += (dy / dist) * factor * 1000 * dt;
        }
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    const rx = this.x - cx + globals.vw/2;
    const ry = this.y - cy + globals.vh/2;

    if (rx < -100 || rx > globals.vw + 100 || ry < -100 || ry > globals.vh + 100) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;

    if (this.type === 'sakura') {
      ctx.fillStyle = '#ffb7c5';
      ctx.beginPath();
      ctx.ellipse(rx, ry, this.size, this.size * 0.6, Math.PI / 4 + Math.sin(this.swayTime) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'rain') {
      ctx.strokeStyle = 'rgba(174, 219, 255, 0.4)';
      ctx.lineWidth = this.size;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + this.vx * 0.015, ry + this.vy * 0.015);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(rx - this.size, ry - this.size, this.size * 2, this.size * 2);
    }

    ctx.restore();
  }
}

export class WeatherEngine {
  particles: WeatherParticle[] = [];
  type: 'rain' | 'snow' = 'rain';

  constructor() {
    const types: ('rain' | 'snow')[] = ['rain', 'snow'];
    this.type = types[Math.floor(Math.random() * types.length)];
  }

  update(dt: number) {
    let writeIdx = 0;
    for (let i = 0; i < globals.windForces.length; i++) {
      const f = globals.windForces[i];
      f.life -= dt;
      if (f.life > 0) {
        globals.windForces[writeIdx++] = f;
      }
    }
    if (writeIdx > 2) writeIdx = 2;
    globals.windForces.length = writeIdx;

    if (globals.graphicsSettings === 'low' || globals.weatherEffectsEnabled === 'off') {
      if (this.particles.length > 0) {
        this.particles.forEach(p => WeatherParticle.release(p));
        this.particles.length = 0;
      }
      return;
    }

    const maxP = ('ontouchstart' in window || navigator.maxTouchPoints > 0) ? 20 : 100;
    
    while (this.particles.length < maxP) {
      const spawnX = globals.camera.x - globals.vw/2 + Math.random() * (globals.vw * 1.5) - globals.vw * 0.25;
      const spawnY = globals.camera.y - globals.vh/2 - 100 + Math.random() * 50;
      this.particles.push(WeatherParticle.acquire(spawnX, spawnY, this.type));
    }

    this.particles.forEach(p => p.update(dt, globals.windForces));

    const minX = globals.camera.x - globals.vw/2 - 200;
    const maxX = globals.camera.x + globals.vw/2 + 400;
    const maxY = globals.camera.y + globals.vh/2 + 200;

    let writeIdxParticles = 0;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.y < maxY && p.x > minX && p.x < maxX) {
        this.particles[writeIdxParticles++] = p;
      } else {
        WeatherParticle.release(p);
      }
    }
    this.particles.length = writeIdxParticles;
  }

  draw(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    if (globals.graphicsSettings === 'low' || globals.weatherEffectsEnabled === 'off' || this.particles.length === 0) return;

    ctx.save();
    const type = this.type;
    if (type === 'rain') {
      ctx.strokeStyle = 'rgba(174, 219, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        const rx = p.x - cx + globals.vw/2;
        const ry = p.y - cy + globals.vh/2;
        if (rx < -50 || rx > globals.vw + 50 || ry < -50 || ry > globals.vh + 50) continue;
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx + p.vx * 0.015, ry + p.vy * 0.015);
      }
      ctx.stroke();
    } else if (type === 'snow') {
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        const rx = p.x - cx + globals.vw/2;
        const ry = p.y - cy + globals.vh/2;
        if (rx < -50 || rx > globals.vw + 50 || ry < -50 || ry > globals.vh + 50) continue;
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(rx - p.size, ry - p.size, p.size * 2, p.size * 2);
      }
    } else { // sakura
      ctx.fillStyle = '#ffb7c5';
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        const rx = p.x - cx + globals.vw/2;
        const ry = p.y - cy + globals.vh/2;
        if (rx < -50 || rx > globals.vw + 50 || ry < -50 || ry > globals.vh + 50) continue;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.ellipse(rx, ry, p.size, p.size * 0.6, Math.PI / 4 + Math.sin(p.swayTime) * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
