import { globals, getStageAffix, getAscendantRank } from './globals';
import { i18n, skillsData } from './assets';
import { bgmAudio, pauseBgm } from './audio';
import { callbacks } from './callbacks';
import { pvpManager } from './pvpIaijutsuManager';
import { AdManager } from './adManager';
import { FUSION_RECIPES } from './powerups';
import { YOMI_SEALS } from './shrine';
import { playSynthesizedFusionUnlock, playSynthesizedSingingBowl, playSynthesizedSealShatter, playSynthesizedTempleBell } from './audio';
import { FloatingText, Shockwave } from './entities';


const t = (key: string): string => i18n[globals.currentLang]?.[key] || key;

// DOM cache
let enhanceCooldownOverlay: HTMLElement;
let enhanceCooldownText: HTMLElement;
let dashCooldownOverlay: HTMLElement;
let dashCooldownText: HTMLElement;
let attackCooldownOverlay: HTMLElement;
let ultCooldownOverlay: HTMLElement;
let ultCooldownText: HTMLElement | null = null;
let flowMeterFill: HTMLElement;
let flowMeterContainer: HTMLElement;
let expMeterFill: HTMLElement;
let scoreDisplay: HTMLElement;
let comboDisplay: HTMLElement;
let heartsElements: NodeListOf<Element>;

let lastEnhanceOverlayHeight = -1;
let lastEnhanceTextContent = '';
let lastDashOverlayHeight = -1;
let lastDashTextContent = '';
let lastAttackOverlayHeight = -1;
let lastUltOverlayHeight = -1;
let lastUltTextContent = '';
let lastLives = 5;

// Additional DOM element caches to prevent querySelector / getElementById thrashing
let btnUltElement: HTMLElement | null = null;
let btnEnhanceElement: HTMLElement | null = null;
let btnDashElement: HTMLElement | null = null;
let objectiveDisplayElement: HTMLElement | null = null;

let lastFlowWidth = -1;
let lastExpWidth = -1;
let lastMaxFlowClass = false;
let lastObjectiveDisplay = '';
let lastObjectiveText = '';
let lastBtnUltReady = false;
let lastBtnDashReady = false;
let lastBtnEnhanceReady = false;
let lastBtnEnhanceBuff = false;
let lastRenderedMagatama = -1;
let hudMagatamaElement: HTMLElement | null = null;
let cachedOnPlayCallback: (() => void) | null = null;

export const STAGES = [
  { id: 1, name: 'BAMBOO GROVE', nameJa: '竹林の覚醒', desc: 'Target: 25 Kills // Grunts & Rogues' },
  { id: 2, name: 'FOREST OUTPOST', nameJa: '狼の群れ', desc: 'Target: 35 Kills // Wolf Packs & Assassins' },
  { id: 3, name: 'SIEGE WORKSHOP', nameJa: '機巧工房', desc: 'Target: 45 Kills // Barrel Bombers & Musketeers' },
  { id: 4, name: 'IRON BASTION', nameJa: '鉄壁の要塞', desc: 'Target: 55 Kills // Heavy Orc Brutes & Frost Sentinels' },
  { id: 5, name: 'YOMI GATEWAY', nameJa: '黄泉の門', desc: 'BOSS BATTLE // Skeleton Oni Overlord' },
  { id: 6, name: 'CURSED GRAVEYARD', nameJa: '呪われた墓所', desc: 'Target: 40 Kills // Necromancers & Barrel Bombers' },
  { id: 7, name: 'BLOOD RIVER', nameJa: '血潮の河原', desc: 'Target: 50 Kills // Chaos Vanguard & Pyromancers' },
  { id: 8, name: 'CASTLE RAMPARTS', nameJa: '漆黒の城壁', desc: 'Target: 60 Kills // Shogun Guards & Orc Brutes' },
  { id: 9, name: 'THRONE ANTECHAMBER', nameJa: '謁見の間', desc: 'Target: 70 Kills // Purgatory Elite Rampage' },
  { id: 10, name: 'SANCTUM OF OBLIVION', nameJa: '忘却の聖域', desc: 'FINAL BOSS // Colossus Agis & Divine Shogun' }
];

export const ASCENSION_UPGRADES = [
  {
    id: 'slashDamage',
    name: 'Katana Sharpness',
    nameJa: '刃の研鑽',
    icon: '🗡️',
    max: 10,
    desc: '+0.5 Slash DMG per level',
    descJa: '通常斬撃ダメージ+0.5',
    baseCost: 100,
    costMult: 100,
  },
  {
    id: 'iaijutsuPower',
    name: 'Iaijutsu Shockwave',
    nameJa: '居合波の極意',
    icon: '🌊',
    max: 10,
    desc: '+1 Shockwave DMG & +8% Width',
    descJa: '衝撃波ダメージ+1 & 幅+8%',
    baseCost: 150,
    costMult: 150,
  },
  {
    id: 'maxLives',
    name: 'Bushido Fortitude',
    nameJa: '武士の生命力',
    icon: '🛡️',
    max: 5,
    desc: '+1 Max Heart Slot',
    descJa: '最大体力+1スロット',
    baseCost: 300,
    costMult: 300,
  },
  {
    id: 'dashCooldown',
    name: 'Phantom Stride',
    nameJa: '瞬歩・神速',
    icon: '⚡',
    max: 5,
    desc: '-8% Dash CD & +5% Move Speed',
    descJa: 'ダッシュCT-8% & 移動速度+5%',
    baseCost: 250,
    costMult: 250,
  },
  {
    id: 'spiritResonance',
    name: 'Spiritual Resonance',
    nameJa: '魂の共鳴',
    icon: '🧘',
    max: 5,
    desc: '+15% Flow Gen & +1.5s Ult Duration',
    descJa: '気力生成+15% & 奥義持続+1.5秒',
    baseCost: 300,
    costMult: 300,
  },
  // Infinite / Paragon Upgrades (Endless Bushido Progression)
  {
    id: 'infiniteSharpness',
    name: 'Endless Edge',
    nameJa: '無限の真剣',
    icon: '✨',
    max: 999,
    isEndless: true,
    desc: '+0.25 Slash DMG per rank (Uncapped)',
    descJa: '通常斬撃ダメージ+0.25 (上限なし)',
    baseCost: 400,
    costMult: 150,
  },
  {
    id: 'infiniteFlow',
    name: 'Unbound Spirit',
    nameJa: '無限の霊気',
    icon: '🌀',
    max: 999,
    isEndless: true,
    desc: '+1% Flow Rate & Spirit Power (Uncapped)',
    descJa: '気力蓄積速度+1% (上限なし)',
    baseCost: 350,
    costMult: 150,
  },
  {
    id: 'infiniteFortune',
    name: 'Golden Fortune',
    nameJa: '黄金の神威',
    icon: '💰',
    max: 999,
    isEndless: true,
    desc: '+2% Magatama drop & bounty yields (Uncapped)',
    descJa: '勾玉獲得量+2% (上限なし)',
    baseCost: 300,
    costMult: 120,
  },
  {
    id: 'infiniteRiposte',
    name: 'Iron Parry Mastery',
    nameJa: '鉄壁の崩し',
    icon: '⚡',
    max: 999,
    isEndless: true,
    desc: '+1.0 Posture break DMG per parry (Uncapped)',
    descJa: '弾き時の体幹削り+1.0 (上限なし)',
    baseCost: 450,
    costMult: 180,
  }
];

export function getStageData(stage: number) {
  if (stage <= 10 && STAGES[stage - 1]) {
    return STAGES[stage - 1];
  }
  const realm = Math.floor((stage - 1) / 5) + 1;
  const stageInRealm = ((stage - 1) % 5) + 1;
  const isBoss = stageInRealm === 5;
  
  if (isBoss) {
    const bossNames = [
      { name: 'SKELETON ONI OVERLORD', nameJa: '冥府の鬼神・骸骨鬼王' },
      { name: 'DIVINE SHOGUN OF YOMI', nameJa: '黄泉の神将・魔界征夷大将軍' },
      { name: 'AGIS ASTRUM COLOSSUS', nameJa: '星海巨神・アギス・コロッサス' },
      { name: 'VOID CALAMITY INCARNATE', nameJa: '虚無の災厄・破滅の権化' }
    ];
    const b = bossNames[(realm - 2) % bossNames.length];
    return {
      id: stage,
      name: `STAGE ${stage}: REALM ${realm} APEX`,
      nameJa: `ステージ ${stage}: 第${realm}界・頂点決戦`,
      desc: `BOSS BATTLE // ${b.name} [CALAMITY TIER ${realm}]`
    };
  }

  const subThemes = [
    { title: 'PURGATORY WASTES', titleJa: '煉獄の荒野', desc: `Target: ${10 + stage * 3} Kills // Vanguard Rogues & Elites` },
    { title: 'OBSIDIAN CITADEL', titleJa: '黒曜石の居城', desc: `Target: ${10 + stage * 3} Kills // Chaos Musketeers & Brutes` },
    { title: 'BLOOD CHASM', titleJa: '血の裂け目', desc: `Target: ${10 + stage * 3} Kills // Barrel Bombers & Pyromancers` },
    { title: 'THRONE OF PHANTOMS', titleJa: '幻影の玉座', desc: `Target: ${10 + stage * 3} Kills // Necromancers & High Guard` }
  ];
  const theme = subThemes[(stageInRealm - 1) % subThemes.length];
  return {
    id: stage,
    name: `STAGE ${stage}: ${theme.title}`,
    nameJa: `ステージ ${stage}: ${theme.titleJa}`,
    desc: theme.desc
  };
}

export function updateStageSelectionUI() {
  const current = globals.currentStage || 1;
  const stageData = getStageData(current);
  const isJa = globals.currentLang === 'ja';

  // 1. Ronin Ascendant Rank Badge
  const rank = getAscendantRank(globals.maxStageUnlocked || 1);
  const rankIconEl = document.getElementById('ronin-rank-icon');
  const rankTextEl = document.getElementById('ronin-rank-text');
  const rankBadgeEl = document.getElementById('ronin-rank-badge');
  if (rankIconEl) rankIconEl.textContent = rank.badge;
  if (rankTextEl) {
    rankTextEl.textContent = isJa ? rank.titleJa : rank.title.toUpperCase();
    rankTextEl.style.color = rank.color;
  }
  if (rankBadgeEl) {
    rankBadgeEl.style.borderColor = `${rank.color}88`;
  }

  // 2. Stage Name & Description
  const nameEl = document.getElementById('stage-select-name');
  const descEl = document.getElementById('stage-select-desc');
  if (nameEl && stageData) {
    const sName = isJa ? stageData.nameJa : stageData.name;
    nameEl.textContent = isJa ? `ステージ ${current}: ${sName}` : `STAGE ${current}: ${sName}`;
  }
  if (descEl && stageData) {
    descEl.textContent = stageData.desc;
  }

  // 3. Stage 3-Star Mastery Rating
  const starsEl = document.getElementById('stage-select-stars');
  if (starsEl) {
    const starCount = globals.stageStars?.[current] || 0;
    let starHtml = '';
    for (let s = 1; s <= 3; s++) {
      if (s <= starCount) {
        starHtml += '<span style="color: #ffd700; text-shadow: 0 0 8px rgba(255,215,0,0.6);">★</span>';
      } else {
        starHtml += '<span style="color: #475569; opacity: 0.4;">☆</span>';
      }
    }
    starsEl.innerHTML = starHtml;
  }

  // 4. Calamity Winds Stage Affix Pill
  const affix = getStageAffix(current);
  const affixEl = document.getElementById('stage-select-affix');
  if (affixEl) {
    if (affix) {
      affixEl.style.display = 'block';
      affixEl.innerHTML = `<strong>${affix.icon} ${isJa ? affix.nameJa : affix.name}:</strong> ${isJa ? affix.descJa : affix.desc}`;
    } else {
      affixEl.style.display = 'none';
    }
  }

  // 5. Prev / Next Navigation Buttons
  const prevBtn = document.getElementById('stage-prev-btn') as HTMLButtonElement;
  const nextBtn = document.getElementById('stage-next-btn') as HTMLButtonElement;
  if (prevBtn) prevBtn.disabled = current <= 1;
  if (nextBtn) nextBtn.disabled = current >= (globals.maxStageUnlocked || 1);
}

export function bindDualListener(el: HTMLElement | null | undefined, handler: (e: Event) => void) {
  if (!el) return;
  let lastTriggerTime = 0;
  const safeHandler = (e: Event) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTriggerTime < 300) return;
    lastTriggerTime = now;
    handler(e);
  };
  el.addEventListener('pointerdown', safeHandler);
  el.addEventListener('click', safeHandler);
}

