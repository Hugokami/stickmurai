import { globals } from './globals';
import { callbacks } from './callbacks';
import { i18n, vfxAnims } from './assets';
import {
  playSynthesizedLevelUp,
  playSynthesizedAwaken,
  playSynthesizedThunder,
  playSynthesizedSingingBowl,
  playSynthesizedTempleBell,
  playSound,
  sfx
} from './audio';
import { Slash, FloatingText, Shockwave, Particle, AnimatedEffect } from './entities';

const t = (key: string): string => i18n[globals.currentLang]?.[key] || key;

export interface PowerUp {
  nameKey: string;
  descKey: string;
  apply: () => void;
  skill?: 'enhance' | 'shield' | 'dash' | 'firewheel' | 'gravity' | 'parry_master';
  isCorrupted?: boolean;
  isFusion?: boolean;
  fusionKey?: string;
}

export const powerUps: PowerUp[] = [
  { nameKey: "puGiantName", descKey: "puGiantDesc", apply: () => globals.playerStats.slashSizeMult = Math.min(2.2, globals.playerStats.slashSizeMult + 0.125) },
  { nameKey: "puWindName", descKey: "puWindDesc", apply: () => globals.playerStats.attackCooldownBase = Math.max(0.18, globals.playerStats.attackCooldownBase * 0.92) },
  { skill: "dash", nameKey: "puFeatherName", descKey: "puFeatherDesc", apply: () => globals.playerStats.dashCooldownBase = Math.max(0.72, globals.playerStats.dashCooldownBase * 0.90) },
  { nameKey: "puSwiftName", descKey: "puSwiftDesc", apply: () => globals.playerStats.moveSpeedMult = Math.min(1.50, globals.playerStats.moveSpeedMult + 0.10) },
  { nameKey: "puBloodName", descKey: "puBloodDesc", apply: () => globals.playerStats.flowGenMult += 0.15 },
  { nameKey: "puDeadeyeName", descKey: "puDeadeyeDesc", apply: () => globals.playerStats.critChanceBonus = Math.min(0.4, (globals.playerStats.critChanceBonus || 0) + 0.1) },
  
  // Dragon's Fury (Enhance) specific
  { skill: "enhance", nameKey: "puLethalName", descKey: "puLethalDesc", apply: () => globals.playerStats.enhanceBonusDmg += 1 },
  { skill: "enhance", nameKey: "puColossalName", descKey: "puColossalDesc", apply: () => globals.playerStats.enhanceSizeMult += 0.5 },
  { skill: "enhance", nameKey: "puDurationName", descKey: "puDurationDesc", apply: () => globals.playerStats.enhanceDuration += 1.5 },
  
  // Wind Aegis (Shield) specific
  { skill: "shield", nameKey: "puShieldDurationName", descKey: "puShieldDurationDesc", apply: () => globals.playerStats.enhanceDuration += 1.5 },
  { skill: "shield", nameKey: "puShieldPulseName", descKey: "puShieldPulseDesc", apply: () => globals.playerStats.shieldPulseLevel = (globals.playerStats.shieldPulseLevel || 0) + 1 },
  { skill: "shield", nameKey: "puShieldBlastName", descKey: "puShieldBlastDesc", apply: () => globals.playerStats.shieldBlastLevel = (globals.playerStats.shieldBlastLevel || 0) + 1 },
  
  // Raijin Step (Dash) specific
  { skill: "dash", nameKey: "puDashDamageName", descKey: "puDashDamageDesc", apply: () => globals.playerStats.dashDamageLevel = (globals.playerStats.dashDamageLevel || 0) + 1 },
  { skill: "dash", nameKey: "puDashRangeName", descKey: "puDashRangeDesc", apply: () => globals.playerStats.dashRangeLevel = (globals.playerStats.dashRangeLevel || 0) + 1 },
  { skill: "dash", nameKey: "puDashThunderName", descKey: "puDashThunderDesc", apply: () => globals.playerStats.dashThunderLevel = (globals.playerStats.dashThunderLevel || 0) + 1 },
  
  // Inferno Sweep (Firewheel) specific
  { skill: "firewheel", nameKey: "puFirewheelRangeName", descKey: "puFirewheelRangeDesc", apply: () => globals.playerStats.firewheelRangeLevel = (globals.playerStats.firewheelRangeLevel || 0) + 1 },
  { skill: "firewheel", nameKey: "puFirewheelBlazeName", descKey: "puFirewheelBlazeDesc", apply: () => globals.playerStats.firewheelBlazeLevel = (globals.playerStats.firewheelBlazeLevel || 0) + 1 },
  { skill: "firewheel", nameKey: "puFirewheelEchoName", descKey: "puFirewheelEchoDesc", apply: () => globals.playerStats.firewheelEchoLevel = (globals.playerStats.firewheelEchoLevel || 0) + 1 },
  
  // Gravity Well (Gravity) specific
  { skill: "gravity", nameKey: "puGravityRadiusName", descKey: "puGravityRadiusDesc", apply: () => globals.playerStats.gravityRadiusLevel = (globals.playerStats.gravityRadiusLevel || 0) + 1 },
  { skill: "gravity", nameKey: "puGravityDamageName", descKey: "puGravityDamageDesc", apply: () => globals.playerStats.gravityDamageLevel = (globals.playerStats.gravityDamageLevel || 0) + 1 },
  { skill: "gravity", nameKey: "puGravityExplosionName", descKey: "puGravityExplosionDesc", apply: () => globals.playerStats.gravityExplosionLevel = (globals.playerStats.gravityExplosionLevel || 0) + 1 },
  
  { nameKey: "puChargeSpeedName", descKey: "puChargeSpeedDesc", apply: () => globals.playerStats.iaijutsuChargeSpeed += 0.35 },
  { nameKey: "puDeflectDmgName", descKey: "puDeflectDmgDesc", apply: () => globals.playerStats.deflectedDmg += 2 },
  { nameKey: "puVampireName", descKey: "puVampireDesc", apply: () => globals.playerStats.vampireChance += 0.06 },
  { nameKey: "puDimensionalName", descKey: "puDimensionalDesc", apply: () => globals.playerStats.iaijutsuRangeMult += 0.3 },
  { nameKey: "puFireName", descKey: "puFireDesc", apply: () => globals.playerStats.fireStanceLevel = (globals.playerStats.fireStanceLevel || 0) + 1 },
  { nameKey: "puClonesName", descKey: "puClonesDesc", apply: () => globals.playerStats.shadowClonesLevel = (globals.playerStats.shadowClonesLevel || 0) + 1 },
  { nameKey: "puStoutHeartName", descKey: "puStoutHeartDesc", apply: () => { globals.maxLives = Math.min(10, Math.max(globals.maxLives + 1, 7)); globals.lives = Math.min(globals.maxLives, globals.lives + 1); } },
  { nameKey: "puPetalArmorName", descKey: "puPetalArmorDesc", apply: () => { globals.petalArmorLevel++; if (!globals.petalArmorActive && globals.petalArmorCooldown <= 0) globals.petalArmorActive = true; } },
  { nameKey: "puEchoSlashName", descKey: "puEchoSlashDesc", apply: () => { globals.echoLevel++; } },
  { nameKey: "puTempoMasteryName", descKey: "puTempoMasteryDesc", apply: () => { globals.tempoMasteryLevel++; } },
  { nameKey: "puFrostName", descKey: "puFrostDesc", apply: () => { globals.frostStanceActive = true; } },
  { nameKey: "puVoidName", descKey: "puVoidDesc", apply: () => { globals.voidStanceActive = true; } },
  { skill: "dash", nameKey: "puFlowingCounterName", descKey: "puFlowingCounterDesc", apply: () => { globals.flowingCounterActive = true; } },
  { skill: "shield", nameKey: "puGaleVortexName", descKey: "puGaleVortexDesc", apply: () => { globals.galeVortexActive = true; globals.playerStats.enhanceDuration = Math.max(1.0, globals.playerStats.enhanceDuration - 1.0); } },
  { nameKey: "puBladeEchoesName", descKey: "puBladeEchoesDesc", apply: () => { globals.bladeEchoesActive = true; } },
  {
    nameKey: "puExecutionName",
    descKey: "puExecutionDesc",
    apply: () => {
      globals.executionUnlocked = true;
      globals.playerStats.executionLevel = (globals.playerStats.executionLevel || 0) + 1;
    }
  },

  // Option 6: Corrupted Blessings / Cursed Relics (High-Risk, High-Reward)
  {
    nameKey: "puCursedGlassName",
    descKey: "puCursedGlassDesc",
    isCorrupted: true,
    apply: () => {
      globals.maxLives = Math.max(1, globals.maxLives - 3);
      globals.lives = Math.min(globals.lives, globals.maxLives);
      globals.playerStats.enhanceBonusDmg += 3;
      globals.playerStats.slashSizeMult = Math.min(2.2, globals.playerStats.slashSizeMult + 0.25);
      globals.playerStats.dashCooldownBase = Math.max(0.72, globals.playerStats.dashCooldownBase * 0.85);
      if (globals.player) (globals.player as any).dashDuration = 0.45; // extra i-frame window
      callbacks.updateUI();
    }
  },
  {
    nameKey: "puCursedBloodName",
    descKey: "puCursedBloodDesc",
    isCorrupted: true,
    apply: () => {
      globals.bloodThirstCurseActive = true;
      globals.playerStats.flowGenMult += 0.5;
      globals.playerStats.vampireChance += 0.15;
    }
  },
  {
    nameKey: "puCursedIronName",
    descKey: "puCursedIronDesc",
    isCorrupted: true,
    apply: () => {
      globals.playerStats.dashCooldownBase *= 1.25; // Replaces sluggish movement speed penalty with shorter dash recovery
      globals.playerStats.slashSizeMult = Math.min(2.2, globals.playerStats.slashSizeMult + 0.5);
      globals.playerStats.deflectedDmg += 6; // +6 deflected damage
    }
  },
  {
    nameKey: "puCursedGreedName",
    descKey: "puCursedGreedDesc",
    isCorrupted: true,
    apply: () => {
      globals.curseOfGreedActive = true;
    }
  }
];

