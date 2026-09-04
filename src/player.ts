import { globals } from './globals';
import { callbacks } from './callbacks';
import {
  Entity,
  Afterimage,
  Particle,
  FloatingText,
  Shockwave,
  Projectile,
  Slash
} from './entities';
import { playSound, sfx } from './audio';
import { pvpManager } from './pvpIaijutsuManager';

const isMobile = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

export class Player extends Entity {
  dashCooldown = 0;
  attackCooldown = 0;
  chargeTimer = 0;
  dashStartX = 0;
  dashStartY = 0;
  sakuraSpawnTimer = 0;
  overloadHitEnemies = new Set<any>();
  lastAfterimageX = 0;
  lastAfterimageY = 0;
  
  // PvP Properties
  isPvpRemote = false;
  pvpParryActiveTimer = 0;
  pvpParryCooldownTimer = 0;

  // Visual scale transition fields for smooth animations
  shieldVisualScale = 0;
  firewheelVisualScale = 0;
  auraVisualScale = 0;
  airborneZ = 0;
  airborneVz = 0;

  constructor() {
    super();
    this.updateHeroType();
    this.subType = 'player';
  }

  updateHeroType() {
    if (globals.selectedHero === 'luneblade') {
      this.type = 'heroluneblade';
    } else if (globals.selectedHero === 'ninja') {
      this.type = 'heroninja';
    } else {
      this.type = 'sword';
    }
  }
  
  setState(newState: string) {
    if (this.state !== newState) {
      if (newState !== 'charge') {
        this.chargeTimer = 0;
      }
      super.setState(newState);
    }
  }
  
  update(dt: number) {
    this.updateHeroType();
    // Stance/Skill visual scale transitions
    const targetShield = (!this.isPvpRemote && globals.selectedSkill === 'shield' && globals.enhanceActiveTimer > 0) ? 1 : 0;
    this.shieldVisualScale += (targetShield - this.shieldVisualScale) * Math.min(1, 12 * dt);

    const targetFirewheel = (!this.isPvpRemote && globals.selectedSkill === 'firewheel' && globals.enhanceActiveTimer > 0) ? 1 : 0;
    this.firewheelVisualScale += (targetFirewheel - this.firewheelVisualScale) * Math.min(1, 12 * dt);

    const targetAura = (!this.isPvpRemote && ((globals.flowState as string) === 'awakened' || (globals.flowState as string) === 'storm_god' || globals.enhanceActiveTimer > 0)) ? 1 : 0;
    this.auraVisualScale += (targetAura - this.auraVisualScale) * Math.min(1, 12 * dt);

    // Option 3: Airborne Z-axis physics
    if (this.airborneZ > 0 || this.airborneVz !== 0) {
      this.airborneZ += this.airborneVz * dt;
      this.airborneVz -= 1800 * dt;
      if (this.airborneZ <= 0) {
        this.airborneZ = 0;
        this.airborneVz = 0;
      }
      this.yOffset = -this.airborneZ;
    } else {
      this.yOffset = 0;
    }

    if ((globals.gameMode as string) === 'pvp') {
      if (pvpManager.subMode === 'insane_survival') {
        if (this.isPvpRemote) {
          // Dynamic smooth interpolation (lerp) for remote player movement to prevent stutter
          const dx = pvpManager.remoteState.x - this.x;
          const dy = pvpManager.remoteState.y - this.y;
          const distSq = dx * dx + dy * dy;
          if (distSq > 400 * 400) {
            // Snap if teleported or too far to prevent rubber-banding
            this.x = pvpManager.remoteState.x;
            this.y = pvpManager.remoteState.y;
          } else {
            const t = Math.min(1, 0.25 * 60 * dt);
            this.x += dx * t;
            this.y += dy * t;
          }
          this.dir = pvpManager.remoteState.dir || 1;
          this.setState(pvpManager.remoteState.state || 'idle');
          this.chargeTimer = pvpManager.remoteState.chargeProgress;
          super.update(dt);
          return;
        }
        // Local player in survival mode: Let it fall through to run normal single-player logic!
      } else {
        // Classic PvP static position locking based on role and screen boundaries
        if (pvpManager.role === 'host') {
          if (this.isPvpRemote) {
            this.x = 1100;
            this.y = 350;
            this.dir = -1; // Face Left
          } else {
            this.x = 300;
            this.y = 350;
            this.dir = 1; // Face Right
          }
        } else { // client
          if (this.isPvpRemote) {
            this.x = 300;
            this.y = 350;
            this.dir = 1; // Face Right
          } else {
            this.x = 1100;
            this.y = 350;
            this.dir = -1; // Face Left
          }
        }

        this.vx = 0;
        this.vy = 0;

        if (this.isPvpRemote) {
          // Opponent stickman updates animations/states driven by network packets
          if (this.state === 'attack') {
            if (this.stateTime > 0.25) {
              this.setState('idle');
            }
          } else {
            this.state = pvpManager.remoteState.isParrying ? 'charge' : (pvpManager.remoteState.isStaggered ? 'dead' : 'idle');
          }
          this.chargeTimer = pvpManager.remoteState.chargeProgress;
          super.update(dt);
          return;
        }

        // Local player timers for Classic PvP
        if (this.state !== 'dead') {
          if (this.pvpParryActiveTimer > 0) {
            this.pvpParryActiveTimer -= dt;
            if (this.pvpParryActiveTimer <= 0) {
              this.setState('idle');
              this.pvpParryCooldownTimer = 0.3; // Missed, trigger lockout
              import('./pvpLobby').then(({ showParryLockout }) => showParryLockout(true));
            }
          }

          if (this.pvpParryCooldownTimer > 0) {
            this.pvpParryCooldownTimer -= dt;
            if (this.pvpParryCooldownTimer <= 0) {
              import('./pvpLobby').then(({ showParryLockout }) => showParryLockout(false));
            }
          }

          // Reset attack state to idle after cooldown in PvP mode
          if (this.state === 'attack' && this.stateTime > 0.25) {
            this.setState('idle');
          }
        }

        super.update(dt);

        // Send local state packet to remote peer
        pvpManager.sendState({
          x: this.x,
          y: this.y,
          state: this.state,
          dir: this.dir,
          chargeProgress: this.chargeTimer,
          isParrying: this.state === 'charge',
          isStaggered: this.state === 'dead',
          staggerTimer: 0,
          isParryCooldown: this.pvpParryCooldownTimer > 0
        });
        return;
      }
    }

    super.update(dt);
    globals.playerPosHistory.push({ x: this.x, y: this.y, state: this.state, animFrame: this.animFrame, dir: this.dir });
    if (globals.playerPosHistory.length > 100) {
      globals.playerPosHistory.shift();
    }
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    // Ambient particle updates (relocated from draw for purity and performance)
    if (this.state !== 'dead') {
      if ((globals.flowState as string) === 'awakened' || (globals.flowState as string) === 'storm_god' || globals.enhanceActiveTimer > 0) {
        if (Math.random() > 0.72) {
          let pColor = '#ff6600';
          if ((globals.flowState as string) === 'awakened') pColor = '#c084fc';
          else if ((globals.flowState as string) === 'storm_god') pColor = '#fbbf24';
          globals.particles.push(Particle.acquire(this.x + (Math.random()-0.5)*50, this.y + (Math.random()-0.5)*50, pColor, 80, 0.6, 2));
        }
      }
      if (this.state === 'charge') {
        if (Math.random() > 0.3) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 140 + Math.random() * 60;
          const px = this.x + Math.cos(angle) * dist;
          const py = this.y + Math.sin(angle) * dist;
          let p = Particle.acquire(px, py, Math.random() > 0.5 ? '#00ffff' : '#ffd700', dist / 0.4, 0.4, 2 + Math.random() * 2, angle + Math.PI, 0, 0.98);
          globals.particles.push(p);
        }
      }
    }

