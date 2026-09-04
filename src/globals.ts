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
  selectedSkill: 'enhance' as 'enhance' | 'shield' | 'dash' | 'firewheel' | 'gravity' | 'parry_master' | 'decoy_illusion',
  raijinDashActive: false,
  raijinHitEnemies: new Set<any>(),
  maxLives: 5,
  petalArmorLevel: 0,
  petalArmorActive: false,
  petalArmorCooldown: 0,
  echoLevel: 0,
  tempoMasteryLevel: 0,
  shieldPulseTimer: 0,
  gravityWellTimer: 0,
  gravityWellX: 0,
  gravityWellY: 0,

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
    slashBonusDmg: 0,
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
    reapersMarkLevel: 0
  },

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
  graphicsSettings: (() => { try { return localStorage.getItem('graphics') || 'high'; } catch(e) { return 'high'; } })(),
  currentLang: (() => { try { return localStorage.getItem('lang') || 'en'; } catch(e) { return 'en'; } })(),
  difficulty: (() => { try { return localStorage.getItem('difficulty') || 'normal'; } catch(e) { return 'normal'; } })() as 'easy' | 'normal' | 'hard' | 'insane',
  screenShakeEnabled: (() => { try { return localStorage.getItem('screenShake') || 'on'; } catch(e) { return 'on'; } })() as 'on' | 'reduced' | 'off',
  autoUltEnabled: (() => { try { return localStorage.getItem('autoUlt') || 'on'; } catch(e) { return 'on'; } })() as 'on' | 'off',
  screenFlashEnabled: (() => { try { return localStorage.getItem('screenFlash') || 'on'; } catch(e) { return 'on'; } })() as 'on' | 'off',
  weatherEffectsEnabled: (() => { try { return localStorage.getItem('weatherEffects') || 'on'; } catch(e) { return 'on'; } })() as 'on' | 'off',
  speedLinesEnabled: (() => { try { return localStorage.getItem('speedLines') || 'on'; } catch(e) { return 'on'; } })() as 'on' | 'off',
  floatingTextEnabled: (() => { try { return localStorage.getItem('floatingText') || 'on'; } catch(e) { return 'on'; } })() as 'on' | 'off',
  groundScarsEnabled: (() => { try { return localStorage.getItem('groundScars') || 'on'; } catch(e) { return 'on'; } })() as 'on' | 'off',
  keyMaps: (() => {
    try {
      const stored = localStorage.getItem('keyMaps');
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
      const stored = localStorage.getItem('highScores');
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
      const stored = localStorage.getItem('stickmurai_fusions');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return [] as string[];
  })() as string[],
  unlockedSeals: (() => {
    try {
      const stored = localStorage.getItem('stickmurai_seals');
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
    try { return parseInt(localStorage.getItem('stickmurai_magatama') || '0', 10) || 0; } catch(e) { return 0; }
  })(),
  unlockedHeroes: (() => {
    try {
      const stored = localStorage.getItem('stickmurai_unlocked_heroes');
      return stored ? JSON.parse(stored) : ['default'];
    } catch(e) {
      return ['default'];
    }
  })() as string[],
  selectedHero: (() => {
    try { return localStorage.getItem('stickmurai_selected_hero') || 'default'; } catch(e) { return 'default'; }
  })(),
  destructibleProps: [] as {
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    propType: number;
    scale: number;
    broken: boolean;
  }[]
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
