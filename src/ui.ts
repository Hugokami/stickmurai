import { heroBalance, heroDescription, heroAwakeningSkill } from './balance';
import { heroComparison, renderStageBriefing, permanentPreview } from './progressionQol';
import { renderCodex } from './codex';
import { completeJourneyStage, masteryBadge } from './journey';
import { requestResume, handleBack, clearGameInputs, showToast } from './qol';
import { globals, getStageAffix, getAscendantRank, getStageMonReward } from './globals';
import { safeStorage } from './storage';
import { i18n, skillsData, preloadStageEnemyAssets, loadHeroAssets, resolveAssetUrl } from './assets';
import { bgmAudio, pauseBgm, triggerBgmGestureUnlock } from './audio';
import { callbacks } from './callbacks';
import { pvpManager } from './pvpIaijutsuManager';
import { AdManager } from './adManager';
import { FUSION_RECIPES, openShop, closeShop, triggerSpecificUltimate } from './powerups';
import { YOMI_SEALS } from './shrine';
import { playSynthesizedFusionUnlock, playSynthesizedSingingBowl, playSynthesizedSealShatter, playSynthesizedTempleBell, playShrineBlessing, playStageConquered, triggerHapticFeedback } from './audio';
import { FloatingText, Shockwave } from './entities';
import { updateFullscreenUI } from './fullscreen';
import { startPractice, startTutorial, isPractice, isTutorialActive } from './runtimeQol';


const t = (key: string): string => i18n[globals.currentLang]?.[key] || key;

// DOM cache
let enhanceCooldownOverlay: HTMLElement | null = null;
let enhanceCooldownText: HTMLElement | null = null;
let dashCooldownOverlay: HTMLElement | null = null;
let dashCooldownText: HTMLElement | null = null;
let attackCooldownOverlay: HTMLElement | null = null;
let ultCooldownOverlay: HTMLElement | null = null;
let ultCooldownText: HTMLElement | null = null;
let flowMeterFill: HTMLElement | null = null;
let flowMeterContainer: HTMLElement | null = null;
let expMeterFill: HTMLElement | null = null;
let scoreDisplay: HTMLElement | null = null;
let comboDisplay: HTMLElement | null = null;
let heartsElements: NodeListOf<Element> | null = null;

let lastEnhanceOverlayHeight = -1;
let lastEnhanceTextContent = '';
let lastDashOverlayHeight = -1;
let lastDashTextContent = '';
let lastAttackOverlayHeight = -1;
let lastUltOverlayHeight = -1;
let lastUltTextContent = '';
let lastLives = 5;
let lastGhostHeartActive = false;

// Additional DOM element caches to prevent querySelector / getElementById thrashing
let btnEnhanceElement: HTMLElement | null = null;
let btnDashElement: HTMLElement | null = null;
let objectiveDisplayElement: HTMLElement | null = null;
let bountyDisplayElement: HTMLElement | null = null;
let levelDisplayElement: HTMLElement | null = null;
let lastRenderedLevel = -1;

let lastFlowWidth = -1;
let lastExpWidth = -1;
let lastMaxFlowClass = false;
let lastObjectiveDisplay = '';
let lastObjectiveText = '';
let lastBountyDisplay = '';
let lastBountyText = '';
let lastBtnUltReady = false;
let lastBtnDashReady = false;
let lastBtnEnhanceReady = false;
let lastBtnEnhanceBuff = false;
let lastRenderedMagatama = -1;
let lastStageCurrency = -1;
let hudMagatamaElement: HTMLElement | null = null;
let stageCurrencyElement: HTMLElement | null = null;
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

export interface AscensionUpgrade {
  id: string;
  name: string;
  nameJa: string;
  icon: string;
  max: number;
  desc: string;
  descJa: string;
  baseCost: number;
  costMult: number;
  isEndless?: boolean;
}

export const ASCENSION_UPGRADES: AscensionUpgrade[] = [
  {
    id: 'slashDamage',
    name: 'Katana Sharpness',
    nameJa: '刃の研鑽',
    icon: 'icons/rpg/fc1170.png',
    max: 10,
    desc: '• +0.5 Flat DMG • +1% ATK per level',
    descJa: '• 基礎斬撃+0.5 • +1% ATK per level',
    baseCost: 800,
    costMult: 800,
  },
  {
    id: 'dashCooldown',
    name: 'Phantom Stride',
    nameJa: '瞬歩・神速',
    icon: 'icons/rpg/fc888.png',
    max: 5,
    desc: '• -0.08s Dash CD per level (0.4s min)',
    descJa: '• ダッシュCD -0.08秒/Lv (最低0.4秒)',
    baseCost: 2000,
    costMult: 2000,
  },
  {
    id: 'ultimateDamage',
    name: 'Heavenly Cataclysm',
    nameJa: '天変地異',
    icon: 'icons/rpg/fc1267.png',
    max: 10,
    desc: '• +10% Ultimate DMG per level',
    descJa: '• 奥義ダメージ +10%/Lv',
    baseCost: 1600,
    costMult: 1200,
  },
  {
    id: 'counterSiphon',
    name: 'Blood Riposte',
    nameJa: '血の返礼',
    icon: 'icons/rpg/fc1220.png',
    max: 5,
    desc: '• Parry/Mikiri: +5% HP & +15 Flow',
    descJa: '• パリィ/見切り: HP+5% & 気力+15',
    baseCost: 2000,
    costMult: 1600,
  },
  {
    id: 'critMastery',
    name: 'Deathstrike Sutra',
    nameJa: '必殺の教条',
    icon: 'icons/rpg/fc1228.png',
    max: 5,
    desc: '• +10% Crit Chance • 2.2x Crit DMG • Stagger',
    descJa: '• 会心率+10%/Lv • 会心2.2倍 • 小怯み',
    baseCost: 2400,
    costMult: 2000,
  },
  // Infinite / Paragon Upgrades (Endless Bushido Progression)
  {
    id: 'infiniteSharpness',
    name: 'Endless Edge',
    nameJa: '無限の真剣',
    icon: 'icons/rpg/fc1132.png',
    max: 999,
    isEndless: true,
    desc: '• +0.2 Flat DMG • +0.5% ATK per rank',
    descJa: '• 基礎斬撃+0.2 • +0.5% ATK per rank',
    baseCost: 400,
    costMult: 150,
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
    { title: 'PURGATORY WASTES', titleJa: '煉獄の荒野', desc: `Target: ${Math.min(90, 35 + stage * 4)} Kills // Vanguard Rogues & Elites` },
    { title: 'OBSIDIAN CITADEL', titleJa: '黒曜石の居城', desc: `Target: ${Math.min(90, 35 + stage * 4)} Kills // Chaos Musketeers & Brutes` },
    { title: 'BLOOD CHASM', titleJa: '血の裂け目', desc: `Target: ${Math.min(90, 35 + stage * 4)} Kills // Barrel Bombers & Pyromancers` },
    { title: 'THRONE OF PHANTOMS', titleJa: '幻影の玉座', desc: `Target: ${Math.min(90, 35 + stage * 4)} Kills // Necromancers & High Guard` }
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

  if (descEl) renderStageBriefing(current, descEl);

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
    // Preserve event bubbling so Poki SDK interaction listeners on window/document detect player gesture
    triggerBgmGestureUnlock();
    const now = Date.now();
    if (now - lastTriggerTime < 250) return;
    lastTriggerTime = now;
    handler(e);
  };
  el.addEventListener('pointerdown', safeHandler);
  el.addEventListener('pointerup', () => triggerBgmGestureUnlock(), { passive: true });
  el.addEventListener('click', safeHandler);
  el.addEventListener('touchstart', safeHandler, { passive: true });
  el.addEventListener('touchend', () => triggerBgmGestureUnlock(), { passive: true });
}

