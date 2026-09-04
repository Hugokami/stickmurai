import { globals } from './globals';
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
  const uiLayer = document.getElementById('ui-layer')!;
  const mobileControls = document.getElementById('mobile-controls')!;
  const bgmVolumeSlider = document.getElementById('bgm-volume') as HTMLInputElement;

  // menu listeners
  document.getElementById('start-btn')!.addEventListener('click', () => {
    mainMenu.style.display = 'none';
    globals.gameMode = 'classic';
    skillSelectScreen.style.display = 'flex';
    globals.activeBlessing = null;
    updateBlessingSelectionUI();
    renderSkillChoicesPregame();
  });

  document.getElementById('level-mode-btn')!.addEventListener('click', () => {
    mainMenu.style.display = 'none';
    globals.gameMode = 'level';
    skillSelectScreen.style.display = 'flex';
    globals.activeBlessing = null;
    updateBlessingSelectionUI();
    renderSkillChoicesPregame();
  });

  document.getElementById('zen-btn')!.addEventListener('click', () => {
    mainMenu.style.display = 'none';
    globals.gameMode = 'zen';
    skillSelectScreen.style.display = 'flex';
    globals.activeBlessing = null;
    updateBlessingSelectionUI();
    renderSkillChoicesPregame();
  });

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

  const openGrimoire = () => {
    if (grimoireScreen) {
      grimoireScreen.style.display = 'flex';
      populateGrimoireGrid();
    }
  };

  if (openGrimoireBtn) openGrimoireBtn.addEventListener('click', openGrimoire);
  if (pauseGrimoireBtn) pauseGrimoireBtn.addEventListener('click', openGrimoire);
  if (closeGrimoireBtn) {
    closeGrimoireBtn.addEventListener('click', () => {
      if (grimoireScreen) grimoireScreen.style.display = 'none';
    });
  }

  const chronicleScreen = document.getElementById('chronicle-screen');
  const openChronicleBtn = document.getElementById('open-chronicle-btn');
  const closeChronicleBtn = document.getElementById('close-chronicle-btn');

  if (openChronicleBtn) {
    openChronicleBtn.addEventListener('click', () => {
      if (chronicleScreen) {
        chronicleScreen.style.display = 'flex';
        populateChronicleList();
      }
    });
  }
  if (closeChronicleBtn) {
    closeChronicleBtn.addEventListener('click', () => {
      if (chronicleScreen) chronicleScreen.style.display = 'none';
    });
  }

  // Shrine & Hermit Modal Listeners
  const onShatterSeal = () => {
    if (globals.activeShrine) {
      const sealId = globals.activeShrine.sealId;
      if (!globals.unlockedSeals.includes(sealId)) {
        globals.unlockedSeals.push(sealId);
        try { localStorage.setItem('stickmurai_seals', JSON.stringify(globals.unlockedSeals)); } catch(e) {}
        YOMI_SEALS[sealId]?.applyPermanentReward();
        playSynthesizedSealShatter();
        globals.screenShake = Math.max(globals.screenShake, 42);
        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 100, globals.currentLang === 'ja' ? '⛩️ 封印砕散！ 恒久恩恵開眼！' : '⛩️ SEAL SHATTERED! PERMANENT BLESSING UNLEASHED!', '#ffd700', 34));
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
  if (shrineClaimBtn) {
    shrineClaimBtn.addEventListener('click', onShatterSeal);
    shrineClaimBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); onShatterSeal(); });
  }
  if (shrineCommuneBtn) {
    shrineCommuneBtn.addEventListener('click', onShatterSeal);
    shrineCommuneBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); onShatterSeal(); });
  }
  if (shrineLeaveBtn) {
    shrineLeaveBtn.addEventListener('click', closeShrineModal);
    shrineLeaveBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); closeShrineModal(); });
  }

  const hermitChoice1Btn = document.getElementById('hermit-pact-choice-1');
  const hermitChoice2Btn = document.getElementById('hermit-pact-choice-2');
  const hermitLeaveBtn = document.getElementById('hermit-leave-btn');

  if (hermitChoice1Btn) {
    hermitChoice1Btn.addEventListener('click', () => {
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
  }

  if (hermitChoice2Btn) {
    hermitChoice2Btn.addEventListener('click', () => {
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
  }

  if (hermitLeaveBtn) hermitLeaveBtn.addEventListener('click', closeHermitModal);

  // Dawn Victory return button
  const dawnReturnBtn = document.getElementById('dawn-return-btn');
  if (dawnReturnBtn) {
    dawnReturnBtn.addEventListener('click', () => {
      const dawnScreen = document.getElementById('dawn-victory-screen');
      if (dawnScreen) dawnScreen.style.display = 'none';
      globals.gameState = 'mainmenu';
      mainMenu.style.display = 'flex';
      uiLayer.style.display = 'none';
      mobileControls.style.display = 'none';
      pauseBgm();
    });
  }


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
  if (!container) return;
  container.innerHTML = '';
  skillsData.forEach((skill: any) => {
    const card = document.createElement('div');
    card.className = `skill-card ${globals.selectedSkill === skill.id ? 'active' : ''}`;
    
    let category = 'basic';
    if (skill.id === 'enhance') category = 'vitality';
    else if (skill.id === 'shield') category = 'wind';
    else if (skill.id === 'dash') category = 'thunder';
    else if (skill.id === 'firewheel') category = 'fire';
    else if (skill.id === 'gravity') category = 'void';
    else if (skill.id === 'parry_master') category = 'wind';
    else if (skill.id === 'decoy_illusion') category = 'void';
    
    card.classList.add(`category-${category}`);
    card.innerHTML = `<span class="skill-category-badge">${category}</span><h3>${t(skill.nameKey)}</h3><p>${t(skill.descKey)}</p>`;
    card.addEventListener('click', () => {
      globals.selectedSkill = skill.id as any;
      document.querySelectorAll('#pregame-skill-choices .skill-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });
    container.appendChild(card);
  });

  // Update pre-game difficulty buttons active state on screen show
  const diffEasyBtn = document.getElementById('diff-easy-btn');
  const diffNormalBtn = document.getElementById('diff-normal-btn');
  const diffHardBtn = document.getElementById('diff-hard-btn');
  const diffInsaneBtn = document.getElementById('diff-insane-btn');
  if (diffEasyBtn && diffNormalBtn && diffHardBtn && diffInsaneBtn) {
    diffEasyBtn.classList.remove('active');
    diffNormalBtn.classList.remove('active');
    diffHardBtn.classList.remove('active');
    diffInsaneBtn.classList.remove('active');
    if (globals.difficulty === 'easy') diffEasyBtn.classList.add('active');
    else if (globals.difficulty === 'normal') diffNormalBtn.classList.add('active');
    else if (globals.difficulty === 'hard') diffHardBtn.classList.add('active');
    else if (globals.difficulty === 'insane') diffInsaneBtn.classList.add('active');
  }

  // Show/Hide time mode / level mode pregame option panels
  const timeOptions = document.getElementById('pregame-time-options');
  const levelOptions = document.getElementById('pregame-level-options');
  if (timeOptions) timeOptions.style.display = 'flex'; // Always show time limit options
  if (levelOptions) levelOptions.style.display = globals.gameMode === 'level' ? 'flex' : 'none';

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

    if (isDiscovered) {
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-family:'Cinzel', serif; font-size:16px; font-weight:bold; color:#ffd700;">${isJa ? recipe.nameJa : recipe.nameEn}</span>
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
          <span style="font-family:'Cinzel', serif; font-size:16px; font-weight:bold; color:#64748b;">??? [${isJa ? '未解読の奥義' : 'LOCKED FUSION'}]</span>
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
          <span style="background:${req1Met ? 'rgba(34,197,94,0.15)' : '#090d16'}; padding:3px 8px; border-radius:4px; border:${req1Met ? '1px solid #22c55e' : '1px solid #1e293b'}; color:${req1Met ? '#86efac' : '#64748b'};">? ${isJa ? recipe.req1Ja : recipe.req1En} ${req1Met ? '✓' : ''}</span>
          <span>+</span>
          <span style="background:${req2Met ? 'rgba(34,197,94,0.15)' : '#090d16'}; padding:3px 8px; border-radius:4px; border:${req2Met ? '1px solid #22c55e' : '1px solid #1e293b'}; color:${req2Met ? '#86efac' : '#64748b'};">? ${isJa ? recipe.req2Ja : recipe.req2En} ${req2Met ? '✓' : ''}</span>
        </div>
      `;
    }
    grid.appendChild(card);
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

  const contentEl = document.getElementById('dawn-stats-content');
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

callbacks.openShrineCommuneModal = openShrineCommuneModal;
callbacks.openHermitPactModal = openHermitPactModal;
callbacks.triggerDawnVictory = triggerDawnVictory;