export function initUI(onPlayCallback: () => void, onZenPlayCallback: () => void, onRestartCallback: () => void) {
  // DOM queries
  enhanceCooldownOverlay = document.getElementById('enhance-cooldown-overlay')!;
  enhanceCooldownText = document.getElementById('enhance-cooldown-text')!;
  dashCooldownOverlay = document.getElementById('dash-cooldown-overlay')!;
  dashCooldownText = document.getElementById('dash-cooldown-text')!;
  attackCooldownOverlay = document.getElementById('attack-cooldown-overlay')!;
  ultCooldownOverlay = document.getElementById('ult-cooldown-overlay')!;
  ultCooldownText = document.getElementById('ult-cooldown-text');
  
  flowMeterFill = document.getElementById('flow-meter-fill')!;
  flowMeterContainer = document.getElementById('flow-meter-container')!;
  expMeterFill = document.getElementById('exp-meter-fill')!;
  scoreDisplay = document.getElementById('score-display')!;
  comboDisplay = document.getElementById('combo-display')!;
  heartsElements = document.querySelectorAll('.heart');
  btnUltElement = document.getElementById('btn-ult');
  btnEnhanceElement = document.getElementById('btn-enhance');
  btnDashElement = document.getElementById('btn-dash');
  objectiveDisplayElement = document.getElementById('objective-display');

  const mainMenu = document.getElementById('main-menu')!;
  const settingsScreen = document.getElementById('settings-screen')!;
  const skillSelectScreen = document.getElementById('skill-select-screen')!;
  const pauseScreen = document.getElementById('pause-screen')!;
  cachedOnPlayCallback = onPlayCallback;
  const uiLayer = document.getElementById('ui-layer')!;
  const mobileControls = document.getElementById('mobile-controls')!;
  const bgmVolumeSlider = document.getElementById('bgm-volume') as HTMLInputElement;

  // menu listeners
  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    bindDualListener(startBtn, () => {
      mainMenu.style.display = 'none';
      globals.gameMode = 'classic';
      globals.difficulty = 'normal';
      globals.timerLimit = 'endless';
      // Default to the current highest stage reached
      globals.currentStage = Math.max(1, globals.maxStageUnlocked || 1);
      skillSelectScreen.style.display = 'flex';
      globals.activeBlessing = null;
      updateBlessingSelectionUI();
      renderSkillChoicesPregame();
      updateStageSelectionUI();
    });
  }

  const prevStageBtn = document.getElementById('stage-prev-btn');
  if (prevStageBtn) {
    bindDualListener(prevStageBtn, () => {
      if ((globals.currentStage || 1) > 1) {
        globals.currentStage--;
        try { localStorage.setItem('stickmurai_current_stage', globals.currentStage.toString()); } catch(e) {}
        updateStageSelectionUI();
      }
    });
  }

  const nextStageBtn = document.getElementById('stage-next-btn');
  if (nextStageBtn) {
    bindDualListener(nextStageBtn, () => {
      if ((globals.currentStage || 1) < (globals.maxStageUnlocked || 1)) {
        globals.currentStage++;
        try { localStorage.setItem('stickmurai_current_stage', globals.currentStage.toString()); } catch(e) {}
        updateStageSelectionUI();
      }
    });
  }

  // Stage Clear modal actions
  const stageClearModal = document.getElementById('stage-clear-modal');
  const stageClearNextBtn = document.getElementById('stage-clear-next-btn');
  const stageClearReplayBtn = document.getElementById('stage-clear-replay-btn');
  const stageClearMenuBtn = document.getElementById('stage-clear-menu-btn');

  if (stageClearNextBtn) {
    bindDualListener(stageClearNextBtn, () => {
      if (stageClearModal) stageClearModal.style.display = 'none';
      globals.currentStage = (globals.currentStage || 1) + 1;
      globals.maxStageUnlocked = Math.max(globals.maxStageUnlocked || 1, globals.currentStage);
      try {
        localStorage.setItem('stickmurai_current_stage', globals.currentStage.toString());
        localStorage.setItem('stickmurai_max_stage', globals.maxStageUnlocked.toString());
      } catch(e) {}
      if (cachedOnPlayCallback) cachedOnPlayCallback();
    });
  }

  if (stageClearReplayBtn) {
    bindDualListener(stageClearReplayBtn, () => {
      if (stageClearModal) stageClearModal.style.display = 'none';
      if (cachedOnPlayCallback) cachedOnPlayCallback();
    });
  }

  if (stageClearMenuBtn) {
    bindDualListener(stageClearMenuBtn, () => {
      if (stageClearModal) stageClearModal.style.display = 'none';
      globals.gameState = 'mainmenu';
      mainMenu.style.display = 'flex';
      uiLayer.style.display = 'none';
      mobileControls.style.display = 'none';
      pauseBgm();
    });
  }

  const stageClearXBtn = document.getElementById('close-stage-clear-x-btn');
  if (stageClearXBtn) {
    bindDualListener(stageClearXBtn, () => {
      if (stageClearModal) stageClearModal.style.display = 'none';
      globals.gameState = 'mainmenu';
      mainMenu.style.display = 'flex';
      uiLayer.style.display = 'none';
      mobileControls.style.display = 'none';
      pauseBgm();
    });
  }

  const lvlModeBtn = document.getElementById('level-mode-btn');
  if (lvlModeBtn) {
    lvlModeBtn.addEventListener('click', () => {
      mainMenu.style.display = 'none';
      globals.gameMode = 'level';
      skillSelectScreen.style.display = 'flex';
      globals.activeBlessing = null;
      updateBlessingSelectionUI();
      renderSkillChoicesPregame();
    });
  }

  const zenBtn = document.getElementById('zen-btn');
  if (zenBtn) {
    zenBtn.addEventListener('click', () => {
      mainMenu.style.display = 'none';
      globals.gameMode = 'zen';
      skillSelectScreen.style.display = 'flex';
      globals.activeBlessing = null;
      updateBlessingSelectionUI();
      renderSkillChoicesPregame();
    });
  }

  document.getElementById('skill-back-btn')!.addEventListener('click', () => {
    skillSelectScreen.style.display = 'none';
    mainMenu.style.display = 'flex';
    globals.activeBlessing = null;
    updateBlessingSelectionUI();
  });

  document.getElementById('start-run-btn')!.addEventListener('click', () => {
    skillSelectScreen.style.display = 'none';
    if (globals.gameMode === 'zen') {
      onZenPlayCallback();
    } else {
      onPlayCallback();
    }
  });

  document.getElementById('open-settings-btn')!.addEventListener('click', () => {
    settingsScreen.style.display = 'flex';
  });

  document.getElementById('close-settings-btn')!.addEventListener('click', () => {
    settingsScreen.style.display = 'none';
    if (globals.gameState === 'paused') {
      pauseScreen.style.display = 'flex';
    }
  });

  document.getElementById('pause-settings-btn')!.addEventListener('click', () => {
    pauseScreen.style.display = 'none';
    settingsScreen.style.display = 'flex';
  });

  document.getElementById('quit-btn')!.addEventListener('click', () => {
    pauseScreen.style.display = 'none';
    if (globals.gameMode === 'pvp') {
      pvpManager.disconnect();
    } else {
      globals.gameState = 'mainmenu';
      mainMenu.style.display = 'flex';
      uiLayer.style.display = 'none';
      mobileControls.style.display = 'none';
      pauseBgm();
    }
  });

  const gameOverQuitBtn = document.getElementById('game-over-quit-btn');
  if (gameOverQuitBtn) {
    gameOverQuitBtn.addEventListener('click', () => {
      document.getElementById('game-over')!.style.display = 'none';
      if (globals.gameMode === 'pvp') {
        pvpManager.disconnect();
      } else {
        globals.gameState = 'mainmenu';
        mainMenu.style.display = 'flex';
        uiLayer.style.display = 'none';
        mobileControls.style.display = 'none';
        pauseBgm();
      }
    });
  }

  bgmVolumeSlider.addEventListener('input', (e) => {
    const vol = parseFloat((e.target as HTMLInputElement).value);
    if (bgmAudio) bgmAudio.volume = vol;
  });

  document.getElementById('restart-btn')!.addEventListener('click', onRestartCallback);

  // Grimoire & Chronicle screen listeners
  const grimoireScreen = document.getElementById('grimoire-screen');
  const openGrimoireBtn = document.getElementById('open-grimoire-btn');
  const pauseGrimoireBtn = document.getElementById('pause-grimoire-btn');
  const closeGrimoireBtn = document.getElementById('close-grimoire-btn');
  const closeGrimoireXBtn = document.getElementById('close-grimoire-x-btn');

  const openGrimoire = () => {
    if (grimoireScreen) {
      grimoireScreen.style.display = 'flex';
      populateGrimoireGrid();
    }
  };

  bindDualListener(openGrimoireBtn, openGrimoire);
  bindDualListener(pauseGrimoireBtn, openGrimoire);
  bindDualListener(closeGrimoireBtn, () => {
    if (grimoireScreen) grimoireScreen.style.display = 'none';
  });
  bindDualListener(closeGrimoireXBtn, () => {
    if (grimoireScreen) grimoireScreen.style.display = 'none';
  });

  const chronicleScreen = document.getElementById('chronicle-screen');
  const openChronicleBtn = document.getElementById('open-chronicle-btn');
  const closeChronicleBtn = document.getElementById('close-chronicle-btn');
  const closeChronicleXBtn = document.getElementById('close-chronicle-x-btn');

  bindDualListener(openChronicleBtn, () => {
    if (chronicleScreen) {
      chronicleScreen.style.display = 'flex';
      populateChronicleList();
    }
  });
  bindDualListener(closeChronicleBtn, () => {
    if (chronicleScreen) chronicleScreen.style.display = 'none';
  });
  bindDualListener(closeChronicleXBtn, () => {
    if (chronicleScreen) chronicleScreen.style.display = 'none';
  });

  // Dojo & Heroes Screen listeners
  const dojoScreen = document.getElementById('dojo-screen');
  const openDojoBtn = document.getElementById('open-dojo-btn');
  const closeDojoBtn = document.getElementById('close-dojo-btn');
  const openDojo = () => {
    if (dojoScreen) {
      dojoScreen.style.display = 'flex';
      populateDojoHeroGrid();
    }
  };

  const closeDojo = () => {
    if (dojoScreen) dojoScreen.style.display = 'none';
  };

  bindDualListener(openDojoBtn, openDojo);
  bindDualListener(closeDojoBtn, closeDojo);
  const closeDojoXBtn = document.getElementById('close-dojo-x-btn');
  bindDualListener(closeDojoXBtn, closeDojo);

  // Shrine & Hermit Modal Listeners
  const onShatterSeal = () => {
    if (globals.activeShrine) {
      const sealId = globals.activeShrine.sealId;
      if (!globals.unlockedSeals.includes(sealId)) {
        globals.unlockedSeals.push(sealId);
        try { localStorage.setItem('stickmurai_seals', JSON.stringify(globals.unlockedSeals)); } catch(e) {}
        // Award Magatama for breaking seal
        const sealReward = 200;
        globals.magatama = (globals.magatama || 0) + sealReward;
        try { localStorage.setItem('stickmurai_magatama', globals.magatama.toString()); } catch(e) {}
        YOMI_SEALS[sealId]?.applyPermanentReward();
        playSynthesizedSealShatter();
        globals.screenShake = Math.max(globals.screenShake, 42);
        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 100, globals.currentLang === 'ja' ? `⛩️ 封印砕散！ +${sealReward} 🔮` : `⛩️ SEAL SHATTERED! +${sealReward} 🔮`, '#ffd700', 34));
        globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#ffd700'));
        globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#38bdf8'));
      }
      globals.activeShrine = null;
    }
    closeShrineModal();
  };

  const shrineClaimBtn = document.getElementById('shrine-claim-btn');
  const shrineCommuneBtn = document.getElementById('shrine-commune-btn');
  const shrineLeaveBtn = document.getElementById('shrine-leave-btn');
  bindDualListener(shrineClaimBtn, onShatterSeal);
  bindDualListener(shrineCommuneBtn, onShatterSeal);
  bindDualListener(shrineLeaveBtn, closeShrineModal);

  const hermitChoice1Btn = document.getElementById('hermit-pact-choice-1');
  const hermitChoice2Btn = document.getElementById('hermit-pact-choice-2');
  const hermitLeaveBtn = document.getElementById('hermit-leave-btn');

  bindDualListener(hermitChoice1Btn, () => {
    const hermit = globals.activeHermit;
    const isJa = globals.currentLang === 'ja';
    if (hermit) {
      if (hermit.pactType === 'blade') {
        if (globals.maxLives > 1) {
          globals.maxLives--;
          globals.lives = Math.min(globals.lives, globals.maxLives);
          globals.playerStats.slashBonusDmg = (globals.playerStats.slashBonusDmg || 0) + 2;
          globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 70, isJa ? '血刀の誓い成立！ +2 攻撃力' : 'BLOODBLADE SEALED! +2 DMG', '#ef4444', 28));
        }
      } else if (hermit.pactType === 'speed') {
        if (globals.maxLives > 1) {
          globals.maxLives--;
          globals.lives = Math.min(globals.lives, globals.maxLives);
          globals.playerStats.dashCooldownBase *= 0.65;
          globals.playerStats.moveSpeedMult += 0.25;
          globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 70, isJa ? '疾風の生贄成立！ 神速化' : 'GALE PACT SEALED! RAPID DASH', '#38bdf8', 28));
        }
      } else {
        if (globals.maxLives > 1) {
          globals.maxLives--;
          globals.lives = Math.min(globals.lives, globals.maxLives);
          globals.playerStats.flowGenMult *= 1.6;
          globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 70, isJa ? '心眼の覚醒成立！ 気力急増' : 'MIND EYE SEALED! +60% FLOW', '#a855f7', 28));
        }
      }
      playSynthesizedTempleBell();
      globals.screenShake = Math.max(globals.screenShake, 24);
      globals.activeHermit = null;
      closeHermitModal();
      callbacks.updateUI();
    }
  });

  bindDualListener(hermitChoice2Btn, () => {
    const hermit = globals.activeHermit;
    const isJa = globals.currentLang === 'ja';
    if (hermit) {
      if (hermit.pactType === 'blade') {
        globals.flow = Math.max(0, globals.flow * 0.5);
        globals.playerStats.slashSizeMult += 0.50;
        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 70, isJa ? '巨刃の瞑想成立！ +50% 範囲' : 'COLOSSUS SEALED! +50% SIZE', '#ffd700', 28));
      } else if (hermit.pactType === 'speed') {
        callbacks.addFlow(globals.playerStats.flowMax);
        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 70, isJa ? '薄氷の修羅！ 気力全開' : 'GLASS ASURA! FULL FLOW', '#f97316', 28));
      } else {
        globals.petalArmorActive = false;
        globals.petalArmorCooldown = 30;
        globals.playerStats.slashBonusDmg = (globals.playerStats.slashBonusDmg || 0) + 1;
        globals.playerStats.iaijutsuBonusDmg = (globals.playerStats.iaijutsuBonusDmg || 0) + 2;
        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 70, isJa ? '天恵拝領！ 抜刀威力向上' : 'ASCETIC GIFT! +2 IAI DMG', '#10b981', 28));
      }
      playSynthesizedTempleBell();
      globals.screenShake = Math.max(globals.screenShake, 24);
      globals.activeHermit = null;
      closeHermitModal();
      callbacks.updateUI();
    }
  });

  bindDualListener(hermitLeaveBtn, closeHermitModal);

  // Dawn Victory return button
  const dawnReturnBtn = document.getElementById('dawn-return-btn');
  bindDualListener(dawnReturnBtn, () => {
    const dawnScreen = document.getElementById('dawn-victory-screen');
    if (dawnScreen) dawnScreen.style.display = 'none';
    globals.gameState = 'mainmenu';
    mainMenu.style.display = 'flex';
    uiLayer.style.display = 'none';
    mobileControls.style.display = 'none';
    pauseBgm();
  });


  // Ad Reward - Honor Revive Click Listener
  const adReviveBtn = document.getElementById('ad-revive-btn');
  if (adReviveBtn) {
    adReviveBtn.addEventListener('click', () => {
      AdManager.showRewardedAd('revive', {
        onComplete: () => {
          callbacks.revivePlayer();
        },
        onFailed: (err) => {
          console.warn("[AdManager] Revive ad failed:", err);
          alert(globals.currentLang === 'ja' ? '広告の読み込みに失敗しました。' : 'Failed to load ad. Please try again.');
        }
      });
    });
  }

  // Pre-Game Stance Blessing Click Listeners
  const swiftBtn = document.getElementById('blessing-swift-btn');
  if (swiftBtn) {
    swiftBtn.addEventListener('click', () => {
      if (globals.activeBlessing === 'swift_strike') {
        globals.activeBlessing = null;
        updateBlessingSelectionUI();
        return;
      }
      
      AdManager.showRewardedAd('blessing', {
        onComplete: () => {
          globals.activeBlessing = 'swift_strike';
          updateBlessingSelectionUI();
        },
        onFailed: (err) => {
          console.warn("[AdManager] Blessing ad failed:", err);
          alert(globals.currentLang === 'ja' ? '広告の読み込みに失敗しました。' : 'Failed to load ad.');
        }
      });
    });
  }

  const fortuneBtn = document.getElementById('blessing-fortune-btn');
  if (fortuneBtn) {
    fortuneBtn.addEventListener('click', () => {
      if (globals.activeBlessing === 'fortune') {
        globals.activeBlessing = null;
        updateBlessingSelectionUI();
        return;
      }
      
      AdManager.showRewardedAd('blessing', {
        onComplete: () => {
          globals.activeBlessing = 'fortune';
          updateBlessingSelectionUI();
        },
        onFailed: (err) => {
          console.warn("[AdManager] Blessing ad failed:", err);
          alert(globals.currentLang === 'ja' ? '広告の読み込みに失敗しました。' : 'Failed to load ad.');
        }
      });
    });
  }

  document.getElementById('pause-btn')!.addEventListener('click', () => {
    if (globals.gameMode === 'pvp') return; // Disable pausing in PvP
    if (globals.gameState === 'playing') {
      globals.gameState = 'paused';
      pauseScreen.style.display = 'flex';
      updatePauseUpgradesList();
    }
  });

  document.getElementById('resume-btn')!.addEventListener('click', () => {
    if (globals.gameState === 'paused') {
      globals.gameState = 'playing';
      pauseScreen.style.display = 'none';
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
      if (globals.gameMode === 'pvp') return; // Disable pausing in PvP
      if (globals.gameState === 'playing') {
        globals.gameState = 'paused';
        pauseScreen.style.display = 'flex';
        updatePauseUpgradesList();
      } else if (globals.gameState === 'paused') {
        globals.gameState = 'playing';
        pauseScreen.style.display = 'none';
      }
    }
  });

  // settings listeners
  const langSelect = document.getElementById('language-select') as HTMLSelectElement;
  if (langSelect) {
    langSelect.value = globals.currentLang;
    langSelect.addEventListener('change', (e) => {
      globals.currentLang = (e.target as HTMLSelectElement).value;
      try { localStorage.setItem('lang', globals.currentLang); } catch(e) {}
      updateStaticText();
    });
  }

  const graphicsSelect = document.getElementById('graphics-select') as HTMLSelectElement;
  if (graphicsSelect) {
    graphicsSelect.value = globals.graphicsSettings;
    graphicsSelect.addEventListener('change', (e) => {
      globals.graphicsSettings = (e.target as HTMLSelectElement).value;
      try { localStorage.setItem('graphics', globals.graphicsSettings); } catch(e) {}
      
      // Reset overlay cached sizes
      lastEnhanceOverlayHeight = -1;
      lastEnhanceTextContent = '';
      lastDashOverlayHeight = -1;
      lastDashTextContent = '';
      lastAttackOverlayHeight = -1;
      lastUltOverlayHeight = -1;
      
      // Re-trigger layout sizing
      const resizeEvent = new Event('resize');
      window.dispatchEvent(resizeEvent);
      updateUI();
    });
  }

  const shakeSelect = document.getElementById('shake-select') as HTMLSelectElement;
  if (shakeSelect) {
    shakeSelect.value = globals.screenShakeEnabled;
    shakeSelect.addEventListener('change', (e) => {
      globals.screenShakeEnabled = (e.target as HTMLSelectElement).value as 'on' | 'reduced' | 'off';
      try { localStorage.setItem('screenShake', globals.screenShakeEnabled); } catch(e) {}
    });
  }

  const autoUltSelect = document.getElementById('auto-ult-select') as HTMLSelectElement;
  if (autoUltSelect) {
    autoUltSelect.value = globals.autoUltEnabled;
    autoUltSelect.addEventListener('change', (e) => {
      globals.autoUltEnabled = (e.target as HTMLSelectElement).value as 'on' | 'off';
      try { localStorage.setItem('autoUlt', globals.autoUltEnabled); } catch(e) {}
    });
  }

  const updateOverlayDisplays = () => {
    const flashOverlay = document.getElementById('flash-overlay');
    if (flashOverlay) {
      flashOverlay.style.display = globals.screenFlashEnabled === 'on' ? 'block' : 'none';
    }
    const speedlinesOverlay = document.getElementById('speedlines-overlay');
    if (speedlinesOverlay) {
      speedlinesOverlay.style.display = globals.speedLinesEnabled === 'on' ? 'block' : 'none';
    }
  };

  const screenFlashSelect = document.getElementById('screen-flash-select') as HTMLSelectElement;
  if (screenFlashSelect) {
    screenFlashSelect.value = globals.screenFlashEnabled;
    screenFlashSelect.addEventListener('change', (e) => {
      globals.screenFlashEnabled = (e.target as HTMLSelectElement).value as 'on' | 'off';
      try { localStorage.setItem('screenFlash', globals.screenFlashEnabled); } catch(e) {}
      updateOverlayDisplays();
    });
  }

  const weatherEffectsSelect = document.getElementById('weather-effects-select') as HTMLSelectElement;
  if (weatherEffectsSelect) {
    weatherEffectsSelect.value = globals.weatherEffectsEnabled;
    weatherEffectsSelect.addEventListener('change', (e) => {
      globals.weatherEffectsEnabled = (e.target as HTMLSelectElement).value as 'on' | 'off';
      try { localStorage.setItem('weatherEffects', globals.weatherEffectsEnabled); } catch(e) {}
    });
  }

  const speedLinesSelect = document.getElementById('speed-lines-select') as HTMLSelectElement;
  if (speedLinesSelect) {
    speedLinesSelect.value = globals.speedLinesEnabled;
    speedLinesSelect.addEventListener('change', (e) => {
      globals.speedLinesEnabled = (e.target as HTMLSelectElement).value as 'on' | 'off';
      try { localStorage.setItem('speedLines', globals.speedLinesEnabled); } catch(e) {}
      updateOverlayDisplays();
    });
  }

  const floatingTextSelect = document.getElementById('floating-text-select') as HTMLSelectElement;
  if (floatingTextSelect) {
    floatingTextSelect.value = globals.floatingTextEnabled;
    floatingTextSelect.addEventListener('change', (e) => {
      globals.floatingTextEnabled = (e.target as HTMLSelectElement).value as 'on' | 'off';
      try { localStorage.setItem('floatingText', globals.floatingTextEnabled); } catch(e) {}
    });
  }

  const groundScarsSelect = document.getElementById('ground-scars-select') as HTMLSelectElement;
  if (groundScarsSelect) {
    groundScarsSelect.value = globals.groundScarsEnabled;
    groundScarsSelect.addEventListener('change', (e) => {
      globals.groundScarsEnabled = (e.target as HTMLSelectElement).value as 'on' | 'off';
      try { localStorage.setItem('groundScars', globals.groundScarsEnabled); } catch(e) {}
    });
  }

  updateOverlayDisplays();

  const diffEasyBtn = document.getElementById('diff-easy-btn');
  const diffNormalBtn = document.getElementById('diff-normal-btn');
  const diffHardBtn = document.getElementById('diff-hard-btn');
  const diffInsaneBtn = document.getElementById('diff-insane-btn');

  const updatePregameDifficultyUI = () => {
    if (!diffEasyBtn || !diffNormalBtn || !diffHardBtn || !diffInsaneBtn) return;
    diffEasyBtn.classList.remove('active');
    diffNormalBtn.classList.remove('active');
    diffHardBtn.classList.remove('active');
    diffInsaneBtn.classList.remove('active');
    
    if (globals.difficulty === 'easy') diffEasyBtn.classList.add('active');
    else if (globals.difficulty === 'normal') diffNormalBtn.classList.add('active');
    else if (globals.difficulty === 'hard') diffHardBtn.classList.add('active');
    else if (globals.difficulty === 'insane') diffInsaneBtn.classList.add('active');
  };

  if (diffEasyBtn && diffNormalBtn && diffHardBtn && diffInsaneBtn) {
    diffEasyBtn.addEventListener('click', () => {
      globals.difficulty = 'easy';
      try { localStorage.setItem('difficulty', 'easy'); } catch(e) {}
      updatePregameDifficultyUI();
    });
    diffNormalBtn.addEventListener('click', () => {
      globals.difficulty = 'normal';
      try { localStorage.setItem('difficulty', 'normal'); } catch(e) {}
      updatePregameDifficultyUI();
    });
    diffHardBtn.addEventListener('click', () => {
      globals.difficulty = 'hard';
      try { localStorage.setItem('difficulty', 'hard'); } catch(e) {}
      updatePregameDifficultyUI();
    });
    diffInsaneBtn.addEventListener('click', () => {
      globals.difficulty = 'insane';
      try { localStorage.setItem('difficulty', 'insane'); } catch(e) {}
      updatePregameDifficultyUI();
    });
  }

  // Time limit options click listeners
  const timeInfinite = document.getElementById('time-infinite-btn');
  const time3m = document.getElementById('time-3m-btn');
  const time5m = document.getElementById('time-5m-btn');
  const time10m = document.getElementById('time-10m-btn');
  if (timeInfinite && time3m && time5m && time10m) {
    timeInfinite.addEventListener('click', () => { globals.timerLimit = 'endless'; updatePregameOptionsUI(); });
    time3m.addEventListener('click', () => { globals.timerLimit = 180; updatePregameOptionsUI(); });
    time5m.addEventListener('click', () => { globals.timerLimit = 300; updatePregameOptionsUI(); });
    time10m.addEventListener('click', () => { globals.timerLimit = 600; updatePregameOptionsUI(); });
  }

  // Level target options click listeners
  const lvl5 = document.getElementById('lvl-5-btn');
  const lvl10 = document.getElementById('lvl-10-btn');
  const lvl15 = document.getElementById('lvl-15-btn');
  if (lvl5 && lvl10 && lvl15) {
    lvl5.addEventListener('click', () => { globals.levelModeTarget = 5; updatePregameOptionsUI(); });
    lvl10.addEventListener('click', () => { globals.levelModeTarget = 10; updatePregameOptionsUI(); });
    lvl15.addEventListener('click', () => { globals.levelModeTarget = 15; updatePregameOptionsUI(); });
  }

  // Dynamic Sakura Petals Spawning for Loader Screen with Depth-of-Field
  const sakuraContainer = document.getElementById('sakura-container');
  if (sakuraContainer) {
    sakuraContainer.innerHTML = '';
    const petalCount = 27;
    for (let i = 0; i < petalCount; i++) {
      const petal = document.createElement('div');
      
      // Distribute into depth layers: foreground (15%), midground (50%), background (35%)
      const rand = Math.random();
      let size = 8;
      let duration = 6;
      let opacity = 0.8;
      let layerClass = 'sakura-midground';
      
      if (rand < 0.15) {
        // Foreground (large, fast, blurred)
        size = Math.random() * 8 + 14; // 14px to 22px
        duration = Math.random() * 2 + 3.5; // 3.5s to 5.5s
        opacity = Math.random() * 0.2 + 0.55;
        layerClass = 'sakura-foreground';
      } else if (rand < 0.65) {
        // Midground (normal)
        size = Math.random() * 5 + 8; // 8px to 13px
        duration = Math.random() * 3 + 5.5; // 5.5s to 8.5s
        opacity = Math.random() * 0.1 + 0.85;
        layerClass = 'sakura-midground';
      } else {
        // Background (small, slow, dim)
        size = Math.random() * 3 + 5; // 5px to 8px
        duration = Math.random() * 4 + 8.5; // 8.5s to 12.5s
        opacity = Math.random() * 0.15 + 0.3;
        layerClass = 'sakura-background';
      }
      
      petal.className = `sakura-petal ${layerClass}`;
      petal.style.width = `${size}px`;
      petal.style.height = `${size * 1.25}px`;
      petal.style.left = `${Math.random() * 100}%`;
      petal.style.top = `${Math.random() * -40 - 20}px`;
      petal.style.setProperty('--petal-opacity', `${opacity}`);
      
      const delay = Math.random() * 8;
      petal.style.animationDelay = `${delay}s, ${delay}s`;
      
      // Sway animation duration: between 2s and 4.5s
      petal.style.animationDuration = `${duration}s, ${Math.random() * 2.5 + 2}s`;
      
      sakuraContainer.appendChild(petal);
    }
  }

  // Dynamic Embers Spawning for Loader Screen (with self-clean loop)
  const embersContainer = document.getElementById('loader-embers');
  if (embersContainer) {
    embersContainer.innerHTML = '';
    const spawnEmber = () => {
      const loaderScreen = document.getElementById('loader-screen');
      if (loaderScreen && (loaderScreen.classList.contains('hidden') || loaderScreen.classList.contains('fade-out'))) {
        clearInterval(embersInterval);
        return;
      }
      
      const ember = document.createElement('div');
      ember.className = 'ember-particle';
      
      const size = Math.random() * 3.5 + 2; // 2px to 5.5px
      ember.style.width = `${size}px`;
      ember.style.height = `${size}px`;
      
      // Spawn in the lower-middle portion of the Enso ring
      ember.style.left = `${Math.random() * 50 + 25}%`;
      ember.style.bottom = `${Math.random() * 30 + 15}%`;
      
      const drift = Math.random() * 60 - 30; // -30px to 30px lateral drift
      ember.style.setProperty('--ember-drift', `${drift}px`);
      
      const duration = Math.random() * 1.4 + 1.2; // 1.2s to 2.6s
      ember.style.animationDuration = `${duration}s`;
      
      embersContainer.appendChild(ember);
      
      setTimeout(() => {
        ember.remove();
      }, duration * 1000);
    };
    
    const embersInterval = setInterval(spawnEmber, 120);
  }

  // load translation / layout init
  updateStaticText();
}