export interface FusionRecipe {
  key: string;
  nameKey: string;
  descKey: string;
  nameEn: string;
  nameJa: string;
  descEn: string;
  descJa: string;
  req1En: string;
  req1Ja: string;
  req2En: string;
  req2Ja: string;
  checkPrereqs: () => boolean;
  apply: () => void;
}

export const FUSION_RECIPES: FusionRecipe[] = [
  {
    key: 'plasma_tempest',
    nameKey: 'fuPlasmaName',
    descKey: 'fuPlasmaDesc',
    nameEn: 'Plasma Tempest (天雷業火)',
    nameJa: '天雷業火（プラズマ・テンペスト）',
    descEn: 'Dashes leave crackling electric firewalls (6 DMG/s). Slashing burned enemies unleashes room-clearing chain lightning for 10 DMG.',
    descJa: 'ダッシュ軌道に電磁火炎壁を展開（秒間6ダメ）。炎上中の敵を斬撃すると画面全域へ10ダメの連鎖雷撃を放出。',
    req1En: 'Inferno Sweep (or Fire upgrades)',
    req1Ja: '業火の回天（または炎属性強化）',
    req2En: 'Raijin Step (or Thunder upgrades)',
    req2Ja: '雷神の瞬歩（または雷属性強化）',
    checkPrereqs: () => {
      const hasFire = globals.selectedSkill === 'firewheel' || (globals.playerStats.firewheelBlazeLevel || 0) > 0 || globals.chosenPowerUps.some(k => k.includes('Fire'));
      const hasThunder = globals.selectedSkill === 'dash' || (globals.playerStats.dashThunderLevel || 0) > 0 || globals.chosenPowerUps.some(k => k.includes('Thunder') || k.includes('Feather'));
      return hasFire && hasThunder && globals.level >= 3;
    },
    apply: () => {
      globals.activeFusions.add('plasma_tempest');
    }
  },
  {
    key: 'singularity_cleave',
    nameKey: 'fuSingularityName',
    descKey: 'fuSingularityDesc',
    nameEn: 'Singularity Cleave (虚無の太刀)',
    nameJa: '虚無の太刀（シンギュラリティ・クリーブ）',
    descEn: 'Basic slashes fire traveling micro black holes that devour enemy bullets, pull in mobs, and implode for 20 AoE DMG.',
    descJa: '通常斬撃がマイクロ・ブラックホールを射出。敵弾を消滅させ敵を吸引し、最後に20ダメの特異点爆発を起こす。',
    req1En: 'Gravity Well (or Void Stance)',
    req1Ja: '重力崩壊（または虚無の型）',
    req2En: "Dragon's Fury (or High Damage)",
    req2Ja: '竜の激昂（または攻撃力強化）',
    checkPrereqs: () => {
      const hasGravity = globals.selectedSkill === 'gravity' || (globals.playerStats.gravityExplosionLevel || 0) > 0 || globals.voidStanceActive;
      const hasDragon = globals.selectedSkill === 'enhance' || globals.playerStats.enhanceBonusDmg >= 2 || globals.chosenPowerUps.some(k => k.includes('Lethal') || k.includes('Giant'));
      return hasGravity && hasDragon && globals.level >= 3;
    },
    apply: () => {
      globals.activeFusions.add('singularity_cleave');
    }
  },
  {
    key: 'hundred_phantoms',
    nameKey: 'fuPhantomsName',
    descKey: 'fuPhantomsDesc',
    nameEn: 'Hundred Demon March (百鬼夜行)',
    nameJa: '百鬼夜行（ハンドレッド・ファントム）',
    descEn: 'Every Perfect Dodge or Finisher spawns an immortal shadow samurai duplicate for 12s that mirrors all your slashes.',
    descJa: '見切り回避またはコンボフィニッシャー発動時、12秒間プレイヤーの全斬撃を完全模倣する影武者を召喚。',
    req1En: 'Shadow Step / Clones',
    req1Ja: '影遁・分身術',
    req2En: 'Glass Edge (or Cursed Relic)',
    req2Ja: '玻璃の刃（または呪物）',
    checkPrereqs: () => {
      const hasShadow = globals.selectedSkill === 'decoy_illusion' || (globals.playerStats.shadowClonesLevel || 0) > 0 || globals.chosenPowerUps.some(k => k.includes('Clones') || k.includes('Decoy'));
      const hasCursed = globals.maxLives === 1 || globals.bloodThirstCurseActive || globals.chosenPowerUps.some(k => k.includes('Cursed'));
      return hasShadow && hasCursed && globals.level >= 3;
    },
    apply: () => {
      globals.activeFusions.add('hundred_phantoms');
    }
  },
  {
    key: 'kamaitachi',
    nameKey: 'fuKamaitachiName',
    descKey: 'fuKamaitachiDesc',
    nameEn: 'Kamaitachi Sickle-Wind (鎌鼬の風)',
    nameJa: '鎌鼬の風（カマイタチ・シックル）',
    descEn: 'Slashes unleash 2 razor crescent wind discs that ricochet off arena borders up to 3 times, slicing through hordes for 8 DMG.',
    descJa: '斬撃から2つの超高速真空鎌を射出。画面端で最大3回跳ね返り、敵軍団を貫通して8ダメージを与える。',
    req1En: 'Wind Aegis (or Wind Stance)',
    req1Ja: '烈風の加護（または風属性）',
    req2En: 'Deflect Damage >= 4',
    req2Ja: '弾き返しダメージ強化',
    checkPrereqs: () => {
      const hasWind = globals.selectedSkill === 'shield' || globals.chosenPowerUps.some(k => k.includes('Wind') || k.includes('Shield') || k.includes('Gale'));
      const hasDeflect = (globals.playerStats.deflectedDmg || 1) >= 4 || globals.chosenPowerUps.some(k => k.includes('Echo') || k.includes('Iron'));
      return hasWind && hasDeflect && globals.level >= 3;
    },
    apply: () => {
      globals.activeFusions.add('kamaitachi');
    }
  },
  {
    key: 'asura_storm',
    nameKey: 'fuAsuraName',
    descKey: 'fuAsuraDesc',
    nameEn: "Asura's Blade Storm (修羅の六腕)",
    nameJa: '修羅の六腕（アスラ・ストーム）',
    descEn: 'Parrying any attack triggers a 360° storm of 6 phantom cross-slashes (12 DMG each) and restores 1 Heart if 3+ enemies are struck.',
    descJa: '攻撃をパリィすると全方位360度に6本の幻影斬撃（各12ダメ）が爆発。3体以上命中時にハートを1回復。',
    req1En: 'Parry Master',
    req1Ja: '弾きの極意',
    req2En: 'Blood Thirst (or Vampire Chance)',
    req2Ja: '血の渇き（または吸血確率）',
    checkPrereqs: () => {
      const hasParry = globals.selectedSkill === 'parry_master' || globals.chosenPowerUps.some(k => k.includes('Parry'));
      const hasBlood = globals.bloodThirstCurseActive || globals.playerStats.vampireChance > 0 || globals.chosenPowerUps.some(k => k.includes('Blood'));
      return hasParry && hasBlood && globals.level >= 3;
    },
    apply: () => {
      globals.activeFusions.add('asura_storm');
    }
  }
];

