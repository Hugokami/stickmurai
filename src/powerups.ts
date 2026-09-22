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
  playSlashSfx,
  sfx
} from './audio';
import { Slash, FloatingText, Shockwave, Particle, AnimatedEffect } from './entities';
import { bindDualListener } from './ui';
import { AdManager } from './adManager';
import { showToast } from './qol';

const t = (key: string): string => i18n[globals.currentLang]?.[key] || key;

export interface PowerUp {
  nameKey: string;
  descKey: string;
  apply: () => void;
  skill?: 'enhance' | 'shield' | 'dash' | 'firewheel' | 'gravity' | 'parry_master' | 'decoy_illusion';
  isCorrupted?: boolean;
  isFusion?: boolean;
  fusionKey?: string;
  isUnique?: boolean;
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
  
  // Raijin's Cataclysm (Gravity) specific
  { skill: "gravity", nameKey: "puCataclysmSuperconductorName", descKey: "puCataclysmSuperconductorDesc", apply: () => globals.playerStats.cataclysmSuperconductorLevel = (globals.playerStats.cataclysmSuperconductorLevel || 0) + 1 },
  { skill: "gravity", nameKey: "puCataclysmThunderclapName", descKey: "puCataclysmThunderclapDesc", apply: () => globals.playerStats.cataclysmThunderclapLevel = (globals.playerStats.cataclysmThunderclapLevel || 0) + 1 },
  { skill: "gravity", nameKey: "puCataclysmConduitName", descKey: "puCataclysmConduitDesc", isUnique: true, apply: () => { globals.cataclysmConduitActive = true; } },

  // Void Rupture (Decoy Illusion) specific
  { skill: "decoy_illusion", nameKey: "puRuptureSeveranceName", descKey: "puRuptureSeveranceDesc", apply: () => globals.playerStats.ruptureSeveranceLevel = (globals.playerStats.ruptureSeveranceLevel || 0) + 1 },
  { skill: "decoy_illusion", nameKey: "puRupturePhantomLegionName", descKey: "puRupturePhantomLegionDesc", apply: () => globals.playerStats.rupturePhantomLegionLevel = (globals.playerStats.rupturePhantomLegionLevel || 0) + 1 },
  { skill: "decoy_illusion", nameKey: "puRupturePhaseStrikeName", descKey: "puRupturePhaseStrikeDesc", isUnique: true, apply: () => { globals.rupturePhaseStrikeActive = true; } },
  
  { nameKey: "puChargeSpeedName", descKey: "puChargeSpeedDesc", isUnique: true, apply: () => { globals.playerStats.iaijutsuChargeSpeed += 0.4; globals.playerStats.iaijutsuBonusDmg = (globals.playerStats.iaijutsuBonusDmg || 0) + 25; } },
  { nameKey: "puDeflectDmgName", descKey: "puDeflectDmgDesc", isUnique: true, apply: () => { globals.playerStats.deflectedDmg += 4; } },
  { nameKey: "puVampireName", descKey: "puVampireDesc", isUnique: true, apply: () => { globals.playerStats.vampireChance += 0.12; } },
  { nameKey: "puDimensionalName", descKey: "puDimensionalDesc", isUnique: true, apply: () => { globals.playerStats.iaijutsuRangeMult += 0.45; globals.playerStats.slashBonusDmgPct = (globals.playerStats.slashBonusDmgPct || 0) + 0.15; } },
  { nameKey: "puFireName", descKey: "puFireDesc", isUnique: true, apply: () => globals.playerStats.fireStanceLevel = 1 },
  { nameKey: "puClonesName", descKey: "puClonesDesc", isUnique: true, apply: () => globals.playerStats.shadowClonesLevel = 1 },
  { nameKey: "puStoutHeartName", descKey: "puStoutHeartDesc", isUnique: true, apply: () => { globals.maxLives = Math.min(10, Math.max(globals.maxLives + 1, 7)); globals.lives = Math.min(globals.maxLives, globals.lives + 1); } },
  { nameKey: "puJudgementCutName", descKey: "puJudgementCutDesc", isUnique: true, apply: () => { globals.playerStats.judgementCutLevel = 1; } },
  { skill: "dash", nameKey: "puSakuraBlizzardName", descKey: "puSakuraBlizzardDesc", isUnique: true, apply: () => { globals.playerStats.sakuraBlizzardLevel = 1; } },
  { skill: "dash", nameKey: "puUnstableOverloadName", descKey: "puUnstableOverloadDesc", isUnique: true, apply: () => { globals.playerStats.unstableOverloadLevel = 1; } },
  { nameKey: "puMagneticDrawName", descKey: "puMagneticDrawDesc", isUnique: true, apply: () => { globals.playerStats.magneticDrawLevel = 1; } },
  { nameKey: "puReapersMarkName", descKey: "puReapersMarkDesc", isUnique: true, apply: () => { globals.playerStats.reapersMarkLevel = 1; globals.reapersMarkTimer = 25.0; globals.reapersMarkKills = 0; } },
  { nameKey: "puPetalArmorName", descKey: "puPetalArmorDesc", isUnique: true, apply: () => { globals.petalArmorLevel = 1; if (!globals.petalArmorActive && globals.petalArmorCooldown <= 0) globals.petalArmorActive = true; } },
  { nameKey: "puEchoSlashName", descKey: "puEchoSlashDesc", isUnique: true, apply: () => { globals.echoLevel = 1; } },
  { nameKey: "puTempoMasteryName", descKey: "puTempoMasteryDesc", isUnique: true, apply: () => { globals.tempoMasteryLevel = 1; globals.tempoStacks = 0; } },
  { nameKey: "puFrostName", descKey: "puFrostDesc", isUnique: true, apply: () => { globals.frostStanceActive = true; } },
  { nameKey: "puVoidName", descKey: "puVoidDesc", isUnique: true, apply: () => { globals.voidStanceActive = true; } },
  { skill: "dash", nameKey: "puFlowingCounterName", descKey: "puFlowingCounterDesc", isUnique: true, apply: () => { globals.flowingCounterActive = true; } },
  { skill: "shield", nameKey: "puGaleVortexName", descKey: "puGaleVortexDesc", isUnique: true, apply: () => { globals.galeVortexActive = true; globals.playerStats.enhanceDuration = Math.max(1.0, globals.playerStats.enhanceDuration - 1.0); } },
  { nameKey: "puBladeEchoesName", descKey: "puBladeEchoesDesc", isUnique: true, apply: () => { globals.bladeEchoesActive = true; } },
  {
    nameKey: "puExecutionName",
    descKey: "puExecutionDesc",
    isUnique: true,
    apply: () => {
      globals.executionUnlocked = true;
      globals.playerStats.executionLevel = 1;
    }
  },
  {
    nameKey: "puRaijinSplitterName",
    descKey: "puRaijinSplitterDesc",
    isUnique: true,
    apply: () => {
      globals.raijinSplitterActive = true;
    }
  },
  {
    nameKey: "puArterialGushName",
    descKey: "puArterialGushDesc",
    isUnique: true,
    apply: () => {
      globals.arterialGushActive = true;
    }
  },
  {
    nameKey: "puSonicBreakName",
    descKey: "puSonicBreakDesc",
    isUnique: true,
    apply: () => {
      globals.sonicBreakthroughActive = true;
    }
  },
  {
    nameKey: "puMiasmaCleaveName",
    descKey: "puMiasmaCleaveDesc",
    isUnique: true,
    apply: () => {
      globals.miasmaCleaveActive = true;
    }
  },
  {
    nameKey: "puHanabiBladeName",
    descKey: "puHanabiBladeDesc",
    isUnique: true,
    apply: () => {
      globals.hanabiBladeActive = true;
    }
  },
  {
    nameKey: "puGrimHarvestName",
    descKey: "puGrimHarvestDesc",
    isUnique: true,
    apply: () => {
      globals.grimHarvestActive = true;
      globals.grimHarvestSouls = 0;
    }
  },

