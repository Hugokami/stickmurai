import { globals } from './globals';
import { i18n, skillsData } from './assets';
import { bgmAudio, pauseBgm } from './audio';
import { callbacks } from './callbacks';
import { pvpManager } from './pvpIaijutsuManager';
import { AdManager } from './adManager';

const t = (key: string): string => i18n[globals.currentLang]?.[key] || key;

// DOM cache
let enhanceCooldownOverlay: HTMLElement;
let enhanceCooldownText: HTMLElement;
let dashCooldownOverlay: HTMLElement;
let dashCooldownText: HTMLElement;
let attackCooldownOverlay: HTMLElement;
let ultCooldownOverlay: HTMLElement;
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
let lastLives = 5;

export function initUI(onPlayCallback: () => void, onZenPlayCallback: () => void, onRestartCallback: () => void) {
  // DOM queries
  enhanceCooldownOverlay = document.getElementById('enhance-cooldown-overlay')!;
  enhanceCooldownText = document.getElementById('enhance-cooldown-text')!;
  dashCooldownOverlay = document.getElementById('dash-cooldown-overlay')!;
  dashCooldownText = document.getElementById('dash-cooldown-text')!;
  attackCooldownOverlay = document.getElementById('attack-cooldown-overlay')!;
  ultCooldownOverlay = document.getElementById('ult-cooldown-overlay')!;
  
  flowMeterFill = document.getElementById('flow-meter-fill')!;
  flowMeterContainer = document.getElementById('flow-meter-container')!;
  expMeterFill = document.getElementById('exp-meter-fill')!;
  scoreDisplay = document.getElementById('score-display')!;
  comboDisplay = document.getElementById('combo-display')!;
  heartsElements = document.querySelectorAll('.heart');

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
    card.innerHTML = `<h3>${t(skill.nameKey)}</h3><p>${t(skill.descKey)}</p>`;
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
  const btnUlt = document.getElementById('btn-ult')!;
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
      
      const btn = document.getElementById('btn-enhance');
      if (btn) {
        if (!btn.classList.contains('buff-active')) btn.classList.add('buff-active');
        btn.classList.remove('ready');
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
      
      const btn = document.getElementById('btn-enhance');
      if (btn) {
        btn.classList.remove('buff-active');
        if (globals.enhanceCooldown <= 0) {
          btn.classList.add('ready');
        } else {
          btn.classList.remove('ready');
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
  const btnDash = document.getElementById('btn-dash');
  if (btnDash) {
    if (globals.player && globals.player.dashCooldown <= 0) {
      btnDash.classList.add('ready');
    } else {
      btnDash.classList.remove('ready');
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
    const p = Math.round((1 - globals.flow / globals.playerStats.flowMax) * 100);
    if (p !== lastUltOverlayHeight) {
      ultCooldownOverlay.style.height = `${p}%`;
      lastUltOverlayHeight = p;
    }
  }
  
  if (globals.flow >= globals.playerStats.flowMax && globals.flowState === 'normal') {
    btnUlt.classList.add('ready');
  } else {
    btnUlt.classList.remove('ready');
  }
}

export function updateUI() {
  if (!flowMeterFill || !expMeterFill || !scoreDisplay) return;
  flowMeterFill.style.width = `${(globals.flow/globals.playerStats.flowMax)*100}%`;
  expMeterFill.style.width = `${(globals.exp/globals.maxExp)*100}%`;
  
  if (globals.flow >= globals.playerStats.flowMax && globals.flowState === 'normal') { 
    flowMeterContainer.classList.add('max-flow'); 
  } else { 
    flowMeterContainer.classList.remove('max-flow'); 
  }
  
  scoreDisplay.textContent = `Kills: ${globals.score}`;

  const objDisplay = document.getElementById('objective-display');
  if (objDisplay) {
    if (globals.gameState === 'playing') {
      if (globals.timerLimit !== 'endless') {
        objDisplay.style.display = 'block';
        const mins = Math.floor(globals.timeModeTimeRemaining / 60);
        const secs = Math.floor(globals.timeModeTimeRemaining % 60);
        const secsStr = secs < 10 ? '0' + secs : secs;
        if (globals.gameMode === 'level') {
          objDisplay.textContent = `GOAL: LVL ${globals.levelModeTarget} | TIME: ${mins}:${secsStr}`;
        } else {
          objDisplay.textContent = `TIME: ${mins}:${secsStr}`;
        }
      } else if (globals.gameMode === 'level') {
        objDisplay.style.display = 'block';
        objDisplay.textContent = `GOAL: LVL ${globals.levelModeTarget}`;
      } else {
        objDisplay.style.display = 'none';
      }
    } else {
      objDisplay.style.display = 'none';
    }
  }
  
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