export function updatePregameOptionsUI() {
  const tInf = document.getElementById('time-infinite-btn');
  const t3m = document.getElementById('time-3m-btn');
  const t5m = document.getElementById('time-5m-btn');
  const t10m = document.getElementById('time-10m-btn');
  if (tInf && t3m && t5m && t10m) {
    tInf.classList.remove('active');
    t3m.classList.remove('active');
    t5m.classList.remove('active');
    t10m.classList.remove('active');
    if (globals.timerLimit === 'endless') {
      tInf.classList.add('active');
    } else if (globals.timerLimit === 180) {
      t3m.classList.add('active');
    } else if (globals.timerLimit === 300) {
      t5m.classList.add('active');
    } else if (globals.timerLimit === 600) {
      t10m.classList.add('active');
    }
  }

  const l5 = document.getElementById('lvl-5-btn');
  const l10 = document.getElementById('lvl-10-btn');
  const l15 = document.getElementById('lvl-15-btn');
  if (l5 && l10 && l15) {
    l5.classList.remove('active');
    l10.classList.remove('active');
    l15.classList.remove('active');
    if (globals.levelModeTarget === 5) l5.classList.add('active');
    else if (globals.levelModeTarget === 10) l10.classList.add('active');
    else if (globals.levelModeTarget === 15) l15.classList.add('active');
  }
}

