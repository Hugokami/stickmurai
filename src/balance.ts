// Shared by combat and Dojo: percentages are fractions, cooldowns are multipliers.
export interface HeroBalance {
  cost:number; slash:number; move:number; attack:number; dash:number; area:number;
  crit:number; iai:number; posture:number; skillCooldown:number;
  passiveEn:string; passiveJa:string;
}
export const HERO_BALANCE:Record<string,HeroBalance> = {
  default:{cost:0,slash:0,move:1.05,attack:1,dash:1,area:1,crit:.05,iai:0,posture:12,skillCooldown:1,passiveEn:'• +35% Parry Window • +12 Posture DMG',passiveJa:'• パリィ猶予+35% • 体幹削り+12'},
  luneblade:{cost:10000,slash:.20,move:1.08,attack:.95,dash:1,area:1.35,crit:.10,iai:3,posture:0,skillCooldown:1,passiveEn:'• +35% Slash Reach • +3 Iaijutsu DMG',passiveJa:'• 斬撃範囲+35% • 抜刀DMG+3'},
  ninja:{cost:15000,slash:.15,move:1.30,attack:.85,dash:.75,area:1,crit:.12,iai:1,posture:0,skillCooldown:.98,passiveEn:'• +30% Move Speed • -25% Dash CD • Phantom Afterimages',passiveJa:'• 移動速度+30% • 瞬歩CD-25% • 影の残像'},
  samurai:{cost:30000,slash:.30,move:1.15,attack:.70,dash:1,area:1.10,crit:.15,iai:2,posture:0,skillCooldown:.96,passiveEn:'• 3rd Slash Cleaves 5 Foes (50% DMG)',passiveJa:'• 3連斬毎: 周囲5体へなぎ払い(50% DMG)'},
  nightborne:{cost:50000,slash:.40,move:1.12,attack:.76,dash:1,area:1.40,crit:.18,iai:5,posture:0,skillCooldown:.94,passiveEn:'• Executions: Restore 1 Heart • +35 Mon on Execution',passiveJa:'• 処刑時: ハート1回復 • 獲得勾玉+35'},
  satyr:{cost:75000,slash:.50,move:1.18,attack:.80,dash:.95,area:1.30,crit:.21,iai:6,posture:8,skillCooldown:.92,passiveEn:'• Executions: 18 DMG & 32 Posture to 4 Foes (5s CD)',passiveJa:'• 処刑時: 4体に18 DMG & 体幹32 (5秒CD)'},
  akakage:{cost:120000,slash:.65,move:1.25,attack:.72,dash:.82,area:1.35,crit:.25,iai:4,posture:0,skillCooldown:.90,passiveEn:'• Slashes Trigger Echo Strike (45% DMG, Max 12)',passiveJa:'• 斬撃時追撃残影 (45% DMG、上限12)'},
  aetherion:{cost:360000,slash:.80,move:1.28,attack:.65,dash:.78,area:1.45,crit:.25,iai:6,posture:16,skillCooldown:.90,passiveEn:'• Melee Applies Star Brand • Ranged Detonates Cosmic AoE',passiveJa:'• 近接で星の刻印付与 • 遠距離射撃で大爆発起爆'}
};
export const heroBalance=(id:string):HeroBalance=>HERO_BALANCE[id]||HERO_BALANCE.default;

export interface HeroAwakeningSkill {
  heroId: string;
  nameEn: string;
  nameJa: string;
  titleEn: string;
  titleJa: string;
  cost: number;
  icon: string;
  descEn: string;
  descJa: string;
}

