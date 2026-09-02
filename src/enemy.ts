import { globals } from './globals';
import { callbacks } from './callbacks';
import { Entity, Particle, FloatingText, Projectile, AnimatedEffect, Shockwave } from './entities';
import { Player } from './player';
import { playSound, sfx, playSynthesizedThunder } from './audio';
import { vfxAnims } from './assets';
import { pvpManager } from './pvpIaijutsuManager';

const isMobile = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

export type EnemySubType = 'brawler' | 'samurai' | 'giant' | 'assassin' | 'berserker' | 'ronin' | 'oni_boss' | 'shogun_boss' | 'musketeer' | 'pyromancer' | 'glacial_sentinel' | 'astromancer' | 'necromancer';

export class Enemy extends Entity {
  target!: Player;
  attackLanded = false;
  chargeTimeMax = 1.6;
  attackCooldownTimer = 0;
  deadTimer = 0;
  knockbackTimer = 0;
  knockbackVx = 0;
  knockbackVy = 0;
  targetAngle = 0;
  lungeSpeed = 950;
  lungeDuration = 0.6; // how long the lunge lasts
  lungeCos = 1;
  lungeSin = 0;
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
  speed = 260;
  burstShotsFired = 0;
  burstShotTimer = 0;
  isAimLocked = false;
  posture = 0;
  maxPosture = 60;
  postureBrokenTimer = 0;
  dominoHitEnemies = new Set<Enemy>();
  airborneZ = 0;
  airborneVz = 0;
  canAerialCleave = false;
  aerialCleaveTriggered = false;

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
    this.attackCooldownTimer = 0.5 + Math.random() * 0.5;
    this.deadTimer = 0;
    this.knockbackTimer = 0;
    this.knockbackVx = 0;
    this.knockbackVy = 0;
    this.targetAngle = 0;
    this.lungeCos = 1;
    this.lungeSin = 0;
    this.burstShotsFired = 0;
    this.burstShotTimer = 0;
    this.isAimLocked = false;
    this.posture = 0;
    this.maxPosture = 60;
    this.postureBrokenTimer = 0;
    this.dominoHitEnemies.clear();
    this.airborneZ = 0;
    this.airborneVz = 0;
    this.canAerialCleave = false;
    this.aerialCleaveTriggered = false;
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
    this.speed = 260;
    this.lungeSpeed = 950;
    this.chargeTimeMax = 1.6;
    this.lungeDuration = 0.6;
    this.scaleMult = 1;
    this.expValue = 1;
    this.colorTint = '#ffffff';
    this.type = 'fighter';
    
    if (globals.gameMode === 'zen') {
      const roll = Math.random();
      if (roll < 0.30) this.subType = 'musketeer';
      else if (roll < 0.40) this.subType = 'samurai';
      else if (roll < 0.50) this.subType = 'ronin';
      else if (roll < 0.60) this.subType = 'brawler';
      else if (roll < 0.70) this.subType = 'berserker';
      else if (roll < 0.75) this.subType = 'giant';
      else if (roll < 0.80) this.subType = 'assassin';
      else if (roll < 0.85) this.subType = 'pyromancer';
      else if (roll < 0.90) this.subType = 'glacial_sentinel';
      else if (roll < 0.95) this.subType = 'astromancer';
      else if (roll < 0.97 && globals.score > 20) this.subType = 'oni_boss';
      else if (globals.score > 40) this.subType = 'shogun_boss';
      else this.subType = 'necromancer';
    } else {
      const roll = Math.random();
      if (roll < 0.15) this.subType = 'brawler';
      else if (roll < 0.30) this.subType = 'samurai';
      else if (roll < 0.40) this.subType = 'ronin';
      else if (roll < 0.50) this.subType = 'berserker';
      else if (roll < 0.58) this.subType = 'giant';
      else if (roll < 0.66) this.subType = 'assassin';
      else if (roll < 0.76) this.subType = 'musketeer';
      else if (roll < 0.82 && globals.score > 5) this.subType = 'pyromancer';
      else if (roll < 0.88 && globals.score > 8) this.subType = 'glacial_sentinel';
      else if (roll < 0.94 && globals.score > 12) this.subType = 'astromancer';
      else if (roll < 0.97 && globals.score > 18) this.subType = 'necromancer';
      else if (roll < 0.99 && globals.score > 20) this.subType = 'oni_boss';
      else if (globals.score > 40) this.subType = 'shogun_boss';
      else this.subType = 'brawler'; // Fallback
    }