function applyStatLevelUp() {
  const stats = [
    ['slashBonusDmgPct', 0.06, '+6% Slash Dmg'],
    ['attackCooldownBase', -0.018, '-0.018s Atk CD'],
    ['dashCooldownBase', -0.06, '-0.06s Dash CD'],
    ['moveSpeedMult', 0.05, '+5% Speed'],
    ['postureDmgBonus', 2, '+2 Posture Break'],
    ['iaijutsuBonusDmg', 2, '+2 Iai Dmg'],
    ['flowGenMult', 0.08, '+8% Flow Gen']
  ] as const;
  const [key, amount, label] = stats[Math.floor(Math.random() * stats.length)];
  const current = (globals.playerStats as any)[key] || 0;
  (globals.playerStats as any)[key] = key.includes('Cooldown') 
    ? Math.max(key === 'attackCooldownBase' ? 0.18 : 0.72, current + amount) 
    : (key === 'moveSpeedMult' ? Math.min(1.5, current + amount) : current + amount);
  
  globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 50, `LVL UP! ${label}`, '#4ade80', 24));
  callbacks.updateUI();
}

export function triggerLevelUp() {
  if (globals.gameState !== 'playing') return;
  globals.exp -= globals.maxExp;
  globals.maxExp = Math.round(globals.maxExp * 1.25);
  globals.level++;
  
  const maxHearts = globals.gameMode === 'zen' ? 3 : globals.maxLives;
  if (globals.lives < maxHearts) globals.lives++;

  applyStatLevelUp();
  playSynthesizedLevelUp();
}

