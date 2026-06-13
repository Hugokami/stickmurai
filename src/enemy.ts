import { globals } from './globals';
import { callbacks } from './callbacks';
import { Entity, Particle, FloatingText, Projectile } from './entities';
import { Player } from './player';
import { playSound, sfx } from './audio';
import { pvpManager } from './pvpIaijutsuManager';

const isMobile = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

export type EnemySubType = 'brawler' | 'samurai' | 'giant' | 'assassin' | 'berserker' | 'ronin' | 'oni_boss' | 'shogun_boss' | 'musketeer';

export class Enemy extends Entity {
  target!: Player;
  attackLanded = false;
  chargeTimeMax = 0.8;
  deadTimer = 0;
  knockbackTimer = 0;
  knockbackVx = 0;
  knockbackVy = 0;
  targetAngle = 0;
  lungeSpeed = 1200;
  lungeDuration = 0.6; // how long the lunge lasts
  subType!: EnemySubType;
  colorTint!: string;
  hp = 2;
  maxHp = 2;
  hitFlash = 0; // brief white flash on hit
  expValue = 1;
  isSlashedKamisori = false;
  kamisoriCutAngle = 0;
  kamisoriDamage = 0;
  kamisoriHits = 0;
  kamisoriCutAngles: number[] = [];
  kamisoriFloatingText: FloatingText | null = null;
  burnTimer = 0;
  burnTickTimer = 0;
  burnBonusDmg = 0;
  hpDelayed = 2;
  stunTimer = 0;
  chillTimer = 0;
  speed = 300;



  constructor(x: number, y: number, target: Player) {
    super(); 
    this.init(x, y, target);
  }

