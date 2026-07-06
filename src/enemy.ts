import { globals } from './globals';
import { callbacks } from './callbacks';
import { Entity, Particle, FloatingText, Projectile, AnimatedEffect } from './entities';
import { Player } from './player';
import { playSound, sfx } from './audio';
import { vfxAnims } from './assets';
import { pvpManager } from './pvpIaijutsuManager';

const isMobile = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

export type EnemySubType = 'brawler' | 'samurai' | 'giant' | 'assassin' | 'berserker' | 'ronin' | 'oni_boss' | 'shogun_boss' | 'musketeer' | 'pyromancer' | 'glacial_sentinel' | 'astromancer' | 'necromancer';

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
    this.lungeCos = 1;
    this.lungeSin = 0;
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
    } else if (this.subType === 'pyromancer') {
      this.type = 'fighter';
      this.lungeSpeed = 0; this.chargeTimeMax = 1.2; this.lungeDuration = 0.5;
      this.scaleMult = 1.2; this.hp = this.maxHp = 8; this.expValue = 4;
      this.colorTint = '#ff4400';
      this.speed = 180;
    } else if (this.subType === 'glacial_sentinel') {
      this.type = 'sword';
      this.lungeSpeed = 1000; this.chargeTimeMax = 1.1; this.lungeDuration = 0.7;
      this.scaleMult = 1.4; this.hp = this.maxHp = 12; this.expValue = 5;
      this.colorTint = '#60a5fa';
      this.speed = 220;
    } else if (this.subType === 'astromancer') {
      this.type = 'fighter';
      this.lungeSpeed = 0; this.chargeTimeMax = 1.0; this.lungeDuration = 0.5;
      this.scaleMult = 1.1; this.hp = this.maxHp = 6; this.expValue = 5;
      this.colorTint = '#f43f5e';
      this.speed = 250;
    } else if (this.subType === 'necromancer') {
      this.type = 'fighter';
      this.lungeSpeed = 0; this.chargeTimeMax = 1.4; this.lungeDuration = 0.6;
      this.scaleMult = 1.5; this.hp = this.maxHp = 20; this.expValue = 8;
      this.colorTint = '#a855f7';
      this.speed = 170;
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

    if (isKnockedBack) {
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
      this.dir = dx < 0 ? -1 : 1;

      if (this.stateTime > this.chargeTimeMax) {
        this.targetAngle = Math.atan2(dy, dx);
        this.lungeCos = Math.cos(this.targetAngle);
        this.lungeSin = Math.sin(this.targetAngle);
        this.setState('attack');
        if (this.subType !== 'musketeer' && this.subType !== 'pyromancer' && this.subType !== 'astromancer' && this.subType !== 'necromancer') {
          playSound(sfx.enemySlash, 0.3);
        }
        this.attackLanded = false;
        
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
        // Fire burning fireball projectile
        const proj = Projectile.acquire(this.x, this.y, this.targetAngle, true);
        (proj as any).shooter = this;
        (proj as any).colorTint = '#ff4400';
        globals.projectiles.push(proj);
        this.attackLanded = true;
      } else {
        // Fire pillar ground eruption
        const tx = currentTarget.x;
        const ty = currentTarget.y;
        
        // Spawn ground warning indicator (VFX1 is fire rune, lasts 0.6s)
        const warnEffect = new AnimatedEffect(tx, ty, vfxAnims.fireMage.vfx1, 0.6, 1.8, 0, 'fire_rune');
        globals.animatedEffects.push(warnEffect);
        
        // Spawn vertical fire column after 0.6s
        globals.delayedActions.push({
          delay: 0.6,
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
            delay: i * 0.1,
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
        const shieldFx = new AnimatedEffect(this.x, this.y, vfxAnims.frostKnight.vfx2, 1.0, 1.8, 0, 'ice_shield');
        globals.animatedEffects.push(shieldFx);
        (this as any).iceShieldActive = true;
        globals.delayedActions.push({
          delay: 1.0,
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
      const starRune = new AnimatedEffect(tx, ty, vfxAnims.starcaller.vfx1, 0.5, 1.5, 0, 'star_rune');
      globals.animatedEffects.push(starRune);
      
      globals.delayedActions.push({
        delay: 0.5,
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
        const portal = new AnimatedEffect(this.x, this.y - 40, vfxAnims.warlock.vfx1, 0.8, 2.0, 0, 'necro_portal');
        globals.animatedEffects.push(portal);
        
        globals.delayedActions.push({
          delay: 0.8,
          run: () => {
            const minion = new Enemy(this.x + (Math.random() - 0.5) * 100, this.y, this.target);
            minion.subType = 'brawler';
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