    // Enforce active ranged density cap (Max 3-4 simultaneous ranged casters)
    if (this.isRanged()) {
      const activeRangedCount = globals.enemies ? globals.enemies.filter(e => e && e.state !== 'dead' && e.isRanged?.()).length : 0;
      const maxRanged = globals.difficulty === 'insane' ? 4 : 3;
      if (activeRangedCount >= maxRanged) {
        const meleePool: EnemySubType[] = ['samurai', 'ronin', 'brawler', 'berserker', 'giant'];
        this.subType = meleePool[Math.floor(Math.random() * meleePool.length)];
      }
    }
    
    this.configureSubType();

    // Desynchronize ranged attacks with random cadence offset to prevent simultaneous off-screen bullet walls
    if (this.isRanged()) {
      this.chargeTimeMax += 0.1 + Math.random() * 0.35;
    }
  }

  isRanged(): boolean {
    return this.subType === 'musketeer' || this.subType === 'pyromancer' || this.subType === 'glacial_sentinel' || this.subType === 'astromancer' || this.subType === 'necromancer';
  }

  configureSubType() {
    if (this.subType === 'brawler') {
      this.type = 'enemy01';
      this.lungeSpeed = 950; this.chargeTimeMax = 1.6; this.lungeDuration = 0.5;
      this.scaleMult = 1; this.hp = this.maxHp = 4; this.expValue = 1;
      this.colorTint = 'none';
      this.speed = 260;
      this.maxPosture = 50;
    } else if (this.subType === 'samurai') {
      this.type = 'enemy02';
      this.lungeSpeed = 900; this.chargeTimeMax = 1.8; this.lungeDuration = 0.6;
      this.scaleMult = 1.1; this.hp = this.maxHp = 4; this.expValue = 1;
      this.colorTint = 'none';
      this.speed = 260;
      this.maxPosture = 60;
    } else if (this.subType === 'ronin') {
      this.type = 'enemy03';
      this.lungeSpeed = 1000; this.chargeTimeMax = 1.8; this.lungeDuration = 0.7;
      this.scaleMult = 1.2; this.hp = this.maxHp = 6; this.expValue = 2;
      this.colorTint = 'none';
      this.speed = 260;
      this.maxPosture = 80;
    } else if (this.subType === 'berserker') {
      this.type = 'enemy02';
      this.lungeSpeed = 1300; this.chargeTimeMax = 1.3; this.lungeDuration = 0.5;
      this.scaleMult = 1.3; this.hp = this.maxHp = 8; this.expValue = 3;
      this.colorTint = 'none';
      this.speed = 320;
      this.maxPosture = 100;
    } else if (this.subType === 'giant') {
      this.type = 'enemy03';
      this.lungeSpeed = 650; this.chargeTimeMax = 2.4; this.lungeDuration = 0.8;
      this.scaleMult = 2; this.hp = this.maxHp = 10; this.expValue = 4;
      this.colorTint = 'none';
      this.speed = 150;
      this.maxPosture = 140;
    } else if (this.subType === 'assassin') {
      this.type = 'enemy01';
      this.lungeSpeed = 1500; this.chargeTimeMax = 1.0; this.lungeDuration = 0.4;
      this.scaleMult = 0.8; this.hp = this.maxHp = 3; this.expValue = 2;
      this.colorTint = 'none';
      this.speed = 360;
      this.maxPosture = 40;
    } else if (this.subType === 'musketeer') {
      this.type = 'enemy05';
      this.lungeSpeed = 0; this.chargeTimeMax = 2.2; this.lungeDuration = 0.55; // Double-shot projectile
      this.scaleMult = 1; this.hp = this.maxHp = 2; this.expValue = 2;
      this.colorTint = 'none';
      this.speed = 180;
      this.maxPosture = 45;
    } else if (this.subType === 'pyromancer') {
      this.type = 'enemy01';
      this.lungeSpeed = 0; this.chargeTimeMax = 2.2; this.lungeDuration = 0.55;
      this.scaleMult = 1.2; this.hp = this.maxHp = 8; this.expValue = 4;
      this.colorTint = '#ff4400';
      this.speed = 160;
      this.maxPosture = 70;
    } else if (this.subType === 'glacial_sentinel') {
      this.type = 'enemy02';
      this.lungeSpeed = 850; this.chargeTimeMax = 2.0; this.lungeDuration = 0.7;
      this.scaleMult = 1.4; this.hp = this.maxHp = 12; this.expValue = 5;
      this.colorTint = '#60a5fa';
      this.speed = 190;
      this.maxPosture = 110;
    } else if (this.subType === 'astromancer') {
      this.type = 'enemy01';
      this.lungeSpeed = 0; this.chargeTimeMax = 1.9; this.lungeDuration = 0.5;
      this.scaleMult = 1.1; this.hp = this.maxHp = 6; this.expValue = 5;
      this.colorTint = '#f43f5e';
      this.speed = 210;
      this.maxPosture = 60;
    } else if (this.subType === 'necromancer') {
      this.type = 'enemy05';
      this.lungeSpeed = 0; this.chargeTimeMax = 2.4; this.lungeDuration = 0.6;
      this.scaleMult = 1.5; this.hp = this.maxHp = 20; this.expValue = 8;
      this.colorTint = '#a855f7';
      this.speed = 150;
      this.maxPosture = 120;
    } else if (this.subType === 'oni_boss') {
      this.type = 'skeleton';
      this.lungeSpeed = 1000; this.chargeTimeMax = 2.0; this.lungeDuration = 0.8;
      this.scaleMult = 2.2; this.hp = this.maxHp = 120; this.expValue = 15;
      this.colorTint = 'none';
      this.speed = 260;
      this.maxPosture = 250;
    } else { // shogun_boss
      this.type = 'skeleton';
      this.lungeSpeed = 1300; this.chargeTimeMax = 1.8; this.lungeDuration = 0.6;
      this.scaleMult = 2.0; this.hp = this.maxHp = 100; this.expValue = 20;
      this.colorTint = 'none';
      this.speed = 260;
      this.maxPosture = 280;
    }

    // Apply difficulty modifiers
    let hpMult = 1.0;
    let speedMult = 1.0;
    let chargeMult = 1.0;

    if (globals.difficulty === 'easy') {
      hpMult = 0.3;
      speedMult = 0.5;
      chargeMult = 2.0;
    } else if (globals.difficulty === 'normal') {
      hpMult = 0.5;
      speedMult = 0.7;
      chargeMult = 1.6;
    } else if (globals.difficulty === 'hard') {
      hpMult = 1.3;
      speedMult = 1.15;
      chargeMult = 1.3;
    } else if (globals.difficulty === 'insane') {
      hpMult = 3.0;
      speedMult = 1.35;
      chargeMult = 1.0;
    }

    this.hp = Math.max(1, Math.round(this.hp * hpMult));
    this.maxHp = this.hp;
    this.hpDelayed = this.hp;
    this.speed *= speedMult;
    this.lungeSpeed *= speedMult;
    this.chargeTimeMax *= chargeMult;
  }
  
  update(dt: number) {
    if (this.state === 'dead') {
      const effectiveDt = (this.chillTimer > 0) ? dt * 0.6 : dt;
      if (this.chillTimer > 0) this.chillTimer -= dt;
      this.vx = 0; this.vy = 0;
      this.deadTimer += effectiveDt;
      if (this.hitFlash > 0) this.hitFlash -= effectiveDt;
      super.update(effectiveDt);
      return;
    }

    const isChilled = this.chillTimer > 0;
    const isKnockedBack = this.knockbackTimer > 0;
    const isStunned = this.stunTimer > 0;
    const isBurning = this.burnTimer > 0;

    const effectiveDt = isChilled ? dt * 0.6 : dt;

    if (isChilled) {
      this.chillTimer -= dt;
    }

    if (this.attackCooldownTimer > 0) {
      this.attackCooldownTimer -= effectiveDt;
    }

    if (isKnockedBack) {
      this.knockbackTimer -= effectiveDt;
      this.vx = this.knockbackVx;
      this.vy = this.knockbackVy;

      const kbSpeed = Math.hypot(this.knockbackVx, this.knockbackVy);
      if (kbSpeed > 450) {
        // Domino collision with other enemies
        for (let j = 0; j < globals.enemies.length; j++) {
          const other = globals.enemies[j];
          if (other === this || other.state === 'dead' || this.dominoHitEnemies.has(other)) continue;
          const edx = other.x - this.x;
          const edy = other.y - this.y;
          const colRadius = 55 * (this.scaleMult + other.scaleMult) * 0.5;
          if (edx * edx + edy * edy < colRadius * colRadius) {
            this.dominoHitEnemies.add(other);
            const colAngle = Math.atan2(this.knockbackVy, this.knockbackVx);
            other.knockbackTimer = 0.35;
            other.knockbackVx = Math.cos(colAngle) * (kbSpeed * 0.7);
            other.knockbackVy = Math.sin(colAngle) * (kbSpeed * 0.7);
            other.stunTimer = 0.6;
            callbacks.hitEnemy(other, 2);
            other.addPostureDamage(20);

            globals.screenShake = 8;
            globals.floatingTexts.push(FloatingText.acquire(other.x, other.y - 35, "DOMINO!", "#f97316", 20));
            for (let k = 0; k < 6; k++) {
              globals.particles.push(Particle.acquire(other.x, other.y, '#f97316', 220, 0.3, 2, Math.random() * Math.PI * 2));
            }
          }
        }
      }

      // Wall Splat: Crashing into outer arena boundary under high knockback
      const pDistX = Math.abs(this.x - globals.player.x);
      const pDistY = Math.abs(this.y - globals.player.y);
      const barrierLimitX = (globals.vw || 1200) * 0.72;
      const barrierLimitY = (globals.vh || 800) * 0.72;
      if (kbSpeed > 1000 && (pDistX > barrierLimitX || pDistY > barrierLimitY)) {
        this.knockbackVx = 0;
        this.knockbackVy = 0;
        this.knockbackTimer = 0;
        this.stunTimer = 1.2;
        callbacks.hitEnemy(this, 4);
        this.addPostureDamage(35);
        globals.screenShake = 16;
        globals.shockwaves.push(new Shockwave(this.x, this.y, '#f8fafc'));
        globals.floatingTexts.push(FloatingText.acquire(this.x, this.y - 50, "WALL SPLAT!", "#ef4444", 24));
        for (let k = 0; k < 12; k++) {
          globals.particles.push(Particle.acquire(this.x, this.y, '#cbd5e1', 300, 0.4, 3, Math.random() * Math.PI * 2));
        }
      }

      this.knockbackVx *= Math.exp(-6 * effectiveDt);
      this.knockbackVy *= Math.exp(-6 * effectiveDt);
      if (this.knockbackTimer <= 0) {
        this.knockbackVx = 0;
        this.knockbackVy = 0;
        this.dominoHitEnemies.clear();
      }
      super.update(effectiveDt);
      return;
    }

    // Option 3: Airborne Z-axis physics
    if (this.airborneZ > 0 || this.airborneVz !== 0) {
      this.airborneZ += this.airborneVz * effectiveDt;
      this.airborneVz -= 1800 * effectiveDt; // gravity
      if (this.airborneZ <= 0) {
        this.airborneZ = 0;
        this.airborneVz = 0;
        this.canAerialCleave = false;

        // Check if landing from Helm-Splitter Aerial Cleave
        if (this.aerialCleaveTriggered) {
          this.aerialCleaveTriggered = false;
          callbacks.hitEnemy(this, Math.max(14, Math.round((this.maxHp || 10) * 0.45)));
          globals.screenShake = Math.max(globals.screenShake, 26);
          globals.shockwaves.push(new Shockwave(this.x, this.y, '#38bdf8'));
          globals.floatingTexts.push(FloatingText.acquire(this.x, this.y - 55, "HELM SPLITTER! ⚡", "neon-#38bdf8", 32));
          playSynthesizedThunder();

          // Collateral ground shockwave knocking down surrounding enemies
          globals.enemies.forEach(other => {
            if (other === this || other.state === 'dead') return;
            const odx = other.x - this.x;
            const ody = other.y - this.y;
            if (odx * odx + ody * ody < 170 * 170) {
              callbacks.hitEnemy(other, 3);
              other.stunTimer = Math.max(other.stunTimer || 0, 1.0);
              other.knockbackTimer = 0.35;
              const oang = Math.atan2(ody, odx);
              other.knockbackVx = Math.cos(oang) * 900;
              other.knockbackVy = Math.sin(oang) * 900;
              other.vx = other.knockbackVx;
              other.vy = other.knockbackVy;
            }
          });
        }
      }
    }

    // Posture broken timer and recovery
    if (this.postureBrokenTimer > 0) {
      this.postureBrokenTimer -= effectiveDt;
      this.stunTimer = Math.max(this.stunTimer, this.postureBrokenTimer);
      this.vx = 0; this.vy = 0;
      if (this.postureBrokenTimer <= 0) {
        this.posture = 0;
      }
    } else if (this.posture > 0) {
      this.posture = Math.max(0, this.posture - 8 * effectiveDt);
    }

    if (isStunned) {
      this.stunTimer -= effectiveDt;
      this.vx = 0;
      this.vy = 0;
      this.setState('idle');
      if (globals.particles.length < 150 && Math.random() < 0.15) {
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

    if (this.isSlashedKamisori) {
      this.vx = 0; this.vy = 0;
      return;
    }

    super.update(effectiveDt);

    if (isBurning) {
      this.burnTimer -= effectiveDt;
      this.burnTickTimer -= effectiveDt;
      if (this.burnTickTimer <= 0) {
        this.burnTickTimer = 1.0;
        const totalBurnDmg = 1 + this.burnBonusDmg;
        this.hp -= totalBurnDmg;
        this.hitFlash = 0.15;
        globals.floatingTexts.push(FloatingText.acquire(this.x + (Math.random()-0.5)*20, this.y - 45, `BURN -${totalBurnDmg}`, "#ff5500", 18));
        
        if (globals.particles.length < 150) {
          for (let i = 0; i < 4; i++) {
            globals.particles.push(Particle.acquire(this.x, this.y, '#ff8800', 150, 0.3, 2));
          }
        }
        
        if (this.hp <= 0) {
          callbacks.killEnemy(this);
          return;
        }
      }
      
      const fireSpawnChance = isMobile ? 0.08 : 0.25;
      if (globals.particles.length < 150 && Math.random() < fireSpawnChance) {
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
      if (globals.decoys.length === 1) {
        currentTarget = globals.decoys[0];
      } else {
        let nearestDecoy = null;
        let minDistSq = Infinity;
        for (let i = 0; i < globals.decoys.length; i++) {
          const decoy = globals.decoys[i];
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
    }

    const dx = currentTarget.x - this.x; const dy = currentTarget.y - this.y;
    const distSq = dx * dx + dy * dy;
    
    if (this.state !== 'charge' && this.state !== 'attack') {
      this.dir = dx < 0 ? -1 : 1;
    }
    
    if (this.state === 'charge') {
      this.vx = 0; this.vy = 0;
      const chargeRatio = this.stateTime / this.chargeTimeMax;

      // Track target during first 65% of charge, then lock in aim for fair telegraph reaction!
      if (chargeRatio < 0.65) {
        this.targetAngle = Math.atan2(dy, dx);
        this.isAimLocked = false;
      } else {
        this.isAimLocked = true;
      }
      this.dir = Math.cos(this.targetAngle) < 0 ? -1 : 1;

      if (this.stateTime > this.chargeTimeMax) {
        this.lungeCos = Math.cos(this.targetAngle);
        this.lungeSin = Math.sin(this.targetAngle);
        this.setState('attack');
        this.attackLanded = false;
        this.burstShotsFired = 0;
        this.burstShotTimer = 0;

        if (this.subType !== 'musketeer' && this.subType !== 'pyromancer' && this.subType !== 'astromancer' && this.subType !== 'necromancer') {
          playSound(sfx.enemySlash, 0.3);
        }

        // Trigger custom spells
        this.triggerCustomSpellCast(currentTarget);

        let curLungeSpeed = this.lungeSpeed;
        if (this.chillTimer > 0) {
          curLungeSpeed *= 0.7;
        }
        this.vx = this.lungeCos * curLungeSpeed;
        this.vy = this.lungeSin * curLungeSpeed;
      }
      return;
    }

    if (this.state === 'attack') {
      const t = this.stateTime / this.lungeDuration;
      const decay = Math.max(0, 1 - t);
      let curLungeSpeed = this.lungeSpeed;
      if (this.chillTimer > 0) {
        curLungeSpeed *= 0.7;
      }
      this.vx = this.lungeCos * curLungeSpeed * decay;
      this.vy = this.lungeSin * curLungeSpeed * decay;

      if (this.subType === 'musketeer') {
        this.burstShotTimer += effectiveDt;
        // First shot fires at 0.05s
        if (this.burstShotsFired === 0 && this.stateTime >= 0.05) {
          const proj1 = Projectile.acquire(this.x, this.y, this.targetAngle, true);
          (proj1 as any).shooter = this;
          globals.projectiles.push(proj1);
          this.burstShotsFired = 1;
          playSound(sfx.enemySlash, 0.25);
        }
        // Second shot fires 0.18s later in rapid succession!
        else if (this.burstShotsFired === 1 && this.burstShotTimer >= 0.18) {
          const proj2 = Projectile.acquire(this.x, this.y, this.targetAngle, true);
          (proj2 as any).shooter = this;
          globals.projectiles.push(proj2);
          this.burstShotsFired = 2;
          this.attackLanded = true;
          playSound(sfx.enemySlash, 0.25);
        }
      } else if (!this.attackLanded) {
        const dxHit = this.target.x - this.x; const dyHit = this.target.y - this.y;
        const enemyHitRadius = (this.scaleMult - 1) * 60; 
        const threshold = 140 + enemyHitRadius;
        if (dxHit*dxHit + dyHit*dyHit < threshold * threshold) {
          this.executeAttack(); 
          this.attackLanded = true; 
        }
      }
      if (this.stateTime > this.lungeDuration) {
        this.setState('idle');
        this.attackLanded = false;
        this.burstShotsFired = 0;
        this.burstShotTimer = 0;
        this.isAimLocked = false;
        this.attackCooldownTimer = 1.0 + Math.random() * 0.6;
      }
      return;
    }
    
    let speed = this.speed, attackRange = 250 * this.scaleMult;
    if (this.subType === 'musketeer') { attackRange = 500; }
    else if (this.subType === 'pyromancer') { attackRange = 450; }
    else if (this.subType === 'glacial_sentinel') { attackRange = 200; }
    else if (this.subType === 'astromancer') { attackRange = 600; }
    else if (this.subType === 'necromancer') { attackRange = 500; }

    if (this.chillTimer > 0) {
      speed *= 0.7;
    }

    // Teleport logic for Astromancer when player gets too close
    if (this.subType === 'astromancer' && distSq < 220 * 220 && this.state !== 'charge' && this.state !== 'attack' && Math.random() < 0.05) {
      const tpAngle = Math.random() * Math.PI * 2;
      const tpDist = 400 + Math.random() * 150;
      const targetX = this.x + Math.cos(tpAngle) * tpDist;
      const targetY = this.y + Math.sin(tpAngle) * tpDist;
      
      const tpOut = new AnimatedEffect(this.x, this.y, vfxAnims.starcaller.vfx1, 0.4, 1.5);
      globals.animatedEffects.push(tpOut);
      
      this.x = targetX;
      this.y = targetY;
      
      const tpIn = new AnimatedEffect(this.x, this.y, vfxAnims.starcaller.vfx1, 0.4, 1.5);
      globals.animatedEffects.push(tpIn);
      this.vx = 0; this.vy = 0;
      return;
    }

    if (distSq > attackRange * attackRange || this.attackCooldownTimer > 0) {
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
      if (globals.decoys.length === 1) {
        currentTarget = globals.decoys[0];
      } else {
        let nearestDecoy = null;
        let minDistSq = Infinity;
        for (let i = 0; i < globals.decoys.length; i++) {
          const decoy = globals.decoys[i];
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
    }
    if (currentTarget === this.target) {
      callbacks.checkPlayerHit(this);
    }
  }

  triggerCustomSpellCast(currentTarget: any) {
    if (this.subType === 'pyromancer') {
      if (Math.random() < 0.4) {
        // Fire burning fireball projectile (burst of 2 in a row!)
        const proj = Projectile.acquire(this.x, this.y, this.targetAngle, true);
        (proj as any).shooter = this;
        (proj as any).colorTint = '#ff4400';
        globals.projectiles.push(proj);

        globals.delayedActions.push({
          delay: 0.18,
          run: () => {
            if (this.state !== 'dead') {
              const proj2 = Projectile.acquire(this.x, this.y, this.targetAngle, true);
              (proj2 as any).shooter = this;
              (proj2 as any).colorTint = '#ff4400';
              globals.projectiles.push(proj2);
            }
          }
        });
        this.attackLanded = true;
      } else {
        // Fire pillar ground eruption
        const tx = currentTarget.x;
        const ty = currentTarget.y;
        
        // Spawn ground warning indicator (VFX1 is fire rune, lasts 1.1s)
        const warnEffect = new AnimatedEffect(tx, ty, vfxAnims.fireMage.vfx1, 1.1, 1.8, 0, 'fire_rune');
        globals.animatedEffects.push(warnEffect);
        
        // Spawn vertical fire column after 1.1s
        globals.delayedActions.push({
          delay: 1.1,
          run: () => {
            const firePillar = new AnimatedEffect(tx, ty, vfxAnims.fireMage.vfx2, 0.8, 2.0, 0, 'fire_pillar');
            globals.animatedEffects.push(firePillar);
            
            // Check if player is near
            const pdx = globals.player.x - tx;
            const pdy = globals.player.y - ty;
            const dist = Math.hypot(pdx, pdy);
            if (dist < 120 && globals.player.state !== 'dead') {
              callbacks.checkPlayerHit(this, 2); // 2 damage
            }
          }
        });
        this.attackLanded = true;
      }
    } else if (this.subType === 'glacial_sentinel') {
      if (Math.random() < 0.45) {
        // Ice spikes wave
        const startX = this.x;
        const startY = this.y;
        const dirX = Math.cos(this.targetAngle);
        const dirY = Math.sin(this.targetAngle);
        
        for (let i = 1; i <= 4; i++) {
          const stepDist = i * 85;
          const ix = startX + dirX * stepDist;
          const iy = startY + dirY * stepDist;
          
          globals.delayedActions.push({
            delay: i * 0.18,
            run: () => {
              const spike = new AnimatedEffect(ix, iy, vfxAnims.frostKnight.vfx3, 0.6, 1.5, 0, 'ice_spike');
              globals.animatedEffects.push(spike);
              
              // Deal slow and minor damage
              const pdx = globals.player.x - ix;
              const pdy = globals.player.y - iy;
              if (Math.hypot(pdx, pdy) < 70 && globals.player.state !== 'dead') {
                globals.player.chillTimer = 3.0; // Chill player
                callbacks.checkPlayerHit(this, 1);
              }
            }
          });
        }
        this.attackLanded = true;
      } else {
        // Temporary Ice Shield + standard lunge
        const shieldFx = new AnimatedEffect(this.x, this.y, vfxAnims.frostKnight.vfx2, 1.2, 1.8, 0, 'ice_shield');
        globals.animatedEffects.push(shieldFx);
        (this as any).iceShieldActive = true;
        globals.delayedActions.push({
          delay: 1.2,
          run: () => {
            (this as any).iceShieldActive = false;
          }
        });
      }
    } else if (this.subType === 'astromancer') {
      // Meteor drops from sky
      const tx = currentTarget.x;
      const ty = currentTarget.y;
      
      // Spawn star rune warning
      const starRune = new AnimatedEffect(tx, ty, vfxAnims.starcaller.vfx1, 1.0, 1.5, 0, 'star_rune');
      globals.animatedEffects.push(starRune);
      
      globals.delayedActions.push({
        delay: 1.0,
        run: () => {
          // Fall meteor (VFX3 is constellation/blast)
          const blast = new AnimatedEffect(tx, ty, vfxAnims.starcaller.vfx3, 0.7, 1.6, 0, 'meteor_blast');
          globals.animatedEffects.push(blast);
          
          const pdx = globals.player.x - tx;
          const pdy = globals.player.y - ty;
          if (Math.hypot(pdx, pdy) < 100 && globals.player.state !== 'dead') {
            callbacks.checkPlayerHit(this, 2);
          }
        }
      });
      this.attackLanded = true;
    } else if (this.subType === 'necromancer') {
      // Necromancer summons skeleton minions or fires tracking void skulls
      if (Math.random() < 0.5 && globals.enemies.length < 15) {
        // Portal effect
        const portal = new AnimatedEffect(this.x, this.y - 40, vfxAnims.warlock.vfx1, 1.2, 2.0, 0, 'necro_portal');
        globals.animatedEffects.push(portal);
        
        globals.delayedActions.push({
          delay: 1.2,
          run: () => {
            const minion = new Enemy(this.x + (Math.random() - 0.5) * 100, this.y, this.target);
            minion.subType = 'brawler';
            minion.configureSubType();
            minion.hp = minion.maxHp = 3;
            minion.colorTint = '#a855f7'; // Purple tainted
            globals.enemies.push(minion);
          }
        });
      } else {
        // Homing Shadow Skull projectile
        const skullProj = Projectile.acquire(this.x, this.y - 20, this.targetAngle, true);
        (skullProj as any).shooter = this;
        (skullProj as any).isHoming = true;
        (skullProj as any).colorTint = '#a855f7';
        globals.projectiles.push(skullProj);
      }
      this.attackLanded = true;
    }
  }

  addPostureDamage(amount: number) {
    if (this.state === 'dead' || this.postureBrokenTimer > 0) return;
    this.posture += amount;
    if (this.posture >= this.maxPosture) {
      this.posture = this.maxPosture;
      this.postureBrokenTimer = 2.5;
      this.stunTimer = 2.5;
      this.vx = 0; this.vy = 0;
      globals.screenShake = 14;
      globals.shockwaves.push(new Shockwave(this.x, this.y, '#f59e0b'));
      globals.floatingTexts.push(FloatingText.acquire(this.x, this.y - 65, "STANCE BROKEN!", "#f59e0b", 22));
      playSound(sfx.enemySlash, 0.4);
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

      const p = Math.min(1, this.stateTime / this.chargeTimeMax);
      ctx.rotate(this.targetAngle);

      const isRanged = (this.subType === 'musketeer' || this.subType === 'pyromancer' || this.subType === 'astromancer' || this.subType === 'necromancer');
      const laserLen = isRanged ? 520 * this.scaleMult : Math.max(180, (this.lungeSpeed * this.lungeDuration * 0.5 + 120) * this.scaleMult);

      if (isRanged) {
        // Precision laser sight with target reticle
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(laserLen, 0);
        if (this.isAimLocked) {
          // Locked aim - solid bright glowing red warning
          ctx.strokeStyle = `rgba(255, 40, 40, 0.95)`;
          ctx.lineWidth = 3 * this.scaleMult;
          ctx.setLineDash([]);
        } else {
          // Tracking aim - pulsing dashed red laser
          ctx.strokeStyle = `rgba(255, 60, 60, ${0.3 + p * 0.5})`;
          ctx.lineWidth = (1.5 + p * 2) * this.scaleMult;
          ctx.setLineDash([12, 8]);
        }
        ctx.stroke();

        // Reticle / target dot at the end
        ctx.beginPath();
        ctx.arc(laserLen, 0, (this.isAimLocked ? 7 : 4 + p * 3) * this.scaleMult, 0, Math.PI * 2);
        ctx.fillStyle = this.isAimLocked ? '#ff0000' : `rgba(255, 80, 80, ${0.5 + p * 0.5})`;
        ctx.fill();

        // Lock-on ring when locked
        if (this.isAimLocked) {
          ctx.beginPath();
          ctx.arc(laserLen, 0, 12 * this.scaleMult, 0, Math.PI * 2);
          ctx.strokeStyle = '#ff0000';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      } else {
        // Melee lunge corridor & hitbox telegraph
        const halfWidth = (22 + (this.scaleMult - 1) * 20);

        // Translucent danger corridor fill
        ctx.fillStyle = this.isAimLocked ? `rgba(255, 30, 30, ${0.15 + p * 0.15})` : `rgba(255, 60, 60, ${0.08 + p * 0.12})`;
        ctx.fillRect(0, -halfWidth, laserLen, halfWidth * 2);

        // Boundary strokes
        ctx.strokeStyle = this.isAimLocked ? `rgba(255, 50, 50, 0.9)` : `rgba(255, 80, 80, ${0.3 + p * 0.4})`;
        ctx.lineWidth = this.isAimLocked ? 2 : 1;
        ctx.setLineDash(this.isAimLocked ? [] : [10, 8]);
        ctx.strokeRect(0, -halfWidth, laserLen, halfWidth * 2);

        // Progress charge bar advancing down the corridor
        ctx.fillStyle = `rgba(255, 50, 50, ${0.3 + p * 0.5})`;
        ctx.fillRect(0, -halfWidth, laserLen * p, halfWidth * 2);

        // Direction arrow at front
        ctx.beginPath();
        ctx.moveTo(laserLen, 0);
        ctx.lineTo(laserLen - 12, -halfWidth * 0.6);
        ctx.lineTo(laserLen - 12, halfWidth * 0.6);
        ctx.closePath();
        ctx.fillStyle = this.isAimLocked ? '#ff2222' : `rgba(255, 80, 80, ${p})`;
        ctx.fill();
      }

      ctx.restore();
    }

    // HP bar above enemy
    if (this.state !== 'dead' && this.hp < this.maxHp) {
      const barW = 50 * this.scaleMult;
      const barH = 5;
      const barY = ry - 60 * this.scaleMult;
      const barX = rx - barW / 2;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(barX, barY, barW, barH);

      // catchup orange bar
      ctx.fillStyle = '#ffa500';
      const delayRatio = (this.hpDelayed || this.hp) / this.maxHp;
      ctx.fillRect(barX, barY, barW * delayRatio, barH);

      // health red bar
      ctx.fillStyle = '#ff3333';
      ctx.fillRect(barX, barY, barW * (this.hp / this.maxHp), barH);

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, barH);
    }

    // Posture bar directly under HP bar (for bosses, elites, or when posture > 0)
    if (this.state !== 'dead' && (this.posture > 0 || this.postureBrokenTimer > 0 || this.subType === 'oni_boss' || this.subType === 'shogun_boss' || this.subType === 'giant' || this.subType === 'berserker')) {
      const barW = (this.subType === 'oni_boss' || this.subType === 'shogun_boss' ? 70 : 45) * this.scaleMult;
      const barH = 3.5;
      const barY = ry - 53 * this.scaleMult;
      const barX = rx - barW / 2;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(barX, barY, barW, barH);

      if (this.postureBrokenTimer > 0) {
        // Posture Broken / Stance Broken: Flashing bright red/gold!
        const flashColor = (Math.floor(Date.now() / 120) % 2 === 0) ? '#ff003c' : '#fbbf24';
        ctx.fillStyle = flashColor;
        ctx.fillRect(barX, barY, barW, barH);

        // Render glowing [EXECUTE] prompt over enemy head!
        ctx.font = 'bold 11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = flashColor;
        ctx.fillText('[EXECUTE]', rx, barY - 8);
      } else {
        // Building posture: Amber / Orange fill
        const postureRatio = Math.min(1, this.posture / this.maxPosture);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(barX, barY, barW * postureRatio, barH);
      }

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(barX, barY, barW, barH);
    }

    if (this.airborneZ > 0) {
      ctx.save();
      const shadowScale = Math.max(0.3, 1.0 - this.airborneZ / 250);
      ctx.fillStyle = `rgba(0, 0, 0, ${0.45 * shadowScale})`;
      ctx.beginPath();
      ctx.ellipse(rx, ry, 22 * this.scaleMult * shadowScale, 8 * this.scaleMult * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    let tint = this.hitFlash > 0 ? '#ffffff' : this.colorTint;
    if (this.chillTimer > 0 && this.hitFlash <= 0) {
      tint = '#00ffff';
    }

    if (this.airborneZ > 0) {
      this.y -= this.airborneZ;
      super.draw(ctx, cx, cy, alpha, tint);
      this.y += this.airborneZ;
    } else {
      super.draw(ctx, cx, cy, alpha, tint);
    }

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