export function omnislashHitDmg(hitIndex: number, isFinalBlast = false): number {
  const base = isFinalBlast ? 24 : 14;
  const slashBonus = globals.playerStats?.slashBonusDmgPct || 0;
  const iaiBonus = globals.playerStats?.iaijutsuBonusDmg || 0;
  const enhanceBonus = (globals.selectedSkill === 'enhance' && globals.enhanceActiveTimer > 0) ? (globals.playerStats?.enhanceBonusDmg || 1) * 2 : 0;
  const comboBonus = Math.min(0.6, (globals.combo || 0) * 0.01 + hitIndex * 0.02);
  const scaling = 1 + slashBonus + Math.min(1.0, (globals.level - 1) * 0.04);
  const dmg = Math.round((base * scaling * (1 + comboBonus)) + iaiBonus + enhanceBonus);
  return Math.max(isFinalBlast ? 16 : 6, dmg);
}

const ultOptions = [
  { 
    nameKey: "ultShadowName", 
    descKey: "ultShadowDesc",
    apply: () => {
       globals.flowState = 'awakened';
       globals.screenShake = 35;
       globals.invertScreenTimer = 0.25;

       triggerMangaCutin('shadow');

       // Shadow awakening blast
       globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#c084fc'));
       globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 120, globals.currentLang === 'ja' ? '影の覚醒！' : 'SHADOW AWAKENING!', 'neon-#c084fc', 56));
       for (let i = 0; i < 20; i++) {
         const angle = Math.random() * Math.PI * 2;
         const speed = 150 + Math.random() * 250;
         globals.particles.push(Particle.acquire(globals.player.x, globals.player.y, '#c084fc', speed, 0.5, 2.5 + Math.random() * 2, angle));
       }
    }
  },
  {
    nameKey: "ultOmniName",
    descKey: "ultOmniDesc",
    apply: () => {
        globals.flowState = 'omnislash';
        globals.flow = 0;

        // get targets
        const targets = globals.enemies.filter(e => e.state !== 'dead');
        const maxVisuals = 10;
        const staggerInterval = 0.015;
        const finalDelay = (Math.min(targets.length, maxVisuals) * staggerInterval) + 0.15;

        // Slow-motion and hit-stop completely disabled to ensure butter-smooth 60fps
        globals.timeSlowDuration = 0; 
        globals.timeSlowFactor = 1.0;
        globals.targetTimeSlowFactor = 1.0;
        globals.hitStop = 0;
        globals.screenShake = 60;

        // stun all active enemies so they freeze in place
        globals.enemies.forEach(e => {
          if (e.state !== 'dead') {
            e.vx = 0; e.vy = 0;
            e.stunTimer = Math.max(e.stunTimer || 0, finalDelay + 0.5);
          }
        });
        globals.invulnTimer = finalDelay + 0.5;

        // Enable screen-wide speedlines overlay during the slashes
        const speedlines = document.getElementById('speedlines-overlay');
        if (speedlines) {
          speedlines.classList.add('active');
          setTimeout(() => { speedlines.classList.remove('active'); }, finalDelay * 1000 + 400);
        }

        triggerMangaCutin('omni');

        // play awakening sfx
        playSynthesizedAwaken();

        // floating text
        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 120, globals.currentLang === 'ja' ? '超究武神覇斬！' : 'OMNISLASH!', 'neon-#ffd700', 72));
        
        // start shockwave
        globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#ffd700'));

       // slash all targetable active enemies
       targets.forEach((e, idx) => {
         // stagger cross cuts
         const slashDelay = idx * staggerInterval;
         globals.delayedActions.push({
           delay: slashDelay,
           run: () => {
             if (e.state === 'dead') return;
             
             // hit target for 16 DMG (always applied)
             const isBoss = e.subType?.includes('boss') || (e as any).isBoss;
              const hitDmg = isBoss ? Math.min(32, omnislashHitDmg(idx)) : omnislashHitDmg(idx);
              callbacks.hitEnemy(e, hitDmg);
             
             // limit heavy canvas and sound context resources to prevent lag
             if (idx < maxVisuals) {
               if (idx % 2 === 0) {
                 playSound(sfx.slash, 1.2);
               }
               
               // spawn 3 cut lines (including a horizontal sweep)
               globals.slashes.push(Slash.acquire(e.x, e.y, Math.PI / 4, 2.5 * e.scaleMult, true));
               globals.slashes.push(Slash.acquire(e.x, e.y, -Math.PI / 4, 2.5 * e.scaleMult, true));
               globals.slashes.push(Slash.acquire(e.x, e.y, 0, 3.0 * e.scaleMult, true));
               
               // blast wave
               globals.shockwaves.push(new Shockwave(e.x, e.y, 'rgba(255, 30, 70, 0.5)'));

               // sparks
               for (let i = 0; i < 4; i++) {
                 const angle = Math.random() * Math.PI * 2;
                 const speed = 200 + Math.random() * 300;
                 globals.particles.push(Particle.acquire(e.x, e.y, i % 2 === 0 ? '#ff1e46' : '#00ffff', speed, 0.4, 1.5 + Math.random() * 1.5, angle));
               }
               
               globals.screenShake = Math.max(globals.screenShake, 18);
             }
           }
         });
       });

       // final screen clearing blast
       globals.delayedActions.push({
         delay: finalDelay,
         run: () => {

            // play lightning thunder sound
            playSynthesizedThunder();
            globals.invertScreenTimer = 0.3;
            
            globals.screenShake = 65;

            // golden shockwave
            globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#ffd700'));
            const lightBurstFinisher = (vfxAnims as any).shockwaves?.lightBurst;
            if (lightBurstFinisher && lightBurstFinisher.length > 0) {
              globals.animatedEffects.push(new AnimatedEffect(globals.player.x, globals.player.y, lightBurstFinisher, 0.35, 2.8));
            }
            
            // Deal 20 DMG to all remaining active enemies
            globals.enemies.forEach(enemy => {
              if (enemy.state !== 'dead') {
                const isBoss = enemy.subType?.includes('boss') || (enemy as any).isBoss;
                const finalDmg = isBoss ? Math.min(48, omnislashHitDmg(0, true)) : omnislashHitDmg(0, true);
                callbacks.hitEnemy(enemy, finalDmg);
                for (let i = 0; i < 4; i++) {
                  globals.particles.push(Particle.acquire(enemy.x, enemy.y, '#ffd700', 150 + Math.random() * 150, 0.4, 2, Math.random() * Math.PI * 2));
                }
              }
            });

            // restore 1 Heart
            globals.lives = Math.min(globals.maxLives, globals.lives + 1);
            globals.flowState = 'normal';
            globals.ultCooldown = globals.ultCooldownMax; // Cooldown starts immediately when Omnislash ends
            globals.timeSlowDuration = 0;
            globals.timeSlowFactor = 1.0;
            globals.targetTimeSlowFactor = 1.0;
            callbacks.updateUI();
         }
       });
    }
  },
  {
    nameKey: "ultStormName",
    descKey: "ultStormDesc",
    apply: () => {
       globals.flowState = 'storm_god';
       globals.screenShake = 50;
       globals.invertScreenTimer = 0.25;

       triggerMangaCutin('storm');

       // play lightning/thunder sound
       playSynthesizedThunder();

       // Storm awakening blast
       globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#fbbf24'));
       const lightBurst = (vfxAnims as any).shockwaves?.lightBurst;
       if (lightBurst && lightBurst.length > 0) {
         globals.animatedEffects.push(new AnimatedEffect(globals.player.x, globals.player.y, lightBurst, 0.35, 2.6));
       }
       const atkUp = (vfxAnims as any).spells?.attackUp;
       if (atkUp && atkUp.length > 0) {
         globals.animatedEffects.push(new AnimatedEffect(globals.player.x, globals.player.y, atkUp, 0.5, 2.0));
       }
       globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 120, globals.currentLang === 'ja' ? '雷神の稲妻！' : 'WRATH OF THE STORM GOD!', 'neon-#fbbf24', 56));
       for (let i = 0; i < 25; i++) {
         const angle = Math.random() * Math.PI * 2;
         const speed = 180 + Math.random() * 300;
         globals.particles.push(Particle.acquire(globals.player.x, globals.player.y, '#fbbf24', speed, 0.5, 2.5 + Math.random() * 2, angle));
       }
    }
  }
];

