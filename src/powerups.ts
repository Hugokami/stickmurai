import { upgradePreview } from './progressionQol';
import { globals } from './globals';
import { callbacks } from './callbacks';
import { i18n, vfxAnims } from './assets';
import { safeStorage } from './storage';
import {
  playSynthesizedLevelUp,
  playSynthesizedAwaken,
  playSynthesizedThunder,
  playSynthesizedFusionUnlock,
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
  { nameKey: "puStoutHeartName", descKey: "puStoutHeartDesc", apply: () => { globals.maxLives = Math.min(7, globals.maxLives + 1); globals.lives = Math.min(globals.maxLives, globals.lives + 1); callbacks.updateUI(); } },
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
      globals.maxLives = 1;
      globals.lives = 1;
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

export function triggerLevelUp() {
  if (globals.gameState !== 'playing') return;
  playSynthesizedLevelUp();
  globals.gameState = 'levelup';
  
  const levelUpScreen = document.getElementById('level-up-screen')!;
  const powerChoicesContainer = document.getElementById('power-choices')!;
  const levelDisplay = document.getElementById('level-display')!;
  
  levelUpScreen.style.display = 'flex';
  powerChoicesContainer.innerHTML = '';
  
  // Heal 1 heart on level up
  const maxHearts = globals.gameMode === 'zen' ? 3 : 5;
  if (globals.lives < maxHearts) globals.lives++;
  callbacks.updateUI();
  
  let availablePowers = [...powerUps];
  if (globals.gameMode === 'zen') {
    availablePowers = [
      { nameKey: "puFeatherName", descKey: "puFeatherDesc", apply: () => globals.playerStats.dashCooldownBase = Math.max(0.72, globals.playerStats.dashCooldownBase * 0.90) },
      { nameKey: "puSwiftName", descKey: "puSwiftDesc", apply: () => globals.playerStats.moveSpeedMult = Math.min(1.50, globals.playerStats.moveSpeedMult + 0.10) },
      { nameKey: "puBloodName", descKey: "puBloodDesc", apply: () => globals.playerStats.flowGenMult += 0.15 },
      { nameKey: "puDeadeyeName", descKey: "puDeadeyeDesc", apply: () => globals.playerStats.critChanceBonus = Math.min(0.4, (globals.playerStats.critChanceBonus || 0) + 0.1) },
      { nameKey: "puDeflectDmgName", descKey: "puDeflectDmgDesc", apply: () => globals.playerStats.deflectedDmg += 2 },
      { nameKey: "puZenRestoreName", descKey: "puZenRestoreDesc", apply: () => { globals.lives = Math.min(3, globals.lives + 1); callbacks.updateUI(); return 0; } }
    ];
  } else {
    // Filter powerups dynamically based on chosen skill and uniqueness
    availablePowers = availablePowers.filter(power => {
      if (power.isCorrupted && globals.chosenPowerUps.includes(power.nameKey)) return false;
      // Filter out unique one-time upgrades that are already acquired
      if (power.nameKey === 'puFrostName' && globals.frostStanceActive) return false;
      if (power.nameKey === 'puVoidName' && globals.voidStanceActive) return false;
      if (power.nameKey === 'puFlowingCounterName' && globals.flowingCounterActive) return false;
      if (power.nameKey === 'puGaleVortexName' && globals.galeVortexActive) return false;
      if (power.nameKey === 'puBladeEchoesName' && globals.bladeEchoesActive) return false;

      if (power.skill) {
        return power.skill === globals.selectedSkill;
      }
      return true;
    });
  }
  
  // Do not offer capped upgrades (or clamp a faster hero to a slower cooldown).
  availablePowers = availablePowers.filter(power => {
  const s = globals.playerStats;
  if (power.nameKey === 'puGiantName') return s.slashSizeMult < 2.2;
  if (power.nameKey === 'puWindName') return s.attackCooldownBase > 0.18;
  if (power.nameKey === 'puFeatherName') return s.dashCooldownBase > 0.72;
  if (power.nameKey === 'puSwiftName') return s.moveSpeedMult < 1.5;
  if (power.nameKey === 'puDeadeyeName') return (s.critChanceBonus || 0) < 0.4;
  if (power.nameKey === 'puStoutHeartName') return globals.maxLives < 7;
  return true;
  });

  const normalPowers = availablePowers.filter(p => !p.isCorrupted);
  const cursedPowers = availablePowers.filter(p => p.isCorrupted);
  const shuffledNormal = [...normalPowers].sort(() => 0.5 - Math.random());
  const choices: PowerUp[] = [];

  // Check for available, unacquired Forbidden Fusion Arts!
  const readyFusion = FUSION_RECIPES.find(f => !globals.activeFusions.has(f.key) && f.checkPrereqs());
  if (readyFusion) {
    choices.push({
      nameKey: readyFusion.nameKey,
      descKey: readyFusion.descKey,
      isFusion: true,
      fusionKey: readyFusion.key,
      apply: () => {
        readyFusion.apply();
        playSynthesizedFusionUnlock();
        if (!globals.discoveredFusions.includes(readyFusion.key)) {
          globals.discoveredFusions.push(readyFusion.key);
          safeStorage.setItem('stickmurai_fusions', JSON.stringify(globals.discoveredFusions));
        }
        globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#ffd700'));
        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 80, globals.currentLang === 'ja' ? '【神聖合一奥義習得！】' : 'FORBIDDEN FUSION SYNTHESIZED!', '#ffd700', 36));
      }
    });
  }

  // 35% chance to offer a Cursed Blessing in non-zen mode when level >= 3
  const offerCurse = (globals.gameMode !== 'zen' && globals.level >= 3 && Math.random() < 0.35 && cursedPowers.length > 0 && choices.length === 0);
  if (offerCurse) {
    const randomCurse = cursedPowers[Math.floor(Math.random() * cursedPowers.length)];
    choices.push(shuffledNormal[0], shuffledNormal[1], randomCurse);
  } else {
    while (choices.length < 3 && shuffledNormal.length > 0) {
      choices.push(shuffledNormal.shift()!);
    }
  }
  
  choices.forEach((power, index) => {
    const card = document.createElement('div');
    card.className = 'power-card';
    card.style.animation = 'power-card-entrance 0.45s cubic-bezier(0.16, 1, 0.3, 1) both, card-glow-pulse 3s infinite alternate';
    card.style.animationDelay = `${index * 0.08}s, ${index * 0.08 + 0.45}s`;
    
    let category = 'basic';
    const nk = power.nameKey;
    if (power.isFusion) {
      card.style.borderColor = '#ffd700';
      card.style.background = 'linear-gradient(135deg, rgba(35, 20, 5, 0.98), rgba(60, 30, 10, 0.98))';
      card.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.6)';
      card.innerHTML = `<span style="display:inline-block; font-size:10px; font-weight:900; letter-spacing:1.5px; color:#ffd700; background:rgba(255,215,0,0.2); padding:3px 10px; border-radius:10px; margin-bottom:8px; border:1px solid rgba(255,215,0,0.6);">⚡ FORBIDDEN FUSION</span><h3 style="color:#fef08a;">${t(power.nameKey)}</h3><p style="color:#fde047;">${t(power.descKey)}</p>`;
    } else if (power.isCorrupted) {
      category = 'cursed';
      card.style.borderColor = 'rgba(239, 68, 68, 0.7)';
      card.style.background = 'linear-gradient(135deg, rgba(30, 10, 20, 0.95), rgba(15, 5, 10, 0.98))';
      card.style.boxShadow = '0 0 25px rgba(239, 68, 68, 0.35)';
      card.innerHTML = `<span style="display:inline-block; font-size:10px; font-weight:800; letter-spacing:1px; color:#ef4444; background:rgba(239,68,68,0.18); padding:2px 8px; border-radius:10px; margin-bottom:8px; border:1px solid rgba(239,68,68,0.4);">☠ CURSED RELIC</span><h3 style="color:#fee2e2;">${t(power.nameKey)}</h3><p style="color:#fca5a5;">${t(power.descKey)}</p>`;
    } else {
      if (nk.includes('Fire') || nk.includes('Blaze')) {
        category = 'fire';
      } else if (nk.includes('Wind') || nk.includes('Shield') || nk.includes('Gale') || nk.includes('Swift') || nk.includes('Feather')) {
        category = 'wind';
      } else if (nk.includes('Dash') || nk.includes('Thunder') || nk.includes('Charge')) {
        category = 'thunder';
      } else if (nk.includes('Void') || nk.includes('Gravity') || nk.includes('Clones') || nk.includes('Dimensional') || nk.includes('Echo')) {
        category = 'void';
      } else if (nk.includes('Giant') || nk.includes('Lethal') || nk.includes('Colossal') || nk.includes('Vampire') || nk.includes('Heart') || nk.includes('Armor') || nk.includes('Frost') || nk.includes('Tempo')) {
        if (nk.includes('Frost')) {
          category = 'frost';
        } else {
          category = 'vitality';
        }
      }
      card.classList.add(`category-${category}`);
      card.innerHTML = `<h3>${t(power.nameKey)}</h3><p>${t(power.descKey)}</p>`;
    }
    card.insertAdjacentHTML('beforeend', upgradePreview(power.nameKey));
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    const choose = (e: Event) => {
      e.stopPropagation();
      if (globals.gameState !== 'levelup') return;
      power.apply();
      globals.chosenPowerUps.push(power.nameKey);

      globals.exp -= globals.maxExp;
      globals.maxExp = Math.round(globals.maxExp * 1.25);
      globals.level++;
      levelDisplay.textContent = globals.level.toString();
      levelUpScreen.style.display = 'none';
      
      globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 50, t('levelUpText'), "#00ff00", 30));
      const atkUp = (vfxAnims as any).spells?.attackUp;
      if (atkUp && atkUp.length > 0) {
        globals.animatedEffects.push(new AnimatedEffect(globals.player.x, globals.player.y, atkUp, 0.55, 1.9));
      }
      callbacks.updateUI();
      globals.gameState = 'playing';
    };
    card.addEventListener('pointerdown', choose);
    card.addEventListener('click', choose);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(e); } });
    powerChoicesContainer.appendChild(card);
  });
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
             callbacks.hitEnemy(e, 16);
             
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
                callbacks.hitEnemy(enemy, 20);
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