export const HERO_AWAKENING_SKILLS: Record<string, HeroAwakeningSkill> = {
  default: {
    heroId: 'default',
    nameEn: 'Kensei Domain',
    nameJa: '剣聖領域',
    titleEn: 'Blade God Revelation',
    titleJa: '刀神の啓示',
    cost: 10000,
    icon: 'icons/rpg/fc1038.png',
    descEn: '• Perfect Parry Slows Time 1.2s • 4 Homing Phantoms (150% ATK)',
    descJa: '• 完全パリィ時時間遅延1.2秒 • 追尾幻影刃4本発射(150% ATK)'
  },
  luneblade: {
    heroId: 'luneblade',
    nameEn: 'Crescent Moonfall',
    nameJa: '月華降臨',
    titleEn: 'Lunar Ascension',
    titleJa: '月華の昇華',
    cost: 20000,
    icon: 'icons/rpg/fc1191.png',
    descEn: '• Dual-Crescent Cross Iaijutsu • Calls Radiant Lunar Beams (Heavy DoT)',
    descJa: '• 十文字月華抜刀術 • 命中地点に連続月光柱召喚'
  },
  ninja: {
    heroId: 'ninja',
    nameEn: 'Shadow Mirage Swarm',
    nameJa: '影分身乱舞',
    titleEn: 'Wraith Mirage',
    titleJa: '幽幻の蜃気楼',
    cost: 30000,
    icon: 'icons/rpg/fc543.png',
    descEn: '• Dash Leaves Mimic Clone (3.5s Taunt) • Detonates with Smoke Stun',
    descJa: '• ダッシュ時模倣影分身(3.5秒挑発) • 爆発煙幕スタン'
  },
  samurai: {
    heroId: 'samurai',
    nameEn: 'Dragon Roar Counter',
    nameJa: '真・龍咆哮',
    titleEn: 'Unbroken Dragon Poise',
    titleJa: '不撓の竜威',
    cost: 60000,
    icon: 'icons/rpg/fc1328.png',
    descEn: '• Parry Shreds 120 Posture • Grants 3s Hyper Armor (50% DR + Unflinching)',
    descJa: '• パリィ時体幹120削り • 3秒ハイパーアーマー(被ダメ半減・無硬直)'
  },
  nightborne: {
    heroId: 'nightborne',
    nameEn: 'Abyssal Singularity',
    nameJa: '深淵特異点',
    titleEn: 'Void Sovereign Core',
    titleJa: '虚無の特異核',
    cost: 100000,
    icon: 'icons/rpg/fc1052.png',
    descEn: '• 4s Black Hole on Execution/Ult • Pulls Foes • Siphons HP',
    descJa: '• 処刑/奥義時4秒ブラックホール • 敵吸引 • HP吸収'
  },
  satyr: {
    heroId: 'satyr',
    nameEn: 'Titan Earth Fissure',
    nameJa: '大地の地割れ',
    titleEn: 'Primal Tremor',
    titleJa: '原初の激震',
    cost: 150000,
    icon: 'icons/rpg/fc1237.png',
    descEn: '• Every 3rd Slash Cone Fissure • Launches Foes Airborne • +40% Damage Taken',
    descJa: '• 3撃毎に扇状地割れ • 敵打ち上げ • 被ダメ+40%付与'
  },
  akakage: {
    heroId: 'akakage',
    nameEn: 'Blood Asura Frenzy',
    nameJa: '血の阿修羅',
    titleEn: 'Crimson Carnage',
    titleJa: '紅蓮の大虐殺',
    cost: 240000,
    icon: 'icons/rpg/fc1220.png',
    descEn: '• Crits Spawn Blood Scythes (4 Pierces) • Flow Kills Add +0.7s (Max +3.5s)',
    descJa: '• 会心時貫通血鎌射出 • 覚醒キル毎に持続+0.7秒(最大+3.5秒)'
  },
  aetherion: {
    heroId: 'aetherion',
    nameEn: 'Astral Singularity',
    nameJa: '星彩特異点',
    titleEn: 'Celestial Convergence',
    titleJa: '星辰の収束',
    cost: 720000,
    icon: 'icons/rpg/fc1276.png',
    descEn: '• 3-Way Starbeam Railgun • Dual Crescent Slashes • 100% Crit on Star Brand',
    descJa: '• 3方向貫通星光線 • 追尾二重三日月刃 • 刻印対象に確定会心'
  }
};

export const heroAwakeningSkill=(id:string):HeroAwakeningSkill|undefined=>HERO_AWAKENING_SKILLS[id];
export const BOSS_BASE_HP = {oni_boss:600,agis_colossus:950,skeleton_warlord:850,shogun_boss:800};
export function campaignHpMultiplier(stage:number,boss:boolean):number {
  const s = Math.max(1, stage);
  const late = Math.max(0, s - 5);
  if (boss) {
    const stage50Mult = s >= 50 ? 5.0 : 1.0;
    const stage60BossMult = s >= 60 ? 1.3 : 1.0;
    // Early stages are ~5x lower HP (360 HP at stage 1 vs 1800 HP), scaling up smoothly to stronger lategame
    const early = 0.6 + (s - 1) * 1.65;
    return stage50Mult * stage60BossMult * (early + late * 2.5 + (late * late) * 0.35);
  }
  return 1.5 * (1 + (s - 1) * 0.20 + late * 0.35 + (late * late) * 0.02);
}
export function heroDescription(id:string,ja=false):string {
  const b=heroBalance(id),pct=(v:number)=>Math.round(v*100);
  return ja?`斬撃ダメージ+${pct(b.slash)}%・会心率${pct(b.crit)}%・スキル再使用時間-${pct(1-b.skillCooldown)}%。${b.passiveJa}`:`+${pct(b.slash)}% slash damage · ${pct(b.crit)}% base crit · ${pct(1-b.skillCooldown)}% active-skill cooldown reduction. ${b.passiveEn}`;
}