export function triggerZenField() {
  globals.flowState = 'normal';
  globals.flow = 0;
  globals.zenFieldActiveTimer = 8.0;
  globals.zenFieldTickTimer = 0;
  globals.invulnTimer = 8.0;
  globals.timeSlowDuration = 0;
  globals.targetTimeSlowFactor = 1.0;
  globals.timeSlowFactor = 1.0;
  
  globals.screenShake = 40;
  globals.invertScreenTimer = 0.25;
  
  triggerMangaCutin('zen');

  globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 120, t('zenFieldText'), "neon-#00ffff", 48));
  globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#00ffff'));
  
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 200 + Math.random() * 200;
    globals.particles.push(Particle.acquire(globals.player.x, globals.player.y, '#00ffff', speed, 0.6, 3, angle));
  }
}

export function triggerSpecificUltimate(type: 'shadow' | 'omni' | 'storm' | 'zen') {
  if (globals.flow < globals.playerStats.flowMax || globals.flowState !== 'normal' || globals.ultCooldown > 0) return;
  globals.flow = 0;

  if (globals.gameMode === 'zen' || type === 'zen') {
    playSynthesizedTempleBell();
    triggerZenField();
    return;
  }

  if (type === 'shadow') {
    playSynthesizedSingingBowl();
    ultOptions[0].apply();
  } else if (type === 'omni') {
    playSynthesizedAwaken();
    ultOptions[1].apply();
  } else if (type === 'storm') {
    playSynthesizedThunder();
    ultOptions[2].apply();
  } else {
    playSynthesizedAwaken();
    ultOptions[1].apply();
  }
}