  // Option 6: Corrupted Blessings / Cursed Relics (High-Risk, High-Reward)
  {
    nameKey: "puCursedGlassName",
    descKey: "puCursedGlassDesc",
    isCorrupted: true,
    isUnique: true,
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
    isUnique: true,
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
    isUnique: true,
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
    isUnique: true,
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
    descEn: '• Dash leaves electric firewalls (6 DMG/s) • Slashing burned foes chains lightning (10 DMG)',
    descJa: '• ダッシュ電磁炎壁(6 DMG/秒) • 炎上敵を斬ると連鎖雷撃(10 DMG)',
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
    descEn: '• Slashes fire black holes devouring bullets • Pulls in mobs • 20 AoE DMG implosion',
    descJa: '• 斬撃から敵弾消滅ブラックホール • 敵吸引 • 20範囲DMG特異点爆発',
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
    descEn: '• Perfect Dodge or Finisher spawns clone (12s) • Mirrors all slashes',
    descJa: '• 見切り回避/フィニッシャーで影武者召喚(12秒) • 全斬撃模倣',
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
    descEn: '• Slashes fire 2 wind discs • Ricochets 3x off borders • 8 DMG piercing',
    descJa: '• 斬撃から真空鎌2枚射出 • 壁3回反射 • 敵群貫通(8 DMG)',
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
    descEn: '• Parry triggers 360° 6-blade storm (12 DMG each) • Heals 1 Heart on 3+ hits',
    descJa: '• パリィ時360度6連幻影斬(各12 DMG) • 3体以上命中でハート1回復',
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
  // Guaranteed stat gains on every level - scales slash damage noticeably with each stage level
  globals.playerStats.slashBonusDmgPct += 0.10;
  globals.playerStats.iaijutsuBonusDmg += 1;
  globals.playerStats.flowGenMult += 0.03;
  globals.playerStats.moveSpeedMult = Math.min(1.5, (globals.playerStats.moveSpeedMult || 1.0) + 0.02);

  const bonusRolls = [
    { key: 'slashBonusDmgPct', amount: 0.12, label: '+12% ATK' },
    { key: 'attackCooldownBase', amount: -0.02, label: '-0.02s Attack CD' },
    { key: 'dashCooldownBase', amount: -0.08, label: '-0.08s Dash CD' },
    { key: 'postureDmgBonus', amount: 3, label: '+3 Posture Break' },
    { key: 'iaijutsuBonusDmg', amount: 2, label: '+2 Iaijutsu DMG' },
    { key: 'critChanceBonus', amount: 0.04, label: '+4% Crit Rate' }
  ] as const;
  const roll = bonusRolls[Math.floor(Math.random() * bonusRolls.length)];
  const current = (globals.playerStats as any)[roll.key] || 0;
  (globals.playerStats as any)[roll.key] = roll.key.includes('Cooldown') 
    ? Math.max(roll.key === 'attackCooldownBase' ? 0.16 : 0.65, current + roll.amount) 
    : current + roll.amount;
  
  globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 65, `⚡ LVL UP: ${roll.label}`, '#4ade80', 22));
  
  const isJa = globals.currentLang === 'ja';
  const levelDmgBonus = Math.max(0, (globals.level - 1) * 10);
  showToast(isJa 
    ? `🆙 Lv.${globals.level} 到達! [${roll.label}] 獲得 (基礎攻撃力 +${levelDmgBonus}%, 体力+1回復)` 
    : `🆙 LV.${globals.level} REACHED! [${roll.label}] acquired (+${levelDmgBonus}% Base ATK, +1 Heart Healed)`
  );
}

export function triggerLevelUp() {
  if (globals.gameState !== 'playing') return;

  while (globals.exp >= globals.maxExp && globals.gameState === 'playing') {
    globals.exp -= globals.maxExp;
    globals.maxExp = Math.round(globals.maxExp * 1.25);
    globals.level++;
    
    const maxHearts = globals.gameMode === 'zen' ? 3 : globals.maxLives;
    if (globals.lives < maxHearts) globals.lives++;

    applyStatLevelUp();
    playSynthesizedLevelUp();
  }

  const levelDmgBonus = Math.max(0, (globals.level - 1) * 10);
  globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 70, `LVL ${globals.level}! (+${levelDmgBonus}% DMG)`, '#ffd700', 22));
  globals.screenShake = Math.max(globals.screenShake, 10);
  globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#ffd700'));
  if (vfxAnims.levelUp && vfxAnims.levelUp.length > 0) {
    globals.animatedEffects.push(new AnimatedEffect(globals.player.x, globals.player.y - 25, vfxAnims.levelUp, 0.65, 1.8));
  }
  callbacks.updateUI();
}

export function omnislashHitDmg(hitIndex: number, isFinalBlast = false): number {
  const slashDmg = (callbacks as any).getCurrentSlashDamage ? (callbacks as any).getCurrentSlashDamage() : 1;
  const base = isFinalBlast ? 65 : 30;
  const iaiBonus = (globals.playerStats?.iaijutsuBonusDmg || 0) * 1.5;
  const enhanceBonus = (globals.selectedSkill === 'enhance' && globals.enhanceActiveTimer > 0) ? Math.round(25 + slashDmg * 1.2 + (globals.playerStats?.enhanceBonusDmg || 1) * 4) : 0;
  const comboBonus = Math.min(1.2, (globals.combo || 0) * 0.015 + hitIndex * 0.03);
  const dmg = Math.round((base + slashDmg * (isFinalBlast ? 5.2 : 3.4)) * (1 + comboBonus) + iaiBonus + enhanceBonus);
  return Math.max(isFinalBlast ? 45 : 20, dmg);
}

export function applyHeroSignatureUltimate() {
  globals.flowState = 'awakened';
  globals.screenShake = 35;
  globals.invertScreenTimer = 0.25;

  const hero = (globals as any).selectedHero || 'default';
  const isJa = globals.currentLang === 'ja';

  triggerMangaCutin('shadow');

  if (hero === 'luneblade') {
    globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#38bdf8'));
    globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 120, isJa ? '月華降臨！ 🌙' : 'CRESCENT MOONFALL! 🌙', 'neon-#38bdf8', 56));
    const starframes = (vfxAnims as any).custom?.starfall;
    if (starframes && starframes.length > 0) {
      globals.animatedEffects.push(new AnimatedEffect(globals.player.x, globals.player.y - 80, starframes, 0.45, 2.5));
    }
    for (let i = 0; i < 20; i++) {
      globals.particles.push(Particle.acquire(globals.player.x, globals.player.y, '#38bdf8', 180 + Math.random() * 200, 0.5, 3, Math.random() * Math.PI * 2));
    }
  } else if (hero === 'ninja') {
    globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#a855f7'));
    globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 120, isJa ? '影分身乱舞！ 👤' : 'WRAITH MIRAGE! 👤', 'neon-#a855f7', 56));
    const smokeFrames = (vfxAnims as any).skills?.decoySmoke;
    if (smokeFrames && smokeFrames.length > 0) {
      globals.animatedEffects.push(new AnimatedEffect(globals.player.x, globals.player.y, smokeFrames, 0.4, 2.2));
    }
    for (let i = 0; i < 20; i++) {
      globals.particles.push(Particle.acquire(globals.player.x, globals.player.y, '#c084fc', 200 + Math.random() * 200, 0.5, 3, Math.random() * Math.PI * 2));
    }
  } else if (hero === 'samurai') {
    globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#f59e0b'));
    globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 120, isJa ? '真・龍咆哮！ 🐉' : 'DRAGON ROAR! 🐉', 'neon-#f59e0b', 56));
    (globals.player as any).hyperArmorTimer = 10.0;
    const goldImpact = (vfxAnims as any).shockwaves?.impactGold;
    if (goldImpact && goldImpact.length > 0) {
      globals.animatedEffects.push(new AnimatedEffect(globals.player.x, globals.player.y, goldImpact, 0.45, 2.8));
    }
    for (let i = 0; i < 20; i++) {
      globals.particles.push(Particle.acquire(globals.player.x, globals.player.y, '#fbbf24', 220 + Math.random() * 200, 0.5, 3.5, Math.random() * Math.PI * 2));
    }
  } else if (hero === 'nightborne') {
    globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#7c3aed'));
    globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 120, isJa ? '深淵特異点！ 🌌' : 'ABYSSAL SINGULARITY! 🌌', 'neon-#7c3aed', 56));
    const voidFrames = (vfxAnims as any).skills?.voidWarp;
    if (voidFrames && voidFrames.length > 0) {
      globals.animatedEffects.push(new AnimatedEffect(globals.player.x, globals.player.y, voidFrames, 0.5, 3.0));
    }
    for (let i = 0; i < 20; i++) {
      globals.particles.push(Particle.acquire(globals.player.x, globals.player.y, '#a855f7', 190 + Math.random() * 200, 0.5, 3, Math.random() * Math.PI * 2));
    }
  } else if (hero === 'satyr') {
    globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#10b981'));
    globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 120, isJa ? '大地の地割れ！ 🌋' : 'TITAN CATACLYSM! 🌋', 'neon-#10b981', 56));
    const slamDust = (vfxAnims as any).boss?.slamDust;
    if (slamDust && slamDust.length > 0) {
      globals.animatedEffects.push(new AnimatedEffect(globals.player.x, globals.player.y, slamDust, 0.45, 2.5));
    }
    for (let i = 0; i < 20; i++) {
      globals.particles.push(Particle.acquire(globals.player.x, globals.player.y, '#34d399', 200 + Math.random() * 200, 0.5, 3.5, Math.random() * Math.PI * 2));
    }
  } else if (hero === 'akakage') {
    (globals as any).akakageAwakeningExtensionTotal = 0;
    globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#ef4444'));
    globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 120, isJa ? '血の阿修羅！ 🩸' : 'BLOOD ASURA FRENZY! 🩸', 'neon-#ef4444', 56));
    const bloodFx = (vfxAnims as any).combat?.bloodSplatter;
    if (bloodFx && bloodFx.length > 0) {
      globals.animatedEffects.push(new AnimatedEffect(globals.player.x, globals.player.y, bloodFx, 0.45, 2.5));
    }
    for (let i = 0; i < 25; i++) {
      globals.particles.push(Particle.acquire(globals.player.x, globals.player.y, '#ef4444', 220 + Math.random() * 220, 0.5, 3, Math.random() * Math.PI * 2));
    }
  } else {
    // default (Stickmurai / Ronin)
    globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#f59e0b'));
    globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 120, isJa ? '剣聖領域！ ⚔️' : 'KENSEI DOMAIN! ⚔️', 'neon-#f59e0b', 56));
    const lightBurst = (vfxAnims as any).shockwaves?.lightBurst;
    if (lightBurst && lightBurst.length > 0) {
      globals.animatedEffects.push(new AnimatedEffect(globals.player.x, globals.player.y, lightBurst, 0.4, 2.5));
    }
    for (let i = 0; i < 20; i++) {
      globals.particles.push(Particle.acquire(globals.player.x, globals.player.y, '#fbbf24', 180 + Math.random() * 220, 0.5, 3, Math.random() * Math.PI * 2));
    }
  }
}