export function initUI(onPlayCallback: () => void, onZenPlayCallback: () => void, onRestartCallback: () => void) {
  // DOM queries
  enhanceCooldownOverlay = document.getElementById('enhance-cooldown-overlay');
  enhanceCooldownText = document.getElementById('enhance-cooldown-text');
  dashCooldownOverlay = document.getElementById('dash-cooldown-overlay');
  dashCooldownText = document.getElementById('dash-cooldown-text');
  attackCooldownOverlay = document.getElementById('attack-cooldown-overlay');
  ultCooldownOverlay = document.getElementById('ult-cooldown-overlay');
  ultCooldownText = document.getElementById('ult-cooldown-text');
  
  flowMeterFill = document.getElementById('flow-meter-fill');
  flowMeterContainer = document.getElementById('flow-meter-container');
  expMeterFill = document.getElementById('exp-meter-fill');
  scoreDisplay = document.getElementById('score-display');
  comboDisplay = document.getElementById('combo-display');
  heartsElements = document.querySelectorAll('.heart');
  btnEnhanceElement = document.getElementById('btn-enhance');
  btnDashElement = document.getElementById('btn-dash');
  objectiveDisplayElement = document.getElementById('objective-display');
  bountyDisplayElement = document.getElementById('bounty-display');
  levelDisplayElement = document.getElementById('level-display');

  const mainMenu = document.getElementById('main-menu');
  const settingsScreen = document.getElementById('settings-screen');
  const skillSelectScreen = document.getElementById('skill-select-screen');
  const pauseScreen = document.getElementById('pause-screen');
  cachedOnPlayCallback = onPlayCallback;
  const uiLayer = document.getElementById('ui-layer');
  const mobileControls = document.getElementById('mobile-controls');
  if (uiLayer) uiLayer.style.display = 'none';
  if (mobileControls) mobileControls.style.display = 'none';
  const bgmVolumeSlider = document.getElementById('bgm-volume') as HTMLInputElement | null;

  // menu listeners
  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    bindDualListener(startBtn, () => {
      if (mainMenu) mainMenu.style.display = 'none';
      globals.gameMode = 'classic';
      globals.difficulty = 'normal';
      globals.timerLimit = 'endless';
      // Default to the current highest stage reached
      globals.currentStage = Math.max(1, globals.maxStageUnlocked || 1);
      if (skillSelectScreen) skillSelectScreen.style.display = 'flex';
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
        safeStorage.setItem('stickmurai_current_stage', globals.currentStage.toString());
        updateStageSelectionUI();
      }
    });
  }

  const nextStageBtn = document.getElementById('stage-next-btn');
  if (nextStageBtn) {
    bindDualListener(nextStageBtn, () => {
      if ((globals.currentStage || 1) < (globals.maxStageUnlocked || 1)) {
        globals.currentStage++;
        safeStorage.setItem('stickmurai_current_stage', globals.currentStage.toString());
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
      safeStorage.setItem('stickmurai_current_stage', globals.currentStage.toString());
      safeStorage.setItem('stickmurai_max_stage', globals.maxStageUnlocked.toString());
      // Reset blessings and bounties once stage advances so new stage can be rewarded
      globals.stageBlessings.swift_strike = { unlocked: false, active: false };
      globals.stageBlessings.fortune = { unlocked: false, active: false };
      globals.stageDoubleRewardClaimed = false;
      globals.stageFortuneMult = 1.0;
      globals.activeBlessing = null;
      updateBlessingSelectionUI();
      globals.runTime = 0;
      globals.dayNightPhase = 'dawn';
      globals.calamityEvent = 'none';
      globals.calamityTimer = 0;
      globals.flow = 0;
      globals.flowState = 'normal';
      globals.ultCooldown = 0;
      globals.enhanceActiveTimer = 0;
      globals.enhanceCooldown = 0;
      globals.zenFieldActiveTimer = 0;
      globals.zenFieldTickTimer = 0;
      globals.roninResolveCooldown = 0;
      AdManager.showMidrollAd(() => {
        if (cachedOnPlayCallback) cachedOnPlayCallback();
      });
    });
  }

  if (stageClearReplayBtn) {
    bindDualListener(stageClearReplayBtn, () => {
      if (stageClearModal) stageClearModal.style.display = 'none';
      globals.runTime = 0;
      globals.dayNightPhase = 'dawn';
      globals.calamityEvent = 'none';
      globals.calamityTimer = 0;
      globals.flow = 0;
      globals.flowState = 'normal';
      globals.ultCooldown = 0;
      globals.enhanceActiveTimer = 0;
      globals.enhanceCooldown = 0;
      globals.zenFieldActiveTimer = 0;
      globals.zenFieldTickTimer = 0;
      globals.roninResolveCooldown = 0;
      AdManager.showMidrollAd(() => {
        if (cachedOnPlayCallback) cachedOnPlayCallback();
      });
    });
  }

  if (stageClearMenuBtn) {
    bindDualListener(stageClearMenuBtn, () => {
      if (stageClearModal) stageClearModal.style.display = 'none';
      callbacks.onQuitToMainMenu?.();
      globals.gameState = 'mainmenu';
      if (mainMenu) mainMenu.style.display = 'flex';
      if (uiLayer) uiLayer.style.display = 'none';
      if (mobileControls) mobileControls.style.display = 'none';
      pauseBgm();
    });
  }

  const stageClearXBtn = document.getElementById('close-stage-clear-x-btn');
  if (stageClearXBtn) {
    bindDualListener(stageClearXBtn, () => {
      if (stageClearModal) stageClearModal.style.display = 'none';
      callbacks.onQuitToMainMenu?.();
      globals.gameState = 'mainmenu';
      if (mainMenu) mainMenu.style.display = 'flex';
      if (uiLayer) uiLayer.style.display = 'none';
      if (mobileControls) mobileControls.style.display = 'none';
      pauseBgm();
    });
  }

  const lvlModeBtn = document.getElementById('level-mode-btn');
  if (lvlModeBtn) {
    lvlModeBtn.addEventListener('click', () => {
      if (mainMenu) mainMenu.style.display = 'none';
      globals.gameMode = 'level';
      if (skillSelectScreen) skillSelectScreen.style.display = 'flex';
      globals.activeBlessing = null;
      updateBlessingSelectionUI();
      renderSkillChoicesPregame();
    });
  }

  const zenBtn = document.getElementById('zen-btn');
  if (zenBtn) {
    zenBtn.addEventListener('click', () => {
      if (mainMenu) mainMenu.style.display = 'none';
      globals.gameMode = 'zen';
      if (skillSelectScreen) skillSelectScreen.style.display = 'flex';
      globals.activeBlessing = null;
      updateBlessingSelectionUI();
      renderSkillChoicesPregame();
    });
  }

  bindDualListener(document.getElementById('skill-back-btn'), () => {
    if (skillSelectScreen) skillSelectScreen.style.display = 'none';
    if (mainMenu) mainMenu.style.display = 'flex';
    globals.activeBlessing = null;
    updateBlessingSelectionUI();
  });

  const tutorialModal = document.getElementById('first-start-tutorial-modal');
  const tutorialStartBtn = document.getElementById('tutorial-start-game-btn');
  const tutorialSkipBtn = document.getElementById('tutorial-skip-btn');
  const tutorialGuidedBtn = document.getElementById('tutorial-guided-btn');
  const pauseTutorialBtn = document.getElementById('pause-tutorial-btn');

  const showTutorialModal = (onDone?: () => void, isReplay = false) => {
    if (!tutorialModal) {
      if (onDone) onDone();
      return;
    }
    if (tutorialStartBtn) {
      tutorialStartBtn.innerText = isReplay ? 'RETURN' : '⚔️ ENTER BATTLEFIELD';
    }
    if (tutorialSkipBtn) {
      tutorialSkipBtn.style.display = isReplay ? 'none' : 'inline-block';
    }
    tutorialModal.style.display = 'flex';

    const handleDismiss = () => {
      triggerBgmGestureUnlock();
      safeStorage.setItem('stickmurai_tutorial_completed', 'true');
      safeStorage.setItem('muramasa_tutorial_v2', 'skipped');
      tutorialModal.style.display = 'none';
      if (tutorialStartBtn) tutorialStartBtn.onclick = null;
      if (tutorialSkipBtn) tutorialSkipBtn.onclick = null;
      if (tutorialGuidedBtn) tutorialGuidedBtn.onclick = null;
      if (onDone) onDone();
    };

    const handleGuided = () => {
      triggerBgmGestureUnlock();
      tutorialModal.style.display = 'none';
      if (tutorialStartBtn) tutorialStartBtn.onclick = null;
      if (tutorialSkipBtn) tutorialSkipBtn.onclick = null;
      if (tutorialGuidedBtn) tutorialGuidedBtn.onclick = null;
      if (mainMenu) mainMenu.style.display = 'none';
      if (skillSelectScreen) skillSelectScreen.style.display = 'none';
      startTutorial(globals.selectedHero || 'default');
    };

    if (tutorialStartBtn) tutorialStartBtn.onclick = handleDismiss;
    if (tutorialSkipBtn) tutorialSkipBtn.onclick = handleDismiss;
    if (tutorialGuidedBtn) tutorialGuidedBtn.onclick = handleGuided;
  };

  if (pauseTutorialBtn) {
    bindDualListener(pauseTutorialBtn, () => {
      if (pauseScreen) pauseScreen.style.display = 'none';
      showTutorialModal(() => {
        if (pauseScreen) pauseScreen.style.display = 'flex';
      }, true);
    });
  }

  bindDualListener(document.getElementById('start-run-btn'), () => {
    if (skillSelectScreen) skillSelectScreen.style.display = 'none';
    loadHeroAssets(globals.selectedHero || 'default');
    preloadStageEnemyAssets(globals.currentStage || 1);
    const proceedWithStart = () => {
      if (globals.gameMode === 'zen') {
        onZenPlayCallback();
      } else {
        onPlayCallback();
      }
    };
    if (safeStorage.getItem('stickmurai_tutorial_completed') !== 'true') {
      showTutorialModal(proceedWithStart, false);
    } else {
      proceedWithStart();
    }
  });

  bindDualListener(document.getElementById('open-settings-btn'), () => {
    if (settingsScreen) settingsScreen.style.display = 'flex';
  });

  bindDualListener(document.getElementById('close-settings-btn'), () => {
    if (settingsScreen) settingsScreen.style.display = 'none';
    if (globals.gameState === 'paused' && pauseScreen) {
      pauseScreen.style.display = 'flex';
    }
  });

  const guideModal = document.getElementById('guide-modal');
  bindDualListener(document.getElementById('open-guide-btn'), () => {
    if (guideModal) guideModal.style.display = 'flex';
  });

  const closeGuideModal = () => {
    if (guideModal) guideModal.style.display = 'none';
  };
  bindDualListener(document.getElementById('close-guide-btn'), closeGuideModal);
  bindDualListener(document.getElementById('close-guide-btn-bottom'), closeGuideModal);

  // Codex category filter tabs
  const codexTabBtns = document.querySelectorAll<HTMLButtonElement>('.codex-tab-btn');
  const codexCards = document.querySelectorAll<HTMLElement>('#codex-cards-container .guide-card');
  codexTabBtns.forEach(btn => {
    bindDualListener(btn, () => {
      const targetTab = btn.getAttribute('data-tab') || 'all';
      codexTabBtns.forEach(b => {
        b.classList.toggle('active', b === btn);
        if (b === btn) {
          b.style.background = 'rgba(56, 189, 248, 0.25)';
          b.style.borderColor = '#38bdf8';
          b.style.color = '#38bdf8';
          b.style.fontWeight = 'bold';
        } else {
          b.style.background = 'rgba(0,0,0,0.4)';
          b.style.borderColor = 'rgba(255,255,255,0.15)';
          b.style.color = '#cbd5e1';
          b.style.fontWeight = 'normal';
        }
      });
      codexCards.forEach(card => {
        const section = card.getAttribute('data-section');
        if (targetTab === 'all' || section === targetTab) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  bindDualListener(document.getElementById('pause-settings-btn'), () => {
    if (pauseScreen) pauseScreen.style.display = 'none';
    if (settingsScreen) settingsScreen.style.display = 'flex';
  });

  bindDualListener(document.getElementById('quit-btn'), () => {
    if (pauseScreen) pauseScreen.style.display = 'none';
    document.getElementById('qol-practice-bar')?.remove();
    document.getElementById('qol-practice-dummy')?.remove();
    if (globals.gameMode === 'pvp') {
      pvpManager.disconnect();
    } else {
      callbacks.onQuitToMainMenu?.();
      globals.gameState = 'mainmenu';
      if (mainMenu) mainMenu.style.display = 'flex';
      if (uiLayer) uiLayer.style.display = 'none';
      if (mobileControls) mobileControls.style.display = 'none';
      pauseBgm();
    }
  });

  const gameOverQuitBtn = document.getElementById('game-over-quit-btn');
  if (gameOverQuitBtn) {
    bindDualListener(gameOverQuitBtn, () => {
      const gameOverEl = document.getElementById('game-over');
      if (gameOverEl) gameOverEl.style.display = 'none';
      document.getElementById('qol-practice-bar')?.remove();
      document.getElementById('qol-practice-dummy')?.remove();
      if (globals.gameMode === 'pvp') {
        pvpManager.disconnect();
      } else {
        callbacks.onQuitToMainMenu?.();
        globals.gameState = 'mainmenu';
        if (mainMenu) mainMenu.style.display = 'flex';
        if (uiLayer) uiLayer.style.display = 'none';
        if (mobileControls) mobileControls.style.display = 'none';
        pauseBgm();
      }
    });
  }

  if (bgmVolumeSlider) {
    bgmVolumeSlider.addEventListener('input', (e) => {
      const vol = parseFloat((e.target as HTMLInputElement).value);
      if (bgmAudio) bgmAudio.volume = vol;
    });
  }

  bindDualListener(document.getElementById('restart-btn'), () => {
    AdManager.showMidrollAd(() => {
      if (onRestartCallback) onRestartCallback();
    });
  });

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

  const dojoPracticeBtn = document.getElementById('dojo-practice-spar-btn');
  const dojoGuidedBtn = document.getElementById('dojo-guided-tutorial-btn');
  if (dojoPracticeBtn) {
    bindDualListener(dojoPracticeBtn, () => {
      closeDojo();
      if (mainMenu) mainMenu.style.display = 'none';
      startPractice(globals.selectedHero || 'default');
    });
  }
  if (dojoGuidedBtn) {
    bindDualListener(dojoGuidedBtn, () => {
      closeDojo();
      if (mainMenu) mainMenu.style.display = 'none';
      startTutorial(globals.selectedHero || 'default');
    });
  }

  // Upgrades Modal Listeners (Main Menu & Title Screen)
  const upgradesModal = document.getElementById('upgrades-modal');
  const openUpgradesBtn = document.getElementById('open-upgrades-btn');
  const closeUpgradesBtn = document.getElementById('close-upgrades-btn');
  const closeUpgradesXBtn = document.getElementById('close-upgrades-x-btn');

  const openUpgrades = () => {
    if (upgradesModal) {
      upgradesModal.style.display = 'flex';
      const treasuryEl = document.getElementById('menu-upgrades-magatama-count');
      if (treasuryEl) treasuryEl.textContent = (globals.magatama || 0).toLocaleString();
      populateAscensionUpgrades();
    }
  };

  const closeUpgrades = () => {
    if (upgradesModal) upgradesModal.style.display = 'none';
  };

  bindDualListener(openUpgradesBtn, openUpgrades);
  bindDualListener(document.getElementById('shop-btn'), openShop);
  bindDualListener(document.getElementById('btn-ult-shadow'), () => triggerSpecificUltimate('shadow'));
  bindDualListener(document.getElementById('btn-ult-omni'), () => triggerSpecificUltimate(globals.gameMode === 'zen' ? 'zen' : 'omni'));
  bindDualListener(document.getElementById('btn-ult-storm'), () => triggerSpecificUltimate('storm'));
  bindDualListener(closeUpgradesBtn, closeUpgrades);
  bindDualListener(closeUpgradesXBtn, closeUpgrades);

  // Secret Redeem Code Modal Listeners
  const redeemModal = document.getElementById('redeem-modal');
  const openRedeemSettingsBtn = document.getElementById('open-redeem-settings-btn');
  const openRedeemDojoBtn = document.getElementById('open-redeem-dojo-btn');
  const closeRedeemXBtn = document.getElementById('close-redeem-x-btn');
  const redeemCancelBtn = document.getElementById('redeem-cancel-btn');
  const redeemSubmitBtn = document.getElementById('redeem-submit-btn');
  const redeemInput = document.getElementById('redeem-input') as HTMLInputElement | null;
  const redeemStatus = document.getElementById('redeem-status-msg');

  const openRedeemModal = () => {
    if (redeemModal) {
      redeemModal.style.display = 'flex';
      if (redeemStatus) {
        redeemStatus.textContent = '';
        redeemStatus.style.color = '';
      }
      if (redeemInput) {
        redeemInput.value = '';
        setTimeout(() => redeemInput.focus(), 80);
      }
    }
  };

  const closeRedeemModal = () => {
    if (redeemModal) redeemModal.style.display = 'none';
  };

  bindDualListener(openRedeemSettingsBtn, openRedeemModal);
  bindDualListener(openRedeemDojoBtn, openRedeemModal);
  bindDualListener(closeRedeemXBtn, closeRedeemModal);
  bindDualListener(redeemCancelBtn, closeRedeemModal);
  bindDualListener(redeemSubmitBtn, () => processRedeemCode());

  if (redeemInput) {
    redeemInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        processRedeemCode();
      }
    });
  }

  // Shrine & Hermit Modal Listeners
  const onShatterSeal = () => {
    if (globals.activeShrine) {
      const sealId = globals.activeShrine.sealId;
      if (!globals.unlockedSeals.includes(sealId)) {
        globals.unlockedSeals.push(sealId);
        safeStorage.setItem('stickmurai_seals', JSON.stringify(globals.unlockedSeals));
        // Award Magatama for breaking seal
        const sealReward = 200;
        globals.magatama = (globals.magatama || 0) + sealReward;
        safeStorage.setItem('stickmurai_magatama', globals.magatama.toString());
        YOMI_SEALS[sealId]?.applyPermanentReward();
        playSynthesizedSealShatter();
        globals.screenShake = Math.max(globals.screenShake, 42);
        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 100, globals.currentLang === 'ja' ? `⛩️ 封印砕散！ +${sealReward} 🪙` : `⛩️ SEAL SHATTERED! +${sealReward} 🪙`, '#ffd700', 34));
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
  const closeShrineXBtn = document.getElementById('close-shrine-x-btn');
  bindDualListener(shrineClaimBtn, onShatterSeal);
  bindDualListener(shrineCommuneBtn, onShatterSeal);
  bindDualListener(shrineLeaveBtn, closeShrineModal);
  bindDualListener(closeShrineXBtn, closeShrineModal);

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
          globals.playerStats.slashBonusDmgPct = (globals.playerStats.slashBonusDmgPct || 0) + 0.05;
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
        globals.playerStats.slashBonusDmgPct = (globals.playerStats.slashBonusDmgPct || 0) + 0.03;
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
    callbacks.onQuitToMainMenu?.();
    globals.gameState = 'mainmenu';
    if (mainMenu) mainMenu.style.display = 'flex';
    if (uiLayer) uiLayer.style.display = 'none';
    if (mobileControls) mobileControls.style.display = 'none';
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
          showToast(globals.currentLang === 'ja' ? '広告の準備ができていません。後ほどお試しください。' : 'Ad not available right now. Please try again later.');
        }
      });
    });
  }

  // Pre-Game Stance Blessing Click Listeners
  const swiftBtn = document.getElementById('blessing-swift-btn');
  if (swiftBtn) {
    swiftBtn.addEventListener('click', () => {
      // If already unlocked for current stage, toggle active without re-watching ad!
      if (globals.stageBlessings?.swift_strike?.unlocked) {
        globals.stageBlessings.swift_strike.active = !globals.stageBlessings.swift_strike.active;
        globals.activeBlessing = globals.stageBlessings.swift_strike.active 
          ? (globals.stageBlessings.fortune.active ? 'both' : 'swift_strike')
          : (globals.stageBlessings.fortune.active ? 'fortune' : null);
        updateBlessingSelectionUI();
        try { playShrineBlessing(); } catch(e) {}
        return;
      }
      
      AdManager.showRewardedAd('blessing-swift', {
        onComplete: () => {
          globals.stageBlessings.swift_strike.unlocked = true;
          globals.stageBlessings.swift_strike.active = true;
          globals.activeBlessing = globals.stageBlessings.fortune.active ? 'both' : 'swift_strike';
          updateBlessingSelectionUI();
          try { playShrineBlessing(); } catch(e) {}
          showToast(globals.currentLang === 'ja' ? '⚡ 神速の構えが解放されました！' : '⚡ Swift Strike Stance Unlocked!');
        },
        onFailed: (err) => {
          console.warn("[AdManager] Blessing ad failed:", err);
          showToast(globals.currentLang === 'ja' ? '広告の準備ができていません。後ほどお試しください。' : 'Ad not available right now. Please try again later.');
          updateBlessingSelectionUI();
        }
      });
    });
  }

  const fortuneBtn = document.getElementById('blessing-fortune-btn');
  if (fortuneBtn) {
    fortuneBtn.addEventListener('click', () => {
      // If already unlocked for current stage, toggle active without re-watching ad!
      if (globals.stageBlessings?.fortune?.unlocked) {
        globals.stageBlessings.fortune.active = !globals.stageBlessings.fortune.active;
        globals.activeBlessing = globals.stageBlessings.fortune.active 
          ? (globals.stageBlessings.swift_strike.active ? 'both' : 'fortune')
          : (globals.stageBlessings.swift_strike.active ? 'swift_strike' : null);
        updateBlessingSelectionUI();
        try { playShrineBlessing(); } catch(e) {}
        return;
      }
      
      AdManager.showRewardedAd('blessing-fortune', {
        onComplete: () => {
          globals.stageBlessings.fortune.unlocked = true;
          globals.stageBlessings.fortune.active = true;
          globals.activeBlessing = globals.stageBlessings.swift_strike.active ? 'both' : 'fortune';
          updateBlessingSelectionUI();
          try { playSynthesizedSingingBowl(); } catch(e) {}
          showToast(globals.currentLang === 'ja' ? '🪙 招福の加護が解放されました！' : '🪙 Fortune Blessing Unlocked!');
        },
        onFailed: (err) => {
          console.warn("[AdManager] Blessing ad failed:", err);
          showToast(globals.currentLang === 'ja' ? '広告の準備ができていません。後ほどお試しください。' : 'Ad not available right now. Please try again later.');
          updateBlessingSelectionUI();
        }
      });
    });
  }

  bindDualListener(document.getElementById('pause-btn'), () => {
    if (globals.gameMode === 'pvp') return; // Disable pausing in PvP
    if (globals.gameState === 'playing') {
      clearGameInputs();
      globals.gameState = 'paused';
      AdManager.gameplayStop();
      if (pauseScreen) pauseScreen.style.display = 'flex';
      updatePauseUpgradesList();
    } else if (globals.gameState === 'paused') {
      requestResume();
    }
  });

  bindDualListener(document.getElementById('resume-btn'), () => {
    if (globals.gameState === 'paused') {
      requestResume();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'b' || e.key === 'B') {
      if (globals.gameState === 'playing') {
        openShop();
        return;
      } else if (globals.shopOpen) {
        closeShop();
        return;
      }
    }
    if (e.key === 'Escape' && globals.shopOpen) {
      closeShop();
      return;
    }
    if (e.key === 'Escape' && handleBack(e)) return;
    if (e.key === 'Escape') {
      const guideModal = document.getElementById('guide-modal');
      if (guideModal && guideModal.style.display === 'flex') {
        guideModal.style.display = 'none';
        return;
      }
    }
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P' || (e.code === 'Space' && globals.gameState === 'paused')) {
      if (globals.gameMode === 'pvp') return; // Disable pausing in PvP
      if (globals.gameState === 'playing') {
        clearGameInputs();
        globals.gameState = 'paused';
        AdManager.gameplayStop();
        if (pauseScreen) pauseScreen.style.display = 'flex';
        updatePauseUpgradesList();
      } else if (globals.gameState === 'paused') {
        requestResume();
      }
    }
  });

  // settings listeners
  const langSelect = document.getElementById('language-select') as HTMLSelectElement;
  if (langSelect) {
    langSelect.value = globals.currentLang;
    langSelect.addEventListener('change', (e) => {
      globals.currentLang = (e.target as HTMLSelectElement).value;
      safeStorage.setItem('lang', globals.currentLang);
      updateStaticText();
    });
  }

  const graphicsSelect = document.getElementById('graphics-select') as HTMLSelectElement;
  if (graphicsSelect) {
    graphicsSelect.value = globals.graphicsSettings;
    graphicsSelect.addEventListener('change', (e) => {
      globals.graphicsSettings = (e.target as HTMLSelectElement).value;
      safeStorage.setItem('graphics', globals.graphicsSettings);
      
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
      safeStorage.setItem('screenShake', globals.screenShakeEnabled);
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
      safeStorage.setItem('screenFlash', globals.screenFlashEnabled);
      updateOverlayDisplays();
    });
  }

  const weatherEffectsSelect = document.getElementById('weather-effects-select') as HTMLSelectElement;
  if (weatherEffectsSelect) {
    weatherEffectsSelect.value = globals.weatherEffectsEnabled;
    weatherEffectsSelect.addEventListener('change', (e) => {
      globals.weatherEffectsEnabled = (e.target as HTMLSelectElement).value as 'on' | 'off';
      safeStorage.setItem('weatherEffects', globals.weatherEffectsEnabled);
    });
  }

  const speedLinesSelect = document.getElementById('speed-lines-select') as HTMLSelectElement;
  if (speedLinesSelect) {
    speedLinesSelect.value = globals.speedLinesEnabled;
    speedLinesSelect.addEventListener('change', (e) => {
      globals.speedLinesEnabled = (e.target as HTMLSelectElement).value as 'on' | 'off';
      safeStorage.setItem('speedLines', globals.speedLinesEnabled);
      updateOverlayDisplays();
    });
  }

  const floatingTextSelect = document.getElementById('floating-text-select') as HTMLSelectElement;
  if (floatingTextSelect) {
    floatingTextSelect.value = globals.floatingTextEnabled;
    floatingTextSelect.addEventListener('change', (e) => {
      globals.floatingTextEnabled = (e.target as HTMLSelectElement).value as 'on' | 'off';
      safeStorage.setItem('floatingText', globals.floatingTextEnabled);
    });
  }

  const groundScarsSelect = document.getElementById('ground-scars-select') as HTMLSelectElement;
    if (groundScarsSelect) {
      groundScarsSelect.value = globals.groundScarsEnabled;
      groundScarsSelect.addEventListener('change', (e) => {
        globals.groundScarsEnabled = (e.target as HTMLSelectElement).value as 'on' | 'off';
        safeStorage.setItem('groundScars', globals.groundScarsEnabled);
      });
    }

    const cameraZoomSelect = document.getElementById('camera-zoom-select') as HTMLSelectElement;
    if (cameraZoomSelect) {
      cameraZoomSelect.value = String(globals.cameraZoomLevel);
      cameraZoomSelect.addEventListener('change', (e) => {
        globals.cameraZoomLevel = parseInt((e.target as HTMLSelectElement).value, 10) as 1 | 2 | 3;
        safeStorage.setItem('cameraZoom', String(globals.cameraZoomLevel));
        // Re-trigger layout sizing
        const resizeEvent = new Event('resize');
        window.dispatchEvent(resizeEvent);
        updateUI();
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
      safeStorage.setItem('difficulty', 'easy');
      updatePregameDifficultyUI();
    });
    diffNormalBtn.addEventListener('click', () => {
      globals.difficulty = 'normal';
      safeStorage.setItem('difficulty', 'normal');
      updatePregameDifficultyUI();
    });
    diffHardBtn.addEventListener('click', () => {
      globals.difficulty = 'hard';
      safeStorage.setItem('difficulty', 'hard');
      updatePregameDifficultyUI();
    });
    diffInsaneBtn.addEventListener('click', () => {
      globals.difficulty = 'insane';
      safeStorage.setItem('difficulty', 'insane');
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
  refreshAllMagatamaDisplays();
  renderSkillChoicesPregame();
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
    safeStorage.setItem('stickmurai_selected_skill', 'enhance');
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
    
    const icon = skill.icon || 'icons/rpg/fc1170.png';
    const cost = skill.cost || 0;

    let lockContent = '';
    if (!isUnlocked) {
      const canAfford = (globals.magatama || 0) >= cost;
      lockContent = `
        <button class="skill-lock-btn" ${canAfford ? '' : 'disabled'}>
          🔒 ${isJa ? '解放' : 'UNLOCK'}: ${cost.toLocaleString()} 🪙
        </button>
      `;
    }

    const hankoMap: Record<string, string> = {
      vitality: 'ui/hanko_ryu.png',
      wind: 'ui/hanko_fuu.png',
      thunder: 'ui/hanko_raijin.png',
      fire: 'ui/hanko_en.png',
      void: 'ui/hanko_kyou.png',
      basic: 'ui/hanko_bushi.png'
    };
    const hankoSrc = hankoMap[category] || 'ui/hanko_bushi.png';

    const skillIconHtml = icon.startsWith('icons/')
      ? `<div class="rpg-icon-box" style="width: 26px; height: 26px;"><img src="${icon}" class="rpg-icon-img" alt="${t(skill.nameKey)}" /></div>`
      : `<span style="font-size: 16px;">${icon}</span>`;
    const skillWatermark = icon.startsWith('icons/')
      ? `<img src="${icon}" class="rpg-card-backdrop-icon" alt="" aria-hidden="true" style="width: 44px; height: 44px; opacity: 0.16;" />`
      : '';

    card.innerHTML = `
      ${skillWatermark}
      <div style="position: relative; z-index: 2;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span class="skill-category-badge rpg-text-upperlayer">${category}</span>
          <div style="display: flex; align-items: center; gap: 6px;">
            <img src="${hankoSrc}" alt="${category} seal" style="width: 22px; height: 22px; object-fit: contain; filter: drop-shadow(0 0 5px rgba(220, 38, 38, 0.5)); vertical-align: middle;" />
            ${skillIconHtml}
          </div>
        </div>
        <h3 class="rpg-text-upperlayer">${t(skill.nameKey)}</h3>
        <p class="rpg-text-upperlayer">${t(skill.descKey)}</p>
        ${lockContent}
      </div>
    `;

    if (isUnlocked) {
      bindDualListener(card, () => {
        globals.selectedSkill = skill.id as any;
        safeStorage.setItem('stickmurai_selected_skill', skill.id);
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
          safeStorage.setItem('stickmurai_magatama', globals.magatama.toString());
          safeStorage.setItem('stickmurai_unlocked_skills', JSON.stringify(globals.unlockedSkills));
          safeStorage.setItem('stickmurai_selected_skill', skill.id);
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
  const imgEl = document.getElementById('enhance-btn-rpg-img') as HTMLImageElement | null;
  
  if (globals.gameMode === 'zen') {
    if (textSpan) textSpan.innerHTML = t('btnRestricted');
    btn.style.opacity = '0.3';
    return;
  }
  
  btn.style.opacity = '1';
  
  const skillIcons: Record<string, string> = {
    enhance: 'icons/rpg/fc1328.png',
    shield: 'icons/rpg/fc1043.png',
    dash: 'icons/rpg/fc888.png',
    firewheel: 'icons/rpg/fc1221.png',
    gravity: 'icons/rpg/fc1031.png',
    parry_master: 'icons/rpg/fc1101.png',
    decoy_illusion: 'icons/rpg/fc1120.png',
  };

  if (imgEl) {
    imgEl.src = skillIcons[globals.selectedSkill] || 'icons/rpg/fc1328.png';
  }

  if (globals.selectedSkill === 'enhance') {
    if (textSpan) textSpan.innerHTML = t('btnEnhance');
  } else if (globals.selectedSkill === 'shield') {
    if (textSpan) textSpan.innerHTML = t('btnShield');
  } else if (globals.selectedSkill === 'dash') {
    if (textSpan) textSpan.innerHTML = t('btnFlash');
  } else if (globals.selectedSkill === 'firewheel') {
    if (textSpan) textSpan.innerHTML = t('btnFirewheel');
  } else if (globals.selectedSkill === 'gravity') {
    if (textSpan) textSpan.innerHTML = t('btnGravity');
  } else if (globals.selectedSkill === 'parry_master') {
    if (textSpan) textSpan.innerHTML = t('btnParryMaster');
  } else if (globals.selectedSkill === 'decoy_illusion') {
    if (textSpan) textSpan.innerHTML = t('btnDecoy');
  }
  updateStanceSwitchButton();
}

export function updateStanceSwitchButton() {
  const btn = document.getElementById('btn-stance-switch');
  if (!btn) return;
  if (globals.selectedHero !== 'aetherion') {
    btn.style.display = 'none';
    return;
  }
  btn.style.display = 'flex';
  btn.classList.add('mode-ranged-attack');
  const textSpan = document.getElementById('stance-switch-text');
  if (textSpan) textSpan.textContent = 'SHOOT';
  const cdOverlay = document.getElementById('shoot-cooldown-overlay');
  if (cdOverlay) {
    const cdRatio = Math.max(0, Math.min(1, (globals.aetherionShootCooldown || 0) / 0.22));
    cdOverlay.style.height = `${cdRatio * 100}%`;
  }
}

export function toggleAetherionStance() {
  if (globals.selectedHero !== 'aetherion') return;
  // Seamless dual-wield: dedicated shoot action
  callbacks.triggerAetherionRangedAttack?.();
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
  if (enhanceCooldownOverlay && enhanceCooldownText) {
    if (globals.enhanceActiveTimer > 0) {
      const p = Math.round((globals.enhanceActiveTimer / globals.playerStats.enhanceDuration) * 100);
      const text = globals.enhanceActiveTimer.toFixed(1) + 's';
      
      let activeColor = '#ff6600';
      let activeBg = 'rgba(255, 102, 0, 0.35)';
      if (globals.selectedSkill === 'gravity') {
        activeColor = '#c084fc';
        activeBg = 'rgba(192, 132, 252, 0.45)';
      } else if (globals.selectedSkill === 'decoy_illusion') {
        activeColor = '#38bdf8';
        activeBg = 'rgba(56, 189, 248, 0.45)';
      } else if (globals.selectedSkill === 'shield') {
        activeColor = '#00ffff';
        activeBg = 'rgba(0, 255, 255, 0.35)';
      } else if (globals.selectedSkill === 'parry_master') {
        activeColor = '#ffd700';
        activeBg = 'rgba(255, 215, 0, 0.4)';
      }

      if (p !== lastEnhanceOverlayHeight) {
        enhanceCooldownOverlay.style.height = `${p}%`;
        enhanceCooldownOverlay.style.background = activeBg;
        lastEnhanceOverlayHeight = p;
      }
      if (text !== lastEnhanceTextContent) {
        enhanceCooldownText.textContent = text;
        enhanceCooldownText.style.color = activeColor;
        enhanceCooldownText.style.textShadow = `0 0 8px ${activeColor}`;
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
  
  const isUltReady = globals.flow >= globals.playerStats.flowMax && globals.flowState === 'normal' && globals.ultCooldown <= 0;
  
  // Update Flow progress overlay on all ultimate buttons
  const flowRatio = Math.min(1, globals.flow / (globals.playerStats.flowMax || 100));
  const flowPct = Math.round(flowRatio * 100);
  const ultProgressBars = document.querySelectorAll('.ult-fill-progress');
  ultProgressBars.forEach(bar => {
    (bar as HTMLElement).style.height = `${flowPct}%`;
  });

  const setUltIcon = (container: Element | null, srcOrEmoji: string, alt: string) => {
    if (!container) return;
    if (srcOrEmoji.startsWith('icons/')) {
      const img = container.querySelector('img');
      if (img) {
        img.src = srcOrEmoji;
        img.alt = alt;
      } else {
        container.innerHTML = `<img src="${srcOrEmoji}" class="rpg-icon-img" alt="${alt}" />`;
      }
    } else {
      container.textContent = srcOrEmoji;
    }
  };

  // Dynamic Zen Mode label on omnislash button
  const omniBtnEl = document.getElementById('btn-ult-omni');
  if (omniBtnEl) {
    const textEl = omniBtnEl.querySelector('.ult-text');
    const iconEl = omniBtnEl.querySelector('.ult-icon');
    if (textEl && iconEl) {
      if (globals.gameMode === 'zen') {
        textEl.textContent = 'ZEN';
        setUltIcon(iconEl, 'icons/rpg/fc1150.png', 'Zen Sanctuary');
        omniBtnEl.title = 'Zen Sanctuary (Press 2 / F)';
      } else {
        textEl.textContent = 'OMNI';
        setUltIcon(iconEl, 'icons/rpg/fc1267.png', 'Omnislash');
        omniBtnEl.title = 'Omnislash (Press 2 / F)';
      }
    }
  }

  // Dynamic Hero Signature Ultimate label on primary ultimate button
  const shadowBtnEl = document.getElementById('btn-ult-shadow');
  if (shadowBtnEl) {
    const textEl = shadowBtnEl.querySelector('.ult-text');
    const iconEl = shadowBtnEl.querySelector('.ult-icon');
    if (textEl && iconEl) {
      const hero = (globals as any).selectedHero || 'default';
      const heroUlts: Record<string, { label: string; icon: string; title: string }> = {
        default: { label: 'KENSEI', icon: 'icons/rpg/fc1038.png', title: 'Kensei Domain (Press 1)' },
        luneblade: { label: 'LUNAR', icon: 'icons/rpg/fc1191.png', title: 'Crescent Moonfall (Press 1)' },
        ninja: { label: 'MIRAGE', icon: 'icons/rpg/fc543.png', title: 'Wraith Mirage (Press 1)' },
        samurai: { label: 'DRAGON', icon: 'icons/rpg/fc1328.png', title: 'Dragon Roar (Press 1)' },
        nightborne: { label: 'ABYSS', icon: 'icons/rpg/fc1052.png', title: 'Abyssal Singularity (Press 1)' },
        satyr: { label: 'TITAN', icon: 'icons/rpg/fc1237.png', title: 'Titan Cataclysm (Press 1)' },
        akakage: { label: 'ASURA', icon: 'icons/rpg/fc1220.png', title: 'Blood Asura Frenzy (Press 1)' },
        aetherion: { label: 'ASTRAL', icon: 'icons/rpg/fc1276.png', title: 'Astral Singularity (Press 1)' },
      };
      const info = heroUlts[hero] || heroUlts.default;
      textEl.textContent = info.label;
      setUltIcon(iconEl, info.icon, info.label);
      shadowBtnEl.title = info.title;
    }
  }

  if (isUltReady !== lastBtnUltReady) {
    const btnShadow = document.getElementById('btn-ult-shadow');
    const btnOmni = document.getElementById('btn-ult-omni');
    const btnStorm = document.getElementById('btn-ult-storm');
    if (isUltReady) {
      btnShadow?.classList.add('ready');
      btnOmni?.classList.add('ready');
      btnStorm?.classList.add('ready');
    } else {
      btnShadow?.classList.remove('ready');
      btnOmni?.classList.remove('ready');
      btnStorm?.classList.remove('ready');
    }
    lastBtnUltReady = isUltReady;
  }
}

let lastRenderedScore = -1;
let lastRenderedMaxLives = -1;
let lastUiUpdateTime = 0;

export function updateUI(force = false) {
  if (!flowMeterFill || !expMeterFill || !scoreDisplay || !flowMeterContainer) return;

  const now = performance.now();
  // Throttle high-frequency UI updates to ~15 FPS unless forced (e.g. state change, level up, damage)
  if (!force && (now - lastUiUpdateTime) < 66) {
    return;
  }
  lastUiUpdateTime = now;
  
  const lvlEl = levelDisplayElement || (levelDisplayElement = document.getElementById('level-display'));
  if (lvlEl && globals.level !== lastRenderedLevel) {
    lvlEl.textContent = String(globals.level);
    lastRenderedLevel = globals.level;
  }
  
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

  const currencyEl = stageCurrencyElement || (stageCurrencyElement = document.getElementById('stage-currency-count'));
  if (currencyEl && globals.stageCurrency !== lastStageCurrency) { currencyEl.textContent = String(globals.stageCurrency || 0); lastStageCurrency = globals.stageCurrency || 0; }

  const objDisplay = objectiveDisplayElement || (objectiveDisplayElement = document.getElementById('objective-display'));
  if (objDisplay) {
    if (isPractice() || isTutorialActive()) {
      if (lastObjectiveDisplay !== 'none') {
        objDisplay.style.display = 'none';
        lastObjectiveDisplay = 'none';
      }
      const tracker = document.getElementById('hud-mission-tracker');
      if (tracker && tracker.style.display !== 'none') {
        tracker.style.display = 'none';
      }
    } else if (globals.gameState === 'playing') {
      const tracker = document.getElementById('hud-mission-tracker');
      if (tracker && tracker.style.display === 'none' && globals.gameMode !== 'pvp') {
        tracker.style.display = '';
      }
      if (globals.timerLimit !== 'endless') {
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
          objDisplay.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          objDisplay.style.color = '#f1f5f9';
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
          objDisplay.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          objDisplay.style.color = '#f1f5f9';
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
        const curWave = globals.currentWave || 1;
        const totWaves = globals.totalWaves || 3;
        const isFinalWave = curWave >= totWaves;
        let text = '';
        if (isBoss && isFinalWave) {
          const bossStageData = getStageData(stage);
          const rawName = isJa ? (bossStageData.nameJa || bossStageData.name) : bossStageData.name;
          const cleanName = rawName.replace(/^ステージ\s*\d+:\s*|^STAGE\s*\d+:\s*/i, '');
          text = isJa ? `ステージ ${stage} · 最終波：${cleanName}` : `STAGE ${stage} · FINAL: ${cleanName}`;
        } else {
          const waveKills = Math.min(globals.waveEnemiesTotal || 1, globals.waveEnemiesKilled || 0);
          const waveTot = globals.waveEnemiesTotal || 1;
          text = isJa 
            ? `ステージ ${stage} · 第 ${curWave}/${totWaves} 波 (${waveKills}/${waveTot})`
            : `STAGE ${stage} · WAVE ${curWave}/${totWaves} (${waveKills}/${waveTot})`;
        }
        if (text !== lastObjectiveText) {
          objDisplay.textContent = text;
          objDisplay.style.borderColor = (isBoss && isFinalWave) ? 'rgba(239, 68, 68, 0.8)' : 'rgba(255, 215, 0, 0.35)';
          objDisplay.style.color = (isBoss && isFinalWave) ? '#ef4444' : '#ffd700';
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

  const bntDisplay = bountyDisplayElement || (bountyDisplayElement = document.getElementById('bounty-display'));
  if (bntDisplay) {
    if (globals.gameState === 'playing' && globals.activeBounty) {
      const b = globals.activeBounty;
      const remaining = Math.ceil(b.timeRemaining);
      const isDone = b.current >= b.target;
      const bText = `🎯 ${b.description} (${b.current}/${b.target}) · ${remaining}s`;
      if (lastBountyDisplay !== 'block') {
        bntDisplay.style.display = 'block';
        lastBountyDisplay = 'block';
      }
      if (bText !== lastBountyText) {
        bntDisplay.textContent = bText;
        bntDisplay.style.borderColor = isDone ? 'rgba(74, 222, 128, 0.6)' : 'rgba(251, 191, 36, 0.45)';
        bntDisplay.style.color = isDone ? '#4ade80' : '#fbbf24';
        lastBountyText = bText;
      }
    } else {
      if (lastBountyDisplay !== 'none') {
        bntDisplay.style.display = 'none';
        lastBountyDisplay = 'none';
      }
    }
  }
  
  const ghostActive = (globals.ghostHeartTimer || 0) > 0;
  if (globals.lives !== lastLives || globals.maxLives !== lastRenderedMaxLives || ghostActive !== lastGhostHeartActive) {
    const heartsHost = document.getElementById('hearts-container');
    const visibleHearts = Math.min(globals.maxLives, 7);
    if (heartsHost && visibleHearts > heartsHost.querySelectorAll('.heart').length) {
      for (let i = heartsHost.querySelectorAll('.heart').length; i < visibleHearts; i++) {
        const h = document.createElement('span'); h.className = 'heart'; h.textContent = '❤️'; heartsHost.appendChild(h);
      }
      heartsElements = heartsHost.querySelectorAll('.heart');
    }
    if (heartsHost) {
      let count = heartsHost.querySelector('#heart-count');
      if (globals.maxLives > 7) {
        if (!count) {
          count = document.createElement('span'); count.id = 'heart-count'; heartsHost.appendChild(count);
        }
        count.textContent = `${globals.lives}/${globals.maxLives}`;
      } else {
        count?.remove();
      }
    }
    if (heartsElements) {
      heartsElements.forEach((h, i) => {
        if (i >= globals.maxLives) {
          (h as HTMLElement).style.display = 'none';
        } else {
          (h as HTMLElement).style.display = '';
        }
        const isGhost = ghostActive && i === globals.lives;
        if (i < globals.lives) {
          h.classList.add('active');
          h.classList.remove('damaged');
          h.classList.remove('ghost');
          h.textContent = '❤️';
        } else if (isGhost) {
          h.classList.remove('active');
          h.classList.remove('damaged');
          h.classList.add('ghost');
          h.textContent = '🧡';
        } else {
          h.classList.remove('active');
          h.classList.remove('ghost');
          h.textContent = '❤️';
          if (i < lastLives) {
            h.classList.add('damaged');
          }
        }
      });
    }
    lastLives = globals.lives;
    lastRenderedMaxLives = globals.maxLives;
    lastGhostHeartActive = ghostActive;
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
  updateFullscreenUI();
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
  const isJa = globals.currentLang === 'ja';
  
  if (swiftBtn) {
    AdManager.measure('rewarded', 'blessing-swift', 'visible');
    const costText = swiftBtn.querySelector('.blessing-cost-text') as HTMLElement;
    const isUnlocked = !!globals.stageBlessings?.swift_strike?.unlocked;
    const isActive = !!globals.stageBlessings?.swift_strike?.active || globals.activeBlessing === 'swift_strike' || globals.activeBlessing === 'both';
    
    if (isUnlocked) {
      if (isActive) {
        swiftBtn.classList.add('active');
        swiftBtn.style.borderColor = '#38bdf8';
        swiftBtn.style.background = 'rgba(56, 189, 248, 0.18)';
        if (costText) {
          costText.innerText = isJa ? '✓ 有効 (解放済み)' : '✓ ACTIVE (Unlocked)';
          costText.style.color = '#38bdf8';
        }
      } else {
        swiftBtn.classList.remove('active');
        swiftBtn.style.borderColor = 'rgba(56, 189, 248, 0.4)';
        swiftBtn.style.background = 'rgba(12, 13, 18, 0.92)';
        if (costText) {
          costText.innerText = isJa ? '装備する (解放済み)' : 'EQUIP (Unlocked)';
          costText.style.color = '#94a3b8';
        }
      }
    } else {
      swiftBtn.classList.remove('active');
      swiftBtn.style.borderColor = 'rgba(212, 162, 78, 0.4)';
      swiftBtn.style.background = 'rgba(12, 13, 18, 0.92)';
      if (costText) {
        costText.innerText = isJa ? '(広告を見て解放)' : '(Watch Ad to Unlock)';
        costText.style.color = '#ffd700';
      }
    }
  }
  
  if (fortuneBtn) {
    AdManager.measure('rewarded', 'blessing-fortune', 'visible');
    const costText = fortuneBtn.querySelector('.blessing-cost-text') as HTMLElement;
    const descText = fortuneBtn.querySelector('p') as HTMLElement;
    const isUnlocked = !!globals.stageBlessings?.fortune?.unlocked;
    const isActive = !!globals.stageBlessings?.fortune?.active || globals.activeBlessing === 'fortune' || globals.activeBlessing === 'both';
    const monReward = getStageMonReward(globals.currentStage || 1);
    const isBoss = (globals.currentStage || 1) % 5 === 0;
    
    if (descText) {
      descText.innerHTML = isJa
        ? `+${monReward.toLocaleString()}文, +150金貨, 2強化, +50%ドロップ${isBoss ? ' <b style="color:#ffd700;">(ボス1.5倍!)</b>' : ''}`
        : `+${monReward.toLocaleString()} Mon, +150 Gold, 2 Powerups, +50% Drops${isBoss ? ' <b style="color:#ffd700;">(1.5× Boss Bonus!)</b>' : ''}`;
    }
    
    if (isUnlocked) {
      if (isActive) {
        fortuneBtn.classList.add('active');
        fortuneBtn.style.borderColor = '#ffd700';
        fortuneBtn.style.background = 'rgba(255, 215, 0, 0.18)';
        if (costText) {
          costText.innerText = isJa ? '✓ 有効 (解放済み)' : '✓ ACTIVE (Unlocked)';
          costText.style.color = '#ffd700';
        }
      } else {
        fortuneBtn.classList.remove('active');
        fortuneBtn.style.borderColor = 'rgba(255, 215, 0, 0.4)';
        fortuneBtn.style.background = 'rgba(12, 13, 18, 0.92)';
        if (costText) {
          costText.innerText = isJa ? '装備する (解放済み)' : 'EQUIP (Unlocked)';
          costText.style.color = '#94a3b8';
        }
      }
    } else {
      fortuneBtn.classList.remove('active');
      fortuneBtn.style.borderColor = 'rgba(212, 162, 78, 0.4)';
      fortuneBtn.style.background = 'rgba(12, 13, 18, 0.92)';
      if (costText) {
        costText.innerText = isJa ? `(広告を見て+${monReward.toLocaleString()}文解放)` : `(Watch Ad for +${monReward.toLocaleString()} Mon)`;
        costText.style.color = '#ffd700';
      }
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
    plasma_tempest: 'icons/rpg/fc1223.png',
    singularity_cleave: 'icons/rpg/fc1120.png',
    hundred_phantoms: 'icons/rpg/fc1388.png',
    kamaitachi: 'icons/rpg/fc1155.png',
    asura_storm: 'icons/rpg/fc1207.png'
  };

  renderCodex(grid);

  FUSION_RECIPES.forEach(recipe => {
    const card = document.createElement('div');
    card.className = 'grimoire-card discovered';
    card.style.background = 'linear-gradient(135deg, rgba(20, 24, 35, 0.95) 0%, rgba(10, 12, 18, 0.98) 100%)';
    card.style.border = '1.5px solid #d4a24e';
    card.style.borderRadius = '0';
    card.style.clipPath = 'polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)';
    card.style.padding = '16px';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '8px';
    card.style.boxShadow = '0 0 18px rgba(212, 162, 78, 0.25)';
    card.style.position = 'relative';
    card.style.overflow = 'hidden';
    
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
    const iconSrc = recipeIcons[recipe.key] || 'icons/rpg/fc1267.png';

    card.innerHTML = `
      <img src="${iconSrc}" class="rpg-card-backdrop-icon" alt="" aria-hidden="true" style="width: 56px; height: 56px; opacity: 0.18;" />
      <div style="position: relative; z-index: 2; display: flex; flex-direction: column; gap: 8px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:8px;">
            <div class="rpg-icon-box" style="width:28px; height:28px;">
              <img src="${iconSrc}" class="rpg-icon-img" alt="icon" />
            </div>
            <span class="rpg-text-upperlayer" style="font-family:'Cinzel', serif; font-size:16px; font-weight:bold; color:#ffd700;">${isJa ? recipe.nameJa : recipe.nameEn}</span>
          </div>
          <span class="rpg-text-upperlayer" style="font-size:11px; padding:2px 6px; border-radius:4px; background:rgba(34,197,94,0.2); color:#22c55e; border:1px solid #22c55e;">${isJa ? '解読済' : 'DISCOVERED'}</span>
        </div>
        <div class="rpg-text-upperlayer" style="font-size:13px; color:#e2e8f0; line-height:1.4;">${isJa ? recipe.descJa : recipe.descEn}</div>
        
        <div style="margin-top:4px; display:flex; flex-direction:column; gap:3px;">
          <div style="display:flex; justify-content:space-between; font-size:11px; color:#94a3b8;">
            <span class="rpg-text-upperlayer">${isJa ? '出撃中の共鳴度' : 'Active Run Synergy'}: <strong style="color:${synergyPct === 100 ? '#22c55e' : (synergyPct > 0 ? '#ffd700' : '#64748b')};">${synergyPct}%</strong></span>
            <span class="rpg-text-upperlayer" style="color:${synergyPct === 100 ? '#22c55e' : '#ffd700'}; font-weight:bold; display: inline-flex; align-items: center; gap: 4px;">${synergyPct === 100 ? (isJa ? '<div class="rpg-icon-box" style="width:12px;height:12px;border:none;background:transparent;box-shadow:none;"><img src="icons/rpg/fc1025.png" class="rpg-icon-img" /></div> 融合準備完了！' : '<div class="rpg-icon-box" style="width:12px;height:12px;border:none;background:transparent;box-shadow:none;"><img src="icons/rpg/fc1025.png" class="rpg-icon-img" /></div> READY TO FORGE!') : (synergyPct === 50 ? (isJa ? '素材1つ獲得済' : '1/2 Acquired') : '')}</span>
          </div>
          <div style="width:100%; height:5px; background:#0f172a; border-radius:3px; overflow:hidden; border:1px solid #334155;">
            <div style="width:${synergyPct}%; height:100%; background:${synergyPct === 100 ? 'linear-gradient(90deg, #22c55e, #4ade80)' : 'linear-gradient(90deg, #f59e0b, #ffd700)'};"></div>
          </div>
        </div>

        <div style="margin-top:auto; padding-top:8px; border-top:1px dashed #334155; display:flex; gap:6px; align-items:center; flex-wrap:wrap; font-size:12px; color:#94a3b8;">
          <span class="rpg-text-upperlayer" style="background:${req1Met ? 'rgba(34,197,94,0.15)' : '#0f172a'}; padding:3px 8px; border-radius:4px; border:${req1Met ? '1px solid #22c55e' : '1px solid #475569'}; color:${req1Met ? '#86efac' : '#cbd5e1'}; display:inline-flex; align-items:center; gap:4px;"><div class="rpg-icon-box" style="width:12px;height:12px;border:none;background:transparent;box-shadow:none;"><img src="icons/rpg/fc1170.png" class="rpg-icon-img" /></div> ${isJa ? recipe.req1Ja : recipe.req1En} ${req1Met ? '✓' : ''}</span>
          <span>+</span>
          <span class="rpg-text-upperlayer" style="background:${req2Met ? 'rgba(34,197,94,0.15)' : '#0f172a'}; padding:3px 8px; border-radius:4px; border:${req2Met ? '1px solid #22c55e' : '1px solid #475569'}; color:${req2Met ? '#86efac' : '#cbd5e1'}; display:inline-flex; align-items:center; gap:4px;"><div class="rpg-icon-box" style="width:12px;height:12px;border:none;background:transparent;box-shadow:none;"><img src="icons/rpg/fc1038.png" class="rpg-icon-img" /></div> ${isJa ? recipe.req2Ja : recipe.req2En} ${req2Met ? '✓' : ''}</span>
        </div>
      </div>
    `;
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
    image: 'sprites/portraits/portrait_ronin.png?v=clean2',
  },
  {
    id: 'luneblade',
    nameEn: 'Luneblade Ascendant',
    nameJa: '月影の剣聖（ルーンブレイド）',
    titleEn: 'Axion Swordsman',
    titleJa: '星海を切り裂く双刃の英傑',
    image: 'sprites/portraits/portrait_luneblade.png?v=clean2',
  },
  {
    id: 'ninja',
    nameEn: 'Shadow Shinobi',
    nameJa: '闇夜の忍（シャドウ・シノビ）',
    titleEn: 'Silent Assassin',
    titleJa: '影を纏いし暗殺の達人',
    image: 'sprites/portraits/portrait_ninja.png?v=clean2',
  },
  {
    id: 'samurai',
    nameEn: 'Grandmaster Samurai',
    nameJa: '極意の侍（グランドマスター）',
    titleEn: 'Kensei of the Blade',
    titleJa: '一騎当千の剣聖武士',
    image: 'sprites/portraits/portrait_samurai.png?v=clean2',
  },
  {
    id: 'nightborne',
    nameEn: 'Nightborne Sovereign',
    nameJa: '常世の覇王（ナイトボーン）',
    titleEn: 'Abyssal Lord',
    titleJa: '冥府の深淵より現れし覇王',
    image: 'sprites/portraits/portrait_nightborne.png?v=clean2',
  },
  {
    id: 'satyr',
    nameEn: 'Primal Satyr Sovereign',
    nameJa: '原始の森神（サテュロス）',
    titleEn: 'Apex Nature Titan',
    titleJa: '深林を支配せし森羅の主',
    image: 'sprites/portraits/portrait_satyr.png?v=clean2',
  },
  {
    id: 'akakage',
    nameEn: 'Akakage, the Crimson Revenant',
    nameJa: '紅影・クリムゾン・レヴナント',
    titleEn: 'Crimson Revenant',
    titleJa: '紅蓮の亡影',
    image: 'sprites/portraits/portrait_akakage.png?v=akakage1',
  },
  {
    id: 'aetherion',
    nameEn: 'Aetherion, Celestial Arbiter',
    nameJa: '天星の執行者・エセリオン',
    titleEn: 'Celestial Arbiter',
    titleJa: '天星の執行者',
    image: 'sprites/portraits/portrait_aetherion.png?v=aeth1',
  }
].map(hero => {
  const stats = heroBalance(hero.id);
  return {...hero, cost:stats.cost, critChance:stats.crit,
    atk:`${Math.round((1+stats.slash)*100)}%`, spd:`${Math.round(stats.move*100)}%`,
    descEn:heroDescription(hero.id), descJa:heroDescription(hero.id,true),
    specialEn:stats.passiveEn, specialJa:stats.passiveJa};
});

export function refreshAllMagatamaDisplays() {
  const formatted = (globals.magatama || 0).toLocaleString();
  const hudEl = document.getElementById('hud-magatama-count');
  if (hudEl) hudEl.textContent = formatted;
  const dojoEl = document.getElementById('dojo-magatama-count');
  if (dojoEl) dojoEl.textContent = formatted;
  const pregameEl = document.getElementById('pregame-magatama-count');
  if (pregameEl) pregameEl.textContent = formatted;
  const stageClearEl = document.getElementById('stage-clear-magatama');
  if (stageClearEl) stageClearEl.innerHTML = formatted + ' <img src="icons/mon_coin.png" class="inline-currency-icon" alt="Mon" />';
}

function processRedeemCode() {
  const inputEl = document.getElementById('redeem-input') as HTMLInputElement | null;
  const msgEl = document.getElementById('redeem-status-msg');
  if (!inputEl || !msgEl) return;
  
  const rawCode = inputEl.value.trim().toUpperCase();
  if (!rawCode) {
    msgEl.style.color = '#ef4444';
    msgEl.textContent = globals.currentLang === 'ja' ? 'コードを入力してください。' : 'Please enter a cipher code.';
    return;
  }

  let redeemed: string[] = [];
  try {
    redeemed = JSON.parse(safeStorage.getItem('stickmurai_redeemed_codes') || '[]');
  } catch(e) {
    redeemed = [];
  }

  if (rawCode === 'LT160224') {
    // Master developer testing code: adds 50,000,000 Magatama!
    const amount = 50000000;
    globals.magatama = (globals.magatama || 0) + amount;
    safeStorage.setItem('stickmurai_magatama', globals.magatama.toString());
    refreshAllMagatamaDisplays();
    populateDojoHeroGrid();

    playShrineBlessing(1.0);
    triggerHapticFeedback([50, 60, 50, 60, 120]);
    globals.screenShake = Math.max(globals.screenShake, 35);
    const px = globals.player ? globals.player.x : 0;
    const py = globals.player ? globals.player.y - 80 : 0;
    globals.floatingTexts.push(FloatingText.acquire(px, py, '🎉 MASTER CODE! +50M 🪙', '#ffd700', 42));

    msgEl.style.color = '#10b981';
    msgEl.textContent = globals.currentLang === 'ja' 
      ? '🎉 マスターコード認証！ +50,000,000 文獲得！' 
      : '🎉 MASTER CODE ACTIVATED! +50,000,000 MON!';
    inputEl.value = '';
    return;
  }

  if (redeemed.includes(rawCode)) {
    msgEl.style.color = '#f59e0b';
    msgEl.textContent = globals.currentLang === 'ja' ? 'このコードは既に使用されています。' : 'This code has already been redeemed.';
    return;
  }

  let rewardMagatama = 0;
  let rewardTitle = '';

  switch(rawCode) {
    case 'MURAMASA':
      rewardMagatama = 100000;
      rewardTitle = 'MURAMASA GIFT (+100,000 🪙)';
      break;
    case 'STICKMURAI':
      rewardMagatama = 100000;
      rewardTitle = 'STICKMURAI TRIBUTE (+100,000 🪙)';
      break;
    case 'NIGHTBORNE':
      rewardMagatama = 200000;
      rewardTitle = 'NIGHTBORNE SOVEREIGN (+200,000 🪙)';
      break;
    case 'SOVEREIGN':
      rewardMagatama = 300000;
      rewardTitle = 'SATYR SOVEREIGN (+300,000 🪙)';
      break;
    case 'CHAMPION':
      rewardMagatama = 500000;
      rewardTitle = 'GRAND CHAMPION BOUNTY (+500,000 🪙)';
      break;
    case 'SAMURAI2026':
      rewardMagatama = 150000;
      rewardTitle = 'KENSEI TREASURE (+150,000 🪙)';
      break;
    default:
      msgEl.style.color = '#ef4444';
      msgEl.textContent = globals.currentLang === 'ja' 
        ? '無効な暗号コードです。' 
        : 'Invalid secret code. Please verify and try again.';
      return;
  }

  globals.magatama = (globals.magatama || 0) + rewardMagatama;
  safeStorage.setItem('stickmurai_magatama', globals.magatama.toString());
  redeemed.push(rawCode);
  safeStorage.setItem('stickmurai_redeemed_codes', JSON.stringify(redeemed));

  refreshAllMagatamaDisplays();
  populateDojoHeroGrid();
  playShrineBlessing(0.9);
  triggerHapticFeedback([40, 50, 80]);
  globals.screenShake = Math.max(globals.screenShake, 20);

  msgEl.style.color = '#10b981';
  msgEl.textContent = `🎉 ${rewardTitle}`;
  inputEl.value = '';
}

let dojoFilter = 'all';
export function populateDojoHeroGrid() {
  const grid = document.getElementById('dojo-hero-grid');
  const countEl = document.getElementById('dojo-magatama-count');
  if (countEl) countEl.textContent = (globals.magatama || 0).toLocaleString();
  if (!grid) return;
  grid.innerHTML = '';

  const isJa = globals.currentLang === 'ja';

  let filter = document.getElementById('qol-dojo-filter');
  if (!filter) {
    filter = document.createElement('label'); filter.id = 'qol-dojo-filter'; filter.className = 'qol-dojo-filter';
    grid.before(filter);
  }
  filter.innerHTML = `${isJa ? '英雄を絞り込む' : 'Show heroes'} <select aria-label="Hero filter"><option value="all">${isJa?'すべて':'All'}</option><option value="owned">${isJa?'所有':'Owned'}</option><option value="locked">${isJa?'未解放':'Locked'}</option><option value="affordable">${isJa?'購入可能':'Affordable'}</option></select>`;
  const select = filter.querySelector('select')!; select.value = dojoFilter;
  select.addEventListener('change', () => { dojoFilter = select.value; populateDojoHeroGrid(); });
  HEROES_DATA.forEach(hero => {
    const owned = globals.unlockedHeroes.includes(hero.id);
    if ((dojoFilter === 'owned' && !owned) || (dojoFilter === 'locked' && owned) || (dojoFilter === 'affordable' && (owned || hero.cost > globals.magatama))) return;
    const isUnlocked = globals.unlockedHeroes.includes(hero.id);
    const isEquipped = globals.selectedHero === hero.id;

    const card = document.createElement('div');
    card.className = 'hero-card';
    card.style.background = isEquipped ? 'linear-gradient(135deg, rgba(30, 20, 45, 0.95) 0%, rgba(12, 13, 18, 0.98) 100%)' : (isUnlocked ? 'linear-gradient(135deg, rgba(18, 20, 28, 0.95) 0%, rgba(10, 12, 18, 0.98) 100%)' : 'linear-gradient(135deg, rgba(10, 12, 16, 0.95) 0%, rgba(6, 7, 10, 0.98) 100%)');
    card.style.border = isEquipped ? '2px solid #d4a24e' : (isUnlocked ? '1.5px solid rgba(212, 162, 78, 0.4)' : '1.5px solid rgba(255, 255, 255, 0.1)');
    card.style.borderRadius = '0';
    card.style.clipPath = 'polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)';
    card.style.padding = '12px 14px';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.justifyContent = 'flex-start';
    card.style.gap = '6px';
    card.style.height = 'auto';
    card.style.minHeight = 'fit-content';
    card.style.flexShrink = '0';
    card.style.boxShadow = isEquipped ? '0 0 20px rgba(212, 162, 78, 0.35)' : '0 4px 16px rgba(0, 0, 0, 0.5)';

    // Hero portrait container with elegant dark dojo alcove podium & SVG fallback
    const heroImgUrl = resolveAssetUrl(hero.image);
    const portraitHtml = `
      <div class="hero-portrait-wrap" style="position: relative; width: 100%; height: 96px; min-height: 96px; flex: 0 0 96px; flex-shrink: 0; background: radial-gradient(circle at 50% 65%, rgba(212,162,78,0.2) 0%, rgba(12,13,18,0.95) 75%); border-radius: 0; clip-path: polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px); display: flex; justify-content: center; align-items: center; overflow: hidden; border: 1.5px solid rgba(212,162,78,0.35); margin-bottom: 4px; box-shadow: inset 0 2px 10px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.4);">
        <img src="${heroImgUrl}" alt="${hero.nameEn}" style="width: 76px; height: 76px; object-fit: contain; image-rendering: pixelated; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.7));" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'80\\' height=\\'80\\' viewBox=\\'0 0 80 80\\'><circle cx=\\'40\\' cy=\\'40\\' r=\\'30\\' fill=\\'%23d4a24e\\' opacity=\\'0.2\\'/><text x=\\'50%\\' y=\\'55%\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' font-size=\\'32\\'>⚔️</text></svg>';" />
        <img src="ui/hanko_bushi.png" alt="Seal" style="position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; opacity: 0.85; pointer-events: none; filter: drop-shadow(0 0 4px rgba(220,38,38,0.6));" />
      </div>
    `;

    const statsHtml = heroComparison(hero.id);

    const awk = heroAwakeningSkill(hero.id);
    const hasAwakening = ((globals as any).unlockedHeroAwakenings || []).includes(hero.id);
    let awakeningHtml = '';
    if (awk) {
      const awkIconHtml = awk.icon.startsWith('icons/')
        ? `<div class="rpg-icon-box" style="width: 18px; height: 18px; display: inline-flex; vertical-align: middle;"><img src="${awk.icon}" class="rpg-icon-img" alt="${awk.nameEn}" /></div>`
        : awk.icon;
      const awkBackdrop = awk.icon.startsWith('icons/')
        ? `<img src="${awk.icon}" class="rpg-card-backdrop-icon" alt="" aria-hidden="true" style="width: 42px; height: 42px; opacity: 0.15;" />`
        : '';
      if (hasAwakening) {
        awakeningHtml = `
          <div style="position: relative; overflow: hidden; margin-top: 4px; padding: 6px 8px; border-radius: 0; clip-path: polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px); background: rgba(212, 162, 78, 0.12); border: 1.5px solid #d4a24e; display: flex; flex-direction: column; gap: 3px;">
            ${awkBackdrop}
            <div style="position: relative; z-index: 2; display: flex; justify-content: space-between; align-items: center;">
              <span class="rpg-text-upperlayer" style="font-size: 11px; font-weight: bold; color: #ffd700; display: inline-flex; align-items: center; gap: 4px;"><div class="rpg-icon-box" style="width: 14px; height: 14px; border: none; background: transparent; box-shadow: none;"><img src="icons/rpg/fc1038.png" class="rpg-icon-img" /></div> ${isJa ? '覚醒スキル習得済み' : 'AWAKENING ACQUIRED'}</span>
              <span class="rpg-text-upperlayer" style="font-size: 10px; color: #ffd700; font-family: monospace; display: inline-flex; align-items: center; gap: 4px;">${awkIconHtml} <span>${isJa ? awk.nameJa : awk.nameEn}</span></span>
            </div>
            <div class="rpg-text-upperlayer" style="font-size: 10px; color: #fef08a; line-height: 1.3;">${isJa ? awk.descJa : awk.descEn}</div>
          </div>
        `;
      } else if (isUnlocked) {
        const canAffordAwk = (globals.magatama || 0) >= awk.cost;
        awakeningHtml = `
          <div style="position: relative; overflow: hidden; margin-top: 4px; padding: 6px 8px; border-radius: 0; clip-path: polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px); background: rgba(15, 23, 42, 0.85); border: 1px dashed rgba(212, 162, 78, 0.4); display: flex; flex-direction: column; gap: 3px;">
            ${awkBackdrop}
            <div style="position: relative; z-index: 2; display: flex; justify-content: space-between; align-items: center;">
              <span class="rpg-text-upperlayer" style="font-size: 11px; font-weight: bold; color: #ffd700; display: inline-flex; align-items: center; gap: 4px;"><div class="rpg-icon-box" style="width: 14px; height: 14px; border: none; background: transparent; box-shadow: none;"><img src="icons/rpg/fc1038.png" class="rpg-icon-img" /></div> ${isJa ? '追加覚醒スキル' : 'AWAKENING SKILL'}</span>
              <span class="rpg-text-upperlayer" style="font-size: 10px; color: #f59e0b; font-family: monospace; display: inline-flex; align-items: center; gap: 4px;">${awkIconHtml} <span>${isJa ? awk.nameJa : awk.nameEn}</span></span>
            </div>
            <div class="rpg-text-upperlayer" style="font-size: 10px; color: #94a3b8; line-height: 1.3;">${isJa ? awk.descJa : awk.descEn}</div>
            <button class="menu-btn btn-card buy-awakening-btn" data-hero="${hero.id}" ${canAffordAwk ? '' : 'disabled'} style="position: relative; z-index: 2; margin-top: 4px; padding: 4px 10px !important; min-height: 28px !important; font-size: 11px !important; border-color: ${canAffordAwk ? '#d4a24e' : '#64748b'}; color: ${canAffordAwk ? '#ffd700' : '#94a3b8'}; cursor: ${canAffordAwk ? 'pointer' : 'not-allowed'};">
              ${isJa ? `覚醒習得: ${awk.cost.toLocaleString()} 🪙` : `AWAKEN: ${awk.cost.toLocaleString()} 🪙`}
            </button>
          </div>
        `;
      }
    }

    let actionBtnHtml = '';
    if (isEquipped) {
      actionBtnHtml = `<button class="menu-btn btn-card" disabled style="margin: 0; background: #166534; border-color: #22c55e; color: #bbf7d0; cursor: default;">✓ ${isJa ? '装備中' : 'EQUIPPED'}</button>`;
    } else if (isUnlocked) {
      actionBtnHtml = `<button class="menu-btn btn-card equip-hero-btn" data-hero="${hero.id}" style="margin: 0; border-color: #d4a24e; color: #ffd700; cursor: pointer;">${isJa ? '装備する' : 'EQUIP HERO'}</button>`;
    } else {
      const canAfford = (globals.magatama || 0) >= hero.cost;
      actionBtnHtml = `<button class="menu-btn btn-card buy-hero-btn" data-hero="${hero.id}" ${canAfford ? '' : 'disabled'} style="margin: 0; border-color: ${canAfford ? '#d4a24e' : '#64748b'}; color: ${canAfford ? '#ffd700' : '#94a3b8'}; opacity: ${canAfford ? '1' : '0.6'}; box-shadow: ${canAfford ? '0 0 15px rgba(212,162,78,0.25)' : 'none'}; cursor: ${canAfford ? 'pointer' : 'not-allowed'}; display: inline-flex; align-items: center; justify-content: center; gap: 4px;">${isJa ? `解放: ${hero.cost.toLocaleString()} 文` : `UNLOCK: ${hero.cost.toLocaleString()} Mon`} <img src="icons/mon_coin.png" class="inline-currency-icon" alt="Mon" /></button>`;
    }

    card.innerHTML = `
      ${portraitHtml}
      <span class="journey-badge">${masteryBadge(hero.id)}</span>
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <span style="font-family: 'Shojumaru', 'Noto Sans JP', sans-serif; font-size: 14px; color: ${isEquipped ? '#ffd700' : '#f1f5f9'}; font-weight: bold;">${isJa ? hero.nameJa : hero.nameEn}</span>
        <span style="font-size: 10px; color: #d4a24e; font-family: monospace;">${isJa ? hero.titleJa : hero.titleEn}</span>
      </div>
      <div style="font-size: 11px; color: #94a3b8; line-height: 1.4; min-height: 32px;">${isJa ? hero.descJa : hero.descEn}</div>
      ${statsHtml}
      <div style="font-size: 11px; color: #fef08a; background: rgba(212, 162, 78, 0.1); padding: 4px 8px; border-radius: 0; clip-path: polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px); border-left: 2px solid #d4a24e; margin-top: 2px;">
        ✨ ${isJa ? hero.specialJa : hero.specialEn}
      </div>
      ${awakeningHtml}
      <div style="margin-top: auto; padding-top: 8px; display: flex; flex-direction: column; gap: 6px; flex-shrink: 0;">
        ${!isUnlocked && hero.cost > globals.magatama ? `<div class="qol-shortfall" style="display: flex; align-items: center; justify-content: center; gap: 4px;">${isJa?'あと':'Need'} ${(hero.cost-globals.magatama).toLocaleString()} <img src="icons/mon_coin.png" class="inline-currency-icon" alt="Mon" /></div>` : ''}
        ${actionBtnHtml}
        <button class="menu-btn btn-card qol-hero-try" data-hero="${hero.id}">${isJa?'道場で試す':'TRY IN DOJO'}</button>
      </div>
    `;

    grid.appendChild(card);
  });

  if (!grid.childElementCount) grid.textContent = isJa ? '該当する英雄はいません。' : 'No heroes match this filter.';
  grid.querySelectorAll('.qol-hero-try').forEach(btn => bindDualListener(btn as HTMLElement, () => {
    window.dispatchEvent(new CustomEvent('qol-practice', { detail: (btn as HTMLElement).dataset.hero }));
  }));

  // Attach pointerdown and click listeners to Equip and Buy buttons using bindDualListener
  grid.querySelectorAll('.equip-hero-btn').forEach(btn => {
    bindDualListener(btn as HTMLElement, () => {
      const heroId = (btn as HTMLElement).dataset.hero;
      if (!heroId) return;
      globals.selectedHero = heroId;
      safeStorage.setItem('stickmurai_selected_hero', heroId);
      loadHeroAssets(heroId);
      globals.player?.updateHeroType();
      updateStanceSwitchButton();
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
      if (globals.unlockedHeroes.includes(heroId) || (globals.magatama || 0) < hero.cost) return;

      globals.magatama -= hero.cost;
      window.dispatchEvent(new CustomEvent('qol-toast', { detail: `${isJa ? hero.nameJa : hero.nameEn} · ${isJa?'残高':'Remaining'} ${globals.magatama.toLocaleString()} Mon` }));
      if (!globals.unlockedHeroes.includes(heroId)) {
        globals.unlockedHeroes.push(heroId);
      }
      globals.selectedHero = heroId;
      safeStorage.setItem('stickmurai_magatama', globals.magatama.toString());
      safeStorage.setItem('stickmurai_unlocked_heroes', JSON.stringify(globals.unlockedHeroes));
      safeStorage.setItem('stickmurai_selected_hero', heroId);
      globals.player?.updateHeroType();
      updateStanceSwitchButton();
      playSynthesizedFusionUnlock();
      playShrineBlessing(0.85);
      refreshAllMagatamaDisplays();
      populateDojoHeroGrid();
    });
  });

  grid.querySelectorAll('.buy-awakening-btn').forEach(btn => {
    bindDualListener(btn as HTMLElement, () => {
      const heroId = (btn as HTMLElement).dataset.hero;
      if (!heroId) return;
      const awk = heroAwakeningSkill(heroId);
      if (!awk) return;
      const currentAwakenings = ((globals as any).unlockedHeroAwakenings || []) as string[];
      if (currentAwakenings.includes(heroId) || (globals.magatama || 0) < awk.cost) return;

      globals.magatama -= awk.cost;
      if (!(globals as any).unlockedHeroAwakenings) (globals as any).unlockedHeroAwakenings = [];
      (globals as any).unlockedHeroAwakenings.push(heroId);
      safeStorage.setItem('stickmurai_magatama', globals.magatama.toString());
      safeStorage.setItem('stickmurai_hero_awakenings', JSON.stringify((globals as any).unlockedHeroAwakenings));

      window.dispatchEvent(new CustomEvent('qol-toast', { detail: `⚡ ${isJa ? awk.nameJa : awk.nameEn} ${isJa ? '解放！' : 'UNLOCKED!'}` }));
      playSynthesizedFusionUnlock();
      playShrineBlessing(0.95);
      refreshAllMagatamaDisplays();
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
    card.style.background = isUnlocked ? 'linear-gradient(135deg, rgba(20, 24, 35, 0.95) 0%, rgba(10, 12, 18, 0.98) 100%)' : 'rgba(10, 12, 16, 0.95)';
    card.style.border = isUnlocked ? '1.5px solid #d4a24e' : '1px solid rgba(255, 255, 255, 0.1)';
    card.style.borderRadius = '0';
    card.style.clipPath = 'polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)';
    card.style.padding = '16px';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '8px';
    card.style.boxShadow = isUnlocked ? '0 0 15px rgba(212, 162, 78, 0.25)' : 'none';

    if (isUnlocked) {
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-family:'Cinzel', serif; font-size:16px; font-weight:bold; color:#ffd700;">⛩️ ${isJa ? seal.titleJa : seal.titleEn}</span>
          <span style="font-size:11px; padding:2px 8px; border-radius:0; clip-path:polygon(3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px), 0 3px); background:rgba(212,162,78,0.2); color:#ffd700; border:1px solid #d4a24e;">${isJa ? '封印解除' : 'SEAL BROKEN'}</span>
        </div>
        <div style="font-size:13px; color:#cbd5e1;"><strong>${isJa ? '【達成試練】' : '【FEAT CLEARED】'}</strong> ${isJa ? seal.featDescJa : seal.featDescEn}</div>
        <div style="font-size:13px; color:#94a3b8; font-style:italic; border-left:3px solid #d4a24e; padding-left:10px; margin:4px 0;">"${isJa ? seal.loreFragmentJa : seal.loreFragmentEn}"</div>
        <div style="margin-top:auto; font-size:13px; color:#ffd700; font-weight:500;">✨ ${isJa ? seal.rewardJa : seal.rewardEn}</div>
      `;
    } else {
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-family:'Cinzel', serif; font-size:16px; font-weight:bold; color:#64748b;">⛩️ Seal ${seal.id}: ???</span>
          <span style="font-size:11px; padding:2px 8px; border-radius:0; clip-path:polygon(3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px), 0 3px); background:rgba(148,163,184,0.1); color:#64748b; border:1px solid #334155;">${isJa ? '封印中' : 'SEALED'}</span>
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
  playStageConquered(0.9);

  if (!globals.unlockedSeals.includes(7)) {
    globals.unlockedSeals.push(7);
    safeStorage.setItem('stickmurai_seals', JSON.stringify(globals.unlockedSeals));
    YOMI_SEALS[7]?.applyPermanentReward();
  }

  // Award Dawn Victory Magatama
  const dawnReward = 500;
  globals.magatama = (globals.magatama || 0) + dawnReward;
  safeStorage.setItem('stickmurai_magatama', globals.magatama.toString());

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
        <span>${isJa ? '黄泉の古銭獲得' : 'Ancient Mon Dawn Tribute'}:</span>
        <span style="color:#ffd700; font-weight:bold; display:inline-flex; align-items:center; gap:4px;">+${dawnReward} <img src="icons/mon_coin.png" class="inline-currency-icon" alt="Mon" /></span>
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
  const containerIds = ['ascension-upgrade-grid', 'menu-ascension-upgrade-grid'];
  const containers = containerIds.map(id => document.getElementById(id)).filter(Boolean) as HTMLElement[];
  if (containers.length === 0) return;
  const isJa = globals.currentLang === 'ja';

  // Sync all treasury count elements
  const stageClearTreasury = document.getElementById('stage-clear-magatama');
  if (stageClearTreasury) stageClearTreasury.textContent = (globals.magatama || 0).toLocaleString() + ' 🪙';
  const menuTreasury = document.getElementById('menu-upgrades-magatama-count');
  if (menuTreasury) menuTreasury.textContent = (globals.magatama || 0).toLocaleString();
  const dojoTreasury = document.getElementById('dojo-magatama-count');
  if (dojoTreasury) dojoTreasury.textContent = (globals.magatama || 0).toLocaleString();
  const hudTreasury = document.getElementById('hud-magatama-count');
  if (hudTreasury) hudTreasury.textContent = (globals.magatama || 0).toLocaleString();

  const upgrades = globals.campaignUpgrades || {
    slashDamage: 0,
    dashCooldown: 0,
    ultimateDamage: 0,
    counterSiphon: 0,
    critMastery: 0,
    infiniteSharpness: 0
  };

  const currentSlashStat = ((callbacks as any).getCurrentSlashDamage ? (callbacks as any).getCurrentSlashDamage() : (1.0 + (globals.playerStats?.slashFlatDmg || 0)) * (1.0 + (globals.playerStats?.slashBonusDmgPct || 0))).toFixed(1);
  const slashStatBadge = `<div style="grid-column: 1 / -1; background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 6px; padding: 6px 12px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; margin-bottom: 4px;">
    <span style="color: #94a3b8; display: flex; align-items: center; gap: 6px;">🗡️ <b>${isJa ? '現在の基礎斬撃力' : 'CURRENT SLASH POWER'}:</b></span>
    <span style="color: #4ade80; font-family: 'Orbitron', monospace; font-weight: bold; font-size: 13px;">${currentSlashStat} DMG <span style="font-size: 10px; color: #a3e635;">(+${Math.round((globals.playerStats?.slashBonusDmgPct || 0) * 100)}%)</span></span>
  </div>`;

  containers.forEach(container => {
    container.innerHTML = slashStatBadge;

    ASCENSION_UPGRADES.forEach(u => {
      const curLevel = upgrades[u.id] || 0;
      const isEndless = Boolean(u.isEndless || u.max >= 999);
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
      card.className = 'ascension-card';
      card.style.cssText = `
        background: rgba(12, 13, 18, 0.92);
        border: 1.5px solid ${isMax ? 'rgba(34, 197, 94, 0.5)' : (isEndless ? 'rgba(212, 162, 78, 0.6)' : (canAfford ? 'rgba(212, 162, 78, 0.5)' : 'rgba(255, 255, 255, 0.12)'))};
        border-radius: 0;
        clip-path: polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px);
        padding: 8px 10px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        transition: all 0.2s ease;
        box-shadow: ${isEndless ? '0 0 12px rgba(212, 162, 78, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.4)'};
      `;

      const iconHtml = u.icon.startsWith('icons/')
        ? `<div class="rpg-icon-box" style="width: 20px; height: 20px; display: inline-flex;"><img src="${u.icon}" class="rpg-icon-img" alt="${u.name}" /></div>`
        : `<span>${u.icon}</span>`;
      const watermarkHtml = u.icon.startsWith('icons/')
        ? `<img src="${u.icon}" class="rpg-card-backdrop-icon" alt="" aria-hidden="true" />`
        : '';

      card.innerHTML = `
        ${watermarkHtml}
        <div style="position: relative; z-index: 2; display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 4px; flex-wrap: wrap;">
            <span class="rpg-text-upperlayer" style="font-family: 'Shojumaru', 'Noto Sans JP', sans-serif; color: ${isMax ? '#4ade80' : (isEndless ? '#fbbf24' : '#ffd700')}; font-size: 11.5px; display: flex; align-items: center; gap: 6px; line-height: 1.2;">
              ${iconHtml} <span class="rpg-text-upperlayer">${isJa ? u.nameJa : u.name}</span>
            </span>
            <span class="ascension-level-display rpg-text-upperlayer" style="font-family: 'Orbitron', monospace; font-size: 10px; color: ${isMax ? '#4ade80' : (isEndless ? '#fbbf24' : '#38bdf8')}; font-weight: bold; white-space: nowrap;">
              ${isEndless ? `Rank ${curLevel} (∞)` : (isMax ? 'MAX' : `Lv. ${curLevel}/${u.max}`)}
            </span>
          </div>
          <div class="ascension-pips rpg-text-upperlayer" style="font-family: monospace; font-size: 9px; color: #a855f7; letter-spacing: 0.5px; word-break: break-all; line-height: 1;">
            ${pips}
          </div>
          <div class="ascension-level-info rpg-text-upperlayer" style="font-family: 'Outfit', sans-serif; font-size: 10px; color: #cbd5e1; line-height: 1.25;">
            <strong>${isJa ? '永続強化' : 'PERMANENT'}</strong> · ${isJa ? u.descJa : u.desc}
            ${permanentPreview(u.id, curLevel, u.max, isEndless)}
            <div style="font-size: 9px; opacity: 0.85; margin-top: 2px;">${isJa ? 'レベル' : 'Level'} ${curLevel} → ${isMax ? curLevel : curLevel + 1} · ${isJa?'上限':'Cap'} ${isEndless?'∞':u.max}</div>
          </div>
          <div style="margin-top: 4px;">
            ${isMax ? `
              <button class="menu-btn btn-card" disabled style="margin: 0; background: #14532d; border-color: #22c55e; color: #86efac; cursor: default; font-size: 10px; min-height: 28px; padding: 2px 6px;">✓ MASTERED</button>
            ` : `
              <button class="menu-btn btn-card buy-ascension-btn" data-upgrade="${u.id}" data-cost="${cost}" ${canAfford ? '' : 'disabled'} style="margin: 0; min-height: 28px; font-size: 10px; padding: 3px 6px; border-color: ${canAfford ? (isEndless ? '#fbbf24' : '#ffd700') : '#475569'}; color: ${canAfford ? (isEndless ? '#fbbf24' : '#ffd700') : '#64748b'}; opacity: ${canAfford ? '1' : '0.6'}; box-shadow: ${canAfford ? '0 0 10px rgba(255,215,0,0.2)' : 'none'}; cursor: ${canAfford ? 'pointer' : 'not-allowed'}; touch-action: manipulation; user-select: none; white-space: normal; word-break: keep-all; line-height: 1.15;">
                <div>${isJa ? `強化: ${cost.toLocaleString()} 🪙` : `UPGRADE: ${cost.toLocaleString()} 🪙`}</div>
                <div style="font-size: 7.5px; opacity: 0.75; font-weight: normal; letter-spacing: 0.2px; margin-top: 1px; display: inline-flex; align-items: center; gap: 3px;"><div class="rpg-icon-box" style="width: 9px; height: 9px; border: none; background: transparent; box-shadow: none;"><img src="icons/rpg/fc1025.png" class="rpg-icon-img" /></div> ${isJa ? '長押しで連続強化' : 'HOLD TO RAPID UPGRADE'}</div>
              </button>
            `}
          </div>
        </div>
      `;

      const buyBtn = card.querySelector('.buy-ascension-btn') as HTMLElement;
      if (buyBtn && canAfford) {
        let isHolding = false;
        let holdTimer: any = null;
        let repeatTimer: any = null;
        let currentInterval = 140;
        let upgradesDone = 0;

        const performOneUpgrade = (): boolean => {
          const upgradesState = globals.campaignUpgrades || (globals.campaignUpgrades = {});
          const currentLvl = upgradesState[u.id] || 0;
          const isEndlessUpgrade = Boolean(u.isEndless || u.max >= 999);
          const isMaxUpgrade = !isEndlessUpgrade && currentLvl >= u.max;
          if (isMaxUpgrade) return false;

          const currentCost = u.baseCost + currentLvl * u.costMult;
          if ((globals.magatama || 0) < currentCost) return false;

          globals.magatama -= currentCost;
          const nextLvl = currentLvl + 1;
          upgradesState[u.id] = nextLvl;
          upgradesDone++;

          const pitch = 1.0 + Math.min(0.85, upgradesDone * 0.05);
          playSynthesizedFusionUnlock(pitch);
          if (upgradesDone === 1 || nextLvl % 5 === 0) {
            playShrineBlessing(0.65);
          }

          const isNowMax = !isEndlessUpgrade && nextLvl >= u.max;
          const nextCost = isNowMax ? 0 : u.baseCost + nextLvl * u.costMult;
          const canAffordNext = !isNowMax && (globals.magatama || 0) >= nextCost;

          // Treasury counter sync
          const stageClearTreasury = document.getElementById('stage-clear-magatama');
          if (stageClearTreasury) stageClearTreasury.textContent = (globals.magatama || 0).toLocaleString() + ' 🪙';
          const menuTreasury = document.getElementById('menu-upgrades-magatama-count');
          if (menuTreasury) menuTreasury.textContent = (globals.magatama || 0).toLocaleString();
          const dojoTreasury = document.getElementById('dojo-magatama-count');
          if (dojoTreasury) dojoTreasury.textContent = (globals.magatama || 0).toLocaleString();
          const hudTreasury = document.getElementById('hud-magatama-count');
          if (hudTreasury) hudTreasury.textContent = (globals.magatama || 0).toLocaleString();

          // In-place UI updates
          const levelEl = card.querySelector('.ascension-level-display');
          if (levelEl) {
            levelEl.textContent = isEndlessUpgrade ? `Rank ${nextLvl} (∞)` : (isNowMax ? 'MAX' : `Lv. ${nextLvl}/${u.max}`);
            levelEl.setAttribute('style', `font-family: 'Orbitron', monospace; font-size: 10px; color: ${isNowMax ? '#4ade80' : (isEndlessUpgrade ? '#fbbf24' : '#38bdf8')}; font-weight: bold; white-space: nowrap;`);
          }

          const pipsEl = card.querySelector('.ascension-pips');
          if (pipsEl && !isEndlessUpgrade) {
            let pipsStr = '';
            for (let i = 0; i < u.max; i++) {
              pipsStr += i < nextLvl ? '● ' : '○ ';
            }
            pipsEl.textContent = pipsStr;
          }

          const infoEl = card.querySelector('.ascension-level-info');
          if (infoEl) {
            infoEl.innerHTML = `
              <strong>${isJa ? '永続強化' : 'PERMANENT'}</strong> · ${isJa ? u.descJa : u.desc}
              ${permanentPreview(u.id, nextLvl, u.max, isEndlessUpgrade)}
              <div style="font-size: 9px; opacity: 0.85; margin-top: 2px;">${isJa ? 'レベル' : 'Level'} ${nextLvl} → ${isNowMax ? nextLvl : nextLvl + 1} · ${isJa?'上限':'Cap'} ${isEndlessUpgrade?'∞':u.max}</div>
            `;
          }

          if (isNowMax) {
            buyBtn.setAttribute('disabled', 'true');
            buyBtn.className = 'menu-btn btn-card';
            buyBtn.setAttribute('style', 'margin: 0; background: #14532d; border-color: #22c55e; color: #86efac; cursor: default; font-size: 10px; min-height: 28px; padding: 2px 6px;');
            buyBtn.innerHTML = '✓ MASTERED';
            card.style.borderColor = 'rgba(34, 197, 94, 0.4)';
            return false;
          } else {
            buyBtn.innerHTML = `
              <div>${isJa ? `強化: ${nextCost.toLocaleString()} 🪙` : `UPGRADE: ${nextCost.toLocaleString()} 🪙`}</div>
              <div style="font-size: 7.5px; opacity: 0.75; font-weight: normal; letter-spacing: 0.2px; margin-top: 1px; display: inline-flex; align-items: center; gap: 3px;"><div class="rpg-icon-box" style="width: 9px; height: 9px; border: none; background: transparent; box-shadow: none;"><img src="icons/rpg/fc1025.png" class="rpg-icon-img" /></div> ${isJa ? '長押しで連続強化' : 'HOLD TO RAPID UPGRADE'}</div>
            `;
            if (!canAffordNext) {
              buyBtn.setAttribute('disabled', 'true');
              buyBtn.style.cursor = 'not-allowed';
              buyBtn.style.opacity = '0.6';
              buyBtn.style.borderColor = '#475569';
              buyBtn.style.color = '#64748b';
              return false;
            }
          }

          card.style.transform = 'scale(1.025)';
          card.style.boxShadow = '0 0 16px rgba(251, 191, 36, 0.45)';
          setTimeout(() => {
            if (card) {
              card.style.transform = 'scale(1.0)';
              card.style.boxShadow = isEndlessUpgrade ? '0 0 12px rgba(251, 191, 36, 0.1)' : 'none';
            }
          }, 70);

          return true;
        };

        const stopHold = () => {
          if (!isHolding) return;
          isHolding = false;
          if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
          if (repeatTimer) { clearTimeout(repeatTimer); repeatTimer = null; }

          if (upgradesDone > 0) {
            safeStorage.setItem('stickmurai_magatama', globals.magatama.toString());
            safeStorage.setItem('stickmurai_campaign_upgrades', JSON.stringify(globals.campaignUpgrades));
            const finalLvl = ((globals.campaignUpgrades as any)[u.id]) || 0;
            window.dispatchEvent(new CustomEvent('qol-toast', {
              detail: `${isJa ? u.nameJa : u.name} Lv. ${finalLvl} (${upgradesDone > 1 ? `+${upgradesDone} ` : ''}▲) · ${isJa ? '残高' : 'Remaining'} ${globals.magatama.toLocaleString()} 🪙`
            }));
            populateAscensionUpgrades();
          }
        };

        const scheduleRepeat = () => {
          if (!isHolding) return;
          repeatTimer = setTimeout(() => {
            if (!isHolding) return;
            const ok = performOneUpgrade();
            if (ok) {
              currentInterval = Math.max(48, Math.floor(currentInterval * 0.82));
              scheduleRepeat();
            } else {
              stopHold();
            }
          }, currentInterval);
        };

        const startHold = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          if (isHolding) return;
          isHolding = true;
          upgradesDone = 0;
          currentInterval = 140;

          const ok = performOneUpgrade();
          if (!ok) {
            stopHold();
            return;
          }

          holdTimer = setTimeout(() => {
            if (!isHolding) return;
            scheduleRepeat();
          }, 260);
        };

        buyBtn.addEventListener('pointerdown', startHold);
        buyBtn.addEventListener('pointerup', stopHold);
        buyBtn.addEventListener('pointercancel', stopHold);
        buyBtn.addEventListener('pointerleave', stopHold);
      }

      container.appendChild(card);
    });
  });
}

export function triggerStageClear() {
  if (completeJourneyStage()) return;
  globals.gameState = 'paused';
  AdManager.gameplayStop();
  const levelUpModal = document.getElementById('level-up-screen');
  if (levelUpModal) levelUpModal.style.display = 'none';
  const ultModal = document.getElementById('ult-screen');
  if (ultModal) ultModal.style.display = 'none';
  const uiLayer = document.getElementById('ui-layer');
  if (uiLayer) uiLayer.style.display = 'none';
  const modal = document.getElementById('stage-clear-modal');
  if (!modal) return;

  const isJa = globals.currentLang === 'ja';
  playSynthesizedSingingBowl();
  playSynthesizedFusionUnlock();
  playStageConquered(0.9);

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
    safeStorage.setItem('stickmurai_cleared_stages', JSON.stringify(clearedStages));
  }

  // 3-Star Mastery Evaluation
  const totalParriesAndDodges = (globals.runStats?.parries || 0) + (globals.runStats?.perfectDodges || 0);
  const maxHearts = Math.max(1, globals.maxLives || 5);
  const currentHearts = Math.max(0, globals.lives || 0);
  const healthPercent = Math.round((currentHearts / maxHearts) * 100);

  const star1 = true; // Stage Conquered
  const star2 = totalParriesAndDodges >= 30; // 30 Parries & Dodges
  const star3 = healthPercent > 80; // >80% Health Remaining

  const earnedStars = (star1 ? 1 : 0) + (star2 ? 1 : 0) + (star3 ? 1 : 0);
  if (!globals.stageStars) globals.stageStars = {};
  const prevStars = globals.stageStars[currentStage] || 0;

  if (earnedStars > prevStars) {
    globals.stageStars[currentStage] = earnedStars;
    safeStorage.setItem('stickmurai_stage_stars', JSON.stringify(globals.stageStars));
  }

  // Mastery Bounty: +300 Magatama when achieving 3 stars for the first time
  let masteryBounty = 0;
  if (earnedStars === 3 && prevStars < 3) {
    masteryBounty = 300;
  }

  const previousTreasury = globals.magatama || 0;
  globals.magatama = previousTreasury + stageReward + masteryBounty;
  safeStorage.setItem('stickmurai_magatama', globals.magatama.toString());

  // Unlock next stage (Endless progression)
  const nextStage = currentStage + 1;
  globals.maxStageUnlocked = Math.max(globals.maxStageUnlocked || 1, nextStage);
  safeStorage.setItem('stickmurai_max_stage', globals.maxStageUnlocked.toString());

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
    starText1.textContent = isJa ? '討伐達成' : 'Conquered';
  }

  const starReq2 = document.getElementById('star-req-2');
  const starIcon2 = document.getElementById('star-icon-2');
  const starText2 = document.getElementById('star-text-2');
  if (starReq2 && starIcon2 && starText2) {
    starReq2.style.color = star2 ? '#ffd700' : '#64748b';
    starIcon2.textContent = star2 ? '⭐' : '☆';
    starText2.textContent = isJa
      ? `防・避 (${totalParriesAndDodges}/30)`
      : `Parry/Dodge (${totalParriesAndDodges}/30)`;
  }

  const starReq3 = document.getElementById('star-req-3');
  const starIcon3 = document.getElementById('star-icon-3');
  const starText3 = document.getElementById('star-text-3');
  if (starReq3 && starIcon3 && starText3) {
    starReq3.style.color = star3 ? '#ffd700' : '#64748b';
    starIcon3.textContent = star3 ? '⭐' : '☆';
    starText3.textContent = isJa
      ? `生存 (${healthPercent}% / >80%)`
      : `Health (${healthPercent}% / >80%)`;
  }

  const bountyBadge = document.getElementById('star-bounty-badge');
  if (bountyBadge) {
    bountyBadge.style.display = masteryBounty > 0 ? 'inline-block' : 'none';
    if (masteryBounty > 0) {
      bountyBadge.textContent = isJa ? '✨ +300 🪙 完全制覇' : '✨ +300 🪙';
    }
  }

  const rewardEl = document.getElementById('stage-clear-reward');
  if (rewardEl) {
    let rewardText = `+${stageReward.toLocaleString()} 🪙`;
    if (isFirstClear) {
      rewardText = `<span style="color: #ffd700; font-size: 11px; margin-right: 4px;">[FIRST 3×]</span> ` + rewardText;
    }
    if (masteryBounty > 0) {
      rewardText += ` <span style="color: #fbbf24; font-size: 11px; margin-left: 4px;">(+300 ⭐⭐⭐)</span>`;
    }
    rewardEl.innerHTML = rewardText;
  }

  const magEl = document.getElementById('stage-clear-magatama');
  if (magEl) {
    magEl.textContent = previousTreasury.toLocaleString() + ' 🪙';
    
    // Smooth currency queue count-up animation
    const animStartTime = performance.now() + 350;
    const animDuration = 1000;
    const stepCount = (now: number) => {
      if (now < animStartTime) {
        requestAnimationFrame(stepCount);
        return;
      }
      const elapsed = now - animStartTime;
      const progress = Math.min(1, elapsed / animDuration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const cur = Math.round(previousTreasury + (globals.magatama - previousTreasury) * eased);
      magEl.textContent = cur.toLocaleString() + ' 🪙';
      magEl.style.color = '#ffd700';
      magEl.style.transform = progress < 1 ? 'scale(1.08)' : 'scale(1)';
      magEl.style.transition = 'transform 0.06s ease';
      if (progress < 1) {
        requestAnimationFrame(stepCount);
      } else {
        magEl.textContent = (globals.magatama || 0).toLocaleString() + ' 🪙';
        magEl.style.color = '#4ade80';
        magEl.style.transform = 'scale(1)';
        refreshAllMagatamaDisplays();
      }
    };
    requestAnimationFrame(stepCount);
  }

  // Double Soul Bounty Rewarded Ad
  const doubleBtn = document.getElementById('stage-clear-double-btn');
  if (doubleBtn) {
    globals.stageDoubleRewardClaimed = false;
    doubleBtn.removeAttribute('disabled');
    (doubleBtn as HTMLElement).style.opacity = '1';
    (doubleBtn as HTMLElement).style.pointerEvents = 'auto';
    doubleBtn.textContent = isJa ? `🎬 +2倍獲得 🪙` : `🎬 +DOUBLE 🪙`;
    
    // Replace with fresh button to eliminate duplicate event listeners
    const freshBtn = doubleBtn.cloneNode(true) as HTMLButtonElement;
    doubleBtn.parentNode?.replaceChild(freshBtn, doubleBtn);
    
    freshBtn.addEventListener('click', () => {
      if (globals.stageDoubleRewardClaimed) return;
      AdManager.showRewardedAd('double-reward', {
        onComplete: () => {
          globals.stageDoubleRewardClaimed = true;
          const doubleStart = globals.magatama || 0;
          const doubleTarget = doubleStart + stageReward;
          globals.magatama = doubleTarget;
          safeStorage.setItem('stickmurai_magatama', globals.magatama.toString());
          try { playSynthesizedSingingBowl(); } catch(e) {}
          freshBtn.setAttribute('disabled', 'true');
          freshBtn.style.opacity = '0.6';
          freshBtn.style.pointerEvents = 'none';
          freshBtn.textContent = isJa ? `✓ 2倍達成！` : `✓ 2× DOUBLED`;
          if (rewardEl) {
            rewardEl.innerHTML = `<span style="color: #ffd700; font-size: 11px; margin-right: 4px;">[2× MON BOUNTY]</span> +${(stageReward * 2).toLocaleString()} 🪙`;
          }
          if (magEl) {
            const dStart = performance.now();
            const dDur = 800;
            const stepDouble = (now: number) => {
              const elap = now - dStart;
              const prog = Math.min(1, elap / dDur);
              const e = 1 - Math.pow(1 - prog, 3);
              const cur = Math.round(doubleStart + stageReward * e);
              magEl.textContent = cur.toLocaleString() + ' 🪙';
              magEl.style.color = '#ffd700';
              magEl.style.transform = prog < 1 ? 'scale(1.08)' : 'scale(1)';
              if (prog < 1) {
                requestAnimationFrame(stepDouble);
              } else {
                magEl.textContent = doubleTarget.toLocaleString() + ' 🪙';
                magEl.style.color = '#4ade80';
                magEl.style.transform = 'scale(1)';
                refreshAllMagatamaDisplays();
              }
            };
            requestAnimationFrame(stepDouble);
          }
          showToast(isJa ? `🪙 獲得文が2倍になりました！(+${stageReward} 文)` : `🪙 Treasury bounty doubled! (+${stageReward} Mon)`);
        },
        onFailed: () => {
          showToast(isJa ? '広告の準備ができていません。後ほどお試しください。' : 'Ad not available right now. Please try again later.');
        }
      });
    });
  }

  const nextBtn = document.getElementById('stage-clear-next-btn');
  if (nextBtn) {
    const ctaText = nextBtn.querySelector('.cta-text');
    const label = isJa ? `ステージ ${currentStage + 1} へ` : `NEXT STAGE ${currentStage + 1}`;
    if (ctaText) {
      ctaText.textContent = label;
    } else {
      nextBtn.innerHTML = `<span class="cta-sword">⚔️</span><span class="cta-text">${label}</span><span class="cta-arrow">➔</span>`;
    }
  }

  populateAscensionUpgrades();
  modal.style.display = 'flex';
}

callbacks.openShrineCommuneModal = openShrineCommuneModal;
callbacks.openHermitPactModal = openHermitPactModal;
callbacks.triggerDawnVictory = triggerDawnVictory;
callbacks.triggerStageClear = triggerStageClear;
callbacks.refreshAllMagatamaDisplays = refreshAllMagatamaDisplays;