export function activateAwakening() {
  if (globals.flow < globals.playerStats.flowMax || globals.flowState !== 'normal' || globals.ultCooldown > 0) return;
  if (globals.gameMode === 'zen') {
    triggerSpecificUltimate('zen');
  } else {
    triggerSpecificUltimate('omni');
  }
}

export interface ShopSlot {
  power: PowerUp;
  price: number;
  quality: 'common' | 'rare' | 'epic' | 'legendary';
}

let currentShopInventory: ShopSlot[] = [];

export function resetShop() {
  currentShopInventory = [];
  globals.shopRefreshCount = 0;
  globals.shopOpen = false;
  const modal = document.getElementById('shop-modal');
  if (modal) modal.style.display = 'none';
}

export function getPowerQuality(p: PowerUp): 'common' | 'rare' | 'epic' | 'legendary' {
  if (p.isFusion) return 'legendary';
  const nk = p.nameKey;
  if (nk.includes('Void') || nk.includes('Tempo') || nk.includes('Execution') || nk.includes('Clones') || nk.includes('Blood')) return 'legendary';
  if (nk.includes('Echo') || nk.includes('Fire') || nk.includes('Frost') || nk.includes('BladeEchoes') || nk.includes('Gale') || nk.includes('Lethal') || nk.includes('Colossal')) return 'epic';
  if (nk.includes('Giant') || nk.includes('Deadeye') || nk.includes('Vampire') || nk.includes('ChargeSpeed') || nk.includes('Dimensional') || nk.includes('StoutHeart') || nk.includes('PetalArmor') || nk.includes('Pulse') || nk.includes('Blast')) return 'rare';
  return 'common';
}

export function getQualityPrice(q: 'common' | 'rare' | 'epic' | 'legendary'): number {
  switch (q) {
    case 'legendary': return 75;
    case 'epic': return 45;
    case 'rare': return 25;
    case 'common': return 12;
  }
}

export function rollShopInventory(): ShopSlot[] {
  const available = powerUps.filter(p => {
    if (p.isCorrupted) return false;
    if (p.nameKey === 'puFrostName' && globals.frostStanceActive) return false;
    if (p.nameKey === 'puVoidName' && globals.voidStanceActive) return false;
    if (p.nameKey === 'puFlowingCounterName' && globals.flowingCounterActive) return false;
    if (p.nameKey === 'puGaleVortexName' && globals.galeVortexActive) return false;
    if (p.nameKey === 'puBladeEchoesName' && globals.bladeEchoesActive) return false;
    if (p.nameKey === 'puGiantName' && globals.playerStats.slashSizeMult >= 2.2) return false;
    if (p.nameKey === 'puWindName' && globals.playerStats.attackCooldownBase <= 0.18) return false;
    if (p.nameKey === 'puFeatherName' && globals.playerStats.dashCooldownBase <= 0.72) return false;
    if (p.nameKey === 'puSwiftName' && globals.playerStats.moveSpeedMult >= 1.5) return false;
    if (p.nameKey === 'puDeadeyeName' && (globals.playerStats.critChanceBonus || 0) >= 0.4) return false;
    if (p.nameKey === 'puStoutHeartName' && globals.maxLives >= 10) return false;
    if (p.skill && p.skill !== globals.selectedSkill) return false;
    return true;
  });

  const shuffled = [...available].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 4);
  return selected.map(p => {
    const q = getPowerQuality(p);
    return {
      power: p,
      quality: q,
      price: getQualityPrice(q)
    };
  });
}