  init(x: number, y: number, target: Player) {
    this.x = x; this.y = y; this.target = target;
    this.state = 'idle'; this.stateTime = 0; this.animFrame = 0; this.animTimer = 0;
    this.yOffset = 0; this.yVelocity = 0;
    this.vx = 0; this.vy = 0;
    this.attackLanded = false;
    this.deadTimer = 0;
    this.knockbackTimer = 0;
    this.knockbackVx = 0;
    this.knockbackVy = 0;
    this.targetAngle = 0;
    this.isSlashedKamisori = false;
    this.kamisoriCutAngle = 0;
    this.kamisoriDamage = 0;
    this.kamisoriHits = 0;
    this.kamisoriCutAngles = [];
    this.kamisoriFloatingText = null;
    this.burnTimer = 0;
    this.burnTickTimer = 0;
    this.burnBonusDmg = 0;
    this.stunTimer = 0;
    this.chillTimer = 0;
    this.hitFlash = 0;

    // Reset properties to base defaults before applying roll customization
    this.hp = 2;
    this.maxHp = 2;
    this.hpDelayed = 2;
    this.speed = 300;
    this.lungeSpeed = 1200;
    this.chargeTimeMax = 0.8;
    this.lungeDuration = 0.6;
    this.scaleMult = 1;
    this.expValue = 1;
    this.colorTint = '#ffffff';
    this.type = 'fighter';
    
    if (globals.gameMode === 'zen') {
      const roll = Math.random();
      if (roll < 0.40) this.subType = 'musketeer';
      else if (roll < 0.52) this.subType = 'samurai';
      else if (roll < 0.64) this.subType = 'ronin';
      else if (roll < 0.76) this.subType = 'brawler';
      else if (roll < 0.84) this.subType = 'berserker';
      else if (roll < 0.88) this.subType = 'giant';
      else if (roll < 0.92) this.subType = 'assassin';
      else if (roll < 0.96 && globals.score > 20) this.subType = 'oni_boss';
      else if (globals.score > 40) this.subType = 'shogun_boss';
      else this.subType = 'musketeer';
    } else {
      const roll = Math.random();
      if (roll < 0.20) this.subType = 'brawler';
      else if (roll < 0.35) this.subType = 'samurai';
      else if (roll < 0.50) this.subType = 'ronin';
      else if (roll < 0.65) this.subType = 'berserker';
      else if (roll < 0.75) this.subType = 'giant';
      else if (roll < 0.85) this.subType = 'assassin';
      else if (roll < 0.95) this.subType = 'musketeer';
      else if (roll < 0.98 && globals.score > 20) this.subType = 'oni_boss'; // Bosses spawn later
      else if (globals.score > 40) this.subType = 'shogun_boss';
      else this.subType = 'brawler'; // Fallback
    }
    
    if (this.subType === 'brawler') {
      this.type = 'fighter';
      this.lungeSpeed = 1200; this.chargeTimeMax = 0.8; this.lungeDuration = 0.5;
      this.scaleMult = 1; this.hp = this.maxHp = 4; this.expValue = 1;
      this.colorTint = '#ff33ff'; // Magenta
      this.speed = 300;
    } else if (this.subType === 'samurai') {
      this.type = 'sword';
      this.lungeSpeed = 1100; this.chargeTimeMax = 0.9; this.lungeDuration = 0.6;
      this.scaleMult = 1.1; this.hp = this.maxHp = 4; this.expValue = 1;
      this.colorTint = '#ff33ff'; // Magenta
      this.speed = 300;
    } else if (this.subType === 'ronin') {
      this.type = 'sword';
      this.lungeSpeed = 1300; this.chargeTimeMax = 0.9; this.lungeDuration = 0.7;
      this.scaleMult = 1.2; this.hp = this.maxHp = 6; this.expValue = 2;
      this.colorTint = '#ffaa00'; // Orange/gold
      this.speed = 300;
    } else if (this.subType === 'berserker') {
      this.type = 'fighter';
      this.lungeSpeed = 1600; this.chargeTimeMax = 0.6; this.lungeDuration = 0.5;
      this.scaleMult = 1.3; this.hp = this.maxHp = 8; this.expValue = 3;
      this.colorTint = '#ff3333'; // Deep red
      this.speed = 380;
    } else if (this.subType === 'giant') {
      this.type = 'fighter';
      this.lungeSpeed = 750; this.chargeTimeMax = 1.4; this.lungeDuration = 0.8;
      this.scaleMult = 2; this.hp = this.maxHp = 10; this.expValue = 4;
      this.colorTint = '#33ff33'; // Green
      this.speed = 160;
    } else if (this.subType === 'assassin') {
      this.type = 'sword';
      this.lungeSpeed = 2400; this.chargeTimeMax = 0.4; this.lungeDuration = 0.4;
      this.scaleMult = 0.8; this.hp = this.maxHp = 3; this.expValue = 2;
      this.colorTint = '#3388ff'; // Blue
      this.speed = 450;
    } else if (this.subType === 'musketeer') {
      this.type = 'pistol';
      this.lungeSpeed = 0; this.chargeTimeMax = 1.3; this.lungeDuration = 0.4; // Shoots projectile
      this.scaleMult = 1; this.hp = this.maxHp = 2; this.expValue = 2;
      this.colorTint = '#dddddd'; // White/Grey
      this.speed = 200;
    } else if (this.subType === 'oni_boss') {
      this.type = 'fighter';
      this.lungeSpeed = 1200; this.chargeTimeMax = 1.1; this.lungeDuration = 0.8;
      this.scaleMult = 3; this.hp = this.maxHp = 50; this.expValue = 15;
      this.colorTint = '#aa33ff'; // Purple
      this.speed = 300;
    } else { // shogun_boss
      this.type = 'sword';
      this.lungeSpeed = 1800; this.chargeTimeMax = 0.8; this.lungeDuration = 0.6;
      this.scaleMult = 2.5; this.hp = this.maxHp = 40; this.expValue = 20;
      this.colorTint = '#ffff33'; // Bright Gold
      this.speed = 300;
    }

    // Apply difficulty modifiers
    let hpMult = 1.0;
    let speedMult = 1.0;
    let chargeMult = 1.0;

    if (globals.difficulty === 'easy') {
      hpMult = 0.3;
      speedMult = 0.5;
      chargeMult = 1.8;
    } else if (globals.difficulty === 'normal') {
      hpMult = 0.5;
      speedMult = 0.7;
      chargeMult = 1.4;
    } else if (globals.difficulty === 'hard') {
      hpMult = 1.3;
      speedMult = 1.15;
      chargeMult = 0.8;
    } else if (globals.difficulty === 'insane') {
      hpMult = 3.0;
      speedMult = 1.55;
      chargeMult = 0.4;
    }

    this.hp = Math.max(1, Math.round(this.hp * hpMult));
    this.maxHp = this.hp;
    this.hpDelayed = this.hp;
    this.speed *= speedMult;
    this.lungeSpeed *= speedMult;
    this.chargeTimeMax *= chargeMult;
  }
  