    if (this.state === 'dash') {
      if (globals.playerStats.sakuraBlizzardLevel && globals.playerStats.sakuraBlizzardLevel > 0) {
        this.sakuraSpawnTimer += dt;
        if (this.sakuraSpawnTimer >= 0.04) {
          this.sakuraSpawnTimer = 0;
          globals.sakuraPetals.push({
            x: this.x,
            y: this.y,
            radius: 40,
            life: 8.0
          });
        }
      }
      if (Math.random() > 0.4) {
        const size = 15 + Math.random() * 20;
        const life = 0.4 + Math.random() * 0.3;
        globals.particles.push(Particle.acquire(
          this.x + (Math.random() - 0.5) * 20,
          this.y + (Math.random() - 0.5) * 20,
          `rgba(35, 35, 40, 0.45)`,
          80,
          life,
          size
        ));
      }
    }

    // Dash cancel / Dash trigger
    if (this.state !== 'dead' && this.state !== 'dash') {
      if ((globals.keys[globals.keyMaps.dash] || globals.mobileDashJustPressed) && this.dashCooldown <= 0) {
        globals.mobileDashJustPressed = false;
        globals.mobileDashAimActive = false;
        this.setState('dash');
        playSound(sfx.dash, 0.015);
        this.chargeTimer = 0;
        this.dashStartX = this.x;
        this.dashStartY = this.y;
        this.lastAfterimageX = this.x;
        this.lastAfterimageY = this.y;
        
        // Reset attack cooldown on dash so combos trigger instantly and reliably!
        this.attackCooldown = 0;

        if ((globals.flowState as string) === 'awakened' || (globals.flowState as string) === 'storm_god') {
          this.dashCooldown = 0.2;
        } else {
          this.dashCooldown = Math.max(0.72, globals.playerStats.dashCooldownBase);
        }
        
        this.overloadHitEnemies.clear();

        // Check for Perfect Dodge on dash initiation near attacking enemies
        let perfectDodgeTriggered = false;
        for (const e of globals.enemies) {
          if (e.state === 'dead') continue;
          const dx = e.x - this.x;
          const dy = e.y - this.y;
          if (dx * dx + dy * dy < 102400) { // 320^2 squared distance check
            const isEnemyAttacking = e.state === 'attack' || (e.state === 'charge' && e.stateTime > e.chargeTimeMax - 0.2);
            if (isEnemyAttacking) {
              perfectDodgeTriggered = true;
              break;
            }
          }
        }

        if (perfectDodgeTriggered) {
          globals.runStats.perfectDodges++;
          callbacks.playSynthesizedDodge();
          globals.screenShake = 30;
          callbacks.addFlow(6.0);
          callbacks.addCombo();
          callbacks.addCombo();
          globals.invulnTimer = 1.6; // generous i-frames
          globals.invertScreenTimer = 0.25;
          globals.floatingTexts.push(FloatingText.acquire(this.x, this.y - 70, callbacks.t('dodgeText'), "neon-#00ffff", 30));
          globals.shockwaves.push(new Shockwave(this.x, this.y, '#ffd700'));
          
          const speedlines = document.getElementById('speedlines-overlay');
          if (speedlines) {
            speedlines.classList.add('active');
            setTimeout(() => { speedlines.classList.remove('active'); }, 250);
          }

          callbacks.triggerFlowingCounterReset?.();

          if (globals.activeFusions.has('hundred_phantoms')) {
            globals.decoys.push({
              x: this.x,
              y: this.y,
              life: 3.5,
              maxLife: 3.5,
              dir: -this.dir,
              animFrame: this.animFrame
            });
            globals.slashes.push(Slash.acquire(
              this.x,
              this.y,
              this.dir === 1 ? Math.PI : 0,
              2.2,
              true,
              '#a855f7'
            ));
            globals.shockwaves.push(new Shockwave(this.x, this.y, '#a855f7'));
            globals.floatingTexts.push(FloatingText.acquire(this.x, this.y - 100, globals.currentLang === 'ja' ? '百影・交差反撃！' : 'PHANTOM SCISSOR CUT!', '#a855f7', 28));
          }
        }
        let angle: number;
        if (globals.useMobileDashAimAngle || (globals.mobileDashAimActive && (globals.flowState === 'awakened' || globals.flowState === 'storm_god'))) {
          angle = globals.mobileDashAimAngle;
          globals.useMobileDashAimAngle = false;
        } else {
          angle = this.dir === 1 ? 0 : Math.PI;
          if (this.vx !== 0 || this.vy !== 0) { angle = Math.atan2(this.vy, this.vx); }
          else if (!globals.joystickActive) { angle = Math.atan2(globals.mouse.y - globals.height/2, globals.mouse.x - globals.width/2); }
        }
        
        // Check for Vortex Shatter (Iaijutsu -> Dash)
        const now = performance.now();
        if (now - globals.lastIaijutsuFireTime < 350) {
          let angleDiff = Math.abs(angle - globals.lastIaijutsuAngle);
          if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
          if (angleDiff < Math.PI / 4) {
            const proj = globals.projectiles.find((p: any) => !p.isEnemy && (p.isHuge || p.enhancedType !== '') && p.life > 1.3);
            if (proj) {
              if ((callbacks as any).triggerVortexShatter) {
                (callbacks as any).triggerVortexShatter(proj.x, proj.y);
              }
              const idx = globals.projectiles.indexOf(proj);
              if (idx !== -1) {
                globals.projectiles.splice(idx, 1);
                Projectile.release(proj);
              }
            }
          }
        }
        
        if ((globals.flowState as string) === 'storm_god') {
          const startX = this.x;
          const startY = this.y;
          const targetX = this.x + Math.cos(angle) * 450;
          const targetY = this.y + Math.sin(angle) * 450;
          
          (callbacks as any).triggerStormGodLightning?.(this.x, this.y);

          // Magnetize EXP gems along the teleport path
          if (globals.collectibles) {
            globals.collectibles.forEach(c => {
              if (c.type === 'exp') {
                const abx = targetX - startX;
                const aby = targetY - startY;
                const acx = c.x - startX;
                const acy = c.y - startY;
                const ab2 = abx * abx + aby * aby;
                if (ab2 > 0) {
                  const t = Math.max(0, Math.min(1, (acx * abx + acy * aby) / ab2));
                  const projX = startX + t * abx;
                  const projY = startY + t * aby;
                  const dist = Math.hypot(c.x - projX, c.y - projY);
                  if (dist < 200) {
                    c.x = targetX + (Math.random() - 0.5) * 10;
                    c.y = targetY + (Math.random() - 0.5) * 10;
                    c.vx = (targetX - c.x) * 5;
                    c.vy = (targetY - c.y) * 5;
                  }
                }
              }
            });
          }

          // Interpolated afterimages along the teleport path for visuals
          for (let i = 1; i <= 5; i++) {
            const ratio = i / 6;
            const interpX = this.x + (targetX - this.x) * ratio;
            const interpY = this.y + (targetY - this.y) * ratio;
            
            const originalX = this.x;
            const originalY = this.y;
            this.x = interpX;
            this.y = interpY;
            
            const afterimg = Afterimage.acquire(this, '#fbbf24');
            afterimg.life = 0.35 - ratio * 0.1;
            afterimg.maxLife = 0.35;
            globals.afterimages.push(afterimg);
            
            this.x = originalX;
            this.y = originalY;
          }
          
          this.x = targetX;
          this.y = targetY;
          (callbacks as any).triggerStormGodLightning?.(this.x, this.y);
          
          this.vx = 0;
          this.vy = 0;
        } else {
          this.vx = Math.cos(angle) * 2200; this.vy = Math.sin(angle) * 2200;
        }

        // Optimized Dash Visuals
        globals.screenShake = globals.flowState === 'storm_god' ? 18 : 10;
        const trailColor = globals.flowState === 'storm_god' ? '#fbbf24' : '#00ffff';
        for(let i=0; i<12; i++) {
          globals.particles.push(Particle.acquire(this.x, this.y, trailColor, 400, 0.3, 2));
        }
        globals.floatingTexts.push(FloatingText.acquire(this.x, this.y - 40, callbacks.t('dashText'), trailColor, 18));
        
        // Register dash radial wind force
        globals.windForces.push({
          x: this.x,
          y: this.y,
          radius: 260,
          strength: 1.6,
          life: 0.25,
          maxLife: 0.25
        });
      }
    }