export function openShop() {
  if (globals.gameState !== 'playing') return;
  globals.gameState = 'paused';
  globals.shopOpen = true;
  if (currentShopInventory.length === 0) {
    currentShopInventory = rollShopInventory();
  }
  renderShopModal();
}

export function closeShop() {
  globals.shopOpen = false;
  const modal = document.getElementById('shop-modal');
  if (modal) modal.style.display = 'none';
  if (globals.gameState === 'paused') {
    globals.gameState = 'playing';
  }
}

export function renderShopModal() {
  let modal = document.getElementById('shop-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'shop-modal';
    modal.className = 'overlay';
    document.getElementById('app')?.appendChild(modal);
  }
  modal.style.display = 'flex';

  const refreshCost = Math.ceil(5 * Math.pow(1.35, globals.shopRefreshCount || 0));
  const isFreeRefresh = !!(globals.unlockedSeals && globals.unlockedSeals.includes(5) && (globals.shopRefreshCount || 0) === 0);
  const costLabel = isFreeRefresh ? 'FREE (SEAL V)' : `◆ ${refreshCost}`;

  const qualityColorMap: Record<string, string> = {
    common: '#94a3b8',
    rare: '#38bdf8',
    epic: '#c084fc',
    legendary: '#fbbf24'
  };

  modal.innerHTML = `
    <div class="menu-box" style="max-width: 680px; width: min(680px, 94vw); max-height: 90vh; padding: 20px; border-color: #fbbf24; box-shadow: 0 0 35px rgba(251, 191, 36, 0.35); overflow-y: auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 12px; border-bottom: 1px solid rgba(251, 191, 36, 0.3); padding-bottom: 8px;">
        <h2 style="font-family: 'Shojumaru', sans-serif; color: #fbbf24; margin: 0; font-size: clamp(18px, 3vh, 26px); text-shadow: 0 0 15px rgba(251, 191, 36, 0.5);">⛩️ BATTLE REQUISITION</h2>
        <div style="font-family: 'Orbitron', monospace; font-size: 16px; color: #fbbf24; font-weight: bold; background: rgba(0,0,0,0.6); padding: 4px 12px; border-radius: 12px; border: 1px solid rgba(251, 191, 36, 0.4);">
          ◆ <span id="modal-currency-count">${globals.stageCurrency || 0}</span>
        </div>
      </div>
      
      <p style="font-size: 12px; color: #94a3b8; margin: 0 0 14px 0; font-family: 'Space Mono', monospace;">
        Temporary stage requisitions. All acquisitions and shards reset upon clearing or leaving this stage.
      </p>

      <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 10px; padding: 10px 14px; margin-bottom: 14px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 24px;">❤️</span>
          <div>
            <div style="font-size: 13px; font-weight: bold; color: #f87171;">Field Ration (Emergency Heal)</div>
            <div style="font-size: 11px; color: #94a3b8;">Restore 1 Heart immediately (Current: ${globals.lives}/${globals.maxLives})</div>
          </div>
        </div>
        <button id="shop-ration-btn" class="menu-btn btn-compact" style="border-color: #ef4444; color: #ef4444; min-height: 32px; height: 32px; min-width: 105px;" ${(globals.stageCurrency || 0) < 20 || globals.lives >= globals.maxLives ? 'disabled' : ''}>
          Buy (◆ 20)
        </button>
      </div>

      <div id="shop-items-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; width: 100%; margin-bottom: 16px;">
      </div>

      <div style="display: flex; gap: 12px; width: 100%; justify-content: center; flex-wrap: wrap;">
        <button id="shop-refresh-btn" class="menu-btn btn-compact" style="border-color: #38bdf8; color: #38bdf8; min-height: 36px; height: 36px; min-width: 140px;">
          🔄 Reroll (${costLabel})
        </button>
        <button id="shop-close-btn" class="menu-btn exit-btn btn-compact" style="min-height: 36px; height: 36px; min-width: 100px;">
          ✕ Resume
        </button>
      </div>
    </div>
  `;

  const grid = modal.querySelector('#shop-items-grid')!;
  currentShopInventory.forEach((slot, idx) => {
    const card = document.createElement('div');
    const qColor = qualityColorMap[slot.quality];
    const canAfford = (globals.stageCurrency || 0) >= slot.price;

    card.className = 'power-card';
    card.style.cssText = `
      border-color: ${qColor};
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(10, 10, 15, 0.95));
      box-shadow: 0 0 15px ${qColor}33;
      padding: 12px 10px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 140px;
      cursor: ${canAfford ? 'pointer' : 'not-allowed'};
      opacity: ${canAfford ? '1' : '0.45'};
      transition: transform 0.15s ease;
    `;

    card.innerHTML = `
      <div>
        <span style="font-size: 9px; font-weight: 900; letter-spacing: 1px; color: ${qColor}; text-transform: uppercase; border: 1px solid ${qColor}66; padding: 1px 6px; border-radius: 6px; display: inline-block; margin-bottom: 6px;">
          ${slot.quality}
        </span>
        <h3 style="font-size: 13px; margin: 0 0 4px 0; color: #f8fafc;">${t(slot.power.nameKey)}</h3>
        <p style="font-size: 10.5px; color: #cbd5e1; margin: 0; line-height: 1.35;">${t(slot.power.descKey)}</p>
      </div>
      <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;">
        <span style="font-family: 'Orbitron', monospace; font-size: 13px; font-weight: bold; color: ${canAfford ? '#fbbf24' : '#ef4444'};">
          ◆ ${slot.price}
        </span>
        <span style="font-size: 10px; color: ${canAfford ? '#4ade80' : '#94a3b8'}; font-weight: bold;">
          ${canAfford ? 'BUY' : 'LACK'}
        </span>
      </div>
    `;

    if (canAfford) {
      const buy = (e: Event) => {
        e.stopPropagation();
        if ((globals.stageCurrency || 0) < slot.price) return;
        globals.stageCurrency -= slot.price;
        slot.power.apply();
        globals.chosenPowerUps.push(slot.power.nameKey);
        currentShopInventory.splice(idx, 1);
        callbacks.updateUI();
        playSound(sfx.magatamaPickup, 1.0);
        renderShopModal();
      };
      card.addEventListener('pointerdown', buy);
      card.addEventListener('click', buy);
    }
    grid.appendChild(card);
  });

  const rationBtn = modal.querySelector('#shop-ration-btn') as HTMLButtonElement;
  if (rationBtn) {
    const buyRation = (e: Event) => {
      e.stopPropagation();
      if ((globals.stageCurrency || 0) < 20 || globals.lives >= globals.maxLives) return;
      globals.stageCurrency -= 20;
      globals.lives++;
      callbacks.updateUI();
      playSound(sfx.magatamaPickup, 1.0);
      globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 60, "+1 ❤️", "#4ade80", 26));
      renderShopModal();
    };
    rationBtn.addEventListener('pointerdown', buyRation);
    rationBtn.addEventListener('click', buyRation);
  }

  const refreshBtn = modal.querySelector('#shop-refresh-btn');
  if (refreshBtn) {
    const doRefresh = (e: Event) => {
      e.stopPropagation();
      const cost = isFreeRefresh ? 0 : refreshCost;
      if ((globals.stageCurrency || 0) < cost) return;
      globals.stageCurrency -= cost;
      globals.shopRefreshCount = (globals.shopRefreshCount || 0) + 1;
      currentShopInventory = rollShopInventory();
      callbacks.updateUI();
      playSound(sfx.slash, 0.7);
      renderShopModal();
    };
    refreshBtn.addEventListener('pointerdown', doRefresh);
    refreshBtn.addEventListener('click', doRefresh);
  }

  const closeBtn = modal.querySelector('#shop-close-btn');
  if (closeBtn) {
    const doClose = (e: Event) => {
      e.stopPropagation();
      closeShop();
    };
    closeBtn.addEventListener('pointerdown', doClose);
    closeBtn.addEventListener('click', doClose);
  }
}