export function renderSkillChoicesPregame() {
  const container = document.getElementById('pregame-skill-choices');
  const countEl = document.getElementById('pregame-magatama-count');
  if (countEl) countEl.textContent = (globals.magatama || 0).toLocaleString();
  if (!container) return;
  container.innerHTML = '';

  const isJa = globals.currentLang === 'ja';

  // Ensure selected skill is unlocked, otherwise fallback to enhance
  if (!globals.unlockedSkills.includes(globals.selectedSkill)) {
    globals.selectedSkill = 'enhance';
    try { localStorage.setItem('stickmurai_selected_skill', 'enhance'); } catch(e) {}
  }

  skillsData.forEach((skill: any) => {
    const isUnlocked = globals.unlockedSkills.includes(skill.id);
    const isSelected = globals.selectedSkill === skill.id;

    const card = document.createElement('div');
    card.className = `skill-card ${isSelected ? 'active' : ''} ${!isUnlocked ? 'skill-locked' : ''}`;
    
    let category = 'basic';
    if (skill.id === 'enhance') category = 'vitality';
    else if (skill.id === 'shield') category = 'wind';
    else if (skill.id === 'dash') category = 'thunder';
    else if (skill.id === 'firewheel') category = 'fire';
    else if (skill.id === 'gravity') category = 'void';
    else if (skill.id === 'parry_master') category = 'wind';
    else if (skill.id === 'decoy_illusion') category = 'void';
    
    card.classList.add(`category-${category}`);
    
    const icon = skill.icon || '⚔️';
    const cost = skill.cost || 0;

    let lockContent = '';
    if (!isUnlocked) {
      const canAfford = (globals.magatama || 0) >= cost;
      lockContent = `
        <button class="skill-lock-btn" ${canAfford ? '' : 'disabled'}>
          🔒 ${isJa ? '解放' : 'UNLOCK'}: ${cost.toLocaleString()} 🔮
        </button>
      `;
    }

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <span class="skill-category-badge">${category}</span>
        <span style="font-size: 16px;">${icon}</span>
      </div>
      <h3>${t(skill.nameKey)}</h3>
      <p>${t(skill.descKey)}</p>
      ${lockContent}
    `;

    if (isUnlocked) {
      bindDualListener(card, () => {
        globals.selectedSkill = skill.id as any;
        try { localStorage.setItem('stickmurai_selected_skill', skill.id); } catch(e) {}
        renderSkillChoicesPregame();
      });
    } else {
      const lockBtn = card.querySelector('.skill-lock-btn') as HTMLElement;
      if (lockBtn) {
        bindDualListener(lockBtn, (e) => {
          e.stopPropagation();
          if ((globals.magatama || 0) < cost) return;
          globals.magatama -= cost;
          if (!globals.unlockedSkills.includes(skill.id)) {
            globals.unlockedSkills.push(skill.id);
          }
          globals.selectedSkill = skill.id as any;
          try {
            localStorage.setItem('stickmurai_magatama', globals.magatama.toString());
            localStorage.setItem('stickmurai_unlocked_skills', JSON.stringify(globals.unlockedSkills));
            localStorage.setItem('stickmurai_selected_skill', skill.id);
          } catch(err) {}
          playSynthesizedFusionUnlock();
          renderSkillChoicesPregame();
        });
      }
    }

    container.appendChild(card);
  });

  // Toggle active skill selections for Zen Mode
  const skillSelectTitle = document.getElementById('skill-select-title');
  const skillChoices = document.getElementById('pregame-skill-choices');
  if (globals.gameMode === 'zen') {
    if (skillSelectTitle) skillSelectTitle.style.display = 'none';
    if (skillChoices) skillChoices.style.display = 'none';
  } else {
    if (skillSelectTitle) skillSelectTitle.style.display = 'block';
    if (skillChoices) skillChoices.style.display = 'flex';
  }

  updatePregameOptionsUI();
}

export function updateEnhanceButton() {
  const btn = document.getElementById('btn-enhance');
  if (!btn) return;
  
  const textSpan = btn.querySelector('.btn-text');
  const iconSvg = btn.querySelector('.skill-icon');
  
  if (globals.gameMode === 'zen') {
    if (textSpan) textSpan.innerHTML = t('btnRestricted');
    btn.style.opacity = '0.3';
    return;
  }
  
  btn.style.opacity = '1';
  
  if (globals.selectedSkill === 'enhance') {
    if (textSpan) textSpan.innerHTML = t('btnEnhance');
    if (iconSvg) {
      iconSvg.innerHTML = `
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
        <g transform="translate(12,12) scale(0.9)">
          <path d="M0,0 C2,-4 6,-4 6,0 C6,4 2,6 -2,6 C-6,6 -8,2 -8,0" fill="currentColor"/>
          <path d="M0,0 C-4,2 -4,6 0,6 C4,6 6,2 6,-2 C6,-6 2,-8 0,-8" fill="currentColor" transform="rotate(120)"/>
          <path d="M0,0 C-2,-4 -6,-4 -6,0 C-6,4 -2,6 2,6 C6,6 8,2 8,0" fill="currentColor" transform="rotate(240)"/>
        </g>
      `;
    }
  } else if (globals.selectedSkill === 'shield') {
    if (textSpan) textSpan.innerHTML = t('btnShield');
    if (iconSvg) {
      iconSvg.innerHTML = `
        <path d="M5 3h14M6 3v12c0 4 3 6 6 6s6-2 6-6V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 7h6M12 7v8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M12 2v2" stroke="currentColor" stroke-width="2"/>
      `;
    }
  } else if (globals.selectedSkill === 'dash') {
    if (textSpan) textSpan.innerHTML = t('btnFlash');
    if (iconSvg) {
      iconSvg.innerHTML = `
        <path d="M17 2L6 13h6l-3 7L20 9h-6z" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/>
        <path d="M3 5l2 2M3 17l2-2M19 17l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      `;
    }
  } else if (globals.selectedSkill === 'firewheel') {
    if (textSpan) textSpan.innerHTML = t('btnFirewheel');
    if (iconSvg) {
      iconSvg.innerHTML = `
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2"/>
        <path d="M12 3c1 2 2 4 0 6c-2 2-4 1-5-1c-1-2 1-4 3-5z" fill="currentColor"/>
        <path d="M12 3c1 2 2 4 0 6c-2 2-4 1-5-1c-1-2 1-4 3-5z" fill="currentColor" transform="rotate(90 12 12)"/>
        <path d="M12 3c1 2 2 4 0 6c-2 2-4 1-5-1c-1-2 1-4 3-5z" fill="currentColor" transform="rotate(180 12 12)"/>
        <path d="M12 3c1 2 2 4 0 6c-2 2-4 1-5-1c-1-2 1-4 3-5z" fill="currentColor" transform="rotate(270 12 12)"/>
      `;
    }
  } else if (globals.selectedSkill === 'gravity') {
    if (textSpan) textSpan.innerHTML = t('btnGravity');
    if (iconSvg) {
      iconSvg.innerHTML = `
        <path d="M12 2a10 10 0 1 0 10 10A8 8 0 0 0 12 4a6 6 0 0 0-6 6a4 4 0 0 0 4 4a2 2 0 0 0 2-2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
      `;
    }
  } else if (globals.selectedSkill === 'parry_master') {
    if (textSpan) textSpan.innerHTML = t('btnParryMaster');
    if (iconSvg) {
      iconSvg.innerHTML = `
        <line x1="4" y1="20" x2="20" y2="4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <line x1="20" y1="20" x2="4" y2="4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <circle cx="8" cy="16" r="1.5" fill="currentColor"/>
        <circle cx="16" cy="16" r="1.5" fill="currentColor"/>
        <path d="M12 6v4M12 14v4M6 12h4M14 12h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
      `;
    }
  } else if (globals.selectedSkill === 'decoy_illusion') {
    if (textSpan) textSpan.innerHTML = t('btnDecoy');
    if (iconSvg) {
      iconSvg.innerHTML = `
        <path d="M12 21c-4 0-7-4-7-8c0-3 2-6 5-8l2-3l2 3c3 2 5 5 5 8c0 4-3 8-7 8z" stroke="currentColor" stroke-width="1.5" fill="none"/>
        <path d="M5 11l-2-4l4 2M19 11l2-4l-4 2" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M9 13c1 0 2 1 2 2M15 13c-1 0-2 1-2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      `;
    }
  }
}

export function updateComboDisplay() {
  if (!comboDisplay) return;
  if (globals.combo <= 0) {
    comboDisplay.classList.remove('combo-active');
    return;
  }
  
  comboDisplay.classList.add('combo-active');
  
  let grade = '';
  let color = '#ff3366';
  let glow = 'rgba(255, 51, 102, 0.8)';
  if (globals.combo >= 120) {
    grade = 'SSS';
    color = '#00ffff';
    glow = 'rgba(0, 255, 255, 0.9)';
  } else if (globals.combo >= 80) {
    grade = 'SS';
    color = '#ffd700';
    glow = 'rgba(255, 215, 0, 0.9)';
  } else if (globals.combo >= 50) {
    grade = 'S';
    color = '#ff00ff';
    glow = 'rgba(255, 0, 255, 0.9)';
  } else if (globals.combo >= 35) {
    grade = 'A';
    color = '#ff6600';
    glow = 'rgba(255, 102, 0, 0.8)';
  } else if (globals.combo >= 20) {
    grade = 'B';
    color = '#aa33ff';
    glow = 'rgba(170, 51, 255, 0.8)';
  } else if (globals.combo >= 10) {
    grade = 'C';
    color = '#3399ff';
    glow = 'rgba(51, 153, 255, 0.8)';
  } else if (globals.combo >= 5) {
    grade = 'D';
    color = '#33cc66';
    glow = 'rgba(51, 204, 102, 0.8)';
  }

  comboDisplay.style.color = color;
  comboDisplay.style.textShadow = `0 0 12px ${glow}, 0 0 24px ${glow}`;
  
  const suffix = globals.currentLang === 'en' ? ' Combo' : t('combo');
  if (grade !== '') {
    comboDisplay.innerHTML = `x${globals.combo}${suffix} <span style="display:inline-block; margin-left:6px; padding:1px 8px; background:rgba(0,0,0,0.65); border:2px solid ${color}; border-radius:4px; box-shadow:0 0 10px ${glow}; font-family:'Outfit', sans-serif; font-weight:900; font-size: 0.85em; color:${color}; vertical-align:middle; text-shadow:0 0 8px ${color};">${grade}</span>`;
  } else {
    comboDisplay.innerHTML = `x${globals.combo}${suffix}`;
  }
}