    const isAttackHeld = globals.mouse.down || globals.mobileAttackDown;

    if (this.state !== 'dash' && this.state !== 'attack' && this.state !== 'dead') {
      if (isAttackHeld && this.attackCooldown <= 0) {
        this.chargeTimer += dt * (globals.playerStats.iaijutsuChargeSpeed || 1.0);
        if (this.chargeTimer > 0.3) {
          this.setState('charge');
          this.vx = 0; this.vy = 0; // stop moving while charging
        }
      } else {
        if (this.state !== 'charge') {
          this.chargeTimer = 0;
        }
      }

      if (this.state !== 'charge') {
        let speed = 400 * globals.playerStats.moveSpeedMult;
        if (globals.selectedSkill === 'shield' && globals.enhanceActiveTimer > 0) speed *= 1.4;
        if (globals.decoyInvisibilityTimer > 0) speed *= 1.5;
        if ((globals.flowState as string) === 'awakened') speed *= 1.5;

        this.vx = 0; this.vy = 0;
        
        if (globals.keys[globals.keyMaps.moveUp]) this.vy = -speed;
        if (globals.keys[globals.keyMaps.moveDown]) this.vy = speed;
        if (globals.keys[globals.keyMaps.moveLeft]) this.vx = -speed;
        if (globals.keys[globals.keyMaps.moveRight]) this.vx = speed;
        
        if (globals.joystickActive) { this.vx = globals.joystickVector.x * speed; this.vy = globals.joystickVector.y * speed; }

        if (this.vx !== 0 || this.vy !== 0) {
          this.setState('walk');
          const len = Math.hypot(this.vx, this.vy);
          this.vx = (this.vx / len) * speed; this.vy = (this.vy / len) * speed;
        } else {
          this.setState('idle');
        }
      }

      if (globals.joystickActive && (this.vx !== 0 || this.vy !== 0)) {
        this.dir = this.vx < 0 ? -1 : 1;
      } else if (!globals.joystickActive) {
        const screenX = globals.width / 2;
        if (globals.mouse.x < screenX) this.dir = -1; else this.dir = 1;
      }
    }