  update(dt: number) {
    if (this.chillTimer > 0 && this.state !== 'dead') {
      this.chillTimer -= dt;
    }
    const effectiveDt = (this.chillTimer > 0 && this.state !== 'dead') ? dt * 0.6 : dt;

    if (this.knockbackTimer > 0 && this.state !== 'dead') {
      this.knockbackTimer -= effectiveDt;
      this.vx = this.knockbackVx;
      this.vy = this.knockbackVy;
      this.knockbackVx *= Math.exp(-6 * effectiveDt);
      this.knockbackVy *= Math.exp(-6 * effectiveDt);
      if (this.knockbackTimer <= 0) {
        this.knockbackVx = 0;
        this.knockbackVy = 0;
      }
      super.update(effectiveDt);
      return;
    }

    if (this.stunTimer > 0 && this.state !== 'dead') {
      this.stunTimer -= effectiveDt;
      this.vx = 0;
      this.vy = 0;
      this.setState('idle');
      if (Math.random() < 0.15) {
        globals.particles.push(Particle.acquire(this.x + (Math.random()-0.5)*20, this.y + (Math.random()-0.5)*40, '#00ffff', 100, 0.3, 1.5));
      }
      super.update(effectiveDt);
      return;
    }

    if (this.hpDelayed === undefined) this.hpDelayed = this.hp;
    if (this.hpDelayed > this.hp) {
      this.hpDelayed -= (this.hpDelayed - this.hp) * 5 * effectiveDt;
      if (this.hpDelayed - this.hp < 0.05) this.hpDelayed = this.hp;
    } else if (this.hpDelayed < this.hp) {
      this.hpDelayed = this.hp;
    }

    if (this.isSlashedKamisori && this.state !== 'dead') {
      this.vx = 0; this.vy = 0;
      return;
    }
    super.update(effectiveDt);
    if (this.burnTimer > 0 && this.state !== 'dead') {
      this.burnTimer -= effectiveDt;
      this.burnTickTimer -= effectiveDt;
      if (this.burnTickTimer <= 0) {
        this.burnTickTimer = 1.0;
        const totalBurnDmg = 1 + this.burnBonusDmg;
        this.hp -= totalBurnDmg;
        this.hitFlash = 0.15;
        globals.floatingTexts.push(FloatingText.acquire(this.x + (Math.random()-0.5)*20, this.y - 45, `BURN -${totalBurnDmg}`, "#ff5500", 18));
        
        for (let i = 0; i < 4; i++) {
          globals.particles.push(Particle.acquire(this.x, this.y, '#ff8800', 150, 0.3, 2));
        }
        
        if (this.hp <= 0) {
          callbacks.killEnemy(this);
          return;
        }
      }
      
      const fireSpawnChance = isMobile ? 0.08 : 0.25;
      if (Math.random() < fireSpawnChance) {
        const pSpeed = 100 + Math.random() * 150;
        globals.particles.push(Particle.acquire(
          this.x + (Math.random() - 0.5) * 20,
          this.y + (Math.random() - 0.5) * 40,
          Math.random() < 0.5 ? '#ffaa00' : '#ff4400',
          pSpeed,
          0.3 + Math.random() * 0.2,
          2 + Math.random() * 2,
          -Math.PI / 2 + (Math.random() - 0.5) * 0.8,
          -100,
          0.9
        ));
      }
    }
    if (this.hitFlash > 0) this.hitFlash -= effectiveDt;
    if (this.state === 'dead') { 
      this.vx = 0; this.vy = 0; 
      this.deadTimer += effectiveDt;
      return; 
    }
    
    let currentTarget: { x: number, y: number } = this.target;
    if (globals.gameMode === 'pvp' && pvpManager.subMode === 'insane_survival') {
      const remotePlayer = globals.enemies[0];
      const dxLocal = this.target.x - this.x;
      const dyLocal = this.target.y - this.y;
      const distToLocalSq = this.target.state !== 'dead' ? (dxLocal * dxLocal + dyLocal * dyLocal) : Infinity;
      const dxRemote = remotePlayer ? remotePlayer.x - this.x : 0;
      const dyRemote = remotePlayer ? remotePlayer.y - this.y : 0;
      const distToRemoteSq = (remotePlayer && remotePlayer.state !== 'dead') ? (dxRemote * dxRemote + dyRemote * dyRemote) : Infinity;
      if (distToRemoteSq < distToLocalSq) {
        currentTarget = remotePlayer;
      } else {
        currentTarget = this.target;
      }
    }
    
    if (globals.decoys && globals.decoys.length > 0) {
      let nearestDecoy = null;
      let minDistSq = Infinity;
      for (const decoy of globals.decoys) {
        const ddx = decoy.x - this.x;
        const ddy = decoy.y - this.y;
        const dSq = ddx * ddx + ddy * ddy;
        if (dSq < minDistSq) {
          minDistSq = dSq;
          nearestDecoy = decoy;
        }
      }
      if (nearestDecoy) {
        currentTarget = nearestDecoy;
      }
    }

    const dx = currentTarget.x - this.x; const dy = currentTarget.y - this.y;
    const distSq = dx * dx + dy * dy;
    
    if (this.state !== 'charge' && this.state !== 'attack') {
      this.dir = dx < 0 ? -1 : 1;
    }
    
    if (this.state === 'charge') {
      this.vx = 0; this.vy = 0;
      
      this.targetAngle = Math.atan2(dy, dx);
      this.dir = Math.cos(this.targetAngle) < 0 ? -1 : 1;

      if (this.stateTime > this.chargeTimeMax) {
        this.setState('attack');
        if (this.subType !== 'musketeer') {
          playSound(sfx.enemySlash, 0.3);
        }
        this.attackLanded = false;
        let curLungeSpeed = this.lungeSpeed;
        if (this.chillTimer > 0) {
          curLungeSpeed *= 0.7;
        }
        this.vx = Math.cos(this.targetAngle) * curLungeSpeed;
        this.vy = Math.sin(this.targetAngle) * curLungeSpeed;
      }
      return;
    }

    if (this.state === 'attack') {
      // Smooth deceleration over the full lunge duration
      const t = this.stateTime / this.lungeDuration;
      const decay = Math.max(0, 1 - t);
      let curLungeSpeed = this.lungeSpeed;
      if (this.chillTimer > 0) {
        curLungeSpeed *= 0.7;
      }
      this.vx = Math.cos(this.targetAngle) * curLungeSpeed * decay;
      this.vy = Math.sin(this.targetAngle) * curLungeSpeed * decay;
      
      if (!this.attackLanded) {
          if (this.subType === 'musketeer') {
            const proj = Projectile.acquire(this.x, this.y, this.targetAngle, true);
            (proj as any).shooter = this;
            globals.projectiles.push(proj);
            this.attackLanded = true;
         } else {
           const dxHit = this.target.x - this.x; const dyHit = this.target.y - this.y;
           const enemyHitRadius = (this.scaleMult - 1) * 60; 
           const threshold = 140 + enemyHitRadius;
           if (dxHit*dxHit + dyHit*dyHit < threshold * threshold) {
             this.executeAttack(); 
             this.attackLanded = true; 
           }
         }
      }
      if (this.stateTime > this.lungeDuration) { this.setState('idle'); this.attackLanded = false; }
      return;
    }
    
    let speed = this.speed, attackRange = 250 * this.scaleMult;
    if (this.subType === 'musketeer') { attackRange = 500; }

    if (this.chillTimer > 0) {
      speed *= 0.7;
    }

    if (distSq > attackRange * attackRange) {
      const dist = Math.sqrt(distSq) || 0.001;
      this.vx = (dx / dist) * speed; this.vy = (dy / dist) * speed; this.setState('walk');
    } else {
      this.vx = 0; this.vy = 0; this.setState('charge');
      this.targetAngle = Math.atan2(dy, dx);
    }
  }