export function activateAwakening() {
  if (globals.flow < globals.playerStats.flowMax || globals.flowState !== 'normal' || globals.ultCooldown > 0) return;
  
  playSynthesizedAwaken();
  globals.gameState = 'ultchoice';
  
  const ultScreen = document.getElementById('ult-screen')!;
  const ultChoicesContainer = document.getElementById('ult-choices')!;
  const btnUlt = document.getElementById('btn-ult')!;
  
  ultScreen.style.display = 'flex';
  ultChoicesContainer.innerHTML = '';
  
  let optionsToUse = ultOptions;
  if (globals.gameMode === 'zen') {
    optionsToUse = [{
      nameKey: "ultZenFieldName",
      descKey: "ultZenFieldDesc",
      apply: () => {
        globals.flowState = 'normal';
        globals.flow = 0;
        globals.zenFieldActiveTimer = 8.0;
        globals.zenFieldTickTimer = 0;
        globals.invulnTimer = 8.0; // Invulnerable for duration
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
    }];
  }
  
  optionsToUse.forEach((ult, index) => {
    const card = document.createElement('div');
    card.className = 'power-card';
    card.style.animation = 'power-card-entrance 0.45s cubic-bezier(0.16, 1, 0.3, 1) both, card-glow-pulse 3s infinite alternate';
    card.style.animationDelay = `${index * 0.08}s, ${index * 0.08 + 0.45}s`;
    
    let category = 'basic';
    const nk = ult.nameKey;
    if (nk.includes('Shadow')) category = 'void';
    else if (nk.includes('Omni')) category = 'vitality';
    else if (nk.includes('Zen')) category = 'wind';
    else if (nk.includes('Storm')) category = 'thunder';
    
    card.classList.add(`category-${category}`);
    card.innerHTML = `<h3>${t(ult.nameKey)}</h3><p>${t(ult.descKey)}</p>`;
    card.addEventListener('click', () => {
      ultScreen.style.display = 'none';
      btnUlt.classList.remove('ready');
      ult.apply();

      
      globals.gameState = 'playing';
    });
    ultChoicesContainer.appendChild(card);
  });
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