    if (this.state === 'dash') {
      // Offensive Dash: Damage enemies (only damage once per enemy per dash)
      globals.enemies.forEach(e => {
        if (e.state === 'dead') return;
        const dx = e.x - this.x; const dy = e.y - this.y;
        const distSq = dx*dx + dy*dy;
        const hitRadius = 100 * this.scaleMult;
        if (distSq < hitRadius * hitRadius) {
          if (globals.playerStats.unstableOverloadLevel && globals.playerStats.unstableOverloadLevel > 0) {
            if (!this.overloadHitEnemies.has(e)) {
              if (e.chillTimer > 0 || e.burnTimer > 0) {
                this.overloadHitEnemies.add(e);
                const wasChilled = e.chillTimer > 0;
                const wasBurning = e.burnTimer > 0;
                e.chillTimer = 0;
                e.burnTimer = 0;
                (callbacks as any).triggerElementalExplosion?.(e.x, e.y, wasChilled, wasBurning);
              }
            }
          }
          if (globals.raijinDashActive) {
            if (!globals.raijinHitEnemies.has(e)) {
              globals.raijinHitEnemies.add(e);
              const dmg = 3 + (globals.playerStats.dashDamageLevel || 0);
              const stunDur = 1.8 + 0.8 * (globals.playerStats.dashDamageLevel || 0);
              callbacks.hitEnemy(e, dmg);
              e.stunTimer = stunDur;
              for (let i = 0; i < 8; i++) {
                globals.particles.push(Particle.acquire(e.x, e.y, '#00ffff', 300, 0.4, 2));
              }
            }
          } else {
            callbacks.hitEnemy(e, 1);
          }
        }
      });

      // distance-based afterimage spawning for extremely smooth trails
      const distTraveled = Math.hypot(this.x - this.lastAfterimageX, this.y - this.lastAfterimageY);
      if (distTraveled >= 28) {
        this.lastAfterimageX = this.x;
        this.lastAfterimageY = this.y;
        
        let trailColor = '#00ffff';
        if ((globals.flowState as string) === 'storm_god') {
          trailColor = '#fbbf24';
        } else if ((globals.flowState as string) === 'awakened') {
          trailColor = '#c084fc';
        }
        const afterimg = Afterimage.acquire(this, trailColor);
        afterimg.life = 0.35;
        afterimg.maxLife = 0.35;
        globals.afterimages.push(afterimg);

        if (globals.activeFusions.has('plasma_tempest')) {
          globals.plasmaTrails.push({
            x: this.x,
            y: this.y,
            life: 3.5,
            maxLife: 3.5,
            radius: 50
          });
        }
      }

      // smoke particles
      const shouldSpawnSmoke = !isMobile || (Math.floor(performance.now() / 40) % 2 === 0);
      if (shouldSpawnSmoke) {
        const size = 12 + Math.random() * 16;
        const life = 0.35 + Math.random() * 0.25;
        globals.particles.push(Particle.acquire(
          this.x, this.y,
          `rgba(35, 35, 40, 0.45)`,
          60,
          life,
          size
        ));
      }

      // extra wind sparks
      if (Math.random() < 0.6) {
        let sparkColor = '#00ffff';
        if ((globals.flowState as string) === 'storm_god') sparkColor = '#fbbf24';
        else if ((globals.flowState as string) === 'awakened') sparkColor = '#c084fc';
        
        globals.particles.push(Particle.acquire(
          this.x + (Math.random() - 0.5) * 15,
          this.y + (Math.random() - 0.5) * 15,
          sparkColor,
          150,
          0.2 + Math.random() * 0.2,
          1 + Math.random() * 1.5,
          Math.atan2(this.vy, this.vx) + Math.PI + (Math.random() - 0.5) * 0.5
        ));
      }

      if (this.stateTime > 0.2) { 
        this.setState('idle'); this.vx = 0; this.vy = 0; 
      } else if (this.stateTime > 0.15) {
        this.vx *= 0.8;
        this.vy *= 0.8;
      }
    }
    