export function updateCooldownsUI() {
  const btnUlt = btnUltElement || (btnUltElement = document.getElementById('btn-ult'));
  if (enhanceCooldownOverlay && enhanceCooldownText) {
    if (globals.enhanceActiveTimer > 0) {
      const p = Math.round((globals.enhanceActiveTimer / globals.playerStats.enhanceDuration) * 100);
      const text = globals.enhanceActiveTimer.toFixed(1) + 's';
      
      if (p !== lastEnhanceOverlayHeight) {
        enhanceCooldownOverlay.style.height = `${p}%`;
        enhanceCooldownOverlay.style.background = 'rgba(255, 102, 0, 0.35)';
        lastEnhanceOverlayHeight = p;
      }
      if (text !== lastEnhanceTextContent) {
        enhanceCooldownText.textContent = text;
        enhanceCooldownText.style.color = '#ff6600';
        enhanceCooldownText.style.textShadow = '0 0 8px #ff6600';
        lastEnhanceTextContent = text;
      }
      
      const btn = btnEnhanceElement || (btnEnhanceElement = document.getElementById('btn-enhance'));
      if (btn) {
        if (!lastBtnEnhanceBuff) {
          btn.classList.add('buff-active');
          btn.classList.remove('ready');
          lastBtnEnhanceBuff = true;
          lastBtnEnhanceReady = false;
        }
      }
    } else {
      const p = globals.enhanceCooldown > 0 ? Math.round((globals.enhanceCooldown / globals.playerStats.enhanceCooldownMax) * 100) : 0;
      const text = globals.enhanceCooldown > 0 ? Math.ceil(globals.enhanceCooldown) + 's' : '';
      
      if (p !== lastEnhanceOverlayHeight) {
        enhanceCooldownOverlay.style.height = `${p}%`;
        enhanceCooldownOverlay.style.background = 'rgba(0, 0, 0, 0.7)';
        lastEnhanceOverlayHeight = p;
      }
      if (text !== lastEnhanceTextContent) {
        enhanceCooldownText.textContent = text;
        enhanceCooldownText.style.color = '#fff';
        enhanceCooldownText.style.textShadow = '0 0 8px #000, 0 0 16px #000';
        lastEnhanceTextContent = text;
      }
      
      const btn = btnEnhanceElement || (btnEnhanceElement = document.getElementById('btn-enhance'));
      if (btn) {
        const isReady = globals.enhanceCooldown <= 0;
        if (lastBtnEnhanceBuff) {
          btn.classList.remove('buff-active');
          lastBtnEnhanceBuff = false;
        }
        if (isReady !== lastBtnEnhanceReady) {
          if (isReady) btn.classList.add('ready');
          else btn.classList.remove('ready');
          lastBtnEnhanceReady = isReady;
        }
      }
    }
  }

  if (dashCooldownOverlay) {
    const p = (globals.player && globals.player.dashCooldown > 0) ? Math.round((globals.player.dashCooldown / globals.playerStats.dashCooldownBase) * 100) : 0;
    if (p !== lastDashOverlayHeight) {
      dashCooldownOverlay.style.height = `${p}%`;
      lastDashOverlayHeight = p;
    }
  }
  if (dashCooldownText) {
    const text = (globals.player && globals.player.dashCooldown > 0) ? globals.player.dashCooldown.toFixed(1) + 's' : '';
    if (text !== lastDashTextContent) {
      dashCooldownText.textContent = text;
      lastDashTextContent = text;
    }
  }
  const btnDash = btnDashElement || (btnDashElement = document.getElementById('btn-dash'));
  if (btnDash) {
    const isDashReady = !!(globals.player && globals.player.dashCooldown <= 0);
    if (isDashReady !== lastBtnDashReady) {
      if (isDashReady) btnDash.classList.add('ready');
      else btnDash.classList.remove('ready');
      lastBtnDashReady = isDashReady;
    }
  }

  if (attackCooldownOverlay) {
    const maxCooldown = globals.playerStats.attackCooldownBase * (globals.flowState === 'awakened' ? 0.5 : 1.0);
    const p = (globals.player && globals.player.attackCooldown > 0) ? Math.round((globals.player.attackCooldown / maxCooldown) * 100) : 0;
    if (p !== lastAttackOverlayHeight) {
      attackCooldownOverlay.style.height = `${p}%`;
      lastAttackOverlayHeight = p;
    }
  }

  if (ultCooldownOverlay) {
    let p = 0;
    if (globals.ultCooldown > 0) {
      p = Math.round((globals.ultCooldown / globals.ultCooldownMax) * 100);
      ultCooldownOverlay.style.background = 'rgba(255, 60, 0, 0.4)';
    } else {
      p = Math.round((1 - globals.flow / globals.playerStats.flowMax) * 100);
      ultCooldownOverlay.style.background = '';
    }
    if (p !== lastUltOverlayHeight) {
      ultCooldownOverlay.style.height = `${p}%`;
      lastUltOverlayHeight = p;
    }
  }

  if (ultCooldownText) {
    const text = globals.ultCooldown > 0 ? globals.ultCooldown.toFixed(1) + 's' : '';
    if (text !== lastUltTextContent) {
      ultCooldownText.textContent = text;
      lastUltTextContent = text;
    }
  }
  
  if (btnUlt) {
    const isUltReady = globals.flow >= globals.playerStats.flowMax && globals.flowState === 'normal' && globals.ultCooldown <= 0;
    if (isUltReady !== lastBtnUltReady) {
      if (isUltReady) btnUlt.classList.add('ready');
      else btnUlt.classList.remove('ready');
      lastBtnUltReady = isUltReady;
    }
  }
}

let lastRenderedScore = -1;
let lastRenderedMaxLives = -1;

export function updateUI() {
  if (!flowMeterFill || !expMeterFill || !scoreDisplay) return;
  
  const flowPct = Math.round((globals.flow / globals.playerStats.flowMax) * 100);
  if (flowPct !== lastFlowWidth) {
    flowMeterFill.style.width = `${flowPct}%`;
    lastFlowWidth = flowPct;
  }
  
  const expPct = Math.round((globals.exp / globals.maxExp) * 100);
  if (expPct !== lastExpWidth) {
    expMeterFill.style.width = `${expPct}%`;
    lastExpWidth = expPct;
  }
  
  const isMaxFlow = globals.flow >= globals.playerStats.flowMax && globals.flowState === 'normal';
  if (isMaxFlow !== lastMaxFlowClass) {
    if (isMaxFlow) flowMeterContainer.classList.add('max-flow');
    else flowMeterContainer.classList.remove('max-flow');
    lastMaxFlowClass = isMaxFlow;
  }
  
  if (globals.score !== lastRenderedScore) {
    scoreDisplay.textContent = `Kills: ${globals.score}`;
    lastRenderedScore = globals.score;
  }

  if (globals.magatama !== lastRenderedMagatama) {
    const el = hudMagatamaElement || (hudMagatamaElement = document.getElementById('hud-magatama-count'));
    if (el) el.textContent = (globals.magatama || 0).toLocaleString();
    lastRenderedMagatama = globals.magatama;
  }

  const objDisplay = objectiveDisplayElement || (objectiveDisplayElement = document.getElementById('objective-display'));
  if (objDisplay) {
    if (globals.gameState === 'playing') {
      if (globals.activeBounty) {
        if (lastObjectiveDisplay !== 'block') {
          objDisplay.style.display = 'block';
          lastObjectiveDisplay = 'block';
        }
        const b = globals.activeBounty;
        const remaining = Math.ceil(b.timeRemaining);
        const text = `📜 BOUNTY [${remaining}s]: ${b.description} (${b.current}/${b.target})`;
        if (text !== lastObjectiveText) {
          objDisplay.textContent = text;
          objDisplay.style.borderColor = 'rgba(251, 191, 36, 0.6)';
          objDisplay.style.color = '#fbbf24';
          lastObjectiveText = text;
        }
      } else if (globals.timerLimit !== 'endless') {
        if (lastObjectiveDisplay !== 'block') {
          objDisplay.style.display = 'block';
          lastObjectiveDisplay = 'block';
        }
        const mins = Math.floor(globals.timeModeTimeRemaining / 60);
        const secs = Math.floor(globals.timeModeTimeRemaining % 60);
        const secsStr = secs < 10 ? '0' + secs : secs;
        const text = globals.gameMode === 'level' 
          ? `GOAL: LVL ${globals.levelModeTarget} | TIME: ${mins}:${secsStr}`
          : `TIME: ${mins}:${secsStr}`;
        if (text !== lastObjectiveText) {
          objDisplay.textContent = text;
          objDisplay.style.borderColor = 'rgba(255, 255, 255, 0.15)';
          objDisplay.style.color = 'inherit';
          lastObjectiveText = text;
        }
      } else if (globals.gameMode === 'level') {
        if (lastObjectiveDisplay !== 'block') {
          objDisplay.style.display = 'block';
          lastObjectiveDisplay = 'block';
        }
        const text = `GOAL: LVL ${globals.levelModeTarget}`;
        if (text !== lastObjectiveText) {
          objDisplay.textContent = text;
          objDisplay.style.borderColor = 'rgba(255, 255, 255, 0.15)';
          objDisplay.style.color = 'inherit';
          lastObjectiveText = text;
        }
      } else if (globals.gameMode === 'classic') {
        if (lastObjectiveDisplay !== 'block') {
          objDisplay.style.display = 'block';
          lastObjectiveDisplay = 'block';
        }
        const stage = globals.currentStage || 1;
        const isBoss = stage % 5 === 0;
        const isJa = globals.currentLang === 'ja';
        let text = '';
        if (isBoss) {
          const bossStageData = getStageData(stage);
          const rawName = isJa ? (bossStageData.nameJa || bossStageData.name) : bossStageData.name;
          const cleanName = rawName.replace(/^ステージ\s*\d+:\s*|^STAGE\s*\d+:\s*/i, '');
          text = isJa ? `ステージ ${stage}: ${cleanName}` : `STAGE ${stage}: ${cleanName}`;
        } else {
          text = `STAGE ${stage}: ${globals.stageKills} / ${globals.stageTargetKills} KILLS`;
        }
        if (text !== lastObjectiveText) {
          objDisplay.textContent = text;
          objDisplay.style.borderColor = isBoss ? 'rgba(239, 68, 68, 0.7)' : 'rgba(255, 215, 0, 0.4)';
          objDisplay.style.color = isBoss ? '#ef4444' : '#ffd700';
          lastObjectiveText = text;
        }
      } else {
        if (lastObjectiveDisplay !== 'none') {
          objDisplay.style.display = 'none';
          lastObjectiveDisplay = 'none';
        }
      }
    } else {
      if (lastObjectiveDisplay !== 'none') {
        objDisplay.style.display = 'none';
        lastObjectiveDisplay = 'none';
      }
    }
  }
  
  if (globals.lives !== lastLives || globals.maxLives !== lastRenderedMaxLives) {
    heartsElements.forEach((h, i) => {
      if (i >= globals.maxLives) {
        (h as HTMLElement).style.display = 'none';
      } else {
        (h as HTMLElement).style.display = '';
      }
      if (i < globals.lives) {
        h.classList.add('active');
        h.classList.remove('damaged');
      } else {
        h.classList.remove('active');
        if (i < lastLives) {
          h.classList.add('damaged');
        }
      }
    });
    lastLives = globals.lives;
    lastRenderedMaxLives = globals.maxLives;
  }

  updateCooldownsUI();
}

export function updateStaticText() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key && i18n[globals.currentLang][key]) {
      if (globals.gameMode === 'zen') {
        if (el.id === 'btn-attack') {
          el.innerHTML = t('btnParryOnly');
          return;
        }
        if (el.id === 'btn-enhance') {
          el.innerHTML = t('btnRestricted');
          return;
        }
      }
      el.innerHTML = i18n[globals.currentLang][key];
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key && i18n[globals.currentLang]?.[key] && el instanceof HTMLInputElement) {
      el.placeholder = i18n[globals.currentLang][key];
    }
  });
  
  document.documentElement.lang = globals.currentLang;
  updateUI();
  updateEnhanceButton();
  if (globals.comboTimer > 0) {
    updateComboDisplay();
  }
  initKeybindsUI();
  updateHighScoresDisplay();
}

