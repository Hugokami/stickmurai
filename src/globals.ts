import { safeStorage } from './storage';

export const globals = {
  // Game State
  gameState: 'mainmenu',
  gameMode: 'classic' as 'classic' | 'zen' | 'time' | 'level' | 'pvp',
  timerLimit: 'endless' as 'endless' | 180 | 300 | 600,
  timeModeDuration: 180,
  timeModeTimeRemaining: 180,
  levelModeTarget: 15,
  lastZenWarningTime: 0,
  flowState: 'normal' as 'normal' | 'awakened' | 'storm_god' | 'omnislash',
  timeSlowFactor: 1,
  timeSlowDuration: 0,
  targetTimeSlowFactor: 1,
  flow: 0,
  ultCooldown: 0,
  ultCooldownMax: 6.0,
  combo: 0,
  comboTimer: 0,
  score: 0,
  screenShake: 0,
  hitStop: 0,
  invertScreenTimer: 0,
  lives: 5,
  invulnTimer: 0,
  roninResolveCooldown: 0,
  enhanceActiveTimer: 0,
  enhanceCooldown: 0,

  // Active Skills and Powerups State
  selectedSkill: (() => {
    try {
      const stored = safeStorage.getItem('stickmurai_selected_skill');
      if (stored) return stored as any;
    } catch(e) {}
    return 'enhance';
  })() as 'enhance' | 'shield' | 'dash' | 'firewheel' | 'gravity' | 'parry_master' | 'decoy_illusion',
  unlockedSkills: (() => {
    try {
      const stored = safeStorage.getItem('stickmurai_unlocked_skills');
      return stored ? JSON.parse(stored) : ['enhance'];
    } catch(e) {
      return ['enhance'];
    }
  })() as string[],
  raijinDashActive: false,
  raijinHitEnemies: new Set<any>(),
  maxLives: 5,
  petalArmorLevel: 0,
  petalArmorActive: false,
  petalArmorCooldown: 0,
  echoLevel: 0,
  levelUpRerollsRemaining: 0,
  tempoMasteryLevel: 0,
  shieldPulseTimer: 0,
  gravityWellTimer: 0,
  gravityWellX: 0,
  gravityWellY: 0,
  singularityCleaveCD: 0,

  runStats: {
    kills: 0,
    bossesKilled: 0,
    maxCombo: 0,
    parries: 0,
    perfectParries: 0,
    perfectDodges: 0,
    damageDealt: 0
  },

  playerStats: { 
    slashBonusDmgPct: 0,
    iaijutsuBonusDmg: 0,
    slashSizeMult: 1.0, 
    attackCooldownBase: 0.3, 
    dashCooldownBase: 1.2, 
    moveSpeedMult: 1.0, 
    flowGenMult: 1.0, 
    flowMax: 200,
    enhanceCooldownMax: 20.0,
    enhanceDuration: 8.0,
    enhanceBonusDmg: 1,
    enhanceSizeMult: 1.5,
    iaijutsuChargeSpeed: 1.0,
    vampireChance: 0.0,
    deflectedDmg: 1,
    iaijutsuRangeMult: 1.0,
    fireStanceLevel: 0,
    shadowClonesLevel: 0,
    shieldPulseLevel: 0,
    shieldBlastLevel: 0,
    dashDamageLevel: 0,
    dashRangeLevel: 0,
    dashThunderLevel: 0,
    firewheelRangeLevel: 0,
    firewheelBlazeLevel: 0,
    firewheelEchoLevel: 0,
    gravityRadiusLevel: 0,
    gravityDamageLevel: 0,
    gravityExplosionLevel: 0,
    judgementCutLevel: 0,
    sakuraBlizzardLevel: 0,
    unstableOverloadLevel: 0,
    magneticDrawLevel: 0,
    reapersMarkLevel: 0,
    fortuneMult: 1.0,
    postureDmgBonus: 0,
    heroCritChance: 0,
    critChanceBonus: 0,
    executionLevel: 0
  },

  executionUnlocked: false,
  chiburuiKills: 0,
  chiburuiTimer: 0,
  guaranteedCrit: false,

  exp: 0,
  maxExp: 15,
  level: 1,

  // Collections
  player: null as any, // Player instance
  enemies: [] as any[],
  slashes: [] as any[],
  projectiles: [] as any[],
  particles: [] as any[],
  afterimages: [] as any[],
  shockwaves: [] as any[],
  floatingTexts: [] as any[],
  groundScars: [] as any[],
  decoys: [] as any[],
  sakuraPetals: [] as any[],
  collectibles: [] as any[],
  judgementDomes: [] as any[],
  lightningBeams: [] as any[],
  pvpShockwaves: [] as any[],
  animatedEffects: [] as any[],
  playerPosHistory: [] as { x: number, y: number, state: string, animFrame: number, dir: number }[],
  delayedActions: [] as any[],
  windForces: [] as any[],
  weatherEngine: null as any,
  chosenPowerUps: [] as string[],

  // Render & Window
  width: window.innerWidth,
  height: window.innerHeight,
  gameZoom: 1,
  vw: window.innerWidth,
  vh: window.innerHeight,
  camera: { x: 0, y: 0 },
  graphicsSettings: (() => { try { return safeStorage.getItem('graphics') || 'high'; } catch(e) { return 'high'; } })(),
  currentLang: (() => { try { return safeStorage.getItem('lang') || 'en'; } catch(e) { return 'en'; } })(),
  difficulty: (() => { try { return safeStorage.getItem('difficulty') || 'normal'; } catch(e) { return 'normal'; } })() as 'easy' | 'normal' | 'hard' | 'insane',
  screenShakeEnabled: (() => { try { return safeStorage.getItem('screenShake') || 'on'; } catch(e) { return 'on'; } })() as 'on' | 'reduced' | 'off',
  autoUltEnabled: (() => { try { return safeStorage.getItem('autoUlt') || 'on'; } catch(e) { return 'on'; } })() as 'on' | 'off',
  screenFlashEnabled: (() => { try { return safeStorage.getItem('screenFlash') || 'on'; } catch(e) { return 'on'; } })() as 'on' | 'off',
  weatherEffectsEnabled: (() => { try { return safeStorage.getItem('weatherEffects') || 'on'; } catch(e) { return 'on'; } })() as 'on' | 'off',
  speedLinesEnabled: (() => { try { return safeStorage.getItem('speedLines') || 'on'; } catch(e) { return 'on'; } })() as 'on' | 'off',
  floatingTextEnabled: (() => { try { return safeStorage.getItem('floatingText') || 'on'; } catch(e) { return 'on'; } })() as 'on' | 'off',
  groundScarsEnabled: (() => { try { return safeStorage.getItem('groundScars') || 'on'; } catch(e) { return 'on'; } })() as 'on' | 'off',
  keyMaps: (() => {
    try {
      const stored = safeStorage.getItem('keyMaps');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return {
      moveUp: 'KeyW',
      moveDown: 'KeyS',
      moveLeft: 'KeyA',
      moveRight: 'KeyD',
      dash: 'Space',
      skill: 'KeyE',
      ult: 'KeyF'
    };
  })() as Record<string, string>,
  highScores: (() => {
    try {
      const stored = safeStorage.getItem('highScores');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return {
      score: 0,
      maxCombo: 0,
      parries: 0,
      perfectParries: 0,
      perfectDodges: 0
    };
  })() as Record<string, number>,

  // Inputs
  keys: {} as Record<string, boolean>,
  mouse: { x: window.innerWidth / 2, y: window.innerHeight / 2, down: false, justPressed: false, justReleased: false },
  joystickActive: false,
  joystickVector: { x: 0, y: 0 },
  mobileAttackJustPressed: false,
  mobileAttackDown: false,
  mobileAttackReleased: false,
  mobileParryJustPressed: false,
  mobileDashJustPressed: false,
  mobileDashDown: false,
  mobileDashAimActive: false,
  mobileDashAimAngle: 0,
  useMobileDashAimAngle: false,
  mobileRaijinAimActive: false,
  mobileRaijinAimAngle: 0,
  useMobileRaijinAimAngle: false,
  mobileIaijutsuAimActive: false,
  mobileIaijutsuAimAngle: 0,
  useMobileIaijutsuAimAngle: false,
  mobileUltJustPressed: false,
  mobileEnhanceJustPressed: false,

  // New Stances & Powerups
  frostStanceActive: false,
  voidStanceActive: false,
  flowingCounterActive: false,
  galeVortexActive: false,
  bladeEchoesActive: false,
  comboFinisherReady: false,
  riposteTimer: 0,
  decoyInvisibilityTimer: 0,
  decoyCritPrimed: false,
  reapersMarkTimer: 25.0,
  reapersMarkKills: 0,
  shadowAutoAttackTimer: 0,

  // Combo Moves tracking
  comboSlashesCount: 0,
  lastBasicSlashTime: 0,
  lastIaijutsuFireTime: 0,
  lastIaijutsuAngle: 0,
  lightningDischargeActive: false,


  // Asset Loading
  totalAssetsToLoad: 0,
  assetsLoadedCount: 0,

  // PvP storm mode warning indicators
  pvpStormWarningTarget: null as 'left' | 'right' | null,
  pvpStormWarningTimer: 0,
  p1Kills: 0,
  p2Kills: 0,

  hasRevivedThisRun: false,
  activeBlessing: null as 'swift_strike' | 'fortune' | null,
  zenFieldActiveTimer: 0,
  zenFieldTickTimer: 0,

  // Battlefield Bounty Contracts
  activeBounty: null as null | {
    type: 'slay' | 'parry' | 'deflect' | 'combo',
    target: number,
    current: number,
    timeRemaining: number,
    description: string
  },
  bountyTimer: 30,

  // Corrupted / Cursed Blessings
  bloodThirstCurseActive: false,
  bloodThirstBleedTimer: 45.0,
  curseOfGreedActive: false,
  scoreMultiplier: 1,

  // Option 2: Blade Clash (Tsubazeriai)
  activeBladeClash: null as BladeClashState | null,

  // Curiosity, Fusions, Shrines & 10-Minute Dawn Progression
  discoveredFusions: (() => {
    try {
      const stored = safeStorage.getItem('stickmurai_fusions');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return [] as string[];
  })() as string[],
  unlockedSeals: (() => {
    try {
      const stored = safeStorage.getItem('stickmurai_seals');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return [] as number[];
  })() as number[],
  activeFusions: new Set<string>(),
  runTime: 0,
  dayNightPhase: 'dawn' as 'dawn' | 'noon' | 'sunset' | 'midnight' | 'final_showdown',
  calamityEvent: 'none' as 'none' | 'blood_moon' | 'wandering_hermit' | 'shadow_duel',
  calamityTimer: 0,
  activeShrine: null as any,
  activeHermit: null as any,
  shadowDoppelganger: null as any,
  consecutiveParries: 0,
  lowHpSurviveTimer: 0,
  shogunDefeatedAtDawn: false,
  bladeClashVictories: 0,
  bouncingSickles: [] as any[],
  plasmaTrails: [] as any[],

  // In-Game Economy, Hero Armory & Props
  magatama: (() => {
    try { return parseInt(safeStorage.getItem('stickmurai_magatama') || '0', 10) || 0; } catch(e) { return 0; }
  })(),
  unlockedHeroes: (() => {
    try {
      const stored = safeStorage.getItem('stickmurai_unlocked_heroes');
      return stored ? JSON.parse(stored) : ['default'];
    } catch(e) {
      return ['default'];
    }
  })() as string[],
  selectedHero: (() => {
    try { return safeStorage.getItem('stickmurai_selected_hero') || 'default'; } catch(e) { return 'default'; }
  })(),
  // Campaign & Stage Progression
  currentStage: (() => {
    try { return parseInt(safeStorage.getItem('stickmurai_current_stage') || '1', 10) || 1; } catch(e) { return 1; }
  })(),
  maxStageUnlocked: (() => {
    try { return parseInt(safeStorage.getItem('stickmurai_max_stage') || '1', 10) || 1; } catch(e) { return 1; }
  })(),
  stageKills: 0,
  stageTargetKills: 12,
  clearedStages: (() => {
    try {
      const stored = safeStorage.getItem('stickmurai_cleared_stages');
      if (stored) return JSON.parse(stored) as number[];
    } catch(e) {}
    return [] as number[];
  })(),
  stageStars: (() => {
    try {
      const stored = safeStorage.getItem('stickmurai_stage_stars');
      if (stored) return JSON.parse(stored) as Record<number, number>;
    } catch(e) {}
    return {} as Record<number, number>;
  })(),
  activeStageAffix: null as StageAffix | null,
  stageBossSpawned: false,
  satyrEarthshakerCD: 0,
  campaignUpgrades: (() => {
    const defaults = {
      slashDamage: 0,     // Level 0..10 (+1 DMG per level)
      iaijutsuPower: 0,   // Level 0..10 (+2 DMG & +10% width per level)
      maxLives: 0,        // Level 0..5 (+1 max heart per level)
      dashCooldown: 0,    // Level 0..5 (-10% dash CD & +5% speed per level)
      spiritResonance: 0, // Level 0..5 (+25% flow gen & +1.5s ult per level)
      infiniteSharpness: 0, // Uncapped (+0.5 DMG per rank)
      infiniteFlow: 0,      // Uncapped (+1% flow per rank)
      infiniteFortune: 0,   // Uncapped (+2% magatama bounty yield per rank)
      infiniteRiposte: 0    // Uncapped (+1.5 posture break DMG per rank)
    };
    try {
      const stored = safeStorage.getItem('stickmurai_campaign_upgrades');
      if (stored) return { ...defaults, ...JSON.parse(stored) };
    } catch(e) {}
    return defaults;
  })(),
  destructibleProps: [] as any[]
};

export interface BladeClashState {
  enemy: any;
  timer: number;
  maxTimer: number;
  tapsRequired: number;
  tapsCurrent: number;
  x: number;
  y: number;
}

export interface StageAffix {
  id: string;
  name: string;
  nameJa: string;
  icon: string;
  desc: string;
  descJa: string;
}

export const STAGE_AFFIXES: StageAffix[] = [
  {
    id: 'corpse_ignition',
    name: 'Corpse Ignition',
    nameJa: '爆炎の呪',
    icon: '🔥',
    desc: 'Slain foes burst into burning embers that harm nearby enemies',
    descJa: '討伐した敵が爆炎を放ち、周囲の敵を巻き込む'
  },
  {
    id: 'thunder_gale',
    name: 'Thunder Gale',
    nameJa: '雷嵐の疾風',
    icon: '⚡',
    desc: 'Dash CD reduced by 15%, and periodic lightning strikes random enemies',
    descJa: 'ダッシュCT短縮-15% & 天の稲妻が敵を定期的に討つ'
  },
  {
    id: 'blood_surge',
    name: 'Blood Surge',
    nameJa: '狂気の血潮',
    icon: '🩸',
    desc: 'Enemies deal +1 damage, but ALL Magatama drops are DOUBLED (2×)',
    descJa: '敵の攻撃力+1、ただし全ての勾玉獲得量が2倍に増大'
  },
  {
    id: 'void_flux',
    name: 'Void Flux',
    nameJa: '虚空の歪み',
    icon: '🌌',
    desc: 'Flow generates 40% faster, but enemies move 15% swifter',
    descJa: '気力蓄積+40%加速、ただし敵の移動速度+15%'
  },
  // ENDLESS ABYSS AFFIXES (Escalating Every 5 Floors)
  {
    id: 'overclocked_circuitry',
    name: 'Overclocked Circuitry',
    nameJa: '超過駆動回路',
    icon: '⚙️',
    desc: 'Toaster Bots are hyper-clocked, discharging deadly 3-round rapid plasma bursts!',
    descJa: 'トースターボットが過負荷駆動し、驚異の3連プラズマバーストを放つ！'
  },
  {
    id: 'infernal_domain',
    name: 'Infernal Domain',
    nameJa: '焦熱の地獄',
    icon: '🌋',
    desc: 'The floor scorches with subterranean magma. Slain foes leave pools of burning embers.',
    descJa: '討伐した敵が大地を焼き焦がし、残留する灼熱の溶岩溜まりを生み出す。'
  },
  {
    id: 'gravity_collapse',
    name: 'Void Collapse',
    nameJa: '重力崩壊',
    icon: '🌀',
    desc: 'Dimensional gravity fractures, periodically drawing entities toward a cosmic vortex.',
    descJa: '空間重力が崩壊し、全存在を中心へ引き寄せる重力渦が周期的に発生する。'
  },
  {
    id: 'phantom_ambush',
    name: 'Phantom Convergence',
    nameJa: '幻影の狂宴',
    icon: '👥',
    desc: 'Ethereal shadow phantoms emerge from the abyss mist upon enemy deaths.',
    descJa: '深淵の霧より幻影の刺客が現れ、討伐時の背後から急襲する。'
  },
  {
    id: 'blood_tithe',
    name: 'Blood Tithe',
    nameJa: '深淵の血誓',
    icon: '🩸',
    desc: 'Enemies gain +25% attack speed and deal +1 damage, but Magatama drops are TRIPLED (3×)!',
    descJa: '敵の速度+25%＆攻撃力+1、ただし全ての勾玉獲得量が3倍に増大！'
  }
];

export function getStageAffix(stage: number): StageAffix | null {
  if (stage < 6) return null; // Stages 1-5 have no affixes
  // Endless Abyss Escalation (Stages 11+)
  if (stage >= 11) {
    if (stage <= 15) return STAGE_AFFIXES.find(a => a.id === 'overclocked_circuitry')!;
    if (stage <= 20) return STAGE_AFFIXES.find(a => a.id === 'infernal_domain')!;
    if (stage <= 25) return STAGE_AFFIXES.find(a => a.id === 'gravity_collapse')!;
    if (stage <= 30) return STAGE_AFFIXES.find(a => a.id === 'phantom_ambush')!;
    // Floor 31+ rotates through highest tier affixes every 5 floors
    const tierCycle = Math.floor((stage - 31) / 5) % 5;
    const endlessIds = ['blood_tithe', 'overclocked_circuitry', 'infernal_domain', 'gravity_collapse', 'phantom_ambush'];
    return STAGE_AFFIXES.find(a => a.id === endlessIds[tierCycle])!;
  }
  // Standard Calamity Winds for Stages 6-10 (non-boss)
  if (stage % 5 === 0) return null;
  const standardPool = STAGE_AFFIXES.slice(0, 4);
  const index = (stage * 7 + 3) % standardPool.length;
  return standardPool[index];
}

export function getAscendantRank(maxStage: number): { title: string; titleJa: string; badge: string; color: string } {
  if (maxStage >= 50) return { title: 'Mythic Immortal', titleJa: '無双不死の覇神', badge: '👑', color: '#ff0055' };
  if (maxStage >= 35) return { title: 'Ascended Sovereign', titleJa: '黄泉の修羅王', badge: '🔱', color: '#a855f7' };
  if (maxStage >= 20) return { title: 'God of Swift Blade', titleJa: '神速の抜刀鬼', badge: '⚡', color: '#fbbf24' };
  if (maxStage >= 10) return { title: 'Blade Saint (Kensei)', titleJa: '剣聖', badge: '⚔️', color: '#38bdf8' };
  if (maxStage >= 5)  return { title: 'Master Swordsman', titleJa: '剣豪', badge: '🗡️', color: '#4ade80' };
  return { title: 'Ronin Aspirant', titleJa: '孤高の浪人', badge: '🎋', color: '#94a3b8' };
}