    let currentAtkCooldown = globals.playerStats.attackCooldownBase;
    if ((globals.flowState as string) === 'awakened') currentAtkCooldown *= 0.5;
    if (this.state === 'attack' && this.stateTime > currentAtkCooldown) { this.setState('idle'); }

    if ((globals.gameMode as string) === 'pvp' && pvpManager.subMode === 'insane_survival' && !this.isPvpRemote) {
      pvpManager.sendState({
        x: this.x,
        y: this.y,
        state: this.state,
        dir: this.dir,
        chargeProgress: this.chargeTimer,
        isParrying: this.state === 'charge',
        isStaggered: this.state === 'dead',
        staggerTimer: 0,
        isParryCooldown: this.pvpParryCooldownTimer > 0
      });
    }
  }

  /* warning: don't change performance shadows check or it lags like crazy on older mobile browsers */
draw(ctx: CanvasRenderingContext2D, cx: number, cy: number, alpha = 1, colorTint = 'none') {
    if (!this.isPvpRemote && globals.invulnTimer > 0 && Math.floor(performance.now() / 100) % 2 === 0 && colorTint === 'none') return;
    
    // petal barrier
    if (!this.isPvpRemote && globals.petalArmorActive) {
      ctx.save();
      ctx.translate(this.x - cx + globals.vw/2, this.y - cy + globals.vh/2 + (this.yOffset || 0));
      ctx.strokeStyle = 'rgba(255, 183, 197, 0.7)';
      ctx.lineWidth = 2.5;
      // Removed shadowBlur to prevent lag
      ctx.beginPath();
      ctx.arc(0, -10, 45, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // wind shield
    if (this.shieldVisualScale > 0.01) {
      ctx.save();
      ctx.translate(this.x - cx + globals.vw/2, this.y - cy + globals.vh/2 + (this.yOffset || 0));
      const time = globals.galeVortexActive ? (performance.now() / 50) : (performance.now() / 150);
      const radius = 120 * (0.6 + 0.4 * this.shieldVisualScale);
      
      // Glow background
      ctx.fillStyle = `rgba(0, 255, 200, ${0.08 * this.shieldVisualScale})`;
      ctx.beginPath();
      ctx.arc(0, 0, radius + 20, 0, Math.PI * 2);
      ctx.fill();

      // Draw spinning wind arcs
      ctx.strokeStyle = `rgba(0, 255, 200, ${0.6 * this.shieldVisualScale})`;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const startAngle = time + (i * Math.PI * 2 / 3);
        ctx.arc(0, 0, radius, startAngle, startAngle + Math.PI / 3);
        ctx.stroke();
      }

      // Inner faint ring
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * this.shieldVisualScale})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, radius - 20, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    // firewheel arcs
    if (this.firewheelVisualScale > 0.01) {
      ctx.save();
      ctx.translate(this.x - cx + globals.vw/2, this.y - cy + globals.vh/2 + (this.yOffset || 0));
      const time = performance.now() / 150;
      const radius = 150 * (1 + 0.25 * (globals.playerStats.firewheelRangeLevel || 0)) * (0.6 + 0.4 * this.firewheelVisualScale);
      
      // Glow background
      const grad = ctx.createRadialGradient(0, 0, radius - 40, 0, 0, radius + 20);
      grad.addColorStop(0, 'rgba(255, 68, 0, 0)');
      grad.addColorStop(0.7, `rgba(255, 68, 0, ${0.15 * this.firewheelVisualScale})`);
      grad.addColorStop(1, 'rgba(255, 68, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, radius + 20, 0, Math.PI * 2);
      ctx.fill();

      // Draw spinning fire arcs
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';

      const colors = [`rgba(255, 68, 0, ${0.7 * this.firewheelVisualScale})`, `rgba(255, 170, 0, ${0.7 * this.firewheelVisualScale})`, `rgba(255, 230, 0, ${0.7 * this.firewheelVisualScale})`];
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = colors[i];
        ctx.beginPath();
        const speedMult = i === 1 ? -1 : 1;
        const startAngle = (time * speedMult) + (i * Math.PI * 2 / 3);
        ctx.arc(0, 0, radius, startAngle, startAngle + Math.PI / 2);
        ctx.stroke();
      }

      // Inner faint ring
      ctx.strokeStyle = `rgba(255, 100, 0, ${0.3 * this.firewheelVisualScale})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, radius - 20, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }


    // aura effect
    if (this.auraVisualScale > 0.01) {
      const time = performance.now() / 1000;
      
      let auraColor = 'rgba(255, 100, 0, ';
      if ((globals.flowState as string) === 'awakened') {
        auraColor = 'rgba(192, 132, 252, '; // purple
      } else if ((globals.flowState as string) === 'storm_god') {
        auraColor = 'rgba(251, 191, 36, '; // gold
      }
      
      ctx.save();
      ctx.translate(this.x - cx + globals.vw/2, this.y - cy + globals.vh/2 + (this.yOffset || 0));
      
      for (let i = 0; i < 3; i++) {
        const ringSize = ( (time * 2 + i * 0.5) % 1.5) * 80;
        const ringAlpha = 1 - (ringSize / 120);
        ctx.beginPath();
        ctx.arc(0, -20, ringSize, 0, Math.PI * 2);
        ctx.strokeStyle = auraColor + (ringAlpha * 0.4 * this.auraVisualScale) + ')';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // inner glow
      const grad = ctx.createRadialGradient(0, -20, 0, 0, -20, 70);
      grad.addColorStop(0, auraColor + (0.4 * this.auraVisualScale) + ')');
      grad.addColorStop(1, auraColor + '0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, -20, 70, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // charge visual indicator (drawn independently if state is charge)
    if (this.state === 'charge') {
      const maxCharge = 1.0;
      const chargeRatio = Math.min(1.0, this.chargeTimer / maxCharge);
      const chargeLevel = Math.min(1.0, this.chargeTimer / maxCharge);
      ctx.save();
      ctx.translate(this.x - cx + globals.vw/2, this.y - cy + globals.vh/2 + (this.yOffset || 0) - 20);

      // charge bar
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(-30, -55, 60, 7);
      ctx.fillStyle = chargeRatio >= 1.0 ? '#ffd700' : '#00ffff';
      ctx.fillRect(-30, -55, 60 * chargeRatio, 7);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(-30, -55, 60, 7);
      ctx.restore();
      
      // ring 1
      const time = performance.now() / 200;
      ctx.beginPath();
      ctx.arc(0, 0, 80 * (1 - chargeLevel * 0.5), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 255, 255, ${chargeLevel * 0.5})`;
      ctx.lineWidth = 3;
      ctx.setLineDash([20, 10]);
      ctx.lineDashOffset = time * 20;
      ctx.stroke();
      ctx.setLineDash([]);

      // ring 2
      ctx.beginPath();
      ctx.arc(0, 0, 60 * (1 - chargeLevel * 0.4), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 215, 0, ${chargeLevel * 0.4})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([15, 15]);
      ctx.lineDashOffset = -time * 15;
      ctx.stroke();
      ctx.setLineDash([]);

      // glow
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 90 * chargeLevel);
      grad.addColorStop(0, `rgba(0, 255, 255, ${chargeLevel * 0.4})`);
      grad.addColorStop(0.5, `rgba(255, 215, 0, ${chargeLevel * 0.2})`);
      grad.addColorStop(1, `rgba(0, 0, 0, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 90 * chargeLevel, 0, Math.PI * 2);
      ctx.fill();

      // cross glint
      ctx.rotate(time * 0.3);
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.moveTo(-120 * chargeLevel, 0);
        ctx.lineTo(120 * chargeLevel, 0);
        ctx.strokeStyle = `rgba(255, 255, 255, ${chargeLevel})`;
        ctx.lineWidth = 1 + chargeLevel * 5;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-50 * chargeLevel, 0);
        ctx.lineTo(50 * chargeLevel, 0);
        ctx.strokeStyle = `rgba(0, 255, 255, ${chargeLevel})`;
        ctx.lineWidth = 3 + chargeLevel * 7;
        ctx.stroke();
        
        ctx.rotate(Math.PI / 2);
      }
      
      ctx.restore();
    } else if (this.state === 'dash') {
      const p = this.stateTime / 0.2; // roughly the dash duration
      if ((globals.flowState as string) === 'storm_god') {
        ctx.save();
        const startX = this.dashStartX - cx + globals.vw/2;
        const startY = this.dashStartY - cy + globals.vh/2;
        const endX = this.x - cx + globals.vw/2;
        const endY = this.y - cy + globals.vh/2;
        const dx = endX - startX;
        const dy = endY - startY;
        const angle = Math.atan2(dy, dx);

        // 1. Draw a thick gold electric background glow
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)';
        // Removed shadowBlur to prevent lag
        ctx.lineWidth = 18 * (1 - p);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const segments = 6;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        for (let i = 1; i < segments; i++) {
          const t = i / segments;
          const px = startX + dx * t;
          const py = startY + dy * t;
          const perpOffset = (Math.sin(i * 1.5 + performance.now() * 0.05) > 0 ? 1 : -1) * (12 + Math.random() * 18);
          const ox = px - Math.sin(angle) * perpOffset;
          const oy = py + Math.cos(angle) * perpOffset;
          ctx.lineTo(ox, oy);
        }
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // 2. Draw the core sharp white lightning bolt
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4.5 * (1 - p);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        for (let i = 1; i < segments; i++) {
          const t = i / segments;
          const px = startX + dx * t;
          const py = startY + dy * t;
          const perpOffset = (Math.sin(i * 1.5 + performance.now() * 0.05) > 0 ? 1 : -1) * (12 + Math.random() * 18);
          const ox = px - Math.sin(angle) * perpOffset;
          const oy = py + Math.cos(angle) * perpOffset;
          ctx.lineTo(ox, oy);
        }
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // 3. Draw secondary branching arc (gold)
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
        ctx.lineWidth = 2 * (1 - p);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        for (let i = 1; i < segments; i++) {
          const t = i / segments;
          const px = startX + dx * t;
          const py = startY + dy * t;
          const perpOffset = (Math.sin(i * 2.1 + performance.now() * 0.08) > 0 ? -1 : 1) * (18 + Math.random() * 18);
          const ox = px - Math.sin(angle) * perpOffset;
          const oy = py + Math.cos(angle) * perpOffset;
          ctx.lineTo(ox, oy);
        }
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.restore();
      } else if (globals.raijinDashActive) {
        ctx.save();
        const startX = this.dashStartX - cx + globals.vw/2;
        const startY = this.dashStartY - cy + globals.vh/2;
        const endX = this.x - cx + globals.vw/2;
        const endY = this.y - cy + globals.vh/2;
        const dx = endX - startX;
        const dy = endY - startY;
        const angle = Math.atan2(dy, dx);

        // 1. Draw a thick cyan electric background glow
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
        // Removed shadowBlur to prevent lag
        ctx.lineWidth = 16 * (1 - p);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const segments = 6;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        for (let i = 1; i < segments; i++) {
          const t = i / segments;
          const px = startX + dx * t;
          const py = startY + dy * t;
          const perpOffset = (Math.sin(i * 1.5 + performance.now() * 0.05) > 0 ? 1 : -1) * (10 + Math.random() * 15);
          const ox = px - Math.sin(angle) * perpOffset;
          const oy = py + Math.cos(angle) * perpOffset;
          ctx.lineTo(ox, oy);
        }
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // 2. Draw the core sharp white lightning bolt
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4 * (1 - p);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        for (let i = 1; i < segments; i++) {
          const t = i / segments;
          const px = startX + dx * t;
          const py = startY + dy * t;
          const perpOffset = (Math.sin(i * 1.5 + performance.now() * 0.05) > 0 ? 1 : -1) * (10 + Math.random() * 15);
          const ox = px - Math.sin(angle) * perpOffset;
          const oy = py + Math.cos(angle) * perpOffset;
          ctx.lineTo(ox, oy);
        }
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // 3. Draw secondary branching arc
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.lineWidth = 1.5 * (1 - p);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        for (let i = 1; i < segments; i++) {
          const t = i / segments;
          const px = startX + dx * t;
          const py = startY + dy * t;
          const perpOffset = (Math.sin(i * 2.1 + performance.now() * 0.08) > 0 ? -1 : 1) * (15 + Math.random() * 15);
          const ox = px - Math.sin(angle) * perpOffset;
          const oy = py + Math.cos(angle) * perpOffset;
          ctx.lineTo(ox, oy);
        }
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.save();
        const color = (globals.flowState as string) === 'awakened' ? 'rgba(192, 132, 252,' : 'rgba(0, 255, 255,';
        ctx.beginPath();
        ctx.moveTo(this.dashStartX - cx + globals.vw/2, this.dashStartY - cy + globals.vh/2);
        ctx.lineTo(this.x - cx + globals.vw/2, this.y - cy + globals.vh/2);
        ctx.strokeStyle = `${color} ${1 - p})`;
        ctx.lineWidth = 30 * (1 - p);
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.dashStartX - cx + globals.vw/2, this.dashStartY - cy + globals.vh/2);
        ctx.lineTo(this.x - cx + globals.vw/2, this.y - cy + globals.vh/2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${1 - p})`;
        ctx.lineWidth = 10 * (1 - p);
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();
      }
    }

    
    // Draw Mirror Strike phantom decoy charging alongside
    if (this.state === 'charge' && globals.decoyInvisibilityTimer > 0 && colorTint === 'none') {
      ctx.save();
      let angle = this.dir === 1 ? 0 : Math.PI;
      if (!globals.joystickActive) {
        angle = Math.atan2(globals.mouse.y - globals.height/2, globals.mouse.x - globals.width/2);
      }
      const offsetDecoyX = -Math.sin(angle) * 70;
      const offsetDecoyY = Math.cos(angle) * 70;
      ctx.translate(offsetDecoyX, offsetDecoyY);
      super.draw(ctx, cx, cy, 0.45, '#aa66ff');
      ctx.restore();
    }

    ctx.save();
    ctx.translate(this.x - cx + globals.vw/2, this.y - cy + globals.vh/2 + (this.yOffset || 0));
    ctx.scale(this.dir, 1);
    ctx.beginPath();
    
    // Adjusted starting point to be closer to the neck/head of the sprite
    const neckX = -4;
    const neckY = -22;
    ctx.moveTo(neckX, neckY);
    
    let trailX = 0;
    let trailY = 0;
    const time = performance.now() / 150;

    if (this.state === 'walk' || this.state === 'dash' || this.state === 'attack') {
      // Stretched out when moving
      trailX = -40 - (Math.abs(this.vx) / 20);
      trailY = -22 + Math.sin(time) * 8;
      ctx.quadraticCurveTo(trailX / 2, -35, trailX, trailY);
    } else {
      // Gentle wave when idle, hanging down slightly
      trailX = -20 + Math.cos(time) * 4;
      trailY = -10 + Math.sin(time) * 4;
      ctx.quadraticCurveTo(-15, neckY, trailX, trailY);
    }
    
    ctx.strokeStyle = '#b31b1b'; // Darker red base for depth
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(neckX, neckY);
    if (this.state === 'walk' || this.state === 'dash' || this.state === 'attack') {
      ctx.quadraticCurveTo(trailX / 2, -35, trailX, trailY);
    } else {
      ctx.quadraticCurveTo(-15, neckY, trailX, trailY);
    }
    ctx.strokeStyle = '#ff3333'; // Brighter red core
    ctx.lineWidth = 4;
    ctx.stroke();
    
    ctx.restore();

    // Render a permanent, semi-transparent neon ellipse ring and radial gradient glowing aura
    if (colorTint === 'none' && this.state !== 'dead') {
      ctx.save();
      const px = this.x - cx + globals.vw/2;
      const py = this.y - cy + globals.vh/2 + (this.yOffset || 0);

      // Determine player's primary color
      let playerColor = '#00ffff'; // Cyan for single player
      let rgbaColor = 'rgba(0, 255, 255, ';
      if ((globals.gameMode as string) === 'pvp') {
        const isHost = pvpManager.role === 'host';
        if (this.isPvpRemote) {
          playerColor = isHost ? '#ffaa00' : '#00ffff';
        } else {
          playerColor = isHost ? '#00ffff' : '#ffaa00';
        }
      }
      if (playerColor === '#ffaa00') {
        rgbaColor = 'rgba(255, 170, 0, ';
      }

      // 1. Glowing Aura (behind the player)
      ctx.fillStyle = rgbaColor + '0.15)';
      ctx.beginPath();
      ctx.arc(px, py - 10, 42, 0, Math.PI * 2);
      ctx.fill();

      // 2. Permanent Neon Ellipse Ring (calibrated to dynamic hero feet baseline)
      const playerFootOffsetY = this.type === 'heroluneblade' ? 30 : (this.type === 'heroninja' ? 48 : 62);
      const ringX = px | 0;
      const ringY = (py + playerFootOffsetY) | 0;

      // Layer 1: Glow
      ctx.strokeStyle = rgbaColor + '0.35)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(ringX, ringY, 22, 7, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Layer 2: Core
      ctx.strokeStyle = playerColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(ringX, ringY, 22, 7, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    // Apply unique color tints to the stick figure sprite
    let finalTint = colorTint;
    if (colorTint === 'none') {
      // Revert to default white stick figure sprite for all modes
      finalTint = 'none';
    }

    // Physical ground contact shadow (anchored at world ground baseline)
    const playerFootOffsetY = this.type === 'heroluneblade' ? 30 : (this.type === 'heroninja' ? 48 : 62);
    const groundShadowRx = (this.x - cx + globals.vw / 2) | 0;
    const groundShadowRy = ((this.y - cy + globals.vh / 2) + playerFootOffsetY) | 0;
    const totalElevation = (this.airborneZ || 0) + Math.max(0, -(this.yOffset || 0));
    const shadowScale = totalElevation > 0 ? Math.max(0.25, 1.0 - totalElevation / 260) : 1.0;
    const shadowAlpha = (this.state === 'dead' ? alpha * 0.2 : 0.38) * shadowScale;

    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(groundShadowRx, groundShadowRy, (22 * shadowScale) | 0, (7 * shadowScale) | 0, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Call super.draw to use the animated sprites
    super.draw(ctx, cx, cy, alpha, finalTint);
  }
}