  executeAttack() {
    let currentTarget: any = this.target;
    if (globals.decoys && globals.decoys.length > 0) {
      let nearestDecoy = null;
      let minDistSq = Infinity;
      for (const decoy of globals.decoys) {
        const ddx = decoy.x - this.x;
        const ddy = decoy.y - this.y;
        const dSq = ddx * ddx + ddy * ddy;
        if (dSq < minDistSq) {
          minDistSq = dSq;
          nearestDecoy = decoy;
        }
      }
      if (nearestDecoy) {
        currentTarget = nearestDecoy;
      }
    }
    
    if (currentTarget === this.target) {
      callbacks.checkPlayerHit(this);
    }
  }

  draw(ctx: CanvasRenderingContext2D, cx: number, cy: number, alpha = 1) {
    const rx = this.x - cx + globals.vw/2;
    const ry = this.y - cy + globals.vh/2;
    const buffer = 150 * this.scaleMult;
    if (rx < -buffer || rx > globals.vw + buffer || ry < -buffer || ry > globals.vh + buffer) {
      return;
    }

    if (this.state === 'charge') {
      ctx.save();
      ctx.translate(rx, ry);
      
      const p = this.stateTime / this.chargeTimeMax;
      ctx.rotate(this.targetAngle);
      
      // laser sight
      const laserLen = this.lungeSpeed * this.lungeDuration * 0.5;
      
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(laserLen, 0);
      ctx.strokeStyle = `rgba(255, 30, 30, ${p})`;
      ctx.lineWidth = (1 + p * 6) * this.scaleMult;
      ctx.setLineDash([15, 10]);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(laserLen * p, 0, 10 * this.scaleMult, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 100, 100, ${p})`;
      ctx.fill();
      
      ctx.restore();
    }
    
    // HP bar above enemy
    if (this.state !== 'dead' && this.hp < this.maxHp) {
      ctx.save();
      ctx.translate(rx, ry);
      const barW = 50 * this.scaleMult;
      const barH = 5;
      const barY = -60 * this.scaleMult;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(-barW/2, barY, barW, barH);
      
      // catchup orange bar
      ctx.fillStyle = '#ffa500';
      const delayRatio = (this.hpDelayed || this.hp) / this.maxHp;
      ctx.fillRect(-barW/2, barY, barW * delayRatio, barH);
      
      // health red bar
      ctx.fillStyle = '#ff3333';
      ctx.fillRect(-barW/2, barY, barW * (this.hp / this.maxHp), barH);
      
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.strokeRect(-barW/2, barY, barW, barH);
      ctx.restore();
    }

    let tint = this.hitFlash > 0 ? '#ffffff' : this.colorTint;
    if (this.chillTimer > 0 && this.hitFlash <= 0) {
      tint = '#00ffff';
    }
    super.draw(ctx, cx, cy, alpha, tint);

    // time stop cut marks
    if (this.isSlashedKamisori && this.state !== 'dead') {
      ctx.save();
      ctx.translate(rx, ry);
      
      let cutColor = '#ff003c';
      if (globals.flowState === 'awakened') {
        cutColor = '#c084fc';
      } else if (globals.flowState === 'storm_god') {
        cutColor = '#fbbf24';
      } else if (globals.gameMode === 'zen' && globals.timeSlowDuration > 0) {
        cutColor = '#00ffff';
      }

      // Removed shadowBlur to prevent lag
      
      const angles = this.kamisoriCutAngles || [];
      angles.forEach((angle) => {
        // themed cut lines
        ctx.strokeStyle = cutColor;
        ctx.lineWidth = 5;
        ctx.beginPath();
        const length = 45 * this.scaleMult;
        const dx = Math.cos(angle) * length;
        const dy = Math.sin(angle) * length;
        ctx.moveTo(-dx, -dy);
        ctx.lineTo(dx, dy);
        ctx.stroke();
        
        // white core highlight
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-dx, -dy);
        ctx.lineTo(dx, dy);
        ctx.stroke();
      });
      ctx.restore();
    }
  }
}
