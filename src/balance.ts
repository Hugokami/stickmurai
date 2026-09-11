// Shared by combat and Dojo: percentages are fractions, cooldowns are multipliers.
export interface HeroBalance {
  cost:number; slash:number; move:number; attack:number; dash:number; area:number;
  crit:number; iai:number; posture:number; skillCooldown:number;
  passiveEn:string; passiveJa:string;
}
export const HERO_BALANCE:Record<string,HeroBalance> = {
  default:{cost:0,slash:0,move:1.05,attack:1,dash:1,area:1,crit:.05,iai:0,posture:12,skillCooldown:1,passiveEn:'Parry Prodigy: +35% parry window and +12 posture damage.',passiveJa:'弾きの達人：パリィ猶予+35%、体幹ダメージ+12。'},
  luneblade:{cost:10000,slash:.20,move:1.08,attack:.95,dash:1,area:1.35,crit:.10,iai:3,posture:0,skillCooldown:1,passiveEn:'Lunar Resonance: +35% slash reach and +3 Iaijutsu damage.',passiveJa:'月華共鳴：斬撃範囲+35%、抜刀ダメージ+3。'},
  ninja:{cost:15000,slash:.15,move:1.30,attack:.85,dash:.75,area:1,crit:.12,iai:1,posture:0,skillCooldown:.98,passiveEn:'Phantom Strike: +30% movement, -25% dash cooldown and phantom dash afterimages.',passiveJa:'幻影瞬歩：移動+30%、瞬歩クールダウン-25%、影の残像。'},
  samurai:{cost:30000,slash:.30,move:1.15,attack:.70,dash:1,area:1.10,crit:.15,iai:2,posture:0,skillCooldown:.96,passiveEn:'Kensei: every third basic slash cleaves up to 5 nearby foes for 50% slash damage.',passiveJa:'剣聖：通常斬撃3回ごとに周囲最大5体へ斬撃の50%ダメージ。'},
  nightborne:{cost:50000,slash:.40,move:1.12,attack:.76,dash:1,area:1.40,crit:.18,iai:5,posture:0,skillCooldown:.94,passiveEn:'Soul Siphon: executions restore 1 heart and grant 35 Magatama.',passiveJa:'魂の吸収：処刑で体力1回復、勾玉35獲得。'},
  satyr:{cost:75000,slash:.50,move:1.18,attack:.80,dash:.95,area:1.30,crit:.21,iai:6,posture:8,skillCooldown:.92,passiveEn:'Earthshaker: executions deal 18 damage and 32 posture to up to 4 nearby foes; 5s cooldown.',passiveJa:'大地震：処刑で周囲最大4体に18ダメージ・体幹32。再使用5秒。'},
  akakage:{cost:120000,slash:.65,move:1.25,attack:.72,dash:.82,area:1.35,crit:.25,iai:4,posture:0,skillCooldown:.90,passiveEn:'Crimson Aftermath: one echo after each basic slash, dealing 45% slash damage (maximum 12).',passiveJa:'紅蓮残影：通常斬撃後に一度追撃。斬撃の45%ダメージ（上限12）。'}
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
    icon: '⚡',
    descEn: 'Perfect parrying slows time for 1.2s and discharges 4 phantom counter-slashes seeking all nearby foes for 150% slash damage.',
    descJa: '完璧な弾きで1.2秒間時間を遅延させ、周囲の敵へ150%ダメージの幻影斬撃4発を自動追尾で放つ。'
  },
  luneblade: {
    heroId: 'luneblade',
    nameEn: 'Crescent Moonfall',
    nameJa: '月華降臨',
    titleEn: 'Lunar Ascension',
    titleJa: '月華の昇華',
    cost: 20000,
    icon: '🌙',
    descEn: 'Iaijutsu splits into a dual-crescent cross cutting all dimensions. Hits summon radiant lunar beams dealing heavy continuous damage.',
    descJa: '抜刀術が縦横二連の十文字月華斬に分裂。命中時に天から月光柱が降り注ぎ継続大ダメージを与える。'
  },
  ninja: {
    heroId: 'ninja',
    nameEn: 'Shadow Mirage Swarm',
    nameJa: '影分身乱舞',
    titleEn: 'Wraith Mirage',
    titleJa: '幽幻の蜃気楼',
    cost: 30000,
    icon: '👤',
    descEn: 'Dashing leaves behind a lethal shadow clone that mirrors your slashes and taunts enemies for 3.5s, detonating into a flash smoke stun.',
    descJa: '瞬歩後に斬撃を模倣し敵を引きつける影分身を生成（3.5秒）。消滅時に煙幕閃光が炸裂し周囲を気絶させる。'
  },
  samurai: {
    heroId: 'samurai',
    nameEn: 'Dragon Roar Counter',
    nameJa: '真・龍咆哮',
    titleEn: 'Unbroken Dragon Poise',
    titleJa: '不撓の竜威',
    cost: 60000,
    icon: '🐉',
    descEn: 'Parries erupt into a golden dragon wave shredding 120 enemy posture instantly and granting 3 seconds of Hyper Armor (50% DR + unflinching).',
    descJa: '弾き成功時に金龍の衝撃波が咆哮し敵の体幹を一気に120削る。さらに3秒間ハイパーアーマー（被ダメ半減・無硬直）。'
  },
  nightborne: {
    heroId: 'nightborne',
    nameEn: 'Abyssal Singularity',
    nameJa: '深淵特異点',
    titleEn: 'Void Sovereign Core',
    titleJa: '虚無の特異核',
    cost: 100000,
    icon: '🌌',
    descEn: 'Executions and Awakening trigger a black hole vortex for 4s, crushing enemies together, dealing dark pulses, and siphoning player health.',
    descJa: '処刑および覚醒時に4秒間ブラックホールが出現。周囲の敵を吸い寄せ、暗黒パルスで体力を吸収する。'
  },
  satyr: {
    heroId: 'satyr',
    nameEn: 'Titan Earth Fissure',
    nameJa: '大地の地割れ',
    titleEn: 'Primal Tremor',
    titleJa: '原初の激震',
    cost: 150000,
    icon: '🌋',
    descEn: 'Every 3rd slash fractures the ground in a cone, erupting jagged stone pillars that propel enemies airborne and increase incoming damage by +40%.',
    descJa: '3連撃ごとに大地を叩き割る地割れが発生。隆起した巨岩が敵を打ち上げ、被ダメージを+40%増加させる。'
  },
  akakage: {
    heroId: 'akakage',
    nameEn: 'Blood Asura Frenzy',
    nameJa: '血の阿修羅',
    titleEn: 'Crimson Carnage',
    titleJa: '紅蓮の大虐殺',
    cost: 240000,
    icon: '🩸',
    descEn: 'Crits spawn spinning blood scythe boomerangs through targets. Slaying enemies during Flow Awakening extends its duration by +1.5s per kill.',
    descJa: '会心時に回転する血の大鎌が敵を貫通往復。覚醒中に敵を討伐すると覚醒時間が1体につき+1.5秒延長される。'
  }
};

export const heroAwakeningSkill=(id:string):HeroAwakeningSkill|undefined=>HERO_AWAKENING_SKILLS[id];
export const BOSS_BASE_HP = {oni_boss:150,agis_colossus:255,skeleton_warlord:225,shogun_boss:195};
export function campaignHpMultiplier(stage:number,boss:boolean):number {
  return 1.5*(1+(Math.max(1,stage)-1)*(boss?.11:.16));
}
export function heroDescription(id:string,ja=false):string {
  const b=heroBalance(id),pct=(v:number)=>Math.round(v*100);
  return ja?`斬撃ダメージ+${pct(b.slash)}%・会心率${pct(b.crit)}%・スキル再使用時間-${pct(1-b.skillCooldown)}%。${b.passiveJa}`:`+${pct(b.slash)}% slash damage · ${pct(b.crit)}% base crit · ${pct(1-b.skillCooldown)}% active-skill cooldown reduction. ${b.passiveEn}`;
}