export function triggerMangaCutin(type: 'shadow' | 'omni' | 'storm' | 'zen') {
  const mangaCutin = document.getElementById('manga-cutin');
  if (mangaCutin) {
    mangaCutin.className = '';
    mangaCutin.classList.add('active', `ult-${type}`);
    
    const video = mangaCutin.querySelector('video');
    if (video) {
      if (!video.src && video.dataset.src) {
        video.src = video.dataset.src;
      }
      video.currentTime = 0;
      video.play().catch(err => console.log("Video playback error:", err));
    }
    
    const existingTimeout = (mangaCutin as any).activeTimeout;
    if (existingTimeout) clearTimeout(existingTimeout);
    
    (mangaCutin as any).activeTimeout = setTimeout(() => {
      mangaCutin.classList.remove('active');
    }, 1650);
  }
}

export function applyRandomStartUpgrade(): string {
  let availablePowers = [...powerUps];
  if (globals.gameMode === 'zen') {
    availablePowers = [
      { nameKey: "puFeatherName", descKey: "puFeatherDesc", apply: () => globals.playerStats.dashCooldownBase = Math.max(0.72, globals.playerStats.dashCooldownBase * 0.90) },
      { nameKey: "puSwiftName", descKey: "puSwiftDesc", apply: () => globals.playerStats.moveSpeedMult = Math.min(1.50, globals.playerStats.moveSpeedMult + 0.10) },
      { nameKey: "puBloodName", descKey: "puBloodDesc", apply: () => globals.playerStats.flowGenMult += 0.15 },
      { nameKey: "puDeflectDmgName", descKey: "puDeflectDmgDesc", apply: () => globals.playerStats.deflectedDmg += 2 }
    ];
  } else {
    availablePowers = availablePowers.filter(power => {
      if (power.skill) {
        return power.skill === globals.selectedSkill;
      }
      return true;
    });
  }

  if (availablePowers.length > 0) {
    const randomPower = availablePowers[Math.floor(Math.random() * availablePowers.length)];
    randomPower.apply();
    const name = t(randomPower.nameKey);
    globals.chosenPowerUps.push(randomPower.nameKey);
    return name;
  }
  return "None";
}