export function updateHighScoresDisplay() {
  const container = document.getElementById('high-scores-content');
  if (!container) return;
  const hs = globals.highScores;
  const isJa = globals.currentLang === 'ja';
  
  container.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr auto; gap: 4px 10px;">
      <span>${isJa ? '最多討伐数' : 'Max Kills'}:</span>
      <strong style="color: #ff3366;">${hs.score}</strong>
      <span>${isJa ? '最大コンボ' : 'Max Combo'}:</span>
      <strong style="color: #ffcc00;">x${hs.maxCombo}</strong>
      <span>${isJa ? '弾き数' : 'Total Parries'}:</span>
      <strong style="color: #00ffaa;">${hs.parries}</strong>
      <span>${isJa ? '極・弾き数' : 'Perfect Parries'}:</span>
      <strong style="color: #ffd700;">${hs.perfectParries}</strong>
      <span>${isJa ? '見切り数' : 'Perfect Dodges'}:</span>
      <strong style="color: #00ffff;">${hs.perfectDodges}</strong>
    </div>
  `;
}

export function initKeybindsUI() {
  const grid = document.getElementById('keybinds-grid');
  if (!grid) return;
  grid.innerHTML = '';
  
  const actions = [
    { id: 'moveUp', labelEn: 'Move Up', labelJa: '上移動' },
    { id: 'moveDown', labelEn: 'Move Down', labelJa: '下移動' },
    { id: 'moveLeft', labelEn: 'Move Left', labelJa: '左移動' },
    { id: 'moveRight', labelEn: 'Move Right', labelJa: '右移動' },
    { id: 'dash', labelEn: 'Dash', labelJa: '回避・ダッシュ' },
    { id: 'skill', labelEn: 'Skill/Enhance', labelJa: 'スキル使用' },
    { id: 'ult', labelEn: 'Ultimate', labelJa: '奥義' }
  ];

  const isJa = globals.currentLang === 'ja';
  
  actions.forEach(act => {
    const labelSpan = document.createElement('span');
    labelSpan.style.color = '#e5e7eb';
    labelSpan.style.display = 'flex';
    labelSpan.style.alignItems = 'center';
    labelSpan.textContent = isJa ? act.labelJa : act.labelEn;
    grid.appendChild(labelSpan);
    
    const btn = document.createElement('button');
    btn.className = 'keybind-btn';
    
    const currentKey = globals.keyMaps[act.id] || 'None';
    btn.textContent = currentKey.replace('Key', '');
    
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      
      const activeBtn = (window as any).activeRebindButton;
      if (activeBtn && activeBtn !== btn) {
        const prevAction = (window as any).activeRebindAction;
        const prevKey = globals.keyMaps[prevAction];
        activeBtn.textContent = prevKey.replace('Key', '');
        activeBtn.classList.remove('waiting-rebind');
      }
      
      (window as any).activeRebindAction = act.id;
      (window as any).activeRebindButton = btn;
      btn.textContent = isJa ? '入力待ち...' : 'Press Key...';
      btn.classList.add('waiting-rebind');
    });
    
    grid.appendChild(btn);
  });
}

(callbacks as any).updateHighScoresDisplay = updateHighScoresDisplay;

export function updatePauseUpgradesList() {
  const listContainer = document.getElementById('pause-upgrades-list');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  if (!globals.chosenPowerUps || globals.chosenPowerUps.length === 0) {
    listContainer.innerHTML = `
      <div style="color: #666; font-style: italic; text-align: center; padding: 40px 10px; font-size: 13px; font-family: 'Outfit', sans-serif; letter-spacing: 0.5px;">
        ${globals.currentLang === 'ja' ? '獲得した強化はありません' : 'NO UPGRADES ACQUIRED YET'}
      </div>`;
    return;
  }

  const counts: Record<string, number> = {};
  globals.chosenPowerUps.forEach(key => {
    if (key.startsWith('ult')) return;
    counts[key] = (counts[key] || 0) + 1;
  });

  const activeKeys = Object.keys(counts);
  if (activeKeys.length === 0) {
    listContainer.innerHTML = `
      <div style="color: #666; font-style: italic; text-align: center; padding: 40px 10px; font-size: 13px; font-family: 'Outfit', sans-serif; letter-spacing: 0.5px;">
        ${globals.currentLang === 'ja' ? '獲得した強化はありません' : 'NO UPGRADES ACQUIRED YET'}
      </div>`;
    return;
  }

  activeKeys.forEach((nameKey, idx) => {
    const count = counts[nameKey];
    const badge = document.createElement('div');
    badge.className = 'pause-upgrade-badge';
    badge.style.animationDelay = `${idx * 0.04}s`;
    badge.innerHTML = `
      <span class="pause-upgrade-name">${t(nameKey)}</span>
      <span class="pause-upgrade-count">x${count}</span>
    `;
    listContainer.appendChild(badge);
  });
}

export function updateBlessingSelectionUI() {
  const swiftBtn = document.getElementById('blessing-swift-btn');
  const fortuneBtn = document.getElementById('blessing-fortune-btn');
  
  if (swiftBtn) {
    const costText = swiftBtn.querySelector('.blessing-cost-text') as HTMLElement;
    if (globals.activeBlessing === 'swift_strike') {
      swiftBtn.classList.add('active');
      if (costText) costText.innerText = '✓ ACTIVE';
    } else {
      swiftBtn.classList.remove('active');
      if (costText) costText.innerText = '(Watch Ad to Unlock)';
    }
  }
  
  if (fortuneBtn) {
    const costText = fortuneBtn.querySelector('.blessing-cost-text') as HTMLElement;
    if (globals.activeBlessing === 'fortune') {
      fortuneBtn.classList.add('active');
      if (costText) costText.innerText = '✓ ACTIVE';
    } else {
      fortuneBtn.classList.remove('active');
      if (costText) costText.innerText = '(Watch Ad to Unlock)';
    }
  }
}


// ----------------------------------------------------
// Grimoire, Chronicle, Shrine & Victory UI Implementation
// ----------------------------------------------------

export function populateGrimoireGrid() {
  const grid = document.getElementById('grimoire-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const isJa = globals.currentLang === 'ja';

  const recipeIcons: Record<string, string> = {
    plasma_tempest: 'icons/release_v1.2-single_38.png',
    singularity_cleave: 'icons/release_v1.2-single_15.png',
    hundred_phantoms: 'icons/release_v1.2-single_77.png',
    kamaitachi: 'icons/release_v1.2-single_5.png',
    asura_storm: 'icons/release_v1.2-single_88.png'
  };

  FUSION_RECIPES.forEach(recipe => {
    const isDiscovered = globals.discoveredFusions.includes(recipe.key) || globals.activeFusions.has(recipe.key);
    const card = document.createElement('div');
    card.className = 'grimoire-card' + (isDiscovered ? ' discovered' : ' locked');
    card.style.background = isDiscovered ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.8)';
    card.style.border = isDiscovered ? '1px solid #ffd700' : '1px solid #334155';
    card.style.borderRadius = '8px';
    card.style.padding = '16px';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '8px';
    card.style.boxShadow = isDiscovered ? '0 0 18px rgba(255, 215, 0, 0.25)' : 'none';
    
    // Live Run Synergy Calculation
    let req1Met = false;
    let req2Met = false;

    if (recipe.key === 'plasma_tempest') {
      req1Met = globals.selectedSkill === 'firewheel' || (globals.playerStats.firewheelBlazeLevel || 0) > 0 || globals.chosenPowerUps.some(k => k.includes('Fire'));
      req2Met = globals.selectedSkill === 'dash' || (globals.playerStats.dashThunderLevel || 0) > 0 || globals.chosenPowerUps.some(k => k.includes('Thunder') || k.includes('Feather'));
    } else if (recipe.key === 'singularity_cleave') {
      req1Met = globals.selectedSkill === 'gravity' || (globals.playerStats.gravityRadiusLevel || 0) > 0 || globals.chosenPowerUps.some(k => k.includes('Gravity'));
      req2Met = globals.selectedSkill === 'enhance' || globals.playerStats.enhanceBonusDmg >= 2 || globals.chosenPowerUps.some(k => k.includes('Lethal') || k.includes('Giant'));
    } else if (recipe.key === 'hundred_phantoms') {
      req1Met = (globals.playerStats.shadowClonesLevel || 0) > 0 || globals.chosenPowerUps.some(k => k.includes('Clones') || k.includes('Echo'));
      req2Met = globals.chosenPowerUps.includes('puCursedGlass') || globals.lives <= 2;
    } else if (recipe.key === 'kamaitachi') {
      req1Met = globals.galeVortexActive || globals.selectedSkill === 'shield' || globals.chosenPowerUps.some(k => k.includes('Wind') || k.includes('Gale'));
      req2Met = globals.playerStats.deflectedDmg >= 3 || globals.chosenPowerUps.some(k => k.includes('Deflect') || k.includes('Iron'));
    } else if (recipe.key === 'asura_storm') {
      req1Met = globals.selectedSkill === 'parry_master' || globals.consecutiveParries >= 3 || globals.runStats.perfectParries >= 3;
      req2Met = globals.bloodThirstCurseActive || globals.playerStats.flowGenMult >= 1.3 || globals.chosenPowerUps.some(k => k.includes('Blood'));
    }

    const synergyPct = ((req1Met ? 1 : 0) + (req2Met ? 1 : 0)) * 50;
    const iconSrc = recipeIcons[recipe.key] || 'icons/release_v1.2-single_1.png';

    if (isDiscovered) {
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:8px;">
            <img src="${iconSrc}" alt="icon" style="width:28px; height:28px; image-rendering:pixelated; border-radius:4px; border:1px solid #ffd700;" />
            <span style="font-family:'Cinzel', serif; font-size:16px; font-weight:bold; color:#ffd700;">${isJa ? recipe.nameJa : recipe.nameEn}</span>
          </div>
          <span style="font-size:11px; padding:2px 6px; border-radius:4px; background:rgba(34,197,94,0.2); color:#22c55e; border:1px solid #22c55e;">${isJa ? '解読済' : 'DISCOVERED'}</span>
        </div>
        <div style="font-size:13px; color:#e2e8f0; line-height:1.4;">${isJa ? recipe.descJa : recipe.descEn}</div>
        
        <div style="margin-top:4px; display:flex; flex-direction:column; gap:3px;">
          <div style="display:flex; justify-content:space-between; font-size:11px; color:#94a3b8;">
            <span>${isJa ? '出撃中の共鳴度' : 'Active Run Synergy'}: <strong style="color:${synergyPct === 100 ? '#22c55e' : (synergyPct > 0 ? '#ffd700' : '#64748b')};">${synergyPct}%</strong></span>
            <span style="color:${synergyPct === 100 ? '#22c55e' : '#ffd700'}; font-weight:bold;">${synergyPct === 100 ? (isJa ? '⚡ 融合準備完了！' : '⚡ READY TO FORGE!') : (synergyPct === 50 ? (isJa ? '素材1つ獲得済' : '1/2 Acquired') : '')}</span>
          </div>
          <div style="width:100%; height:5px; background:#0f172a; border-radius:3px; overflow:hidden; border:1px solid #334155;">
            <div style="width:${synergyPct}%; height:100%; background:${synergyPct === 100 ? 'linear-gradient(90deg, #22c55e, #4ade80)' : 'linear-gradient(90deg, #f59e0b, #ffd700)'};"></div>
          </div>
        </div>

        <div style="margin-top:auto; padding-top:8px; border-top:1px dashed #334155; display:flex; gap:6px; align-items:center; flex-wrap:wrap; font-size:12px; color:#94a3b8;">
          <span style="background:${req1Met ? 'rgba(34,197,94,0.15)' : '#0f172a'}; padding:3px 8px; border-radius:4px; border:${req1Met ? '1px solid #22c55e' : '1px solid #475569'}; color:${req1Met ? '#86efac' : '#cbd5e1'};">⚔️ ${isJa ? recipe.req1Ja : recipe.req1En} ${req1Met ? '✓' : ''}</span>
          <span>+</span>
          <span style="background:${req2Met ? 'rgba(34,197,94,0.15)' : '#0f172a'}; padding:3px 8px; border-radius:4px; border:${req2Met ? '1px solid #22c55e' : '1px solid #475569'}; color:${req2Met ? '#86efac' : '#cbd5e1'};">⚡ ${isJa ? recipe.req2Ja : recipe.req2En} ${req2Met ? '✓' : ''}</span>
        </div>
      `;
    } else {
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="width:28px; height:28px; background:#1e293b; border-radius:4px; border:1px dashed #475569; display:flex; justify-content:center; align-items:center; color:#64748b; font-size:14px;">?</div>
            <span style="font-family:'Cinzel', serif; font-size:16px; font-weight:bold; color:#64748b;">??? [${isJa ? '未解読の奥義' : 'LOCKED FUSION'}]</span>
          </div>
          <span style="font-size:11px; padding:2px 6px; border-radius:4px; background:rgba(148,163,184,0.1); color:#64748b; border:1px solid #475569;">${isJa ? '未修得' : 'LOCKED'}</span>
        </div>
        <div style="font-size:13px; color:#475569; font-style:italic; line-height:1.4;">
          ${isJa 
            ? '二つの異なる流派の極致を同時に極めし時、この禁断の秘奥義は開眼する…' 
            : 'When two opposing disciplines reach their zenith in a single battle, this secret art shall awaken...'}
        </div>
        
        <div style="margin-top:4px; display:flex; flex-direction:column; gap:3px;">
          <div style="display:flex; justify-content:space-between; font-size:11px; color:#64748b;">
            <span>${isJa ? '出撃中の共鳴度' : 'Active Run Synergy'}: <strong style="color:${synergyPct > 0 ? '#ffd700' : '#475569'};">${synergyPct}%</strong></span>
            <span style="color:#ffd700; font-weight:bold;">${synergyPct === 100 ? (isJa ? '⚡ 融合準備完了！' : '⚡ READY TO FORGE!') : (synergyPct === 50 ? (isJa ? '素材1つ獲得済' : '1/2 Acquired') : '')}</span>
          </div>
          <div style="width:100%; height:5px; background:#090d16; border-radius:3px; overflow:hidden; border:1px solid #1e293b;">
            <div style="width:${synergyPct}%; height:100%; background:${synergyPct === 100 ? 'linear-gradient(90deg, #22c55e, #4ade80)' : 'linear-gradient(90deg, #f59e0b, #ffd700)'};"></div>
          </div>
        </div>

        <div style="margin-top:auto; padding-top:8px; border-top:1px dashed #1e293b; display:flex; gap:6px; align-items:center; flex-wrap:wrap; font-size:12px; color:#475569;">
          <span style="background:${req1Met ? 'rgba(34,197,94,0.15)' : '#090d16'}; padding:3px 8px; border-radius:4px; border:${req1Met ? '1px solid #22c55e' : '1px solid #1e293b'}; color:${req1Met ? '#86efac' : '#64748b'};">📜 ${isJa ? recipe.req1Ja : recipe.req1En} ${req1Met ? '✓' : ''}</span>
          <span>+</span>
          <span style="background:${req2Met ? 'rgba(34,197,94,0.15)' : '#090d16'}; padding:3px 8px; border-radius:4px; border:${req2Met ? '1px solid #22c55e' : '1px solid #1e293b'}; color:${req2Met ? '#86efac' : '#64748b'};">📜 ${isJa ? recipe.req2Ja : recipe.req2En} ${req2Met ? '✓' : ''}</span>
        </div>
      `;
    }
    grid.appendChild(card);
  });
}

export const HEROES_DATA = [
  {
    id: 'default',
    nameEn: 'Classic Ronin',
    nameJa: '霧の浪人 (クラシック)',
    titleEn: 'Ronin of the Mist',
    titleJa: '疾風怒濤の流浪剣士',
    descEn: 'The traditional stickmurai swordsman. Well-rounded agility, blade range, and recovery.',
    descJa: '伝統を受け継ぐ棒人間サムライ。速さ・刃のリーチ・隙の少なさの全てが高水準で調和した万能の型。',
    cost: 0,
    image: '/sprites/portraits/portrait_ronin.png',
    atk: '100%',
    spd: '100%',
    specialEn: 'Balanced Arts (Baseline Stance)',
    specialJa: '中段の構え（基本型）'
  },
  {
    id: 'luneblade',
    nameEn: 'Luneblade Ascendant',
    nameJa: '月影の剣聖（ルーンブレイド）',
    titleEn: 'Axion Swordsman',
    titleJa: '星海を切り裂く双刃の英傑',
    descEn: 'Wields an ethereal celestial greatsword. +25% Slash AoE, +1 Base Slash DMG, and +2 Iaijutsu Shockwave DMG.',
    descJa: '天空の霊力を帯びた双刃の大剣を振るう。通常斬撃範囲+25%、基礎威力+1、抜刀衝撃波威力+2。',
    cost: 100000,
    image: '/sprites/portraits/portrait_luneblade.png',
    atk: '130%',
    spd: '95%',
    specialEn: 'Lunar Resonance (+25% AoE, +2 Iai DMG)',
    specialJa: '月華共鳴（広範囲斬撃・衝撃波強化）'
  },
  {
    id: 'ninja',
    nameEn: 'Shadow Shinobi',
    nameJa: '闇夜の忍（シャドウ・シノビ）',
    titleEn: 'Silent Assassin',
    titleJa: '影を纏いし暗殺の達人',
    descEn: 'Master of lethal shadow-stepping. +15% Movement Speed, -20% Dash Cooldown, and +10% Attack Speed.',
    descJa: '闇に潜み急所を討つ達人。移動速度+15%、瞬歩クールダウン-20%、攻撃速度+10%。',
    cost: 150000,
    image: '/sprites/portraits/portrait_ninja.png',
    atk: '110%',
    spd: '120%',
    specialEn: 'Phantom Step (-20% Dash CD, +15% Speed)',
    specialJa: '幻影瞬歩（高速離脱・移動速度上昇）'
  }
];

export function populateDojoHeroGrid() {
  const grid = document.getElementById('dojo-hero-grid');
  const countEl = document.getElementById('dojo-magatama-count');
  if (countEl) countEl.textContent = (globals.magatama || 0).toLocaleString();
  if (!grid) return;
  grid.innerHTML = '';

  const isJa = globals.currentLang === 'ja';

  HEROES_DATA.forEach(hero => {
    const isUnlocked = globals.unlockedHeroes.includes(hero.id);
    const isEquipped = globals.selectedHero === hero.id;

    const card = document.createElement('div');
    card.className = 'hero-card';
    card.style.background = isEquipped ? 'rgba(88, 28, 135, 0.4)' : (isUnlocked ? 'rgba(30, 41, 59, 0.85)' : 'rgba(15, 23, 42, 0.8)');
    card.style.border = isEquipped ? '2px solid #c084fc' : (isUnlocked ? '1px solid #94a3b8' : '1px solid #334155');
    card.style.borderRadius = '10px';
    card.style.padding = '14px';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '8px';
    card.style.boxShadow = isEquipped ? '0 0 20px rgba(192, 132, 252, 0.4)' : 'none';

    // Hero portrait container with luminous backlight & SVG silhouette fallback
    const portraitHtml = `
      <div class="hero-portrait-wrap" style="width: 100%; height: 110px; background: radial-gradient(circle, rgba(255,255,255,0.25) 0%, rgba(15,23,42,0.9) 100%); border-radius: 8px; display: flex; justify-content: center; align-items: center; overflow: hidden; border: 1px solid rgba(192,132,252,0.3); margin-bottom: 4px; box-shadow: inset 0 0 12px rgba(0,0,0,0.6);">
        <img src="${hero.image}" alt="${hero.nameEn}" style="width: 90px; height: 90px; object-fit: contain; image-rendering: pixelated; filter: drop-shadow(0 0 8px rgba(255,255,255,0.45));" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'80\\' height=\\'80\\' viewBox=\\'0 0 80 80\\'><circle cx=\\'40\\' cy=\\'40\\' r=\\'30\\' fill=\\'%23c084fc\\' opacity=\\'0.2\\'/><text x=\\'50%\\' y=\\'55%\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' font-size=\\'32\\'>⚔️</text></svg>';" />
      </div>
    `;

    // Stats badge row
    const statsHtml = `
      <div style="display: flex; gap: 6px; font-family: 'Orbitron', monospace; font-size: 11px; margin-top: 2px;">
        <span style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #fca5a5; padding: 2px 6px; border-radius: 4px;">⚔️ ${hero.atk}</span>
        <span style="background: rgba(56, 189, 248, 0.2); border: 1px solid rgba(56, 189, 248, 0.4); color: #7dd3fc; padding: 2px 6px; border-radius: 4px;">⚡ ${hero.spd}</span>
      </div>
    `;

    let actionBtnHtml = '';
    if (isEquipped) {
      actionBtnHtml = `<button class="menu-btn btn-card" disabled style="margin: 0; background: #166534; border-color: #22c55e; color: #bbf7d0; cursor: default;">✓ ${isJa ? '装備中' : 'EQUIPPED'}</button>`;
    } else if (isUnlocked) {
      actionBtnHtml = `<button class="menu-btn btn-card equip-hero-btn" data-hero="${hero.id}" style="margin: 0; border-color: #38bdf8; color: #38bdf8; cursor: pointer;">${isJa ? '装備する' : 'EQUIP HERO'}</button>`;
    } else {
      const canAfford = (globals.magatama || 0) >= hero.cost;
      actionBtnHtml = `<button class="menu-btn btn-card buy-hero-btn" data-hero="${hero.id}" ${canAfford ? '' : 'disabled'} style="margin: 0; border-color: ${canAfford ? '#ffd700' : '#64748b'}; color: ${canAfford ? '#ffd700' : '#94a3b8'}; opacity: ${canAfford ? '1' : '0.6'}; box-shadow: ${canAfford ? '0 0 15px rgba(255,215,0,0.25)' : 'none'}; cursor: ${canAfford ? 'pointer' : 'not-allowed'};">${isJa ? `解放: ${hero.cost.toLocaleString()} 🔮` : `UNLOCK: ${hero.cost.toLocaleString()} 🔮`}</button>`;
    }

    card.innerHTML = `
      ${portraitHtml}
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <span style="font-family: 'Shojumaru', cursive; font-size: 14px; color: ${isEquipped ? '#c084fc' : '#f1f5f9'}; font-weight: bold;">${isJa ? hero.nameJa : hero.nameEn}</span>
        <span style="font-size: 10px; color: #a855f7; font-family: monospace;">${isJa ? hero.titleJa : hero.titleEn}</span>
      </div>
      <div style="font-size: 11px; color: #94a3b8; line-height: 1.4; min-height: 32px;">${isJa ? hero.descJa : hero.descEn}</div>
      ${statsHtml}
      <div style="font-size: 11px; color: #fef08a; background: rgba(254, 240, 138, 0.08); padding: 4px 8px; border-radius: 4px; border-left: 2px solid #ffd700; margin-top: 2px;">
        ✨ ${isJa ? hero.specialJa : hero.specialEn}
      </div>
      <div style="margin-top: auto; padding-top: 6px;">
        ${actionBtnHtml}
      </div>
    `;

    grid.appendChild(card);
  });

  // Attach pointerdown and click listeners to Equip and Buy buttons using bindDualListener
  grid.querySelectorAll('.equip-hero-btn').forEach(btn => {
    bindDualListener(btn as HTMLElement, () => {
      const heroId = (btn as HTMLElement).dataset.hero;
      if (!heroId) return;
      globals.selectedHero = heroId;
      try { localStorage.setItem('stickmurai_selected_hero', heroId); } catch(err) {}
      globals.player?.updateHeroType();
      playSynthesizedTempleBell();
      populateDojoHeroGrid();
    });
  });

  grid.querySelectorAll('.buy-hero-btn').forEach(btn => {
    bindDualListener(btn as HTMLElement, () => {
      const heroId = (btn as HTMLElement).dataset.hero;
      if (!heroId) return;
      const hero = HEROES_DATA.find(h => h.id === heroId);
      if (!hero) return;
      if ((globals.magatama || 0) < hero.cost) return;

      globals.magatama -= hero.cost;
      if (!globals.unlockedHeroes.includes(heroId)) {
        globals.unlockedHeroes.push(heroId);
      }
      globals.selectedHero = heroId;
      try {
        localStorage.setItem('stickmurai_magatama', globals.magatama.toString());
        localStorage.setItem('stickmurai_unlocked_heroes', JSON.stringify(globals.unlockedHeroes));
        localStorage.setItem('stickmurai_selected_hero', heroId);
      } catch(err) {}
      globals.player?.updateHeroType();
      playSynthesizedFusionUnlock();
      populateDojoHeroGrid();
    });
  });
}

export function populateChronicleList() {
  const countEl = document.getElementById('seals-unlocked-count');
  if (countEl) countEl.textContent = `${globals.unlockedSeals.length} / 7`;

  const list = document.getElementById('chronicle-list');
  if (!list) return;
  list.innerHTML = '';

  const isJa = globals.currentLang === 'ja';

  for (let i = 1; i <= 7; i++) {
    const seal = YOMI_SEALS[i];
    if (!seal) continue;
    const isUnlocked = globals.unlockedSeals.includes(seal.id);
    const card = document.createElement('div');
    card.style.background = isUnlocked ? 'rgba(15, 23, 42, 0.9)' : 'rgba(10, 15, 26, 0.6)';
    card.style.border = isUnlocked ? '1px solid #38bdf8' : '1px solid #1e293b';
    card.style.borderRadius = '8px';
    card.style.padding = '16px';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '8px';
    card.style.boxShadow = isUnlocked ? '0 0 15px rgba(56, 189, 248, 0.15)' : 'none';

    if (isUnlocked) {
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-family:'Cinzel', serif; font-size:16px; font-weight:bold; color:#38bdf8;">⛩️ ${isJa ? seal.titleJa : seal.titleEn}</span>
          <span style="font-size:11px; padding:2px 8px; border-radius:4px; background:rgba(56,189,248,0.2); color:#38bdf8; border:1px solid #38bdf8;">${isJa ? '封印解除' : 'SEAL BROKEN'}</span>
        </div>
        <div style="font-size:13px; color:#cbd5e1;"><strong>${isJa ? '【達成試練】' : '【FEAT CLEARED】'}</strong> ${isJa ? seal.featDescJa : seal.featDescEn}</div>
        <div style="font-size:13px; color:#94a3b8; font-style:italic; border-left:3px solid #38bdf8; padding-left:10px; margin:4px 0;">"${isJa ? seal.loreFragmentJa : seal.loreFragmentEn}"</div>
        <div style="margin-top:auto; font-size:13px; color:#ffd700; font-weight:500;">✨ ${isJa ? seal.rewardJa : seal.rewardEn}</div>
      `;
    } else {
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-family:'Cinzel', serif; font-size:16px; font-weight:bold; color:#64748b;">⛩️ Seal ${seal.id}: ???</span>
          <span style="font-size:11px; padding:2px 8px; border-radius:4px; background:rgba(148,163,184,0.1); color:#64748b; border:1px solid #334155;">${isJa ? '封印中' : 'SEALED'}</span>
        </div>
        <div style="font-size:13px; color:#94a3b8;">
          <strong>${isJa ? '【解呪条件】' : '【FEAT OBJECTIVE】'}</strong> ${isJa ? seal.featDescJa : seal.featDescEn}
        </div>
        <div style="font-size:12px; color:#475569; font-style:italic;">
          "${isJa ? '記憶は黄泉の冥流に沈みて判読不能…' : 'The memory remains submerged in Yomi\'s river, awaiting your triumph...'}"
        </div>
        <div style="margin-top:auto; font-size:12px; color:#64748b;">
          🔒 ${isJa ? seal.rewardJa : seal.rewardEn}
        </div>
      `;
    }
    list.appendChild(card);
  }
}

export function openShrineCommuneModal(sealId: number) {
  const modal = document.getElementById('shrine-modal');
  if (!modal) return;
  const seal = YOMI_SEALS[sealId];
  if (!seal) return;

  const isJa = globals.currentLang === 'ja';
  const titleEl = document.getElementById('shrine-modal-title');
  const featEl = document.getElementById('shrine-modal-feat');
  const rewardEl = document.getElementById('shrine-modal-reward');
  const loreEl = document.getElementById('shrine-modal-lore');

  if (titleEl) titleEl.textContent = isJa ? `⛩️ 封印開眼: ${seal.titleJa}` : `⛩️ SEAL AWAKENED: ${seal.titleEn}`;
  if (featEl) featEl.textContent = `${isJa ? '【試練達成】' : 'FEAT FULFILLED: '} ${isJa ? seal.featDescJa : seal.featDescEn}`;
  if (rewardEl) rewardEl.innerHTML = `⭐ <strong>${isJa ? '恒久恩恵' : 'PERMANENT BLESSING'}:</strong> ${isJa ? seal.rewardJa : seal.rewardEn}`;
  if (loreEl) loreEl.textContent = `"${isJa ? seal.loreFragmentJa : seal.loreFragmentEn}"`;

  modal.style.display = 'flex';
}

export function closeShrineModal() {
  const modal = document.getElementById('shrine-modal');
  if (modal) modal.style.display = 'none';
  globals.activeShrine = null;
}

export function openHermitPactModal() {
  const hermit = globals.activeHermit;
  if (!hermit) return;
  const modal = document.getElementById('hermit-modal');
  if (!modal) return;

  const isJa = globals.currentLang === 'ja';
  const titleEl = document.getElementById('hermit-modal-title');
  const descEl = document.getElementById('hermit-modal-desc');
  const choice1Btn = document.getElementById('hermit-pact-choice-1');
  const choice2Btn = document.getElementById('hermit-pact-choice-2');

  if (titleEl) titleEl.textContent = isJa ? '世捨て人の深紅の契約' : "THE HERMIT'S CRIMSON PACT";
  if (descEl) descEl.textContent = isJa 
    ? '「生きてこの地を出られると思うな。だが力を求めるなら…血を捧げよ。」' 
    : '"None leave this realm unscathed, ronin. If you crave divine strength... pay in blood."';

  if (hermit.pactType === 'blade') {
    if (choice1Btn) {
      choice1Btn.innerHTML = `<strong>${isJa ? '【血刀の誓い】' : '【Pact of the Bloodblade】'}</strong><br>${isJa ? '最大体力 -1 ハート ➔ 恒久斬撃ダメージ +35%' : 'Sacrifice 1 Max Heart ➔ +35% Slash Damage'}`;
    }
    if (choice2Btn) {
      choice2Btn.innerHTML = `<strong>${isJa ? '【巨刃の瞑想】' : '【Meditation of the Colossus】'}</strong><br>${isJa ? '現在の気力 50% を消費 ➔ 斬撃範囲 +50%' : 'Sacrifice 50% Current Flow ➔ +50% Slash Radius'}`;
    }
  } else if (hermit.pactType === 'speed') {
    if (choice1Btn) {
      choice1Btn.innerHTML = `<strong>${isJa ? '【疾風の生贄】' : '【Pact of the Gale】'}</strong><br>${isJa ? '最大体力 -1 ハート ➔ 瞬歩クールダウン -35% ＆ 移動速度 +25%' : 'Sacrifice 1 Max Heart ➔ -35% Dash Cooldown & +25% Speed'}`;
    }
    if (choice2Btn) {
      choice2Btn.innerHTML = `<strong>${isJa ? '【薄氷の修羅】' : '【Curse of the Glass Asura】'}</strong><br>${isJa ? '気力を全開まで即座に充填' : 'Instant 100% Full Flow Energy'}`;
    }
  } else {
    if (choice1Btn) {
      choice1Btn.innerHTML = `<strong>${isJa ? '【心眼の覚醒】' : "【Pact of the Mind's Eye】"}</strong><br>${isJa ? '最大体力 -1 ハート ➔ 気力蓄積速度 +60%' : 'Sacrifice 1 Max Heart ➔ +60% Flow Generation'}`;
    }
    if (choice2Btn) {
      choice2Btn.innerHTML = `<strong>${isJa ? '【天恵の即時拝領】' : '【Gift of the Ascetic】'}</strong><br>${isJa ? '障壁を解除 ➔ 基礎攻撃力+1 ＆ 抜刀威力+2' : 'Shatter barriers ➔ Base DMG +1 & Iai DMG +2'}`;
    }
  }

  modal.style.display = 'flex';
}

export function closeHermitModal() {
  const modal = document.getElementById('hermit-modal');
  if (modal) modal.style.display = 'none';
}

export function triggerDawnVictory(_stats?: any) {
  globals.gameState = 'gameover';
  const modal = document.getElementById('dawn-victory-screen');
  if (!modal) return;

  const isJa = globals.currentLang === 'ja';
  playSynthesizedSingingBowl();
  playSynthesizedFusionUnlock();

  if (!globals.unlockedSeals.includes(7)) {
    globals.unlockedSeals.push(7);
    try { localStorage.setItem('stickmurai_seals', JSON.stringify(globals.unlockedSeals)); } catch(e) {}
    YOMI_SEALS[7]?.applyPermanentReward();
  }

  // Award Dawn Victory Magatama
  const dawnReward = 500;
  globals.magatama = (globals.magatama || 0) + dawnReward;
  try { localStorage.setItem('stickmurai_magatama', globals.magatama.toString()); } catch(e) {}

  const contentEl = document.getElementById('dawn-victory-stats') || document.getElementById('dawn-stats-content');
  if (contentEl) {
    const min = Math.floor(globals.runTime / 60);
    const sec = Math.floor(globals.runTime % 60);
    const timeStr = `${min}:${sec < 10 ? '0' : ''}${sec}`;

    contentEl.innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid #334155; padding-bottom:6px;">
        <span>${isJa ? '夜明け到達生存時間' : 'Time Survived Until Dawn'}:</span>
        <span style="color:#ffd700; font-weight:bold;">${timeStr} (10:00)</span>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid #334155; padding-bottom:6px;">
        <span>${isJa ? '討伐した敵兵' : 'Enemies Slain'}:</span>
        <span style="color:#38bdf8; font-weight:bold;">${globals.runStats.kills}</span>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid #334155; padding-bottom:6px;">
        <span>${isJa ? '討伐した将軍・幹部' : 'Bosses Succeeded'}:</span>
        <span style="color:#f43f5e; font-weight:bold;">${globals.runStats.bossesKilled}</span>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid #334155; padding-bottom:6px;">
        <span>${isJa ? '黄泉の勾玉獲得' : 'Yomi Magatama Dawn Tribute'}:</span>
        <span style="color:#c084fc; font-weight:bold;">+${dawnReward} 🔮</span>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid #334155; padding-bottom:6px;">
        <span>${isJa ? '解除した黄泉の封印' : 'Yomi Seals Awakened'}:</span>
        <span style="color:#a855f7; font-weight:bold;">${globals.unlockedSeals.length} / 7</span>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom:12px; border-bottom:1px solid #334155; padding-bottom:6px;">
        <span>${isJa ? '開眼した禁断の融合' : 'Active Fusions'}:</span>
        <span style="color:#22c55e; font-weight:bold;">${globals.activeFusions.size}</span>
      </div>
      <div style="font-size:13px; color:#cbd5e1; font-style:italic; line-height:1.5; text-align:center; padding:12px; background:rgba(255,215,0,0.08); border-radius:6px; border:1px solid rgba(255,215,0,0.2);">
        "${isJa 
          ? '「刃は折れず、魂は遂に宵闇を裂いた。朝日が差し込み、黄泉の悪夢は朝露の如く消え去る…」' 
          : '"The blade remains unbroken. With the Supreme Shogun slain, golden sunlight pierces the dark of Yomi. You are finally free."'}
      </div>
    `;
  }

  modal.style.display = 'flex';
}