const ultOptions = [
  { 
    nameKey: "ultShadowName", 
    descKey: "ultShadowDesc",
    apply: () => {
      applyHeroSignatureUltimate();
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
        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 120, globals.currentLang === 'ja' ? '超究武神覇斬・天極！ ⚔️' : 'OMNISLASH: HEAVENLY LIMIT! ⚔️', 'neon-#ffd700', 80));
        
        // start grand dual shockwaves
        globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#ffd700'));
        globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#00ffff'));

       // slash all targetable active enemies
       targets.forEach((e, idx) => {
         // stagger cross cuts
         const slashDelay = idx * staggerInterval;
         globals.delayedActions.push({
           delay: slashDelay,
           run: () => {
             if (e.state === 'dead') return;
             
             // hit target with massive omnislash damage
             const isBoss = e.subType?.includes('boss') || (e as any).isBoss;
              const hitDmg = isBoss ? Math.round(omnislashHitDmg(idx) * 1.35) : omnislashHitDmg(idx);
              const hpChunk = typeof e.maxHp === 'number' && e.maxHp > 0 ? Math.round(e.maxHp * (isBoss ? 0.30 : (0.30 + Math.random() * 0.10))) : 0;
              callbacks.hitEnemy(e, hitDmg + hpChunk);
             
             // visual & sound execution
             if (idx < maxVisuals) {
               if (idx % 2 === 0) {
                 playSlashSfx(1.2);
               }
               
               // spawn 4 vibrant high-opacity cross cut lines
               globals.slashes.push(Slash.acquire(e.x, e.y, Math.PI / 4, 3.6 * e.scaleMult, true, '#ffd700'));
               globals.slashes.push(Slash.acquire(e.x, e.y, -Math.PI / 4, 3.6 * e.scaleMult, true, '#00ffff'));
               globals.slashes.push(Slash.acquire(e.x, e.y, 0, 4.0 * e.scaleMult, true, '#ff0055'));
               globals.slashes.push(Slash.acquire(e.x, e.y, Math.PI / 2, 3.2 * e.scaleMult, true, '#a855f7'));
               
               // blast wave
               globals.shockwaves.push(new Shockwave(e.x, e.y, 'rgba(255, 215, 0, 0.75)'));
               globals.shockwaves.push(new Shockwave(e.x, e.y, 'rgba(0, 255, 255, 0.6)'));

               const goldImpact = (vfxAnims as any).shockwaves?.impactGold;
               if (goldImpact && goldImpact.length > 0) {
                 globals.animatedEffects.push(new AnimatedEffect(e.x, e.y, goldImpact, 0.28, 2.2));
               }

               // dense sparks
               for (let i = 0; i < 8; i++) {
                 const angle = Math.random() * Math.PI * 2;
                 const speed = 250 + Math.random() * 350;
                 const sparkCol = i % 3 === 0 ? '#ffd700' : (i % 3 === 1 ? '#00ffff' : '#ff0055');
                 globals.particles.push(Particle.acquire(e.x, e.y, sparkCol, speed, 0.45, 2.0 + Math.random() * 1.5, angle));
               }
               
               globals.screenShake = Math.max(globals.screenShake, 24);
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
            globals.invertScreenTimer = 0.35;
            
            globals.screenShake = 75;

            // golden & cyan shockwaves
            globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#ffd700'));
            globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#00ffff'));
            const lightBurstFinisher = (vfxAnims as any).shockwaves?.lightBurst;
            if (lightBurstFinisher && lightBurstFinisher.length > 0) {
              globals.animatedEffects.push(new AnimatedEffect(globals.player.x, globals.player.y, lightBurstFinisher, 0.4, 3.2));
            }
            
            // Deal massive DMG to all remaining active enemies
            globals.enemies.forEach(enemy => {
              if (enemy.state !== 'dead') {
                const isBoss = enemy.subType?.includes('boss') || (enemy as any).isBoss;
                const finalDmg = isBoss ? Math.round(omnislashHitDmg(0, true) * 1.6) : omnislashHitDmg(0, true);
                const hpChunk = typeof enemy.maxHp === 'number' && enemy.maxHp > 0 ? Math.round(enemy.maxHp * (isBoss ? 0.30 : (0.30 + Math.random() * 0.10))) : 0;
                callbacks.hitEnemy(enemy, finalDmg + hpChunk);
                for (let i = 0; i < 6; i++) {
                  globals.particles.push(Particle.acquire(enemy.x, enemy.y, '#ffd700', 180 + Math.random() * 200, 0.45, 2.5, Math.random() * Math.PI * 2));
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

  // Notify tutorial system of awakening activation regardless of trigger source
  callbacks.onTrainingAction?.({ type: 'awakening', manualInput: true, ultType: type });

  if (globals.gameMode === 'zen' || type === 'zen') {
    globals.flow = 0;
    playSynthesizedTempleBell();
    triggerZenField();
    return;
  }

  if (type === 'shadow') {
    // Flow stays full so the 6-second drain in main.ts can run to completion
    globals.flow = globals.playerStats.flowMax;
    if (globals.selectedHero !== 'akakage') {
      playSynthesizedSingingBowl();
    }
    ultOptions[0].apply();
  } else if (type === 'omni') {
    globals.flow = 0;
    playSynthesizedAwaken();
    ultOptions[1].apply();
  } else if (type === 'storm') {
    // Flow stays full so the 8-second drain in main.ts can run to completion
    globals.flow = globals.playerStats.flowMax;
    playSynthesizedThunder();
    ultOptions[2].apply();
  } else {
    globals.flow = 0;
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

export type SynergyType = 'blade' | 'flow' | 'shadow' | 'iron' | 'element';

export interface ShopSlot {
  power: PowerUp;
  price: number;
  originalPrice: number;
  quality: 'common' | 'rare' | 'epic' | 'legendary';
  isFrozen?: boolean;
  discountPct?: number;
  synergy: SynergyType;
}

export const SYNERGY_INFO: Record<SynergyType, { label: string; icon: string; color: string; desc2: string; desc4: string }> = {
  blade: { label: 'Blade Art', icon: 'icons/rpg/fc1267.png', color: '#f43f5e', desc2: '+15% ATK', desc4: 'Inflicts Bleed' },
  flow: { label: 'Flow Chi', icon: 'icons/rpg/fc20.png', color: '#06b6d4', desc2: '+25% Flow Gain', desc4: 'Ult Flow Cost -20%' },
  shadow: { label: 'Shadow Step', icon: 'icons/rpg/fc543.png', color: '#a855f7', desc2: '-15% Dash CD', desc4: 'Shadow Clones' },
  iron: { label: 'Iron Guard', icon: 'icons/rpg/fc1043.png', color: '#eab308', desc2: '+4 Posture Break', desc4: 'Parry Deflects 200%' },
  element: { label: 'Elemental', icon: 'icons/rpg/fc1221.png', color: '#f97316', desc2: '+2 Skill DMG', desc4: 'Skills Chain Lightning' },
};

export function getPowerSynergy(p: PowerUp): SynergyType {
  const nk = p.nameKey;
  if (nk.includes('Giant') || nk.includes('Wind') || nk.includes('Deadeye') || nk.includes('Echo') || nk.includes('BladeEchoes') || nk.includes('Execution') || nk.includes('ArterialGush') || nk.includes('GrimHarvest')) return 'blade';
  if (nk.includes('Blood') || nk.includes('ChargeSpeed') || nk.includes('Dimensional') || nk.includes('Tempo') || nk.includes('Flowing') || nk.includes('SonicBreak')) return 'flow';
  if (nk.includes('Feather') || nk.includes('Swift') || nk.includes('Clones') || nk.includes('Petal') || nk.includes('Dash')) return 'shadow';
  if (nk.includes('Shield') || nk.includes('Deflect') || nk.includes('StoutHeart') || nk.includes('Gale') || nk.includes('HanabiBlade')) return 'iron';
  return 'element';
}

export function getActiveSynergies(): Record<SynergyType, number> {
  const counts: Record<SynergyType, number> = { blade: 0, flow: 0, shadow: 0, iron: 0, element: 0 };
  for (const nameKey of globals.chosenPowerUps) {
    const power = powerUps.find(p => p.nameKey === nameKey);
    if (power) {
      const syn = getPowerSynergy(power);
      counts[syn] = (counts[syn] || 0) + 1;
    }
  }
  return counts;
}

let currentShopInventory: ShopSlot[] = [];

export function resetShop() {
  currentShopInventory = [];
  globals.shopRefreshCount = 0;
  globals.stageMerchantCacheAds = 0;
  globals.shopOpen = false;
  const modal = document.getElementById('shop-modal');
  if (modal) modal.style.display = 'none';
}

export function getPowerQuality(p: PowerUp): 'common' | 'rare' | 'epic' | 'legendary' {
  if (p.isFusion) return 'legendary';
  const nk = p.nameKey;
  if (nk.includes('Void') || nk.includes('Tempo') || nk.includes('Execution') || nk.includes('Clones') || nk.includes('Blood') || nk.includes('GrimHarvest') || nk.includes('RaijinSplitter')) return 'legendary';
  if (nk.includes('Echo') || nk.includes('Fire') || nk.includes('Frost') || nk.includes('BladeEchoes') || nk.includes('Gale') || nk.includes('Lethal') || nk.includes('Colossal') || nk.includes('ArterialGush') || nk.includes('SonicBreak') || nk.includes('MiasmaCleave')) return 'epic';
  if (nk.includes('Giant') || nk.includes('Deadeye') || nk.includes('Vampire') || nk.includes('ChargeSpeed') || nk.includes('Dimensional') || nk.includes('StoutHeart') || nk.includes('PetalArmor') || nk.includes('Pulse') || nk.includes('Blast') || nk.includes('HanabiBlade')) return 'rare';
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

export const attackPotionPowerUp: PowerUp = {
  nameKey: "puAttackPotionName",
  descKey: "puAttackPotionDesc",
  apply: () => {
    globals.stageAttackPotions = (globals.stageAttackPotions || 0) + 1;
    globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 60, "+5% SLASH DMG (STAGE)! ⚔️", "#fbbf24", 26));
  }
};

function rollSingleShopSlot(existingSlots: ShopSlot[] = []): ShopSlot {
  const available = powerUps.filter(p => {
    if (p.isCorrupted) return false;
    if (p.isUnique && (globals.chosenPowerUps.includes(p.nameKey) || existingSlots.some(s => s?.power?.nameKey === p.nameKey))) return false;
    if (p.nameKey === 'puRaijinSplitterName' && globals.raijinSplitterActive) return false;
    if (p.nameKey === 'puArterialGushName' && globals.arterialGushActive) return false;
    if (p.nameKey === 'puSonicBreakName' && globals.sonicBreakthroughActive) return false;
    if (p.nameKey === 'puMiasmaCleaveName' && globals.miasmaCleaveActive) return false;
    if (p.nameKey === 'puHanabiBladeName' && globals.hanabiBladeActive) return false;
    if (p.nameKey === 'puGrimHarvestName' && globals.grimHarvestActive) return false;
    if (p.nameKey === 'puFrostName' && globals.frostStanceActive) return false;
    if (p.nameKey === 'puVoidName' && globals.voidStanceActive) return false;
    if (p.nameKey === 'puFireName' && (globals.playerStats.fireStanceLevel || 0) >= 1) return false;
    if (p.nameKey === 'puFlowingCounterName' && globals.flowingCounterActive) return false;
    if (p.nameKey === 'puGaleVortexName' && globals.galeVortexActive) return false;
    if (p.nameKey === 'puBladeEchoesName' && globals.bladeEchoesActive) return false;
    if (p.nameKey === 'puClonesName' && (globals.playerStats.shadowClonesLevel || 0) >= 1) return false;
    if (p.nameKey === 'puExecutionName' && globals.executionUnlocked) return false;
    if (p.nameKey === 'puPetalArmorName' && (globals.petalArmorLevel || 0) >= 1) return false;
    if (p.nameKey === 'puEchoSlashName' && (globals.echoLevel || 0) >= 1) return false;
    if (p.nameKey === 'puTempoMasteryName' && (globals.tempoMasteryLevel || 0) >= 1) return false;
    if (p.nameKey === 'puGiantName' && globals.playerStats.slashSizeMult >= 2.2) return false;
    if (p.nameKey === 'puWindName' && globals.playerStats.attackCooldownBase <= 0.18) return false;
    if (p.nameKey === 'puFeatherName' && globals.playerStats.dashCooldownBase <= 0.72) return false;
    if (p.nameKey === 'puSwiftName' && globals.playerStats.moveSpeedMult >= 1.5) return false;
    if (p.nameKey === 'puDeadeyeName' && (globals.playerStats.critChanceBonus || 0) >= 0.4) return false;
    if (p.nameKey === 'puStoutHeartName' && globals.maxLives >= 10) return false;
    if (p.skill && p.skill !== globals.selectedSkill) return false;
    return true;
  });

  const p = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : attackPotionPowerUp;
  const q = getPowerQuality(p);
  const origPrice = getQualityPrice(q);
  const hasDiscount = Math.random() < 0.28;
  const discountPct = hasDiscount ? (Math.random() < 0.5 ? 25 : 35) : 0;
  const price = discountPct > 0 ? Math.max(5, Math.round(origPrice * (1 - discountPct / 100))) : origPrice;

  return {
    power: p,
    quality: q,
    price,
    originalPrice: origPrice,
    discountPct,
    isFrozen: false,
    synergy: getPowerSynergy(p),
  };
}

export function rollShopInventory(isNewWave = false): ShopSlot[] {
  // Always preserve locked slots across rerolls and waves
  const preservedSlots = currentShopInventory.filter(slot => slot && slot.isFrozen);
  const slots: ShopSlot[] = [...preservedSlots];
  while (slots.length < 4) {
    slots.push(rollSingleShopSlot(slots));
  }
  if (isNewWave) {
    globals.shopRefreshCount = 0;
  }
  return slots;
}

export function refreshShop(isNewWave = false) {
  currentShopInventory = rollShopInventory(isNewWave);
  renderShopModal();
}

export function openShop() {
  if (globals.shopOpen) {
    closeShop();
    return;
  }
  if (globals.gameState !== 'playing' && globals.gameState !== 'paused') return;
  globals.gameState = 'paused';
  AdManager.gameplayStop();
  globals.shopOpen = true;
  if (currentShopInventory.length === 0) {
    currentShopInventory = rollShopInventory(true);
  }
  renderShopModal();
}

export function openTutorialShop() {
  if (globals.shopOpen) {
    closeShop();
    return;
  }
  globals.gameState = 'paused';
  AdManager.gameplayStop();
  globals.shopOpen = true;
  globals.stageCurrency = 50;
  const power = powerUps.find((p: PowerUp) => p.nameKey === 'puGiantName') || powerUps[0];
  currentShopInventory = [
    {
      power,
      price: 20,
      originalPrice: 20,
      quality: 'common',
      synergy: 'blade',
    }
  ];
  renderShopModal();
}
callbacks.openTutorialShop = openTutorialShop;

export function closeShop() {
  globals.shopOpen = false;
  const modal = document.getElementById('shop-modal');
  if (modal) modal.style.display = 'none';
  globals.gameState = 'playing';
  AdManager.gameplayStart();
  if (globals.waveState === 'shop') {
    globals.waveState = 'active';
    callbacks.advanceToNextWave();
  }
}

function renderShopBadges(slot: ShopSlot, activeSyn: Record<string, number>): string {
  const badges: string[] = [];

  if (slot.discountPct) {
    badges.push(`<div class="rpg-text-upperlayer" style="display: inline-flex; align-items: center; gap: 3px; background: #ef4444; color: #ffffff; font-size: 8.5px; font-weight: 900; padding: 1px 5px; border-radius: 4px; margin-bottom: 3px; margin-right: 3px;"><div class="rpg-icon-box" style="width: 11px; height: 11px; border: none; background: transparent; box-shadow: none; display: inline-flex;"><img src="icons/rpg/fc1221.png" class="rpg-icon-img" /></div> -${slot.discountPct}% SALE</div>`);
  }

  const name = slot.power.nameKey;
  if (!globals.activeFusions.has('plasma_tempest') && (name.includes('Fire') || name.includes('Thunder') || name.includes('Feather'))) {
    badges.push(`<div class="rpg-text-upperlayer" style="display: inline-flex; align-items: center; gap: 3px; background: rgba(168, 85, 247, 0.25); color: #e9d5ff; border: 1px solid #c084fc; font-size: 8px; font-weight: 900; padding: 1px 4px; border-radius: 4px; margin-bottom: 3px; margin-right: 3px;"><div class="rpg-icon-box" style="width: 11px; height: 11px; border: none; background: transparent; box-shadow: none; display: inline-flex;"><img src="icons/rpg/fc1223.png" class="rpg-icon-img" /></div> PLASMA</div>`);
  } else if (!globals.activeFusions.has('singularity_cleave') && (name.includes('Cataclysm') || name.includes('Lethal') || name.includes('Giant') || name.includes('Void'))) {
    badges.push(`<div class="rpg-text-upperlayer" style="display: inline-flex; align-items: center; gap: 3px; background: rgba(168, 85, 247, 0.25); color: #e9d5ff; border: 1px solid #c084fc; font-size: 8px; font-weight: 900; padding: 1px 4px; border-radius: 4px; margin-bottom: 3px; margin-right: 3px;"><div class="rpg-icon-box" style="width: 11px; height: 11px; border: none; background: transparent; box-shadow: none; display: inline-flex;"><img src="icons/rpg/fc1120.png" class="rpg-icon-img" /></div> SINGULARITY</div>`);
  } else if (!globals.activeFusions.has('hundred_phantoms') && (name.includes('Rupture') || name.includes('Clones') || name.includes('Cursed'))) {
    badges.push(`<div class="rpg-text-upperlayer" style="display: inline-flex; align-items: center; gap: 3px; background: rgba(168, 85, 247, 0.25); color: #e9d5ff; border: 1px solid #c084fc; font-size: 8px; font-weight: 900; padding: 1px 4px; border-radius: 4px; margin-bottom: 3px; margin-right: 3px;"><div class="rpg-icon-box" style="width: 11px; height: 11px; border: none; background: transparent; box-shadow: none; display: inline-flex;"><img src="icons/rpg/fc1388.png" class="rpg-icon-img" /></div> PHANTOMS</div>`);
  } else if (!globals.activeFusions.has('kamaitachi') && (name.includes('Wind') || name.includes('Gale') || name.includes('Deflect') || name.includes('Echo'))) {
    badges.push(`<div class="rpg-text-upperlayer" style="display: inline-flex; align-items: center; gap: 3px; background: rgba(168, 85, 247, 0.25); color: #e9d5ff; border: 1px solid #c084fc; font-size: 8px; font-weight: 900; padding: 1px 4px; border-radius: 4px; margin-bottom: 3px; margin-right: 3px;"><div class="rpg-icon-box" style="width: 11px; height: 11px; border: none; background: transparent; box-shadow: none; display: inline-flex;"><img src="icons/rpg/fc1155.png" class="rpg-icon-img" /></div> KAMAITACHI</div>`);
  }

  const curSyn = activeSyn[slot.synergy] || 0;
  if (curSyn === 1 || curSyn === 3) {
    badges.push(`<div class="rpg-text-upperlayer" style="display: inline-flex; align-items: center; gap: 3px; background: rgba(34, 197, 94, 0.25); color: #bbf7d0; border: 1px solid #22c55e; font-size: 8px; font-weight: 900; padding: 1px 4px; border-radius: 4px; margin-bottom: 3px;"><div class="rpg-icon-box" style="width: 11px; height: 11px; border: none; background: transparent; box-shadow: none; display: inline-flex;"><img src="icons/rpg/fc1221.png" class="rpg-icon-img" /></div> UNLOCK (${curSyn + 1})</div>`);
  }

  return badges.join('');
}

export function renderShopModal() {
  let modal = document.getElementById('shop-modal');
  const prevScrollTop = modal?.querySelector('.shop-modal-box')?.scrollTop ?? 0;
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

  const activeSyn = getActiveSynergies();
  const stageNum = globals.currentStage || 1;
  const radarText = stageNum % 5 === 0
    ? '⚠️ BATTLEFIELD INTEL: Boss Anomaly Detected! Armor-break & heavy burst damage advised.'
    : stageNum % 3 === 0
      ? '⚠️ BATTLEFIELD INTEL: Fast Skirmishers & Aerial Units Inbound! High mobility recommended.'
      : '⚠️ BATTLEFIELD INTEL: Standard Vanguard Patrol. Soul shard drop yields maximized.';

  modal.innerHTML = `
    <div class="menu-box shop-modal-box" style="max-width: 1060px; width: min(1060px, 96vw); max-height: 94vh; padding: 16px 20px; border-color: #fbbf24; box-shadow: 0 0 35px rgba(251, 191, 36, 0.35); overflow-y: auto; display: flex; flex-direction: column; gap: 12px; box-sizing: border-box;">
      
      <!-- Header -->
      <div style="position: sticky; top: -16px; background: #0c101c; z-index: 10; margin: -16px -20px 0 -20px; padding: 12px 20px 10px 20px; border-bottom: 1px solid rgba(251, 191, 36, 0.3); display: flex; justify-content: space-between; align-items: center; width: calc(100% + 40px); box-sizing: border-box;">
        <div>
          <h2 style="font-family: 'Shojumaru', sans-serif; color: #fbbf24; margin: 0; font-size: clamp(16px, 2.5vh, 22px); text-shadow: 0 0 15px rgba(251, 191, 36, 0.5);">⛩️ WAR REQUISITION: OUTPOST ARMORY</h2>
          <div style="font-size: 11px; color: #94a3b8; font-family: 'Space Mono', monospace; margin-top: 2px;">
            Stage ${stageNum} Battlefield Requisition Hub
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="font-family: 'Orbitron', monospace; font-size: 15px; color: #fbbf24; font-weight: bold; background: rgba(0,0,0,0.6); padding: 5px 14px; border-radius: 12px; border: 1px solid rgba(251, 191, 36, 0.4); display: flex; align-items: center; gap: 6px;">
            <img src="icons/stage_gold.png" class="hud-currency-icon" style="width: 17px; height: 17px;" alt="Gold" /> <span id="modal-currency-count">${globals.stageCurrency || 0}</span>
          </div>
        </div>
      </div>

      <!-- Threat Radar -->
      <div style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 8px; padding: 7px 12px; font-family: 'Space Mono', monospace; font-size: 10.5px; color: #fca5a5; display: flex; align-items: center; gap: 8px;">
        <span>${radarText}</span>
      </div>

      <!-- Body: 2 Columns on Desktop, Stacked on Mobile -->
      <div class="shop-content-layout" style="display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 14px; width: 100%; align-items: start; box-sizing: border-box;">
        
        <!-- Left Column: Shinobi Stat Sheet & Synergies -->
        <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 10px; min-width: 0; box-sizing: border-box;">
          <div style="font-family: 'Orbitron', sans-serif; font-size: 11px; font-weight: bold; color: #38bdf8; letter-spacing: 1px; border-bottom: 1px solid rgba(56, 189, 248, 0.25); padding-bottom: 5px;">
            📊 SHINOBI STAT SHEET
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 10px;">
            <div style="color: #94a3b8;">Health: <b style="color: #ef4444;">${globals.lives}/${globals.maxLives} ❤️</b></div>
            <div style="color: #94a3b8;">Level: <b style="color: #ffd700;">LVL ${globals.level}</b></div>
            <div style="color: #94a3b8;">ATK: <b style="color: #4ade80;">${((callbacks as any).getCurrentSlashDamage ? (callbacks as any).getCurrentSlashDamage() : 1).toFixed(1)} (+${Math.round((globals.playerStats.slashBonusDmgPct || 0) * 100)}%)</b></div>
            <div style="color: #94a3b8;">Iaijutsu: <b style="color: #00ffff;">+${globals.playerStats.iaijutsuBonusDmg || 0}</b></div>
            <div style="color: #94a3b8;">Attack CD: <b style="color: #cbd5e1;">${globals.playerStats.attackCooldownBase.toFixed(2)}s</b></div>
            <div style="color: #94a3b8;">Dash CD: <b style="color: #cbd5e1;">${globals.playerStats.dashCooldownBase.toFixed(2)}s</b></div>
            <div style="color: #94a3b8;">Speed: <b style="color: #38bdf8;">+${Math.round(((globals.playerStats.moveSpeedMult || 1.0) - 1.0) * 100)}%</b></div>
            <div style="color: #94a3b8;">Flow Gen: <b style="color: #c084fc;">+${Math.round(((globals.playerStats.flowGenMult || 1.0) - 1.0) * 100)}%</b></div>
            <div style="color: #94a3b8;">Posture Break: <b style="color: #fbbf24;">+${globals.playerStats.postureDmgBonus || 0}</b></div>
            <div style="color: #94a3b8;">Crit Rate: <b style="color: #f43f5e;">+${Math.round(((globals.playerStats.critChanceBonus || 0) + (globals.playerStats.heroCritChance || 0)) * 100)}%</b></div>
          </div>

          <!-- Active Synergies -->
          <div style="font-family: 'Orbitron', sans-serif; font-size: 10.5px; font-weight: bold; color: #a855f7; letter-spacing: 1px; margin-top: 2px; border-bottom: 1px solid rgba(168, 85, 247, 0.25); padding-bottom: 4px; display: flex; align-items: center; gap: 5px;">
            <div class="rpg-icon-box" style="width: 14px; height: 14px; display: inline-flex; border: none; background: transparent; box-shadow: none; vertical-align: middle;"><img src="icons/rpg/fc20.png" class="rpg-icon-img" alt="Disciplines" /></div>
            <span class="rpg-text-upperlayer">ACTIVE DISCIPLINES</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 5px; font-size: 10px;">
            ${(Object.keys(SYNERGY_INFO) as SynergyType[]).map(synKey => {
              const count = activeSyn[synKey] || 0;
              const info = SYNERGY_INFO[synKey];
              const is2Active = count >= 2;
              const is4Active = count >= 4;
              const statusText = is4Active ? info.desc4 : (is2Active ? info.desc2 : 'Inactive');
              const activeColor = is2Active ? info.color : '#64748b';
              const synIconHtml = info.icon.startsWith('icons/')
                ? `<div class="rpg-icon-box" style="width: 15px; height: 15px; display: inline-flex; border: none; background: transparent; box-shadow: none; vertical-align: middle;"><img src="${info.icon}" class="rpg-icon-img" alt="${info.label}" /></div>`
                : info.icon;
              return `
                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.3); padding: 3px 6px; border-radius: 5px; border-left: 3px solid ${activeColor};">
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <span class="rpg-text-upperlayer" style="color: ${activeColor}; font-weight: bold; display: flex; align-items: center; gap: 4px;">${synIconHtml} <span>${info.label} (${count})</span></span>
                  </div>
                  <div class="rpg-text-upperlayer" style="font-size: 9px; color: ${is2Active ? '#e2e8f0' : '#64748b'};">
                    ${statusText}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Emergency Field Ration, Slash Elixir & Merchant Cache -->
          <div style="margin-top: auto; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); width: 100%; display: flex; flex-direction: column; gap: 6px;">
            <button id="shop-ration-btn" style="width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.5); border-radius: 6px; cursor: pointer; transition: all 0.2s ease; font-family: 'Outfit', sans-serif; box-sizing: border-box; text-decoration: none;" ${(globals.stageCurrency || 0) < 20 || globals.lives >= globals.maxLives ? 'disabled' : ''}>
              <div style="display: flex; align-items: center; gap: 6px; font-size: 10.5px; font-weight: 700; color: #f87171;">
                <img src="icons/potion_health.png" class="inline-currency-icon" style="width: 18px; height: 18px;" alt="Health Potion" />
                <span>Field Ration (+1 HP)</span>
              </div>
              <div style="font-family: 'Orbitron', monospace; font-size: 10.5px; font-weight: bold; color: ${(globals.stageCurrency || 0) >= 20 ? '#ffd700' : '#ef4444'}; background: rgba(0,0,0,0.55); padding: 2px 7px; border-radius: 4px; border: 1px solid rgba(239, 68, 68, 0.4); white-space: nowrap; display: flex; align-items: center; gap: 3px;">
                ${globals.lives >= globals.maxLives ? 'MAX HP' : '<img src="icons/stage_gold.png" class="inline-currency-icon" style="width: 13px; height: 13px;" /> 20'}
              </div>
            </button>
            <button id="shop-potion-btn" style="width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.5); border-radius: 6px; cursor: pointer; transition: all 0.2s ease; font-family: 'Outfit', sans-serif; box-sizing: border-box; text-decoration: none;" ${(globals.stageCurrency || 0) < 50 ? 'disabled' : ''}>
              <div style="display: flex; align-items: center; gap: 6px; font-size: 10.5px; font-weight: 700; color: #fbbf24;">
                <img src="icons/potion_attack.png" class="inline-currency-icon" style="width: 18px; height: 18px;" alt="Slash Elixir" />
                <span>Slash Elixir (+5% ATK)</span>
              </div>
              <div style="font-family: 'Orbitron', monospace; font-size: 10.5px; font-weight: bold; color: ${(globals.stageCurrency || 0) >= 50 ? '#ffd700' : '#ef4444'}; background: rgba(0,0,0,0.55); padding: 2px 7px; border-radius: 4px; border: 1px solid rgba(245, 158, 11, 0.4); white-space: nowrap; display: flex; align-items: center; gap: 3px;">
                <img src="icons/stage_gold.png" class="inline-currency-icon" style="width: 13px; height: 13px;" /> 50
              </div>
            </button>
            ${(() => {
              const maxCacheAds = 2;
              const cacheAdsUsed = globals.stageMerchantCacheAds || 0;
              const canUseCacheAd = cacheAdsUsed < maxCacheAds;
              return `
                <button id="shop-ad-gold-btn" style="width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: ${canUseCacheAd ? 'rgba(212, 162, 78, 0.16)' : 'rgba(100, 100, 100, 0.12)'}; border: 1px solid ${canUseCacheAd ? 'rgba(251, 191, 36, 0.6)' : 'rgba(150, 150, 150, 0.3)'}; border-radius: 6px; cursor: ${canUseCacheAd ? 'pointer' : 'not-allowed'}; opacity: ${canUseCacheAd ? '1' : '0.5'}; transition: all 0.2s ease; font-family: 'Outfit', sans-serif; box-sizing: border-box; text-decoration: none;" ${canUseCacheAd ? '' : 'disabled'}>
                  <div style="display: flex; align-items: center; gap: 6px; font-size: 10.5px; font-weight: 700; color: ${canUseCacheAd ? '#ffd700' : '#888888'};">
                    <img src="icons/stage_gold_chest.png" class="inline-currency-icon" style="width: 20px; height: 20px; ${canUseCacheAd ? '' : 'filter: grayscale(1);'}" alt="Merchant Cache" />
                    <span>Merchant Cache (+100 Gold)${canUseCacheAd ? ` (${cacheAdsUsed}/${maxCacheAds})` : ' (2/2 Used)'}</span>
                  </div>
                  <div style="font-family: 'Orbitron', monospace; font-size: 9.5px; font-weight: bold; color: ${canUseCacheAd ? '#ffd700' : '#888888'}; background: rgba(0,0,0,0.55); padding: 2px 7px; border-radius: 4px; border: 1px solid ${canUseCacheAd ? 'rgba(251, 191, 36, 0.4)' : 'rgba(150, 150, 150, 0.3)'}; white-space: nowrap; display: flex; align-items: center; gap: 4px;">
                    <span>🎬</span> <span>${canUseCacheAd ? 'REWARD' : 'LIMIT'}</span>
                  </div>
                </button>
              `;
            })()}
          </div>
        </div>

        <!-- Right Column: 4 Shop Requisition Cards -->
        <div style="display: flex; flex-direction: column; gap: 10px; min-width: 0; width: 100%; box-sizing: border-box;">
          <div id="shop-items-grid" style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; width: 100%; box-sizing: border-box;">
          </div>
          
          <!-- Bottom Action Buttons -->
          <div style="display: flex; gap: 10px; width: 100%; justify-content: space-between; align-items: center; margin-top: 6px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px; flex-wrap: wrap;">
            <div style="font-size: 10.5px; color: #94a3b8; font-family: 'Space Mono', monospace; display: flex; align-items: center; gap: 6px;">
              <span>❄️ Frozen cards stay locked through rerolls</span>
            </div>
            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-left: auto;">
              <button id="shop-refresh-btn" class="menu-btn btn-compact" style="border-color: #38bdf8; color: #38bdf8; min-height: 34px; height: 34px; width: auto; max-width: none; min-width: 130px; padding: 0 14px; font-size: 11.5px; white-space: nowrap; flex-shrink: 0;">
                🔄 Reroll Unlocked (${costLabel})
              </button>
              <button id="shop-close-btn" class="menu-btn exit-btn btn-compact" style="min-height: 34px; height: 34px; width: auto; max-width: none; min-width: 90px; padding: 0 14px; font-size: 11.5px; white-space: nowrap; flex-shrink: 0;">
                ✕ Resume Battle
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const grid = modal.querySelector('#shop-items-grid')!;
  currentShopInventory.forEach((slot, idx) => {
    const card = document.createElement('div');
    const qColor = qualityColorMap[slot.quality];
    const canAfford = (globals.stageCurrency || 0) >= slot.price;
    const isFrozen = !!slot.isFrozen;
    const synInfo = SYNERGY_INFO[slot.synergy] || SYNERGY_INFO.element;

    card.className = 'shop-power-card';
    card.style.cssText = `
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      box-sizing: border-box !important;
      border-color: ${isFrozen ? '#38bdf8' : qColor};
      background: linear-gradient(135deg, ${isFrozen ? 'rgba(8, 47, 73, 0.95)' : 'rgba(15, 23, 42, 0.95)'}, rgba(10, 10, 15, 0.95));
      box-shadow: 0 0 12px ${isFrozen ? 'rgba(56, 189, 248, 0.35)' : qColor + '22'};
      padding: 10px 8px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 145px;
      position: relative;
      border-radius: 8px;
      border-width: 1.5px;
      border-style: solid;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      overflow: hidden;
    `;

    const cardWatermark = synInfo.icon.startsWith('icons/')
      ? `<img src="${synInfo.icon}" class="rpg-card-backdrop-icon" alt="" aria-hidden="true" />`
      : '';
    const cardSynIconEl = synInfo.icon.startsWith('icons/')
      ? `<div class="rpg-icon-box" style="width: 14px; height: 14px; display: inline-flex; border: none; background: transparent; box-shadow: none; vertical-align: middle;"><img src="${synInfo.icon}" class="rpg-icon-img" alt="${synInfo.label}" /></div>`
      : synInfo.icon;

    card.innerHTML = `
      ${cardWatermark}
      <div style="position: relative; z-index: 2;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; flex-wrap: wrap; gap: 3px;">
          <div style="display: flex; align-items: center; gap: 3px; flex-wrap: wrap;">
            <span class="rpg-text-upperlayer" style="font-size: 8.5px; font-weight: 900; letter-spacing: 0.5px; color: ${qColor}; text-transform: uppercase; border: 1px solid ${qColor}66; padding: 1px 5px; border-radius: 5px;">
              ${slot.quality}
            </span>
            ${slot.power.isUnique ? `
              <span class="rpg-text-upperlayer" style="font-size: 8px; font-weight: 900; color: #fbbf24; background: rgba(251, 191, 36, 0.2); border: 1px solid #fbbf24; padding: 1px 4px; border-radius: 4px; letter-spacing: 0.3px; display: inline-flex; align-items: center; gap: 3px;">
                <div class="rpg-icon-box" style="width: 11px; height: 11px; border: none; background: transparent; box-shadow: none; display: inline-flex; vertical-align: middle;"><img src="icons/rpg/fc1025.png" class="rpg-icon-img" /></div> <span>UNIQUE</span>
              </span>
            ` : ''}
            ${slot.power.skill && slot.power.skill === globals.selectedSkill ? `
              <span class="rpg-text-upperlayer" style="font-size: 8px; font-weight: 900; color: #38bdf8; background: rgba(56, 189, 248, 0.2); border: 1px solid #38bdf8; padding: 1px 4px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px;">
                <div class="rpg-icon-box" style="width: 11px; height: 11px; border: none; background: transparent; box-shadow: none; display: inline-flex; vertical-align: middle;"><img src="icons/rpg/fc1157.png" class="rpg-icon-img" /></div> <span>SYNERGY</span>
              </span>
            ` : ''}
          </div>
          <span class="rpg-text-upperlayer" style="font-size: 8.5px; font-weight: bold; color: ${synInfo.color}; background: rgba(0,0,0,0.5); padding: 1px 5px; border-radius: 5px; display: inline-flex; align-items: center; gap: 3px;">
            ${cardSynIconEl} <span>${synInfo.label}</span>
          </span>
        </div>

        ${renderShopBadges(slot, activeSyn)}

        <h3 class="rpg-text-upperlayer" style="font-size: 11.5px; margin: 0 0 3px 0; color: #f8fafc; font-family: 'Shojumaru', sans-serif; word-break: break-word;">
          ${t(slot.power.nameKey)}
        </h3>
        <p class="rpg-text-upperlayer" style="font-size: 9.5px; color: #cbd5e1; margin: 0; line-height: 1.35; font-family: 'Space Mono', monospace;">
          ${t(slot.power.descKey)}
        </p>
      </div>

      <div style="position: relative; z-index: 2; margin-top: 8px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center; gap: 4px;">
        <button class="shop-freeze-btn" style="background: ${isFrozen ? '#0284c7' : 'rgba(0,0,0,0.5)'}; border: 1px solid ${isFrozen ? '#38bdf8' : 'rgba(255,255,255,0.2)'}; color: ${isFrozen ? '#ffffff' : '#94a3b8'}; border-radius: 4px; padding: 2px 5px; font-size: 9px; cursor: pointer; display: flex; align-items: center; gap: 4px; white-space: nowrap; flex-shrink: 0;">
          <div class="rpg-icon-box" style="width: 11px; height: 11px; border: none; background: transparent; box-shadow: none; display: inline-flex;"><img src="icons/rpg/fc1191.png" class="rpg-icon-img" /></div>
          <span>${isFrozen ? 'LOCKED' : 'LOCK'}</span>
        </button>

        <button class="shop-buy-btn" style="background: ${canAfford ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.05)'}; border: 1px solid ${canAfford ? '#fbbf24' : 'rgba(255,255,255,0.2)'}; color: ${canAfford ? '#fbbf24' : '#64748b'}; border-radius: 4px; padding: 3px 8px; font-size: 10.5px; font-weight: bold; cursor: ${canAfford ? 'pointer' : 'not-allowed'}; font-family: 'Orbitron', monospace; white-space: nowrap; flex-shrink: 0; display: inline-flex; align-items: center; gap: 4px;" ${canAfford ? '' : 'disabled'}>
          ${slot.discountPct ? `<span style="text-decoration: line-through; opacity: 0.6; font-size: 8.5px; margin-right: 3px;"><img src="icons/stage_gold.png" class="inline-currency-icon" style="width: 10px; height: 10px;" />${slot.originalPrice}</span>` : ''}<img src="icons/stage_gold.png" class="inline-currency-icon" style="width: 12px; height: 12px;" /> ${slot.price} <span style="font-size: 8.5px; opacity: 0.7; margin-left: 3px; background: rgba(0,0,0,0.35); padding: 1px 4px; border-radius: 3px; font-family: monospace;">[${idx + 1}]</span>
        </button>
      </div>
    `;

    // Freeze Button Handler
    const freezeBtn = card.querySelector('.shop-freeze-btn') as HTMLElement;
    if (freezeBtn) {
      bindDualListener(freezeBtn, () => {
        slot.isFrozen = !slot.isFrozen;
        playSlashSfx(0.6);
        renderShopModal();
      });
    }

    // Buy Button Handler
    const buyBtn = card.querySelector('.shop-buy-btn') as HTMLElement;
    if (buyBtn && canAfford) {
      bindDualListener(buyBtn, () => {
        if ((globals.stageCurrency || 0) < slot.price) return;
        globals.stageCurrency -= slot.price;
        slot.power.apply();
        globals.chosenPowerUps.push(slot.power.nameKey);
        currentShopInventory.splice(idx, 1);
        callbacks.onTrainingAction?.({ type: 'shop', phase: 'buy', powerupId: slot.power.nameKey });
        callbacks.updateUI();
        playSound(sfx.magatamaPickup, 1.0);
        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 70, `+${t(slot.power.nameKey)}`, '#ffd700', 22));
        renderShopModal();
      });
    }

    grid.appendChild(card);
  });

  const rationBtn = modal.querySelector('#shop-ration-btn') as HTMLElement;
  if (rationBtn) {
    let isHoldingRation = false;
    let rationHoldTimer: any = null;
    let rationRepeatTimer: any = null;

    const buyOneRation = (): boolean => {
      if ((globals.stageCurrency || 0) < 20 || globals.lives >= globals.maxLives) return false;
      globals.stageCurrency -= 20;
      globals.lives++;
      callbacks.onTrainingAction?.({ type: 'shop', phase: 'buy', powerupId: 'ration' });
      callbacks.updateUI();
      playSound(sfx.magatamaPickup, 1.0);
      globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 60, "+1 ❤️", "#4ade80", 26));
      renderShopModal();
      return globals.lives < globals.maxLives && (globals.stageCurrency || 0) >= 20;
    };

    const stopRationHold = () => {
      if (!isHoldingRation) return;
      isHoldingRation = false;
      if (rationHoldTimer) { clearTimeout(rationHoldTimer); rationHoldTimer = null; }
      if (rationRepeatTimer) { clearTimeout(rationRepeatTimer); rationRepeatTimer = null; }
    };

    const scheduleRationRepeat = () => {
      if (!isHoldingRation) return;
      rationRepeatTimer = setTimeout(() => {
        if (!isHoldingRation) return;
        const canContinue = buyOneRation();
        if (canContinue) scheduleRationRepeat();
        else stopRationHold();
      }, 160);
    };

    const startRationHold = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if (isHoldingRation) return;
      isHoldingRation = true;
      const canContinue = buyOneRation();
      if (!canContinue) { stopRationHold(); return; }
      rationHoldTimer = setTimeout(() => {
        if (!isHoldingRation) return;
        scheduleRationRepeat();
      }, 300);
    };

    rationBtn.addEventListener('pointerdown', startRationHold);
    rationBtn.addEventListener('pointerup', stopRationHold);
    rationBtn.addEventListener('pointercancel', stopRationHold);
    rationBtn.addEventListener('pointerleave', stopRationHold);
  }

  const potionBtn = modal.querySelector('#shop-potion-btn') as HTMLElement;
  if (potionBtn) {
    let isHoldingPotion = false;
    let potionHoldTimer: any = null;
    let potionRepeatTimer: any = null;

    const buyOnePotion = (): boolean => {
      if ((globals.stageCurrency || 0) < 50) return false;
      globals.stageCurrency -= 50;
      globals.stageAttackPotions = (globals.stageAttackPotions || 0) + 1;
      callbacks.updateUI();
      playSound(sfx.magatamaPickup, 1.0);
      globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 60, "+5% SLASH DMG (STAGE)! ⚔️", "#fbbf24", 26));
      renderShopModal();
      return (globals.stageCurrency || 0) >= 50;
    };

    const stopPotionHold = () => {
      if (!isHoldingPotion) return;
      isHoldingPotion = false;
      if (potionHoldTimer) { clearTimeout(potionHoldTimer); potionHoldTimer = null; }
      if (potionRepeatTimer) { clearTimeout(potionRepeatTimer); potionRepeatTimer = null; }
    };

    const schedulePotionRepeat = () => {
      if (!isHoldingPotion) return;
      potionRepeatTimer = setTimeout(() => {
        if (!isHoldingPotion) return;
        const canContinue = buyOnePotion();
        if (canContinue) schedulePotionRepeat();
        else stopPotionHold();
      }, 90);
    };

    const startPotionHold = (e: PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isHoldingPotion) return;
      isHoldingPotion = true;
      const canContinue = buyOnePotion();
      if (!canContinue) { stopPotionHold(); return; }
      potionHoldTimer = setTimeout(() => {
        if (!isHoldingPotion) return;
        schedulePotionRepeat();
      }, 300);
    };

    potionBtn.addEventListener('pointerdown', startPotionHold);
    potionBtn.addEventListener('pointerup', stopPotionHold);
    potionBtn.addEventListener('pointercancel', stopPotionHold);
    potionBtn.addEventListener('pointerleave', stopPotionHold);
  }

  const adGoldBtn = modal.querySelector('#shop-ad-gold-btn') as HTMLElement;
  if (adGoldBtn) {
    bindDualListener(adGoldBtn, () => {
      if ((globals.stageMerchantCacheAds || 0) >= 2) return;
      AdManager.showRewardedAd('shop-gold-cache', {
        onComplete: () => {
          globals.stageMerchantCacheAds = (globals.stageMerchantCacheAds || 0) + 1;
          globals.stageCurrency = (globals.stageCurrency || 0) + 100;
          callbacks.updateUI();
          playSound(sfx.magatamaPickup, 1.0);
          globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 70, "+100 GOLD CACHE! 💰", "#ffd700", 26));
          renderShopModal();
        },
        onFailed: (err) => {
          console.warn("[Shop] Gold Cache Ad failed:", err);
        }
      });
    });
  }

  const refreshBtn = modal.querySelector('#shop-refresh-btn') as HTMLElement;
  if (refreshBtn) {
    bindDualListener(refreshBtn, () => {
      const cost = isFreeRefresh ? 0 : refreshCost;
      if ((globals.stageCurrency || 0) < cost) return;
      globals.stageCurrency -= cost;
      globals.shopRefreshCount = (globals.shopRefreshCount || 0) + 1;
      currentShopInventory = rollShopInventory();
      callbacks.updateUI();
      playSlashSfx(0.8);
      renderShopModal();
    });
  }

  const closeBtn = modal.querySelector('#shop-close-btn') as HTMLElement;
  if (closeBtn) {
    bindDualListener(closeBtn, () => {
      closeShop();
    });
  }

  // Keyboard shortcut listener for rapid outposts ergonomics
  if (!(window as any)._shopKeyHandlerBound) {
    (window as any)._shopKeyHandlerBound = true;
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (!globals.shopOpen) return;
      if (['1', '2', '3', '4'].includes(e.key)) {
        const slotIdx = parseInt(e.key) - 1;
        const buyBtns = document.querySelectorAll('.shop-buy-btn') as NodeListOf<HTMLButtonElement>;
        if (buyBtns[slotIdx] && !buyBtns[slotIdx].disabled) {
          buyBtns[slotIdx].click();
        }
      } else if (e.key === 'r' || e.key === 'R') {
        const refreshBtn = document.getElementById('shop-refresh-btn') as HTMLButtonElement;
        if (refreshBtn && !refreshBtn.disabled) {
          refreshBtn.click();
        }
      }
    });
  }

  // Restore scroll position after purchase/lock/refresh re-render
  const newBox = modal.querySelector('.shop-modal-box') as HTMLElement;
  if (newBox && prevScrollTop > 0) {
    newBox.scrollTop = prevScrollTop;
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
