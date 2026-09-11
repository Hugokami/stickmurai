import { globals } from './globals';
import { BOSS_BASE_HP, campaignHpMultiplier } from './balance';
import { callbacks } from './callbacks';
import { Entity, Particle, FloatingText, Projectile, AnimatedEffect, Shockwave } from './entities';
import { Player } from './player';
import { playSound, sfx, playSynthesizedThunder, playEnergyBeam, playTeleportSfx, playExplosionSfx, playSynthesizedClash } from './audio';
import { vfxAnims, loadEnemyAssetsNow } from './assets';
import { pvpManager } from './pvpIaijutsuManager';
import { isBoss } from './combatPolish';

const isMobile = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

export type EnemySubType = 'brawler' | 'samurai' | 'giant' | 'assassin' | 'berserker' | 'ronin' | 'oni_boss' | 'shogun_boss' | 'musketeer' | 'pyromancer' | 'glacial_sentinel' | 'astromancer' | 'necromancer' | 'barrel_bomber' | 'orc_brute' | 'agis_colossus' | 'skeleton_warlord' | 'toaster_bot' | 'tengu_sorcerer' | 'shadow_sniper' | 'corrupted_shaman' | 'crimson_berserker';

export class Enemy extends Entity {
  get meleeHitRadius(){return 140+(this.scaleMult-1)*60;}
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
      if (roll < 0.20) this.subType = 'musketeer';
      else if (roll < 0.30) this.subType = 'toaster_bot';
      else if (roll < 0.40) this.subType = 'samurai';
      else if (roll < 0.50) this.subType = 'ronin';
      else if (roll < 0.60) this.subType = 'brawler';
      else if (roll < 0.70) this.subType = 'berserker';
      else if (roll < 0.75) this.subType = 'giant';
      else if (roll < 0.80) this.subType = 'assassin';
      else if (roll < 0.85) this.subType = 'pyromancer';
      else if (roll < 0.90) this.subType = 'glacial_sentinel';
      else if (roll < 0.94) this.subType = 'astromancer';
      else if (roll < 0.96 && globals.score > 20) this.subType = 'oni_boss';
      else if (roll < 0.98 && globals.score > 35) this.subType = 'skeleton_warlord';
      else if (globals.score > 50) this.subType = 'shogun_boss';
      else this.subType = 'necromancer';
    } else {
      // Stage Mode Campaign Spawning
      const stage = globals.currentStage || 1;
      if (stage === 1) {
        // Stage 1: Bamboo Grove - Grunts & Rogues
        const r = Math.random();
        this.subType = r < 0.60 ? 'brawler' : 'samurai';
      } else if (stage === 2) {
        // Stage 2: Forest Outpost - Wolf Pack & Assassins
        const r = Math.random();
        if (r < 0.35) this.subType = 'brawler';
        else if (r < 0.65) this.subType = 'samurai';
        else if (r < 0.85) this.subType = 'ronin';
        else this.subType = 'assassin';
      } else if (stage === 3) {
        // Stage 3: Siege Workshop - Gunpowder, Musketeers & Barrel Bombers
        const r = Math.random();
        if (r < 0.30) this.subType = 'brawler';
        else if (r < 0.55) this.subType = 'musketeer';
        else if (r < 0.80) this.subType = 'barrel_bomber';
        else this.subType = 'pyromancer';
      } else if (stage === 4) {
        // Stage 4: Iron Bastion - Heavy Orc Brutes & Elites
        const r = Math.random();
        if (r < 0.30) this.subType = 'berserker';
        else if (r < 0.60) this.subType = 'orc_brute';
        else if (r < 0.80) this.subType = 'giant';
        else this.subType = 'glacial_sentinel';
      } else if (stage === 5) {
        // Stage 5: Yomi Gateway - Oni Boss Encounter on Final Wave
        const isFinalWave = (globals.currentWave || 1) >= (globals.totalWaves || 3);
        const bossAlive = globals.enemies?.some(e => e && e.state !== 'dead' && e.subType === 'oni_boss');
        if (isFinalWave && !bossAlive && !globals.stageBossSpawned) {
          this.subType = 'oni_boss';
          globals.stageBossSpawned = true;
        } else {
          const r = Math.random();
          if (r < 0.35) this.subType = 'tengu_sorcerer';
          else if (r < 0.65) this.subType = 'samurai';
          else if (r < 0.85) this.subType = 'ronin';
          else this.subType = 'brawler';
        }
      } else if (stage === 6) {
        // Stage 6: Cursed Graveyard - Sorcery, Shamans & Barrel Bombers
        const r = Math.random();
        if (r < 0.25) this.subType = 'necromancer';
        else if (r < 0.50) this.subType = 'corrupted_shaman';
        else if (r < 0.75) this.subType = 'barrel_bomber';
        else this.subType = 'orc_brute';
      } else if (stage === 7) {
        // Stage 7: Blood River - Chaos Vanguard, Snipers & Advanced Bots
        const r = Math.random();
        if (r < 0.25) this.subType = 'shadow_sniper';
        else if (r < 0.50) this.subType = 'toaster_bot';
        else if (r < 0.75) this.subType = 'crimson_berserker';
        else this.subType = 'pyromancer';
      } else if (stage === 8) {
        // Stage 8: Castle Ramparts - Shogun's Guard & Artillery
        const r = Math.random();
        if (r < 0.25) this.subType = 'tengu_sorcerer';
        else if (r < 0.50) this.subType = 'glacial_sentinel';
        else if (r < 0.75) this.subType = 'crimson_berserker';
        else this.subType = 'giant';
      } else if (stage === 9) {
        // Stage 9: Throne Ante-Chamber - Purgatory Rampage
        const elitePool: EnemySubType[] = ['orc_brute', 'crimson_berserker', 'corrupted_shaman', 'shadow_sniper', 'tengu_sorcerer', 'astromancer', 'toaster_bot'];
        this.subType = elitePool[Math.floor(Math.random() * elitePool.length)];
      } else if (stage === 10) {
        // Stage 10: Sanctum of Oblivion - Agis Colossus Boss on Final Wave
        const isFinalWave = (globals.currentWave || 1) >= (globals.totalWaves || 3);
        const agisAlive = globals.enemies?.some(e => e && e.state !== 'dead' && e.subType === 'agis_colossus');
        if (isFinalWave && !agisAlive && !globals.stageBossSpawned) {
          this.subType = 'agis_colossus';
          globals.stageBossSpawned = true;
        } else {
          const r = Math.random();
          if (r < 0.35) this.subType = 'shadow_sniper';
          else if (r < 0.70) this.subType = 'orc_brute';
          else this.subType = 'crimson_berserker';
        }
      } else if (stage === 15) {
        // Stage 15: Tomb of the Ancient King - Skeleton Warlord Boss on Final Wave
        const isFinalWave = (globals.currentWave || 1) >= (globals.totalWaves || 3);
        const warlordAlive = globals.enemies?.some(e => e && e.state !== 'dead' && e.subType === 'skeleton_warlord');
        if (isFinalWave && !warlordAlive && !globals.stageBossSpawned) {
          this.subType = 'skeleton_warlord';
          globals.stageBossSpawned = true;
        } else {
          const r = Math.random();
          if (r < 0.35) this.subType = 'corrupted_shaman';
          else if (r < 0.70) this.subType = 'tengu_sorcerer';
          else this.subType = 'necromancer';
        }
      } else {
        // Stage 11+ Endless Realms
        const realm = Math.floor((stage - 1) / 5) + 1;
        const stageInRealm = ((stage - 1) % 5) + 1;
        if (stageInRealm === 5) {
          // Boss stage on final wave
          const isFinalWave = (globals.currentWave || 1) >= (globals.totalWaves || 3);
          const bossTypes: EnemySubType[] = ['oni_boss', 'agis_colossus', 'skeleton_warlord', 'shogun_boss'];
          const targetBoss = bossTypes[(realm - 1) % bossTypes.length];
          const bossAlive = globals.enemies?.some(e => e && e.state !== 'dead' && (e.subType === targetBoss || (e as any).isBoss));
          if (isFinalWave && !bossAlive && !globals.stageBossSpawned) {
            this.subType = targetBoss;
            globals.stageBossSpawned = true;
          } else {
            const minionPool: EnemySubType[] = ['orc_brute', 'crimson_berserker', 'corrupted_shaman', 'shadow_sniper', 'tengu_sorcerer', 'glacial_sentinel'];
            this.subType = minionPool[Math.floor(Math.random() * minionPool.length)];
          }
        } else if (stageInRealm === 1) {
          const pool: EnemySubType[] = ['samurai', 'ronin', 'assassin', 'tengu_sorcerer'];
          this.subType = pool[Math.floor(Math.random() * pool.length)];
        } else if (stageInRealm === 2) {
          const pool: EnemySubType[] = ['musketeer', 'shadow_sniper', 'crimson_berserker', 'orc_brute', 'assassin'];
          this.subType = pool[Math.floor(Math.random() * pool.length)];
        } else if (stageInRealm === 3) {
          const pool: EnemySubType[] = ['barrel_bomber', 'pyromancer', 'toaster_bot', 'corrupted_shaman', 'giant'];
          this.subType = pool[Math.floor(Math.random() * pool.length)];
        } else {
          const pool: EnemySubType[] = ['glacial_sentinel', 'necromancer', 'astromancer', 'crimson_berserker', 'shadow_sniper'];
          this.subType = pool[Math.floor(Math.random() * pool.length)];
        }
      }
    }

    // Enforce active ranged density cap (Max 3-4 simultaneous ranged casters)
    if (this.isRanged()) {
      const activeRangedCount = globals.enemies ? globals.enemies.filter(e => e && e.state !== 'dead' && e.isRanged?.()).length : 0;
      const maxRanged = globals.difficulty === 'insane' ? 4 : 3;
      if (activeRangedCount >= maxRanged) {
        const meleePool: EnemySubType[] = ['samurai', 'ronin', 'brawler', 'berserker', 'giant', 'orc_brute', 'barrel_bomber'];
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
    return this.subType === 'musketeer' || this.subType === 'pyromancer' || this.subType === 'glacial_sentinel' || this.subType === 'astromancer' || this.subType === 'necromancer' || this.subType === 'toaster_bot' || this.subType === 'shadow_sniper' || this.subType === 'tengu_sorcerer' || this.subType === 'corrupted_shaman';
  }

  configureSubType() {
    if (this.subType === 'brawler') {
      this.type = 'enemy01';
      this.lungeSpeed = 950; this.chargeTimeMax = 1.6; this.lungeDuration = 0.5;
      this.scaleMult = 1; this.hp = this.maxHp = 6; this.expValue = 1;
      this.colorTint = 'none';
      this.speed = 260;
      this.maxPosture = 120;
    } else if (this.subType === 'samurai') {
      this.type = 'enemy02';
      this.lungeSpeed = 900; this.chargeTimeMax = 1.8; this.lungeDuration = 0.6;
      this.scaleMult = 1.1; this.hp = this.maxHp = 7; this.expValue = 1;
      this.colorTint = 'none';
      this.speed = 260;
      this.maxPosture = 140;
    } else if (this.subType === 'ronin') {
      this.type = 'enemy03';
      this.lungeSpeed = 1000; this.chargeTimeMax = 1.8; this.lungeDuration = 0.7;
      this.scaleMult = 1.2; this.hp = this.maxHp = 10; this.expValue = 2;
      this.colorTint = 'none';
      this.speed = 260;
      this.maxPosture = 160;
    } else if (this.subType === 'berserker') {
      this.type = 'enemy02';
      this.lungeSpeed = 1300; this.chargeTimeMax = 1.3; this.lungeDuration = 0.5;
      this.scaleMult = 1.3; this.hp = this.maxHp = 12; this.expValue = 3;
      this.colorTint = 'none';
      this.speed = 320;
      this.maxPosture = 200;
    } else if (this.subType === 'crimson_berserker') {
      this.type = 'enemy02';
      this.lungeSpeed = 1400; this.chargeTimeMax = 1.2; this.lungeDuration = 0.6;
      this.scaleMult = 1.4; this.hp = this.maxHp = 26; this.expValue = 6;
      this.colorTint = '#ef4444';
      this.speed = 340;
      this.maxPosture = 320;
    } else if (this.subType === 'giant') {
      this.type = 'enemy03';
      this.lungeSpeed = 650; this.chargeTimeMax = 2.4; this.lungeDuration = 0.8;
      this.scaleMult = 2; this.hp = this.maxHp = 18; this.expValue = 4;
      this.colorTint = 'none';
      this.speed = 150;
      this.maxPosture = 280;
    } else if (this.subType === 'assassin') {
      this.type = 'enemy01';
      this.lungeSpeed = 1500; this.chargeTimeMax = 1.0; this.lungeDuration = 0.4;
      this.scaleMult = 0.8; this.hp = this.maxHp = 5; this.expValue = 2;
      this.colorTint = 'none';
      this.speed = 360;
      this.maxPosture = 100;
    } else if (this.subType === 'musketeer') {
      this.type = 'enemy05';
      this.lungeSpeed = 0; this.chargeTimeMax = 2.5; this.lungeDuration = 0.55; // Double-shot projectile
      this.scaleMult = 1.6; this.hp = this.maxHp = 4; this.expValue = 2;
      this.colorTint = 'none';
      this.speed = 180;
      this.maxPosture = 110;
    } else if (this.subType === 'shadow_sniper') {
      this.type = 'enemy05';
      this.lungeSpeed = 0; this.chargeTimeMax = 2.1; this.lungeDuration = 0.45;
      this.scaleMult = 1.4; this.hp = this.maxHp = 9; this.expValue = 4;
      this.colorTint = '#881337';
      this.speed = 200;
      this.maxPosture = 180;
    } else if (this.subType === 'tengu_sorcerer') {
      this.type = 'enemy01';
      this.lungeSpeed = 0; this.chargeTimeMax = 1.9; this.lungeDuration = 0.55;
      this.scaleMult = 1.35; this.hp = this.maxHp = 14; this.expValue = 5;
      this.colorTint = '#38bdf8';
      this.speed = 240;
      this.maxPosture = 220;
    } else if (this.subType === 'corrupted_shaman') {
      this.type = 'evil_wizard';
      this.lungeSpeed = 0; this.chargeTimeMax = 2.4; this.lungeDuration = 0.6;
      this.scaleMult = 1.5; this.hp = this.maxHp = 22; this.expValue = 7;
      this.colorTint = '#059669';
      this.speed = 170;
      this.maxPosture = 260;
    } else if (this.subType === 'pyromancer') {
      this.type = 'enemy01';
      this.lungeSpeed = 0; this.chargeTimeMax = 2.5; this.lungeDuration = 0.55;
      this.scaleMult = 1.5; this.hp = this.maxHp = 8; this.expValue = 4;
      this.colorTint = '#ff4400';
      this.speed = 160;
      this.maxPosture = 150;
    } else if (this.subType === 'glacial_sentinel') {
      this.type = 'enemy02';
      this.lungeSpeed = 850; this.chargeTimeMax = 2.0; this.lungeDuration = 0.7;
      this.scaleMult = 1.4; this.hp = this.maxHp = 14; this.expValue = 5;
      this.colorTint = '#60a5fa';
      this.speed = 190;
      this.maxPosture = 260;
    } else if (this.subType === 'astromancer') {
      this.type = 'enemy01';
      this.lungeSpeed = 0; this.chargeTimeMax = 2.3; this.lungeDuration = 0.5;
      this.scaleMult = 1.5; this.hp = this.maxHp = 7; this.expValue = 5;
      this.colorTint = '#f43f5e';
      this.speed = 210;
      this.maxPosture = 160;
    } else if (this.subType === 'necromancer') {
      this.type = 'enemy05';
      this.lungeSpeed = 0; this.chargeTimeMax = 2.7; this.lungeDuration = 0.6;
      this.scaleMult = 1.8; this.hp = this.maxHp = 22; this.expValue = 8;
      this.colorTint = '#a855f7';
      this.speed = 150;
      this.maxPosture = 240;
    } else if (this.subType === 'oni_boss') {
      this.type = 'skeleton';
      this.lungeSpeed = 1000; this.chargeTimeMax = 1.9; this.lungeDuration = 0.8;
      this.scaleMult = 2.5; this.hp = this.maxHp = BOSS_BASE_HP.oni_boss; this.expValue = 15;
      this.colorTint = 'none';
      this.speed = 270;
      this.maxPosture = 850;
    } else if (this.subType === 'barrel_bomber') {
      this.type = 'enemy_barrel';
      this.lungeSpeed = 1000; this.chargeTimeMax = 1.3; this.lungeDuration = 0.5;
      this.scaleMult = 1.1; this.hp = this.maxHp = 6; this.expValue = 2;
      this.colorTint = 'none';
      this.speed = 340;
      this.maxPosture = 90;
    } else if (this.subType === 'orc_brute') {
      this.type = 'enemy_orc';
      this.lungeSpeed = 800; this.chargeTimeMax = 1.8; this.lungeDuration = 0.65;
      this.scaleMult = 1.2; this.hp = this.maxHp = 16; this.expValue = 4;
      this.colorTint = 'none';
      this.speed = 220;
      this.maxPosture = 250;
    } else if (this.subType === 'agis_colossus') {
      this.type = 'boss_agis';
      this.lungeSpeed = 700; this.chargeTimeMax = 2.2; this.lungeDuration = 0.8;
      this.scaleMult = 2.4; this.hp = this.maxHp = BOSS_BASE_HP.agis_colossus; this.expValue = 30;
      this.colorTint = 'none';
      this.speed = 190;
      this.maxPosture = 1100;
    } else if (this.subType === 'skeleton_warlord') {
      this.type = 'boss_skeleton';
      this.lungeSpeed = 900; this.chargeTimeMax = 2.0; this.lungeDuration = 0.75;
      this.scaleMult = 2.2; this.hp = this.maxHp = BOSS_BASE_HP.skeleton_warlord; this.expValue = 35;
      this.colorTint = 'none';
      this.speed = 220;
      this.maxPosture = 950;
    } else if (this.subType === 'toaster_bot') {
      this.type = 'toaster_bot';
      this.lungeSpeed = 0; this.chargeTimeMax = 2.0; this.lungeDuration = 0.6;
      this.scaleMult = 1.0; this.hp = this.maxHp = 10; this.expValue = 3;
      this.colorTint = 'none';
      this.speed = 190;
      this.maxPosture = 130;
    } else { // shogun_boss
      this.type = 'evil_wizard';
      this.lungeSpeed = 1350; this.chargeTimeMax = 1.7; this.lungeDuration = 0.6;
      this.scaleMult = 2.4; this.hp = this.maxHp = BOSS_BASE_HP.shogun_boss; this.expValue = 20;
      this.colorTint = 'none';
      this.speed = 280;
      this.maxPosture = 900;
    }

    // Apply scaling modifiers
    let hpMult = 1.0;
    let speedMult = 1.0;
    let chargeMult = 1.0;

    if (globals.gameMode === 'classic') {
      const stage = Math.max(1, globals.currentStage || 1);
      const isBoss = this.subType === 'oni_boss' || this.subType === 'shogun_boss' || this.subType === 'agis_colossus' || this.subType === 'skeleton_warlord';
      if (isBoss) {
        (this as any).isBoss = true;
      }
      
      // Progressive endless scaling: keeps grunts killable in 1-3 clean strikes while steadily raising challenge
      const stageHpMult = campaignHpMultiplier(stage, isBoss);
      const stageSpeedMult = Math.min(1.55, 1.0 + (stage - 1) * 0.035);
      const stageChargeMult = Math.max(0.55, 1.0 - (stage - 1) * 0.03);

      hpMult = stageHpMult;
      speedMult = stageSpeedMult;
      chargeMult = stageChargeMult;

      if (isBoss) {
        this.maxPosture = Math.round(this.maxPosture * (1.0 + (stage - 1) * 0.09));
      }
    } else {
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
    }

    if (globals.activeStageAffix?.id === 'void_flux') {
      speedMult *= 1.15;
    }

    this.hp = Math.max(1, Math.round(this.hp * hpMult));
    this.maxHp = this.hp;
    this.hpDelayed = this.hp;
    this.speed *= speedMult;
    this.lungeSpeed *= speedMult;
    this.chargeTimeMax *= chargeMult;
    loadEnemyAssetsNow(this.type);
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
    
    if (this.state === 'react') {
      this.vx = 0; this.vy = 0;
      if (this.stateTime > 1.2) {
        this.setState('idle');
        this.attackCooldownTimer = 0.6 + Math.random() * 0.4;
      }
      return;
    }

    if (this.state === 'recover') {
      this.vx = 0; this.vy = 0;
      const recovery=isBoss(this)&&globals.gameMode==='classic'?(this.hp/this.maxHp<=.33?.9:1.2):.8;
      if (this.stateTime > recovery) {
        this.setState('idle');
        this.attackCooldownTimer = 0.8 + Math.random() * 0.5;
      }
      return;
    }

    if (this.state !== 'charge' && this.state !== 'attack' && this.state !== 'react' && this.state !== 'recover') {
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

        if (this.subType !== 'musketeer' && this.subType !== 'pyromancer' && this.subType !== 'astromancer' && this.subType !== 'necromancer' && this.subType !== 'toaster_bot') {
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

      if (this.subType === 'musketeer' || this.subType === 'toaster_bot') {
        this.burstShotTimer += effectiveDt;
        if (this.subType === 'musketeer') {
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
        }
      }
      
      if (this.subType === 'toaster_bot') {
        const isOverclocked = globals.activeStageAffix?.id === 'overclocked_circuitry';
        if (isOverclocked) {
          // 3-round rapid plasma burst in Overclocked Circuitry!
          if (this.burstShotsFired === 0 && (this.animFrame >= 12 || this.stateTime >= 0.26)) {
            const proj1 = Projectile.acquire(this.x, this.y - 10, this.targetAngle, true);
            (proj1 as any).shooter = this;
            (proj1 as any).colorTint = '#38bdf8';
            globals.projectiles.push(proj1);
            this.burstShotsFired = 1;
            this.burstShotTimer = 0;
            playEnergyBeam(0.45);
          } else if (this.burstShotsFired === 1 && this.burstShotTimer >= 0.12) {
            const proj2 = Projectile.acquire(this.x, this.y - 10, this.targetAngle, true);
            (proj2 as any).shooter = this;
            (proj2 as any).colorTint = '#00ffff';
            globals.projectiles.push(proj2);
            this.burstShotsFired = 2;
            this.burstShotTimer = 0;
            playEnergyBeam(0.45);
          } else if (this.burstShotsFired === 2 && this.burstShotTimer >= 0.12) {
            const proj3 = Projectile.acquire(this.x, this.y - 10, this.targetAngle, true);
            (proj3 as any).shooter = this;
            (proj3 as any).colorTint = '#f43f5e';
            globals.projectiles.push(proj3);
            this.burstShotsFired = 3;
            this.attackLanded = true;
            playEnergyBeam(0.5);
          }
        } else {
          // Standard single plasma blast
          if (!this.attackLanded && (this.animFrame >= 12 || this.stateTime >= 0.32)) {
            const proj = Projectile.acquire(this.x, this.y - 10, this.targetAngle, true);
            (proj as any).shooter = this;
            (proj as any).colorTint = '#38bdf8';
            globals.projectiles.push(proj);
            this.attackLanded = true;
            playEnergyBeam(0.45);
          }
        }
      } else if (this.subType === 'tengu_sorcerer') {
        if (!this.attackLanded && this.stateTime >= 0.10) {
          const p1 = Projectile.acquire(this.x, this.y, this.targetAngle - 0.18, true, 1);
          const p2 = Projectile.acquire(this.x, this.y, this.targetAngle + 0.18, true, 1);
          (p1 as any).shooter = this; (p1 as any).colorTint = '#38bdf8';
          (p2 as any).shooter = this; (p2 as any).colorTint = '#38bdf8';
          globals.projectiles.push(p1, p2);
          this.attackLanded = true;
          playSound(sfx.enemySlash, 0.3);
        }
      } else if (this.subType === 'shadow_sniper') {
        if (!this.attackLanded && this.stateTime >= 0.08) {
          const p = Projectile.acquire(this.x, this.y, this.targetAngle, true, 2);
          (p as any).shooter = this; (p as any).colorTint = '#ef4444';
          p.vx = Math.cos(this.targetAngle) * 1600;
          p.vy = Math.sin(this.targetAngle) * 1600;
          globals.projectiles.push(p);
          this.attackLanded = true;
          playSound(sfx.enemySlash, 0.35);
        }
      } else if (this.subType === 'corrupted_shaman') {
        if (!this.attackLanded && this.stateTime >= 0.12) {
          const p = Projectile.acquire(this.x, this.y, this.targetAngle, true, 2);
          (p as any).shooter = this; (p as any).colorTint = '#10b981';
          globals.projectiles.push(p);
          this.attackLanded = true;
          playSound(sfx.enemySlash, 0.3);
        }
      } else if (this.subType === 'oni_boss') {
        const distToTarget = Math.hypot(this.target.x - this.x, this.target.y - this.y);
        if (!this.attackLanded && distToTarget > 200 && this.stateTime >= 0.15) {
          const p1 = Projectile.acquire(this.x, this.y, this.targetAngle - 0.18, true, 2, true);
          const p2 = Projectile.acquire(this.x, this.y, this.targetAngle + 0.18, true, 2, true);
          (p1 as any).shooter = this; (p1 as any).colorTint = '#ef4444';
          (p2 as any).shooter = this; (p2 as any).colorTint = '#ef4444';
          globals.projectiles.push(p1, p2);
          globals.shockwaves.push(new Shockwave(this.x, this.y, '#ef4444'));
          this.attackLanded = true;
          playSound(sfx.enemySlash, 0.4);
        } else if (!this.attackLanded) {
          const dxHit = this.target.x - this.x; const dyHit = this.target.y - this.y;
          if (dxHit*dxHit + dyHit*dyHit < this.meleeHitRadius * this.meleeHitRadius) {
            this.executeAttack();
            this.attackLanded = true;
          }
        }
      } else if (this.subType === 'skeleton_warlord') {
        const distToTarget = Math.hypot(this.target.x - this.x, this.target.y - this.y);
        if (!this.attackLanded && distToTarget > 220 && this.stateTime >= 0.15) {
          for (let off of [-0.25, 0, 0.25]) {
            const p = Projectile.acquire(this.x, this.y, this.targetAngle + off, true, 2);
            (p as any).shooter = this; (p as any).colorTint = '#a855f7';
            globals.projectiles.push(p);
          }
          this.attackLanded = true;
          playSound(sfx.enemySlash, 0.4);
        } else if (!this.attackLanded) {
          const dxHit = this.target.x - this.x; const dyHit = this.target.y - this.y;
          if (dxHit*dxHit + dyHit*dyHit < this.meleeHitRadius * this.meleeHitRadius) {
            this.executeAttack();
            this.attackLanded = true;
          }
        }
      } else if (this.subType === 'agis_colossus') {
        const distToTarget = Math.hypot(this.target.x - this.x, this.target.y - this.y);
        if (!this.attackLanded && distToTarget > 220 && this.stateTime >= 0.18) {
          const p = Projectile.acquire(this.x, this.y, this.targetAngle, true, 3, true);
          (p as any).shooter = this; (p as any).colorTint = '#00ffff';
          globals.projectiles.push(p);
          globals.shockwaves.push(new Shockwave(this.x, this.y, '#00ffff'));
          globals.screenShake = Math.max(globals.screenShake, 18);
          this.attackLanded = true;
          playSound(sfx.enemySlash, 0.4);
        } else if (!this.attackLanded) {
          const dxHit = this.target.x - this.x; const dyHit = this.target.y - this.y;
          if (dxHit*dxHit + dyHit*dyHit < this.meleeHitRadius * this.meleeHitRadius) {
            this.executeAttack();
            this.attackLanded = true;
          }
        }
      } else if (this.subType === 'shogun_boss') {
        const distToTarget = Math.hypot(this.target.x - this.x, this.target.y - this.y);
        if (!this.attackLanded && distToTarget > 180 && this.stateTime >= 0.15) {
          for (let off of [-0.3, -0.1, 0.1, 0.3]) {
            const p = Projectile.acquire(this.x, this.y, this.targetAngle + off, true, 2);
            (p as any).shooter = this; (p as any).colorTint = '#fbbf24';
            globals.projectiles.push(p);
          }
          this.attackLanded = true;
          playSound(sfx.enemySlash, 0.4);
        } else if (!this.attackLanded) {
          const dxHit = this.target.x - this.x; const dyHit = this.target.y - this.y;
          if (dxHit*dxHit + dyHit*dyHit < this.meleeHitRadius * this.meleeHitRadius) {
            this.executeAttack();
            this.attackLanded = true;
          }
        }
      } else if (this.subType !== 'musketeer' && !this.attackLanded) {
        const dxHit = this.target.x - this.x; const dyHit = this.target.y - this.y;
        const threshold = this.meleeHitRadius;
        if (dxHit*dxHit + dyHit*dyHit < threshold * threshold) {
          this.executeAttack(); 
          this.attackLanded = true; 
        }
      }
      if (this.stateTime > this.lungeDuration) {
        if (this.subType === 'skeleton_warlord' || (globals.gameMode==='classic'&&isBoss(this))) {
          this.setState('recover');
        } else {
          this.setState('idle');
        }
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
    else if (this.subType === 'toaster_bot') { attackRange = 460; }
    else if (this.subType === 'shadow_sniper') { attackRange = 620; }
    else if (this.subType === 'tengu_sorcerer') { attackRange = 460; }
    else if (this.subType === 'corrupted_shaman') { attackRange = 480; }
    else if (this.subType === 'oni_boss') { attackRange = 420; }
    else if (this.subType === 'skeleton_warlord') { attackRange = 420; }
    else if (this.subType === 'agis_colossus') { attackRange = 440; }
    else if (this.subType === 'shogun_boss') { attackRange = 450; }

    // Active boss poise regeneration: recovers posture when not under active pressure
    if (isBoss(this) && this.posture > 0 && this.postureBrokenTimer <= 0) {
      this.posture = Math.max(0, this.posture - 28 * effectiveDt);
    }

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
      playTeleportSfx(0.45);
      
      this.x = targetX;
      this.y = targetY;
      
      const tpIn = new AnimatedEffect(this.x, this.y, vfxAnims.starcaller.vfx1, 0.4, 1.5);
      globals.animatedEffects.push(tpIn);
      this.vx = 0; this.vy = 0;
      return;
    }

    // Skeleton Warlord parry reaction stance trigger
    if (this.subType === 'skeleton_warlord' && this.attackCooldownTimer <= 0 && distSq < 280 * 280 && Math.random() < 0.025) {
      this.setState('react');
      this.vx = 0; this.vy = 0;
      globals.floatingTexts.push(FloatingText.acquire(this.x, this.y - 65, "PARRY STANCE! ⚔️", "#cbd5e1", 20));
      return;
    }

    // Toaster Bot kiting / strafing AI: back away when player gets close to keep optimal firing distance
    if (this.subType === 'toaster_bot' && distSq < 260 * 260 && this.state !== 'charge' && this.state !== 'attack') {
      const dist = Math.sqrt(distSq) || 0.001;
      this.vx = -(dx / dist) * speed;
      this.vy = -(dy / dist) * speed;
      this.setState('walk');
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
    if (this.subType === 'barrel_bomber') {
      triggerBarrelExplosion(this);
      this.attackLanded = true;
      return;
    }
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
      if (this.subType === 'orc_brute') {
        globals.screenShake = Math.max(globals.screenShake, 14);
        globals.shockwaves.push(new Shockwave(this.x, this.y, '#ea580c'));
        callbacks.checkPlayerHit(this, 2);
      } else {
        callbacks.checkPlayerHit(this);
      }
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
    } else if (this.subType === 'agis_colossus') {
      // Colossus Seismic Shockwave + Tri-Orb Plasma Spray
      globals.screenShake = Math.max(globals.screenShake, 24);
      globals.shockwaves.push(new Shockwave(this.x, this.y, '#38bdf8', 220));
      const bossImpact = (vfxAnims as any).boss?.slamImpact;
      const bossDust = (vfxAnims as any).boss?.slamDust;
      if (bossImpact?.length > 0) globals.animatedEffects.push(new AnimatedEffect(this.x, this.y, bossImpact, 0.5, 2.0));
      if (bossDust?.length > 0) globals.animatedEffects.push(new AnimatedEffect(this.x, this.y, bossDust, 0.55, 2.2));
      globals.floatingTexts.push(FloatingText.acquire(this.x, this.y - 65, "COLOSSUS CRUSH! ⚡", "#38bdf8", 30));
      playSynthesizedThunder();

      // Tri-orb spread projectiles
      const baseAng = this.targetAngle;
      const spreadAngles = [baseAng - 0.28, baseAng, baseAng + 0.28];
      for (const ang of spreadAngles) {
        const proj = Projectile.acquire(this.x, this.y, ang, true);
        (proj as any).shooter = this;
        (proj as any).colorTint = '#38bdf8';
        globals.projectiles.push(proj);
      }

      // Heavy ground tremor damaging player if in range
      const pdx = globals.player.x - this.x;
      const pdy = globals.player.y - this.y;
      if (pdx * pdx + pdy * pdy < 190 * 190 && globals.player.state !== 'dead') {
        callbacks.checkPlayerHit(this, 2);
      }
      this.attackLanded = true;
    } else if (this.subType === 'skeleton_warlord') {
      // Skeleton Warlord Ground-Splitting Cleave Tremor
      globals.screenShake = Math.max(globals.screenShake, 24);
      globals.shockwaves.push(new Shockwave(this.x, this.y, '#ef4444', 220));
      const bossImpact = (vfxAnims as any).boss?.slamImpact;
      const bossDust = (vfxAnims as any).boss?.slamDust;
      if (bossImpact?.length > 0) globals.animatedEffects.push(new AnimatedEffect(this.x, this.y, bossImpact, 0.5, 2.0));
      if (bossDust?.length > 0) globals.animatedEffects.push(new AnimatedEffect(this.x, this.y, bossDust, 0.55, 2.2));
      globals.floatingTexts.push(FloatingText.acquire(this.x, this.y - 70, "WARLORD CLEAVE! 💀", "#ef4444", 28));
      playSound(sfx.enemySlash, 0.5);

      const pdx = globals.player.x - this.x;
      const pdy = globals.player.y - this.y;
      if (pdx * pdx + pdy * pdy < 210 * 210 && globals.player.state !== 'dead') {
        callbacks.checkPlayerHit(this, 2);
      }
      this.attackLanded = true;
    }
  }

  addPostureDamage(amount: number) {
    if (this.state === 'dead' || this.postureBrokenTimer > 0) return;
    const bonus = globals.playerStats?.postureDmgBonus || 0;
    this.posture += (amount + bonus);
    if (this.posture >= this.maxPosture) {
      this.posture = this.maxPosture;
      this.postureBrokenTimer = 3.0;
      this.stunTimer = 3.0;
      this.vx = 0; this.vy = 0;
      const bossEntity = isBoss(this);
      globals.screenShake = bossEntity ? 22 : 14;
      globals.shockwaves.push(new Shockwave(this.x, this.y, '#ff003c', bossEntity ? 200 : 130));
      globals.floatingTexts.push(FloatingText.acquire(this.x, this.y - 75, bossEntity ? "BOSS POSTURE BROKEN! 💀" : "STANCE BROKEN!", "#ff003c", bossEntity ? 26 : 22));
      playSynthesizedClash();
    }
  }

  draw(ctx: CanvasRenderingContext2D, cx: number, cy: number, alpha = 1) {
    const rx = (this.x - cx + globals.vw/2) | 0;
    const ry = (this.y - cy + globals.vh/2 + (this.yOffset || 0)) | 0;
    const effectiveRy = (ry - (this.airborneZ || 0)) | 0;
    const buffer = 150 * this.scaleMult;
    if (rx < -buffer || rx > globals.vw + buffer || effectiveRy < -buffer || effectiveRy > globals.vh + buffer) {
      return;
    }

    if (this.state === 'charge') {
      ctx.save();ctx.translate(rx,effectiveRy);
      const p=Math.min(1,this.stateTime/this.chargeTimeMax);
      const ranged=this.isRanged();
      const color=ranged?'#67e8f9':'#fbbf24';
      ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=this.isAimLocked?3:2;
      ctx.setLineDash(this.isAimLocked?[]:[10,8]);
      ctx.font="bold 12px Outfit,system-ui,sans-serif";ctx.textAlign='center';
      ctx.fillText(ranged?'◇ RANGED':'▸ LUNGE',0,-this.meleeHitRadius-14);
      // Area casts use the same radii as triggerCustomSpellCast.
      if(this.subType==='agis_colossus'||this.subType==='skeleton_warlord'){
        ctx.beginPath();ctx.arc(0,0,this.subType==='agis_colossus'?190:210,0,Math.PI*2);ctx.stroke();
      }
      ctx.rotate(this.targetAngle);
      if(ranged){
        ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(600,0);ctx.stroke();
        ctx.beginPath();ctx.moveTo(600,-9);ctx.lineTo(609,0);ctx.lineTo(600,9);ctx.lineTo(591,0);ctx.closePath();ctx.stroke();
      }else{
        const travel=this.lungeSpeed*this.lungeDuration*.5;
        const radius=this.meleeHitRadius;
        // Swept circle: its radius is also used by the melee damage check.
        ctx.beginPath();ctx.arc(travel,0,radius,-Math.PI/2,Math.PI/2);ctx.arc(0,0,radius,Math.PI/2,Math.PI*1.5);ctx.closePath();
        ctx.globalAlpha=.06+p*.08;ctx.fill();ctx.globalAlpha=1;ctx.stroke();
        ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(travel,0);ctx.stroke();
      }
      ctx.restore();
    }

    // Dynamic head height offset per enemy type for cleanly anchored HP and Posture bars
    let headOffset = 46;
    if (this.type === 'boss_agis') headOffset = 160;
    else if (this.type === 'boss_skeleton') headOffset = 65;
    else if (this.type === 'toaster_bot') headOffset = 25;
    else if (this.type === 'evil_wizard') headOffset = 52;
    else if (this.type === 'skeleton') headOffset = 22;
    else if (this.type === 'enemy01') headOffset = 50;
    else if (this.type === 'enemy02') headOffset = 44;
    else if (this.type === 'enemy03') headOffset = 26;
    else if (this.type === 'enemy05') headOffset = 26;
    else if (this.type === 'enemy_orc') headOffset = 44;
    else if (this.type === 'enemy_barrel') headOffset = 52;

    // Sniper Laser Aim Telegraph
    if (this.subType === 'shadow_sniper' && this.state === 'charge') {
      ctx.save();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(rx, effectiveRy);
      ctx.lineTo(rx + Math.cos(this.targetAngle) * 600, effectiveRy + Math.sin(this.targetAngle) * 600);
      ctx.stroke();
      ctx.restore();
    }

    // Perilous Attack Danger Telegraph ("!") for charging bosses, unblockable lunges, and locked aim
    if (this.state === 'charge' && (this.isAimLocked || this.subType === 'oni_boss' || this.subType === 'shogun_boss' || this.subType === 'agis_colossus' || this.subType === 'skeleton_warlord' || this.subType === 'giant')) {
      const alertFrames = (vfxAnims as any).combat?.perilAlert;
      if (alertFrames && alertFrames.length > 0) {
        const aIdx = Math.floor((performance.now() / 65) % alertFrames.length);
        const aImg = alertFrames[aIdx];
        if (aImg && aImg.complete && aImg.naturalWidth > 0) {
          ctx.save();
          const alertY = (effectiveRy - (headOffset + 24) * this.scaleMult) | 0;
          ctx.drawImage(aImg, (rx - aImg.width / 2) | 0, (alertY - aImg.height / 2) | 0);
          ctx.restore();
        }
      }
    }

    // HP bar directly above enemy head
    if (this.state !== 'dead' && this.hp < this.maxHp) {
      const barW = (this.subType === 'oni_boss' || this.subType === 'shogun_boss' || this.subType === 'agis_colossus' || this.subType === 'skeleton_warlord' ? 80 : 48) * this.scaleMult;
      const barH = 5;
      const barY = (effectiveRy - headOffset * this.scaleMult) | 0;
      const barX = (rx - barW / 2) | 0;

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
    if (this.state !== 'dead' && (this.posture > 0 || this.postureBrokenTimer > 0 || this.subType === 'oni_boss' || this.subType === 'shogun_boss' || this.subType === 'agis_colossus' || this.subType === 'skeleton_warlord' || this.subType === 'giant' || this.subType === 'berserker' || this.subType === 'orc_brute')) {
      const barW = (this.subType === 'oni_boss' || this.subType === 'shogun_boss' || this.subType === 'agis_colossus' || this.subType === 'skeleton_warlord' ? 80 : 44) * this.scaleMult;
      const barH = 3.5;
      const barY = (effectiveRy - headOffset * this.scaleMult + 6) | 0;
      const barX = (rx - barW / 2) | 0;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(barX, barY, barW, barH);

      if (this.postureBrokenTimer > 0) {
        // Posture Broken / Stance Broken: Flashing bright red/gold!
        const flashColor = (Math.floor(Date.now() / 120) % 2 === 0) ? '#ff003c' : '#fbbf24';
        ctx.fillStyle = flashColor;
        ctx.fillRect(barX, barY, barW, barH);

        // Render Deathblow kanji / reticle over enemy head
        const deathblowY = barY - 20;
        const pulse = 1 + 0.12 * Math.sin(Date.now() * 0.015);
        ctx.save();
        ctx.strokeStyle = '#ff003c';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(rx, deathblowY, 15 * pulse, 0, Math.PI * 2);
        ctx.stroke();

        // 4 crosshairs
        const arm = 6 * pulse;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rx - 20 * pulse, deathblowY); ctx.lineTo(rx - 20 * pulse + arm, deathblowY);
        ctx.moveTo(rx + 20 * pulse, deathblowY); ctx.lineTo(rx + 20 * pulse - arm, deathblowY);
        ctx.moveTo(rx, deathblowY - 20 * pulse); ctx.lineTo(rx, deathblowY - 20 * pulse + arm);
        ctx.moveTo(rx, deathblowY + 20 * pulse); ctx.lineTo(rx, deathblowY + 20 * pulse - arm);
        ctx.stroke();

        ctx.font = '900 12px Outfit, Shojumaru, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = flashColor;
        ctx.fillText(isBoss(this) ? '忍殺 DEATHBLOW' : '[EXECUTE]', rx, deathblowY - 22 * pulse);
        ctx.restore();
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

    // Ground contact shadow (drawn anchored at entity's physical feet baseline)
    const footOffsetY = (this.type === 'boss_agis' ? 143 : (this.type === 'boss_skeleton' ? 44 : (this.type === 'toaster_bot' ? 20 : (this.type === 'enemy_barrel' ? 42 : (this.type === 'enemy_orc' ? 27 : (this.type === 'skeleton' ? 38 : (this.type === 'evil_wizard' ? 33 : (this.type === 'enemy03' ? 17 : (this.type === 'enemy05' ? 18 : 37))))))))) * this.scaleMult;
    const shadowGroundRy = ((this.y - cy + globals.vh/2) + footOffsetY) | 0;
    const shadowGroundRx = (this.x - cx + globals.vw/2) | 0;
    const totalElevation = (this.airborneZ || 0) + Math.max(0, -(this.yOffset || 0));
    const shadowScale = totalElevation > 0 ? Math.max(0.25, 1.0 - totalElevation / 260) : 1.0;
    const shadowAlpha = (this.state === 'dead' ? alpha * 0.25 : 0.35) * shadowScale;
    
    // Elite enemy aura rings
    const isEliteEnemy = (this as any).isElite || ['musketeer', 'pyromancer', 'orc_brute', 'astromancer', 'glacial_sentinel'].includes(this.subType);
    if (isEliteEnemy && this.state !== 'dead') {
      ctx.save();
      const auraPulse = 0.65 + 0.35 * Math.sin(Date.now() * 0.006);
      ctx.strokeStyle = `rgba(251, 191, 36, ${0.55 * auraPulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(shadowGroundRx, shadowGroundRy - 3, (28 * this.scaleMult) | 0, (10 * this.scaleMult) | 0, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(245, 158, 11, ${0.3 * auraPulse})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(shadowGroundRx, shadowGroundRy - 3, (36 * this.scaleMult) | 0, (13 * this.scaleMult) | 0, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
    ctx.beginPath();
    const isLargeBoss = this.subType === 'agis_colossus' || this.subType === 'skeleton_warlord';
    ctx.ellipse(shadowGroundRx, shadowGroundRy, ((isLargeBoss ? 55 : 22) * this.scaleMult * shadowScale) | 0, ((isLargeBoss ? 16 : 7) * this.scaleMult * shadowScale) | 0, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

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

export function triggerBarrelExplosion(barrel: Enemy) {
  if ((barrel as any).hasExploded) return;
  (barrel as any).hasExploded = true;
  barrel.hp = 0;
  barrel.setState('dead');

  globals.screenShake = Math.max(globals.screenShake, 18);
  globals.shockwaves.push(new Shockwave(barrel.x, barrel.y, '#f97316'));
  const barrelExp = (vfxAnims as any).explosions?.barrel;
  if (barrelExp && barrelExp.length > 0) {
    globals.animatedEffects.push(new AnimatedEffect(barrel.x, barrel.y, barrelExp, 0.55, 1.8));
  }
  playSynthesizedThunder();
  playExplosionSfx(0.7);

  // Fire explosion particle spray
  const pCount = globals.graphicsSettings === 'low' ? 8 : 22;
  for (let i = 0; i < pCount; i++) {
    const pAng = Math.random() * Math.PI * 2;
    const pSpd = 200 + Math.random() * 450;
    globals.particles.push(Particle.acquire(barrel.x, barrel.y, Math.random() < 0.5 ? '#f97316' : '#ef4444', pSpd, 0.45, 3 + Math.random() * 3, pAng));
  }

  // Was it kicked / deflected by the player?
  const isDeflected = barrel.knockbackTimer > 0;
  if (isDeflected) {
    // Kicked barrel explodes into enemies!
    globals.floatingTexts.push(FloatingText.acquire(barrel.x, barrel.y - 45, "BARREL DETONATION! 💥", "#f97316", 26));
    for (let i = 0; i < globals.enemies.length; i++) {
      const other = globals.enemies[i];
      if (!other || other === barrel || other.state === 'dead') continue;
      const edx = other.x - barrel.x;
      const edy = other.y - barrel.y;
      if (edx * edx + edy * edy < 220 * 220) {
        callbacks.hitEnemy(other, 12);
        other.addPostureDamage(45);
        other.knockbackTimer = 0.4;
        const ang = Math.atan2(edy, edx);
        other.knockbackVx = Math.cos(ang) * 900;
        other.knockbackVy = Math.sin(ang) * 900;
      }
    }
  } else {
    // Detonates on player if in blast radius
    const pdx = globals.player.x - barrel.x;
    const pdy = globals.player.y - barrel.y;
    if (pdx * pdx + pdy * pdy < 140 * 140 && globals.player.state !== 'dead') {
      callbacks.checkPlayerHit(barrel, 2);
      globals.floatingTexts.push(FloatingText.acquire(barrel.x, barrel.y - 40, "BOOM! 💥", "#ef4444", 24));
    }
  }
}