export function populateAscensionUpgrades() {
  const container = document.getElementById('ascension-upgrade-grid');
  if (!container) return;
  const isJa = globals.currentLang === 'ja';
  container.innerHTML = '';

  const upgrades = globals.campaignUpgrades || {
    slashDamage: 0,
    iaijutsuPower: 0,
    maxLives: 0,
    dashCooldown: 0,
    spiritResonance: 0,
    infiniteSharpness: 0,
    infiniteFlow: 0,
    infiniteFortune: 0,
    infiniteRiposte: 0
  };

  ASCENSION_UPGRADES.forEach(u => {
    const curLevel = (upgrades as any)[u.id] || 0;
    const isEndless = (u as any).isEndless || u.max >= 999;
    const isMax = !isEndless && curLevel >= u.max;
    const cost = isMax ? 0 : u.baseCost + curLevel * u.costMult;
    const canAfford = !isMax && (globals.magatama || 0) >= cost;

    let pips = '';
    if (isEndless) {
      pips = `<span style="color: #fbbf24; font-weight: bold; font-size: 10px;">★ PRESTIGE UNBOUND ★</span>`;
    } else {
      for (let i = 0; i < u.max; i++) {
        pips += i < curLevel ? '● ' : '○ ';
      }
    }

    const card = document.createElement('div');
    card.style.cssText = `
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid ${isMax ? 'rgba(34, 197, 94, 0.4)' : (isEndless ? 'rgba(251, 191, 36, 0.45)' : (canAfford ? 'rgba(255, 215, 0, 0.35)' : 'rgba(255, 255, 255, 0.1)'))};
      border-radius: 8px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      transition: all 0.2s ease;
      box-shadow: ${isEndless ? '0 0 12px rgba(251, 191, 36, 0.1)' : 'none'};
    `;

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-family: 'Shojumaru', cursive; color: ${isMax ? '#4ade80' : (isEndless ? '#fbbf24' : '#ffd700')}; font-size: 13px; display: flex; align-items: center; gap: 4px;">
          <span>${u.icon}</span> ${isJa ? u.nameJa : u.name}
        </span>
        <span style="font-family: 'Orbitron', monospace; font-size: 11px; color: ${isMax ? '#4ade80' : (isEndless ? '#fbbf24' : '#38bdf8')}; font-weight: bold;">
          ${isEndless ? `Rank ${curLevel} (∞)` : (isMax ? 'MAX' : `Lv. ${curLevel}/${u.max}`)}
        </span>
      </div>
      <div style="font-family: monospace; font-size: 10px; color: #a855f7; letter-spacing: 1px;">
        ${pips}
      </div>
      <div style="font-family: 'Outfit', sans-serif; font-size: 11px; color: #cbd5e1; line-height: 1.3;">
        ${isJa ? u.descJa : u.desc}
      </div>
      <div style="margin-top: 4px;">
        ${isMax ? `
          <button class="menu-btn btn-card" disabled style="margin: 0; background: #14532d; border-color: #22c55e; color: #86efac; cursor: default; font-size: 11px; min-height: 32px;">✓ MASTERED</button>
        ` : `
          <button class="menu-btn btn-card buy-ascension-btn" data-upgrade="${u.id}" data-cost="${cost}" ${canAfford ? '' : 'disabled'} style="margin: 0; min-height: 32px; font-size: 11px; border-color: ${canAfford ? (isEndless ? '#fbbf24' : '#ffd700') : '#475569'}; color: ${canAfford ? (isEndless ? '#fbbf24' : '#ffd700') : '#64748b'}; opacity: ${canAfford ? '1' : '0.6'}; box-shadow: ${canAfford ? '0 0 10px rgba(255,215,0,0.2)' : 'none'}; cursor: ${canAfford ? 'pointer' : 'not-allowed'};">
            ${isJa ? `強化: ${cost.toLocaleString()} 🔮` : `UPGRADE: ${cost.toLocaleString()} 🔮`}
          </button>
        `}
      </div>
    `;

    const buyBtn = card.querySelector('.buy-ascension-btn');
    if (buyBtn && canAfford) {
      bindDualListener(buyBtn as HTMLElement, () => {
        if ((globals.magatama || 0) >= cost && (isEndless || curLevel < u.max)) {
          globals.magatama -= cost;
          (globals.campaignUpgrades as any)[u.id] = curLevel + 1;
          try {
            localStorage.setItem('stickmurai_magatama', globals.magatama.toString());
            localStorage.setItem('stickmurai_campaign_upgrades', JSON.stringify(globals.campaignUpgrades));
          } catch(e) {}
          playSynthesizedFusionUnlock();
          const treasuryEl = document.getElementById('stage-clear-magatama');
          if (treasuryEl) treasuryEl.textContent = (globals.magatama || 0).toLocaleString() + ' 🔮';
          populateAscensionUpgrades();
        }
      });
    }

    container.appendChild(card);
  });
}

export function triggerStageClear() {
  globals.gameState = 'paused';
  const levelUpModal = document.getElementById('level-up-screen');
  if (levelUpModal) levelUpModal.style.display = 'none';
  const ultModal = document.getElementById('ult-screen');
  if (ultModal) ultModal.style.display = 'none';
  const modal = document.getElementById('stage-clear-modal');
  if (!modal) return;

  const isJa = globals.currentLang === 'ja';
  playSynthesizedSingingBowl();
  playSynthesizedFusionUnlock();

  const currentStage = globals.currentStage || 1;
  const fortuneMult = globals.playerStats?.fortuneMult || 1.0;
  const baseReward = Math.round(currentStage * 100 * fortuneMult);

  let clearedStages: number[] = globals.clearedStages || [];
  const isFirstClear = !clearedStages.includes(currentStage);
  let stageReward = baseReward;

  if (isFirstClear) {
    stageReward = baseReward * 3;
    clearedStages.push(currentStage);
    globals.clearedStages = clearedStages;
    try { localStorage.setItem('stickmurai_cleared_stages', JSON.stringify(clearedStages)); } catch(e) {}
  }

  // 3-Star Mastery Evaluation
  const isBossStage = currentStage % 5 === 0;
  const parTime = isBossStage ? 90 : 60;
  const star1 = true; // Stage Conquered
  const star2 = globals.runTime <= parTime; // Speed Demon
  const star3 = (globals.runStats?.maxCombo || 0) >= 20; // Combo Master

  const earnedStars = (star1 ? 1 : 0) + (star2 ? 1 : 0) + (star3 ? 1 : 0);
  if (!globals.stageStars) globals.stageStars = {};
  const prevStars = globals.stageStars[currentStage] || 0;

  if (earnedStars > prevStars) {
    globals.stageStars[currentStage] = earnedStars;
    try { localStorage.setItem('stickmurai_stage_stars', JSON.stringify(globals.stageStars)); } catch(e) {}
  }

  // Mastery Bounty: +300 Magatama when achieving 3 stars for the first time
  let masteryBounty = 0;
  if (earnedStars === 3 && prevStars < 3) {
    masteryBounty = 300;
  }

  globals.magatama = (globals.magatama || 0) + stageReward + masteryBounty;
  try { localStorage.setItem('stickmurai_magatama', globals.magatama.toString()); } catch(e) {}

  // Unlock next stage (Endless progression)
  const nextStage = currentStage + 1;
  globals.maxStageUnlocked = Math.max(globals.maxStageUnlocked || 1, nextStage);
  try { localStorage.setItem('stickmurai_max_stage', globals.maxStageUnlocked.toString()); } catch(e) {}

  const titleEl = document.getElementById('stage-clear-title');
  if (titleEl) {
    titleEl.textContent = isJa ? `ステージ ${currentStage} 突破！` : `STAGE ${currentStage} CONQUERED!`;
  }

  const killsEl = document.getElementById('stage-clear-kills');
  if (killsEl) killsEl.textContent = globals.runStats.kills.toString();

  const timeEl = document.getElementById('stage-clear-time');
  if (timeEl) {
    const min = Math.floor(globals.runTime / 60);
    const sec = Math.floor(globals.runTime % 60);
    timeEl.textContent = `${min}:${sec < 10 ? '0' : ''}${sec}`;
  }

  // Render 3-Star Mastery Card Breakdown
  const starReq1 = document.getElementById('star-req-1');
  const starIcon1 = document.getElementById('star-icon-1');
  const starText1 = document.getElementById('star-text-1');
  if (starReq1 && starIcon1 && starText1) {
    starReq1.style.color = '#ffd700';
    starIcon1.textContent = '⭐';
    starText1.textContent = isJa ? '討伐達成 (ステージクリア)' : 'Stage Conquered';
  }

  const starReq2 = document.getElementById('star-req-2');
  const starIcon2 = document.getElementById('star-icon-2');
  const starText2 = document.getElementById('star-text-2');
  if (starReq2 && starIcon2 && starText2) {
    starReq2.style.color = star2 ? '#ffd700' : '#64748b';
    starIcon2.textContent = star2 ? '⭐' : '☆';
    starText2.textContent = isJa
      ? `神速の剣士 (≤${parTime}秒)`
      : `Speed Demon (≤${parTime}s)`;
  }

  const starReq3 = document.getElementById('star-req-3');
  const starIcon3 = document.getElementById('star-icon-3');
  const starText3 = document.getElementById('star-text-3');
  if (starReq3 && starIcon3 && starText3) {
    starReq3.style.color = star3 ? '#ffd700' : '#64748b';
    starIcon3.textContent = star3 ? '⭐' : '☆';
    starText3.textContent = isJa
      ? `連撃の達人 (20+ 連撃)`
      : `Combo Master (20+ Combo)`;
  }

  const bountyBadge = document.getElementById('star-bounty-badge');
  if (bountyBadge) {
    bountyBadge.style.display = masteryBounty > 0 ? 'inline-block' : 'none';
    if (masteryBounty > 0) {
      bountyBadge.textContent = isJa ? '✨ +300 🔮 完全制覇ボーナス！' : '✨ +300 🔮 MASTERY BOUNTY!';
    }
  }

  const rewardEl = document.getElementById('stage-clear-reward');
  if (rewardEl) {
    let rewardText = `+${stageReward.toLocaleString()} 🔮`;
    if (isFirstClear) {
      rewardText = `<span style="color: #ffd700; font-size: 11px; margin-right: 4px;">[FIRST CLEAR 3×]</span> ` + rewardText;
    }
    if (masteryBounty > 0) {
      rewardText += ` <span style="color: #fbbf24; font-size: 11px; margin-left: 4px;">(+300 ⭐⭐⭐)</span>`;
    }
    rewardEl.innerHTML = rewardText;
  }

  const magEl = document.getElementById('stage-clear-magatama');
  if (magEl) magEl.textContent = (globals.magatama || 0).toLocaleString() + ' 🔮';

  const nextBtn = document.getElementById('stage-clear-next-btn');
  if (nextBtn) {
    nextBtn.textContent = isJa ? `⚔️ ステージ ${currentStage + 1} へ進む` : `⚔️ ADVANCE TO STAGE ${currentStage + 1}`;
  }

  populateAscensionUpgrades();
  modal.style.display = 'flex';
}

callbacks.openShrineCommuneModal = openShrineCommuneModal;
callbacks.openHermitPactModal = openHermitPactModal;
callbacks.triggerDawnVictory = triggerDawnVictory;
callbacks.triggerStageClear = triggerStageClear;
