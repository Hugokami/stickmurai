import './style.css';
import { initQol, clearGameInputs, actionBuffer, qolSettings } from './qol';
import { initRuntimeQol, isPractice, practiceStep, recordHurt, resetRunFeedback, showDefeatFeedback, updateThreats } from './runtimeQol';
import { assetReadiness, retryRequiredAssets } from './assets';
import { safeStorage } from './storage';
import { globals, getStageAffix } from './globals';
import { callbacks, assetCallbacks } from './callbacks';
import { i18n, loaderTips, startBackgroundAssetLoading, loadCoreCombatAssetsNow } from './assets';
import {
  playSound,
  sfx,
  playSynthesizedHit,
  playSynthesizedHurt,
  playSynthesizedParry,
  playSynthesizedPerfectParry,
  playSynthesizedDodge,
  playSynthesizedEnhance,
  playSynthesizedAwaken,
  playSynthesizedThunder,
  playSynthesizedCharge,
  playSynthesizedFirewheel,
  playSynthesizedGravity,
  playSynthesizedLevelUp,
  playSynthesizedClash,
  playSynthesizedTempleBell,
  playSynthesizedSingingBowl,
  startBgm,
  playSwordClash,
  playEnergyBeam,
  playTeleportSfx,
  playAffixAlert,
  playMagatamaPickup,
  playPrimalZap,
  getConsecutiveParries,
  playSynthesizedSheathe
} from './audio';
import {
  Afterimage,
  Particle,
  Slash,
  Projectile,
  Shockwave,
  FloatingText,
  Decoy,
  Collectible,
  LightningBeam,
  PvPShockwave,
  AnimatedEffect,
  GroundScar
} from './entities';
import { pvpManager } from './pvpIaijutsuManager';
import { initPvPLobby, updatePvpHud, showRoundBanner, updateTurnBadge, recordMatchResult } from './pvpLobby';
import { Player } from './player';
import { Enemy, triggerBarrelExplosion } from './enemy';
import { vfxAnims } from './assets';

let localRematchReady = false;
let remoteRematchReady = false;
let stormLightningTimer = 0.0;
let isZanFinisherActive = false;
let thunderGaleTimer = 0.0;
let gravityCollapseTimer = 0.0;
import { WeatherEngine } from './weather';
import { checkShrineSpawns, triggerCalamityCheck, YOMI_SEALS, spawnShrine, notifyFeatMilestone } from './shrine';
let bossEncounterDamaged = false;
let shogunSpawned = false;

// Import helper modules
import { initInput, pollGamepad } from './input';
import { initUI, updateUI, updateEnhanceButton, updateStaticText, updateComboDisplay } from './ui';
import { initRenderer, draw, resetCanvasVisuals } from './renderer';
import { triggerLevelUp, activateAwakening, applyRandomStartUpgrade } from './powerups';

// register callbacks
callbacks.t = t;
callbacks.playSound = playSound;
callbacks.revivePlayer = revivePlayer;
callbacks.playSynthesizedHit = playSynthesizedHit;
callbacks.playSynthesizedHurt = playSynthesizedHurt;
callbacks.playSynthesizedParry = playSynthesizedParry;
callbacks.playSynthesizedPerfectParry = playSynthesizedPerfectParry;
callbacks.playSynthesizedDodge = playSynthesizedDodge;
callbacks.playSynthesizedThunder = playSynthesizedThunder;
callbacks.playSynthesizedEnhance = playSynthesizedEnhance;
callbacks.playSynthesizedLevelUp = playSynthesizedLevelUp;
callbacks.playSynthesizedAwaken = playSynthesizedAwaken;
callbacks.playSynthesizedFirewheel = playSynthesizedFirewheel;
callbacks.playSynthesizedGravity = playSynthesizedGravity;
callbacks.hitEnemy = hitEnemy;
callbacks.checkPlayerHit = checkPlayerHit;
callbacks.killEnemy = killEnemy;
callbacks.addCombo = addCombo;
callbacks.addFlow = addFlow;
callbacks.updateUI = updateUI;
callbacks.updateEnhanceButton = updateEnhanceButton;
callbacks.updateComboDisplay = updateComboDisplay;
callbacks.triggerFlowingCounterReset = triggerFlowingCounterReset;
callbacks.triggerElementalExplosion = triggerElementalExplosion;
(callbacks as any).triggerStormGodLightning = triggerStormGodLightning;
(callbacks as any).triggerVortexShatter = triggerVortexShatter;

export function clearBattlefield() {
  globals.enemies = [];
  globals.slashes = [];
  globals.projectiles = [];
  globals.particles = [];
  globals.afterimages = [];
  globals.shockwaves = [];
  globals.floatingTexts = [];
  globals.animatedEffects = [];
  globals.lightningBeams = [];
  globals.sakuraPetals = [];
  globals.collectibles = [];
  globals.judgementDomes = [];
  globals.groundScars = [];
  globals.bouncingSickles = [];
  globals.plasmaTrails = [];
  globals.destructibleProps = [];
  globals.windForces = [];
  globals.screenShake = 0;
  if (globals.player) {
    globals.player.setState('idle');
    globals.player.vx = 0;
    globals.player.vy = 0;
  }
}

export function handleQuitToMainMenu() {
  globals.gameState = 'mainmenu';
  clearGameInputs();
  resetRunFeedback();
  clearBattlefield();
  resetCanvasVisuals();
  startOrResumeGameLoop();
}

callbacks.onQuitToMainMenu = handleQuitToMainMenu;

assetCallbacks.onProgress = updateLoaderProgress;

let firewheelTickTimer = 0;
let firewheelProjectileTimer = 0;
let gravityTickTimer = 0;

let loaderStickmanFrame = 1;
let loaderStickmanInterval: any = null;
let loadingFinished = false;
let loaderTimeoutId: any = null;

function finishLoading() {
  if (loadingFinished) return;
  if (!assetReadiness().ready) return;
  loadingFinished = true;
  
  if (loaderTimeoutId) {
    clearTimeout(loaderTimeoutId);
    loaderTimeoutId = null;
  }
  if (typeof (window as any).__loaderFailSafeTimer !== 'undefined') {
    clearTimeout((window as any).__loaderFailSafeTimer);
  }

  const fill = document.getElementById('loader-fill');
  const flare = document.getElementById('loader-bar-flare');
  const percentText = document.getElementById('loader-percent-text');
  const text = document.getElementById('loader-text');
  const statusText = document.getElementById('loader-status');

  if (fill) fill.style.width = '100%';
  if (flare) flare.style.left = '100%';
  if (percentText) percentText.innerText = '100%';
  if (text) {
    text.innerText = t('tapToContinue') || 'TAP / CLICK TO CONTINUE';
    text.classList.add('ready-to-continue');
  }
  if (statusText) statusText.innerText = "READY";

  const loaderScreen = document.getElementById('loader-screen');
  if (loaderScreen && !loaderScreen.dataset.bound) {
    loaderScreen.dataset.bound = 'true';
    let transitioned = false;
    const onContinue = (e?: Event) => {
      if (transitioned) return;
      transitioned = true;
      if (e) e.stopPropagation();
      loaderScreen.removeEventListener('click', onContinue);
      loaderScreen.removeEventListener('touchstart', onContinue);
      loaderScreen.removeEventListener('pointerdown', onContinue);
      
      clearInterval(tipsInterval);
      if (loaderStickmanInterval) {
        clearInterval(loaderStickmanInterval);
      }
      
      const proceedToMenu = () => {
        loaderScreen.classList.add('fade-out');
        setTimeout(() => {
          loaderScreen.classList.add('hidden');
          loaderScreen.style.display = 'none';
          const mainMenu = document.getElementById('main-menu');
          if (mainMenu) mainMenu.style.display = 'flex';
        }, 350);
      };

      // Guaranteed direct progression to menu
      proceedToMenu();

      // Optional fullscreen attempt on user gesture
      if (e && e.isTrusted) {
        tryEnterFullscreen(() => {});
      }
    };

    loaderScreen.addEventListener('click', onContinue);
    loaderScreen.addEventListener('touchstart', onContinue);
    loaderScreen.addEventListener('pointerdown', onContinue);

    // Auto-proceed after 600ms so mobile players don't need to guess to tap
    setTimeout(() => {
      onContinue();
    }, 600);
  }
}

function startLoaderStickmanAnimation() {
  const img = document.getElementById('loader-stickman-img') as HTMLImageElement;
  if (!img) return;
  loaderStickmanInterval = setInterval(() => {
    const currentImg = document.getElementById('loader-stickman-img') as HTMLImageElement;
    if (currentImg) {
      loaderStickmanFrame = (loaderStickmanFrame % 8) + 1;
      currentImg.src = encodeURI(`sprites/Stick Figure Character Sprites 2D/Sword sprites/sword_Idle_000${loaderStickmanFrame}.png`);
    }
  }, 120);
}

let currentTipIndex = 0;
const tipsInterval = setInterval(() => {
  const tipElement = document.getElementById('loader-tip');
  const lang = globals.currentLang === 'ja' ? 'ja' : 'en';
  const tips = loaderTips[lang];
  if (tipElement && tips && tips.length > 0) {
    tipElement.classList.add('fade-out');
    setTimeout(() => {
      currentTipIndex = (currentTipIndex + 1) % tips.length;
      tipElement.innerText = tips[currentTipIndex];
      tipElement.classList.remove('fade-out');
    }, 300);
  }
}, 2800);

function updateLoaderProgress() {
  const readiness = assetReadiness();
  const percent = readiness.total > 0 ? Math.round(readiness.loaded / readiness.total * 100) : 0;
  const fill = document.getElementById('loader-fill');
  const flare = document.getElementById('loader-bar-flare');
  const text = document.getElementById('loader-text');
  const percentText = document.getElementById('loader-percent-text');
  const statusText = document.getElementById('loader-status');

  if (fill) fill.style.width = percent + '%';
  if (flare) flare.style.left = percent + '%';
  if (percentText) percentText.innerText = percent + '%';

  if (!loadingFinished) {
    if (text) text.innerText = t('loading') || 'LOADING RESOURCES';
  } else {
    if (text) {
      text.innerText = t('tapToContinue') || 'TAP / CLICK TO CONTINUE';
      text.classList.add('ready-to-continue');
    }
  }

  if (statusText) {
    statusText.textContent = readiness.ready ? 'Heroes & combat effects ready · Audio loads separately' : `Heroes & combat effects: ${readiness.loaded}/${readiness.total}${readiness.failed ? ` · ${readiness.failed} downloads need retry` : ''}`;
  }
  
  if (readiness.ready && !loadingFinished) {
    finishLoading();
  }
}

function t(key: string): string { return i18n[globals.currentLang]?.[key] || key; }

function tryEnterFullscreen(onComplete: () => void) {
  const docEl = document.documentElement as any;
  const requestFS = docEl.requestFullscreen || 
                    docEl.webkitRequestFullscreen || 
                    docEl.mozRequestFullScreen || 
                    docEl.msRequestFullscreen;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isPWA = (navigator as any).standalone || 
                window.matchMedia('(display-mode: standalone)').matches || 
                window.matchMedia('(display-mode: fullscreen)').matches;

  // On iOS Safari (not PWA), standard Fullscreen API is not supported on document elements.
  // Do not prompt the user as it will always fail and annoy them.
  if (isIOS && !isPWA) {
    onComplete();
    return;
  }

  // If already in fullscreen, proceed directly
  const isCurrentlyFS = !!(document.fullscreenElement || 
                           (document as any).webkitFullscreenElement || 
                           (document as any).mozFullScreenElement || 
                           (document as any).msFullscreenElement);
  if (isCurrentlyFS) {
    onComplete();
    return;
  }

  if (requestFS) {
    try {
      const res = requestFS.call(docEl);
      if (res && typeof res.then === 'function') {
        res.then(() => {
          onComplete();
        }).catch((err: any) => {
          console.warn("Fullscreen request rejected (continuing):", err);
          onComplete();
        });
      } else {
        onComplete();
      }
    } catch (err) {
      console.warn("Fullscreen request crashed (continuing):", err);
      onComplete();
    }
  } else {
    onComplete();
  }
}

export function showFullscreenPrompt(onComplete: () => void) {
  const prompt = document.getElementById('fullscreen-prompt');
  if (!prompt) {
    onComplete();
    return;
  }
  
  prompt.style.display = 'flex';
  
  const btnYes = document.getElementById('fs-btn-yes');
  const btnNo = document.getElementById('fs-btn-no');
  
  const handleYes = (e?: Event) => {
    if (e) e.stopPropagation();
    prompt.style.display = 'none';
    cleanup();
    const docEl = document.documentElement as any;
    const requestFS = docEl.requestFullscreen || 
                      docEl.webkitRequestFullscreen || 
                      docEl.mozRequestFullScreen || 
                      docEl.msRequestFullscreen;
    if (requestFS) {
      try {
        requestFS.call(docEl).catch((err: any) => {
          console.warn("Fullscreen retry failed:", err);
        }).finally(() => {
          onComplete();
        });
      } catch (err) {
        onComplete();
      }
    } else {
      onComplete();
    }
  };
  
  const handleNo = (e?: Event) => {
    if (e) e.stopPropagation();
    prompt.style.display = 'none';
    cleanup();
    onComplete();
  };
  
  const cleanup = () => {
    btnYes?.removeEventListener('click', handleYes);
    btnYes?.removeEventListener('pointerdown', handleYes);
    btnNo?.removeEventListener('click', handleNo);
    btnNo?.removeEventListener('pointerdown', handleNo);
  };
  
  btnYes?.addEventListener('click', handleYes);
  btnYes?.addEventListener('pointerdown', handleYes);
  btnNo?.addEventListener('click', handleNo);
  btnNo?.addEventListener('pointerdown', handleNo);
}

const isMobile = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
let rotatePromptDismissed = safeStorage.getItem('stickmurai_rotate_dismissed') === 'true';
let rotateAutoDismissTimer: any = null;

function checkOrientationAndFullscreen() {
  if (!isMobile) return;

  const rotatePrompt = document.getElementById('rotate-prompt');
  const fsEnterBtn = document.getElementById('fs-enter-btn') as HTMLButtonElement;
  const rotateDismissBtn = document.getElementById('rotate-dismiss-btn') as HTMLButtonElement;
  const rotateCloseBtn = document.getElementById('rotate-close-btn') as HTMLButtonElement;
  const rotateMessage = document.getElementById('rotate-message');
  const iosPwaTip = document.getElementById('ios-pwa-tip');

  if (!rotatePrompt) return;

  const dismissRotate = (e?: Event) => {
    if (e) e.stopPropagation();
    rotatePromptDismissed = true;
    safeStorage.setItem('stickmurai_rotate_dismissed', 'true');
    if (rotateAutoDismissTimer) {
      clearTimeout(rotateAutoDismissTimer);
      rotateAutoDismissTimer = null;
    }
    rotatePrompt.style.display = 'none';
  };

  if (rotateCloseBtn && !rotateCloseBtn.dataset.bound) {
    rotateCloseBtn.dataset.bound = 'true';
    rotateCloseBtn.addEventListener('click', dismissRotate);
    rotateCloseBtn.addEventListener('pointerdown', dismissRotate);
  }

  if (rotateDismissBtn && !rotateDismissBtn.dataset.bound) {
    rotateDismissBtn.dataset.bound = 'true';
    rotateDismissBtn.addEventListener('click', dismissRotate);
    rotateDismissBtn.addEventListener('pointerdown', dismissRotate);
  }

  if (rotatePromptDismissed) {
    rotatePrompt.style.display = 'none';
    return;
  }

  const isPortrait = window.innerHeight > window.innerWidth;
  const fsApproved = safeStorage.getItem('stickmurai_fs_approved') === 'true';
  const isCurrentlyFS = !!(document.fullscreenElement || 
                           (document as any).webkitFullscreenElement || 
                           (document as any).mozFullScreenElement || 
                           (document as any).msFullscreenElement);
  
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isPWA = (navigator as any).standalone || 
                window.matchMedia('(display-mode: standalone)').matches || 
                window.matchMedia('(display-mode: fullscreen)').matches;
  
  const docEl = document.documentElement as any;
  const supportsFS = !!(docEl.requestFullscreen || 
                       docEl.webkitRequestFullscreen || 
                       docEl.mozRequestFullScreen || 
                       docEl.msRequestFullscreen);

  const canGoFullscreen = supportsFS && !isPWA;

  if (isPortrait) {
    rotatePrompt.style.display = 'flex';
    if (!rotateAutoDismissTimer) {
      rotateAutoDismissTimer = setTimeout(() => {
        dismissRotate();
      }, 5000);
    }
    if (rotateMessage) {
      if (!fsApproved) {
        rotateMessage.innerHTML = '<strong data-i18n="rotatePrompt">' + t('rotatePrompt') + '</strong>';
        if (fsEnterBtn) {
          fsEnterBtn.style.display = 'inline-block';
          fsEnterBtn.innerText = globals.currentLang === 'ja' ? '確認' : 'CONFIRM';
          if (!fsEnterBtn.dataset.bound) {
            fsEnterBtn.dataset.bound = 'true';
            const enterFS = (e?: Event) => {
              if (e) e.stopPropagation();
              safeStorage.setItem('stickmurai_fs_approved', 'true');
              safeStorage.setItem('stickmurai_rotate_dismissed', 'true');
              rotatePromptDismissed = true;
              if (rotateAutoDismissTimer) {
                clearTimeout(rotateAutoDismissTimer);
                rotateAutoDismissTimer = null;
              }
              const requestFS = docEl.requestFullscreen || 
                                docEl.webkitRequestFullscreen || 
                                docEl.mozRequestFullScreen || 
                                docEl.msRequestFullscreen;
              if (requestFS) {
                try {
                  requestFS.call(docEl).catch((err: any) => {
                    console.warn("Fullscreen request rejected:", err);
                  });
                } catch(e) {}
              }
              dismissRotate();
            };
            fsEnterBtn.addEventListener('click', enterFS);
            fsEnterBtn.addEventListener('pointerdown', enterFS);
          }
        }
      } else {
        rotateMessage.innerHTML = '<strong data-i18n="rotateInstruction">' + t('rotateInstruction') + '</strong>';
        if (fsEnterBtn) fsEnterBtn.style.display = 'none';
      }
    }
    if (iosPwaTip) {
      iosPwaTip.style.display = isIOS && !isPWA ? 'block' : 'none';
    }
  } else {
    if (!fsApproved && canGoFullscreen) {
      rotatePrompt.style.display = 'flex';
      if (!rotateAutoDismissTimer) {
        rotateAutoDismissTimer = setTimeout(() => {
          dismissRotate();
        }, 5000);
      }
      if (rotateMessage) {
        rotateMessage.innerHTML = '<strong data-i18n="rotatePrompt">' + t('rotatePrompt') + '</strong>';
      }
      if (fsEnterBtn) {
        fsEnterBtn.style.display = 'inline-block';
        fsEnterBtn.innerText = globals.currentLang === 'ja' ? '確認' : 'CONFIRM';
        if (!fsEnterBtn.dataset.bound) {
          fsEnterBtn.dataset.bound = 'true';
          const enterFS = (e?: Event) => {
            if (e) e.stopPropagation();
            safeStorage.setItem('stickmurai_fs_approved', 'true');
            safeStorage.setItem('stickmurai_rotate_dismissed', 'true');
            rotatePromptDismissed = true;
            if (rotateAutoDismissTimer) {
              clearTimeout(rotateAutoDismissTimer);
              rotateAutoDismissTimer = null;
            }
            const requestFS = docEl.requestFullscreen || 
                              docEl.webkitRequestFullscreen || 
                              docEl.mozRequestFullScreen || 
                              docEl.msRequestFullscreen;
            if (requestFS) {
              try {
                requestFS.call(docEl).catch((err: any) => {
                  console.warn("Fullscreen request rejected:", err);
                });
              } catch(e) {}
            }
            if (screen.orientation && (screen.orientation as any).lock) {
              try {
                (screen.orientation as any).lock('landscape').catch((err: any) => {
                  console.warn("Orientation lock rejected:", err);
                });
              } catch(e) {}
            }
            rotatePrompt.style.display = 'none';
          };
          fsEnterBtn.addEventListener('click', enterFS);
          fsEnterBtn.addEventListener('pointerdown', enterFS);
        }
      }
      if (iosPwaTip) iosPwaTip.style.display = 'none';
    } else {
      if (rotateAutoDismissTimer) {
        clearTimeout(rotateAutoDismissTimer);
        rotateAutoDismissTimer = null;
      }
      rotatePrompt.style.display = 'none';
      if (canGoFullscreen && !isCurrentlyFS && fsApproved) {
        const triggerFSOnGesture = () => {
          const requestFS = docEl.requestFullscreen || 
                            docEl.webkitRequestFullscreen || 
                            docEl.mozRequestFullScreen || 
                            docEl.msRequestFullscreen;
          if (requestFS) {
            try {
              requestFS.call(docEl).catch((err: any) => {
                console.warn("Auto-fullscreen on gesture rejected:", err);
              });
            } catch(e) {}
          }
          if (screen.orientation && (screen.orientation as any).lock) {
            try {
              (screen.orientation as any).lock('landscape').catch((err: any) => {
                console.warn("Orientation lock on gesture rejected:", err);
              });
            } catch(e) {}
          }
          document.removeEventListener('click', triggerFSOnGesture);
          document.removeEventListener('pointerdown', triggerFSOnGesture);
        };
        document.addEventListener('click', triggerFSOnGesture, { once: true });
        document.addEventListener('pointerdown', triggerFSOnGesture, { once: true });
      }
    }
  }
}

function startApp() {
  try {
    if (isMobile) {
      checkOrientationAndFullscreen();
      window.addEventListener('resize', checkOrientationAndFullscreen);
      window.addEventListener('orientationchange', checkOrientationAndFullscreen);
    }

    const canvasElement = document.getElementById('gameCanvas') as HTMLCanvasElement;
    
    // Initialize Sub-systems
    initRenderer(canvasElement);
    initInput();
    initUI(
      () => { initGame(); }, // Classic start
      () => { initGame(); }, // Zen start
      () => { initGame(); }  // Restart run
    );
    initQol();
    initRuntimeQol(initGame);
    window.addEventListener('qol-assets', updateLoaderProgress);
    (window as any).__showLoadingRecovery = showLoadingRecovery;

    initPvPLobby(() => {
      globals.gameMode = 'pvp';
      initGame();
    });

    setupPvpRematchListeners();

    // Allow early tap-to-skip on loader screen
    const loaderScreen = document.getElementById('loader-screen');
    if (loaderScreen) {
      const earlySkip = (e: Event) => {
        e.stopPropagation();
        if (assetReadiness().ready) finishLoading();
      };
      loaderScreen.addEventListener('click', earlySkip, { once: true });
      loaderScreen.addEventListener('touchstart', earlySkip, { once: true });
      loaderScreen.addEventListener('pointerdown', earlySkip, { once: true });
    }

    // Setup loader video events and programmatically trigger play
    const loaderVideo = document.getElementById('loader-video') as HTMLVideoElement;
    if (loaderVideo) {
      const handleVideoPlay = () => {
        loaderVideo.classList.add('video-loaded');
        const spinner = document.querySelector('.loader-spinner') as HTMLElement;
        if (spinner) {
          spinner.style.opacity = '0';
          setTimeout(() => {
            spinner.style.display = 'none';
          }, 500);
        }
      };

      if (!loaderVideo.paused) {
        handleVideoPlay();
      }
      loaderVideo.addEventListener('playing', handleVideoPlay);
      loaderVideo.addEventListener('play', handleVideoPlay);

      // Call play programmatically in case autoplay policy blocks it
      loaderVideo.play().catch(err => {
        console.warn("Loader video autoplay blocked or failed:", err);
      });
    }

    startLoaderStickmanAnimation();
    startBackgroundAssetLoading();
    setTimeout(updateLoaderProgress, 0);
  } catch (err) {
    console.error("Critical error in startApp:", err);
    try {
      finishLoading();
    } catch(e) {}
  }

  // Hard safety timeout: allow 15 seconds for all assets to fully load
  loaderTimeoutId = setTimeout(() => {
    if (assetReadiness().ready) finishLoading(); else showLoadingRecovery();
  }, 15000);
}

function showLoadingRecovery() {
  if (loadingFinished) return;
  updateLoaderProgress();
  const loader = document.getElementById('loader-screen');
  if (!loader || document.getElementById('qol-loader-retry')) return;
  const actions = document.createElement('div'); actions.className='qol-actions';
  const retry=document.createElement('button'); retry.id='qol-loader-retry'; retry.className='qol-btn'; retry.textContent='Retry loading';
  let last=0;
  const run=(e:Event)=>{e.preventDefault();e.stopPropagation();if(Date.now()-last<350)return;last=Date.now();retryRequiredAssets();updateLoaderProgress();};
  retry.addEventListener('pointerdown',run);retry.addEventListener('click',run);
  const reload=document.createElement('button');reload.className='qol-btn';reload.textContent='Reload game';reload.onclick=()=>location.reload();
  actions.append(retry,reload);loader.append(actions);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

// filter in-place to avoid GC
function inplaceFilter<T>(arr: T[], predicate: (item: T) => boolean, releaseCallback?: (item: T) => void) {
  let writeIndex = 0;
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (predicate(item)) {
      arr[writeIndex++] = item;
    } else if (releaseCallback) {
      releaseCallback(item);
    }
  }
  arr.length = writeIndex;
}

let lastTime = performance.now();
let uiUpdateAccumulator = 0;

function showBossWarningBanner(stage: number) {
  const banner = document.getElementById('boss-warning-banner');
  const nameEl = document.getElementById('boss-banner-name');
  if (!banner || !nameEl) return;

  const realm = Math.floor((stage - 1) / 5) + 1;
  const bossNames = [
    { name: 'SKELETON ONI OVERLORD', nameJa: '冥府の鬼神・骸骨鬼王' },
    { name: 'DIVINE SHOGUN OF YOMI', nameJa: '黄泉の神将・魔界征夷大将軍' },
    { name: 'AGIS ASTRUM COLOSSUS', nameJa: '星海巨神・アギス・コロッサス' },
    { name: 'VOID CALAMITY INCARNATE', nameJa: '虚無の災厄・破滅の権化' }
  ];
  const b = bossNames[(realm - 1) % bossNames.length];
  nameEl.textContent = (globals.currentLang === 'ja' ? b.nameJa : b.name) + ` [STAGE ${stage}]`;

  banner.style.display = 'block';
  setTimeout(() => { if (banner) banner.style.opacity = '1'; }, 10);
  globals.screenShake = Math.max(globals.screenShake, 35);
  try { playSynthesizedSingingBowl(); } catch(e) {}

  setTimeout(() => {
    if (banner) {
      banner.style.opacity = '0';
      setTimeout(() => {
        if (banner) banner.style.display = 'none';
      }, 550);
    }
  }, 3200);
}

function initGame() {
  if (!assetReadiness().ready) { showLoadingRecovery(); return; }
  startOrResumeGameLoop();
  clearGameInputs();
  resetRunFeedback();
  clearBattlefield();
  resetCanvasVisuals();
  loadCoreCombatAssetsNow();
  playSound(sfx.gameStart);
  startBgm();
  globals.gameState = 'playing'; 
  globals.flowState = 'normal'; 
  globals.hasRevivedThisRun = false;
  globals.zenFieldActiveTimer = 0;
  globals.zenFieldTickTimer = 0;
  
  document.getElementById('game-over')!.style.display = 'none'; 
  const gameOverTitle = document.getElementById('game-over-title');
  if (gameOverTitle) {
    gameOverTitle.innerText = t('death') || 'DEATH';
    gameOverTitle.className = 'death-title';
  }
  document.getElementById('level-up-screen')!.style.display = 'none'; 
  document.getElementById('ult-screen')!.style.display = 'none'; 
  document.getElementById('pause-screen')!.style.display = 'none';
  
  if ((globals.gameMode as string) === 'pvp') {
    globals.activeBlessing = null; // Clear so blessings cannot carry into PvP
    document.getElementById('ui-layer')!.style.display = 'block';
    document.getElementById('pvp-hud')!.style.display = 'block';
    
    const isSurvival = pvpManager.subMode === 'insane_survival';
    
    // Hide standard elements in ui-layer only if NOT survival
    const topBars = document.querySelector('.top-bars') as HTMLElement;
    if (topBars) topBars.style.display = isSurvival ? 'flex' : 'none';
    const scoreDisp = document.getElementById('score-display');
    if (scoreDisp) scoreDisp.style.display = isSurvival ? 'block' : 'none';
    const comboDisp = document.getElementById('combo-display');
    if (comboDisp) comboDisp.style.display = isSurvival ? 'block' : 'none';
    const objDisp = document.getElementById('objective-display');
    if (objDisp) objDisp.style.display = 'none';

    // Show mobile controls wrapper but adjust for PvP mode
    const mobileCtrl = document.getElementById('mobile-controls');
    if (mobileCtrl) {
      mobileCtrl.style.display = 'block';
      const leftTouch = document.getElementById('left-touch-zone');
      if (leftTouch) leftTouch.style.display = isSurvival ? 'block' : 'none';
      const joyBase = document.getElementById('joystick-base');
      if (joyBase) joyBase.style.display = isSurvival ? 'block' : 'none';
      
      // Customize Enhance button
      const btnEnhance = document.getElementById('btn-enhance');
      if (btnEnhance) {
        btnEnhance.style.display = 'flex';
        btnEnhance.style.borderColor = isSurvival ? '#a855f7' : '#ffd700'; // PURPLE for enhance or GOLD for parry
        
        const svgIcon = btnEnhance.querySelector('.skill-icon') as HTMLElement;
        if (svgIcon) svgIcon.style.display = isSurvival ? 'block' : 'none';
        const hotkeyText = btnEnhance.querySelector('.hotkey') as HTMLElement;
        if (hotkeyText) hotkeyText.textContent = isSurvival ? 'E' : 'E / K';
        
        const btnText = btnEnhance.querySelector('.btn-text') as HTMLElement;
        if (btnText) btnText.textContent = isSurvival ? 'ENHANCE' : 'PARRY';
      }
      
      // Customize Dash button
      const btnDash = document.getElementById('btn-dash');
      if (btnDash) {
        const btnText = btnDash.querySelector('.btn-text') as HTMLElement;
        if (btnText) btnText.textContent = isSurvival ? 'DASH' : 'FEINT';
        const hotkeyText = btnDash.querySelector('.hotkey') as HTMLElement;
        if (hotkeyText) hotkeyText.textContent = 'SPACE';
      }

      const btnUlt = document.getElementById('btn-ult');
      if (btnUlt) btnUlt.style.display = isSurvival ? 'block' : 'none';
    }
    
    globals.player = new Player();
    globals.player.isPvpRemote = false;
    
    if (isSurvival) {
      globals.maxLives = 5;
      globals.lives = 5;
      globals.difficulty = 'insane';
      globals.p1Kills = 0;
      globals.p2Kills = 0;
      globals.timeModeTimeRemaining = 180; // 3 minutes
    }
    
    const opponent = new Player();
    opponent.isPvpRemote = true;
    globals.enemies = [opponent];
    
    globals.slashes = [];
    globals.chosenPowerUps = [];
    globals.projectiles = [];
    globals.pvpShockwaves = [];
    globals.particles = [];
    globals.afterimages = [];
    globals.shockwaves = [];
    globals.floatingTexts = [];
    globals.groundScars = [];
    
    initPvpGame();
    return;
  }

  document.getElementById('pvp-hud')!.style.display = 'none';
  document.getElementById('ui-layer')!.style.display = 'block'; 
  
  // Restore standard elements in ui-layer
  const topBars = document.querySelector('.top-bars') as HTMLElement;
  if (topBars) topBars.style.display = 'flex';
  const scoreDisp = document.getElementById('score-display');
  if (scoreDisp) scoreDisp.style.display = 'block';
  const comboDisp = document.getElementById('combo-display');
  if (comboDisp) comboDisp.style.display = 'block';

  // Restore standard elements in mobile-controls
  const mobileCtrl = document.getElementById('mobile-controls');
  if (mobileCtrl) {
    mobileCtrl.style.display = 'block';
    const leftTouch = document.getElementById('left-touch-zone');
    if (leftTouch) leftTouch.style.display = 'block';
    const joyBase = document.getElementById('joystick-base');
    if (joyBase) joyBase.style.display = 'flex';
    
    const btnEnhance = document.getElementById('btn-enhance');
    if (btnEnhance) {
      btnEnhance.style.display = 'flex';
      btnEnhance.style.borderColor = ''; // reset to default
      const svgIcon = btnEnhance.querySelector('.skill-icon') as HTMLElement;
      if (svgIcon) svgIcon.style.display = 'block';
      const hotkeyText = btnEnhance.querySelector('.hotkey') as HTMLElement;
      if (hotkeyText) hotkeyText.textContent = 'E';
      const btnText = btnEnhance.querySelector('.btn-text') as HTMLElement;
      if (btnText) btnText.textContent = 'ENHANCE';
    }

    const btnDash = document.getElementById('btn-dash');
    if (btnDash) {
      const btnText = btnDash.querySelector('.btn-text') as HTMLElement;
      if (btnText) btnText.textContent = 'DASH';
      const hotkeyText = btnDash.querySelector('.hotkey') as HTMLElement;
      if (hotkeyText) hotkeyText.textContent = 'SPACE';
    }
  }
  
  globals.player = new Player(); 
  globals.enemies = []; 
  globals.slashes = []; 
  globals.chosenPowerUps = []; 
  globals.projectiles = []; 
  globals.particles = []; 
  globals.afterimages = []; 
  globals.shockwaves = []; 
  globals.floatingTexts = []; 
  globals.groundScars = []; 
  globals.playerPosHistory = []; 
  globals.delayedActions = [];
  globals.runStats = {
    kills: 0,
    bossesKilled: 0,
    maxCombo: 0,
    parries: 0,
    perfectParries: 0,
    perfectDodges: 0,
    damageDealt: 0
  };
  globals.score = 0; 
  globals.combo = 0; 
  if (globals.timerLimit !== 'endless') {
    globals.timeModeTimeRemaining = globals.timerLimit;
  } else {
    globals.timeModeTimeRemaining = 0;
  }
  
  callbacks.updateComboDisplay?.();
  globals.exp = 0; 
  globals.maxExp = 10; 
  globals.level = 1;
  globals.invulnTimer = 0;
  globals.timeSlowDuration = 0; 
  globals.timeSlowFactor = 1; 
  globals.targetTimeSlowFactor = 1;
  globals.hitStop = 0; 
  globals.invertScreenTimer = 0;
  
  globals.weatherEngine = new WeatherEngine();
  globals.weatherEngine.type = Math.random() > 0.5 ? 'rain' : 'snow';
  globals.windForces = [];
  
  globals.maxLives = globals.gameMode === 'zen' ? 3 : 5;
  globals.lives = globals.maxLives;
  globals.petalArmorLevel = 0;
  globals.petalArmorActive = false;
  globals.petalArmorCooldown = 0;
  globals.echoLevel = 0;
  globals.tempoMasteryLevel = 0;
  globals.shieldPulseTimer = 0;
  globals.raijinDashActive = false;
  globals.raijinHitEnemies.clear();
  globals.stageBossSpawned = false;
  globals.satyrEarthshakerCD = 0;
  globals.executionUnlocked = false;
  globals.chiburuiKills = 0;
  globals.chiburuiTimer = 0;
  globals.guaranteedCrit = false;
  if (globals.playerStats) globals.playerStats.executionLevel = 0;

  globals.comboFinisherReady = false;
  globals.riposteTimer = 0;
  globals.decoyInvisibilityTimer = 0;
  globals.decoyCritPrimed = false;
  globals.reapersMarkTimer = 25.0;
  globals.reapersMarkKills = 0;
  globals.shadowAutoAttackTimer = 0;
  globals.decoys = [];
  globals.sakuraPetals = [];
  globals.collectibles = [];
  globals.judgementDomes = [];
  globals.lightningBeams = [];

  globals.frostStanceActive = false;
  globals.voidStanceActive = false;
  globals.flowingCounterActive = false;
  globals.galeVortexActive = false;
  globals.bladeEchoesActive = false;
  globals.activeBounty = null;
  globals.bountyTimer = 30;
  globals.bloodThirstCurseActive = false;
  globals.bloodThirstBleedTimer = 45.0;
  globals.curseOfGreedActive = false;
  globals.scoreMultiplier = 1;
  globals.ultCooldown = 0;
  globals.ultCooldownMax = 6.0;
  globals.roninResolveCooldown = 0;
  globals.singularityCleaveCD = 0;
  globals.gravityWellTimer = 0;
  globals.runTime = 0;
  globals.dayNightPhase = 'dawn';
  globals.calamityEvent = 'none';
  globals.calamityTimer = 0;
  globals.activeShrine = null;
  globals.activeHermit = null;
  globals.shadowDoppelganger = null;
  globals.consecutiveParries = 0;
  globals.lowHpSurviveTimer = 0;
  globals.shogunDefeatedAtDawn = false;
  bossEncounterDamaged = false;
  shogunSpawned = false;
  globals.bladeClashVictories = 0;
  globals.activeFusions.clear();
  globals.bouncingSickles = [];
  globals.plasmaTrails = [];
  globals.destructibleProps = [];

  // Apply permanent Yomi Seal breakthrough bonuses
  globals.unlockedSeals.forEach(id => {
    YOMI_SEALS[id]?.applyPermanentReward();
  });
  
  if (globals.gameMode === 'zen') {
    globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 120, t('playZen'), "#00ffff", 36));
  }
  
  const eMax = globals.selectedSkill === 'enhance' ? 18.0 : (globals.selectedSkill === 'shield' ? 10.0 : (globals.selectedSkill === 'dash' ? 0.9 : (globals.selectedSkill === 'firewheel' ? 11.0 : (globals.selectedSkill === 'gravity' ? 9.0 : (globals.selectedSkill === 'parry_master' ? 9.0 : (globals.selectedSkill === 'decoy_illusion' ? 12.0 : 14.0))))));
  const eDur = globals.selectedSkill === 'enhance' ? 10.0 : (globals.selectedSkill === 'shield' ? 4.5 : (globals.selectedSkill === 'dash' ? 0.45 : (globals.selectedSkill === 'firewheel' ? 6.0 : (globals.selectedSkill === 'gravity' ? 4.5 : (globals.selectedSkill === 'parry_master' ? 4.0 : (globals.selectedSkill === 'decoy_illusion' ? 5.0 : 3.5))))));
  globals.playerStats = { 
    slashBonusDmg: 0,
    iaijutsuBonusDmg: 0,
    slashSizeMult: 1.0, 
    attackCooldownBase: 0.3, 
    dashCooldownBase: 1.2, 
    moveSpeedMult: 1.0, 
    flowGenMult: 1.0, 
    flowMax: 200,
    enhanceCooldownMax: eMax,
    enhanceDuration: eDur,
    enhanceBonusDmg: 3,
    enhanceSizeMult: 1.8,
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
  };

  // Apply Hero Archetype Perks & update sprite type
  if (globals.selectedHero === 'luneblade') {
    globals.playerStats.slashBonusDmg = (globals.playerStats.slashBonusDmg || 0) + 2;
    globals.playerStats.slashSizeMult *= 1.35;
    globals.playerStats.iaijutsuBonusDmg = (globals.playerStats.iaijutsuBonusDmg || 0) + 4;
  } else if (globals.selectedHero === 'ninja') {
    globals.playerStats.moveSpeedMult *= 1.30;
    globals.playerStats.dashCooldownBase *= 0.75;
    globals.playerStats.attackCooldownBase *= 0.85;
    globals.playerStats.heroCritChance = (globals.playerStats.heroCritChance || 0) + 0.20;
  } else if (globals.selectedHero === 'samurai') {
    globals.playerStats.moveSpeedMult *= 1.15;
    globals.playerStats.attackCooldownBase *= 0.65; // -35% attack cooldown (Kensei Rapid Arts)
    globals.playerStats.slashBonusDmg = (globals.playerStats.slashBonusDmg || 0) + 1;
  } else if (globals.selectedHero === 'nightborne') {
    globals.playerStats.moveSpeedMult *= 1.10;
    globals.playerStats.slashBonusDmg = (globals.playerStats.slashBonusDmg || 0) + 3;
    globals.playerStats.iaijutsuBonusDmg = (globals.playerStats.iaijutsuBonusDmg || 0) + 6;
    globals.playerStats.slashSizeMult *= 1.40;
  } else if (globals.selectedHero === 'satyr') {
    globals.playerStats.moveSpeedMult *= 1.12;
    globals.playerStats.attackCooldownBase *= 0.82; // -18% attack cooldown (Primal Ferocity)
    globals.playerStats.slashBonusDmg = (globals.playerStats.slashBonusDmg || 0) + 2;
    globals.playerStats.iaijutsuBonusDmg = (globals.playerStats.iaijutsuBonusDmg || 0) + 4;
    globals.playerStats.slashSizeMult *= 1.25; // +25% slash AoE
    globals.playerStats.postureDmgBonus = (globals.playerStats.postureDmgBonus || 0) + 8;
  } else if (globals.selectedHero === 'akakage') {
    // Akakage, the Crimson Revenant: expensive glass-cannon duelist.
    globals.playerStats.moveSpeedMult *= 1.20;
    globals.playerStats.attackCooldownBase *= 0.72;
    globals.playerStats.dashCooldownBase *= 0.82;
    globals.playerStats.slashBonusDmg = (globals.playerStats.slashBonusDmg || 0) + 5;
    globals.playerStats.slashSizeMult *= 1.35;
    globals.playerStats.heroCritChance = (globals.playerStats.heroCritChance || 0) + 0.25;
  } else {
    // Default Classic Ronin (Parry Prodigy)
    globals.playerStats.moveSpeedMult *= 1.05;
    globals.playerStats.postureDmgBonus = (globals.playerStats.postureDmgBonus || 0) + 12;
  }
  globals.player?.updateHeroType();
  
  // Apply pre-game Stance Blessings
  if (globals.activeBlessing === 'swift_strike') {
    globals.playerStats.attackCooldownBase *= 0.9; // +10% Attack Speed (90% cooldown)
    globals.chosenPowerUps.push('blessingSwiftName');
    globals.delayedActions.push({
      delay: 0.1,
      run: () => {
        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 80, globals.currentLang === 'ja' ? '神速の構え！' : 'Swift Strike Stance!', "#ffd700", 24));
      }
    });
  } else if (globals.activeBlessing === 'fortune') {
    const grantedUpgradeName = applyRandomStartUpgrade();
    globals.delayedActions.push({
      delay: 0.1,
      run: () => {
        const text = globals.currentLang === 'ja' ? `招福の加護: ${grantedUpgradeName}!` : `Fortune Blessing: ${grantedUpgradeName}!`;
        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 80, text, "#00ffff", 24));
      }
    });
  }
  globals.activeBlessing = null; // Clear so it only applies to the current run

  // Apply Campaign / Ascension Upgrades (Permanent progression)
  if (globals.campaignUpgrades) {
    const cu = globals.campaignUpgrades as any;
    const slashLvl = cu.slashDamage ?? cu.katana_dmg ?? 0;
    const iaijutsuLvl = cu.iaijutsuPower ?? cu.iaijutsu_shock ?? 0;
    const hpLvl = cu.maxLives ?? cu.bushido_hp ?? 0;
    const dashLvl = cu.dashCooldown ?? cu.phantom_dash ?? 0;
    const flowLvl = cu.spiritResonance ?? cu.flow_resonance ?? 0;
    const infSharpness = cu.infiniteSharpness ?? 0;
    const infFlow = cu.infiniteFlow ?? 0;
    const infFortune = cu.infiniteFortune ?? 0;
    const infRiposte = cu.infiniteRiposte ?? 0;

    globals.playerStats.slashBonusDmg = (globals.playerStats.slashBonusDmg || 0) + slashLvl * 0.5 + infSharpness * 0.25;
    globals.playerStats.iaijutsuBonusDmg = (globals.playerStats.iaijutsuBonusDmg || 0) + iaijutsuLvl * 1;
    globals.playerStats.iaijutsuRangeMult = (globals.playerStats.iaijutsuRangeMult || 1.0) + iaijutsuLvl * 0.08;
    globals.maxLives += hpLvl;
    globals.lives = globals.maxLives;
    globals.playerStats.dashCooldownBase = Math.max(0.4, globals.playerStats.dashCooldownBase - dashLvl * 0.08);
    globals.playerStats.flowGenMult = (globals.playerStats.flowGenMult || 1.0) + flowLvl * 0.15 + infFlow * 0.01;
    globals.playerStats.fortuneMult = 1.0 + infFortune * 0.02;
    globals.playerStats.postureDmgBonus = (globals.playerStats.postureDmgBonus || 0) + infRiposte * 1.0;
  }

  // Initialize Stage Mode Objectives & Affixes
  globals.stageKills = 0;
  globals.runTime = 0;
  globals.dayNightPhase = 'dawn';
  globals.calamityEvent = 'none';
  globals.calamityTimer = 0;
  globals.stageBossSpawned = false;
  isZanFinisherActive = false;
  thunderGaleTimer = 0.0;
  gravityCollapseTimer = 0.0;
  const currentStage = globals.currentStage || 1;
  const isBossStage = currentStage % 5 === 0;
  const stageTargets: Record<number, number> = {
    1: 25, 2: 35, 3: 45, 4: 55, 5: 1, 6: 40, 7: 50, 8: 60, 9: 70, 10: 1
  };
  if (isBossStage) {
    globals.stageTargetKills = 1;
  } else {
    globals.stageTargetKills = stageTargets[currentStage] || Math.min(90, 35 + currentStage * 4);
  }

  // Active Stage Affix (Calamity Winds & Endless Abyss Affixes)
  if (globals.gameMode === 'classic') {
    globals.activeStageAffix = getStageAffix(currentStage);
    if (globals.activeStageAffix?.id === 'thunder_gale') {
      globals.playerStats.dashCooldownBase = Math.max(0.35, globals.playerStats.dashCooldownBase * 0.85);
    }
    if (globals.activeStageAffix?.id === 'void_flux') {
      globals.playerStats.flowGenMult = (globals.playerStats.flowGenMult || 1.0) * 1.4;
    }
    if (globals.activeStageAffix) {
      const isJa = globals.currentLang === 'ja';
      const isAbyss = currentStage >= 11;
      const affixPrefix = isJa
        ? (isAbyss ? '【深淵の呪詛】' : '【災厄の風】')
        : (isAbyss ? 'ABYSS AFFIX:' : 'CALAMITY WIND:');
      const affixText = isJa
        ? `${globals.activeStageAffix.icon} ${affixPrefix}${globals.activeStageAffix.nameJa}`
        : `${globals.activeStageAffix.icon} ${affixPrefix} ${globals.activeStageAffix.name.toUpperCase()}`;
      globals.delayedActions.push({
        delay: 0.8,
        run: () => {
          playAffixAlert(0.85);
          globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 120, affixText, '#fca5a5', 24));
        }
      });
    }
  } else {
    globals.activeStageAffix = null;
  }

  // Cinematic Boss Encounter Announcement
  if (globals.gameMode === 'classic' && isBossStage) {
    showBossWarningBanner(currentStage);
  }

  document.getElementById('level-display')!.textContent = globals.level.toString();
  updateEnhanceButton();
  updateStaticText();
  updateUI(); 
  spawnEnemy();

  // Wave Influx: Immediate spawn on higher stages to eliminate early dead air
  if (globals.gameMode === 'classic' && !isBossStage && currentStage >= 3) {
    const initialInflux = Math.min(3, Math.floor(currentStage / 3));
    for (let i = 0; i < initialInflux; i++) {
      spawnEnemy();
    }
  }
}

function spawnEnemy() {
  if (isPractice()) return;
  if (globals.gameState !== 'playing') {
    if (globals.gameState === 'paused' || globals.gameState === 'levelup' || globals.gameState === 'ultchoice') {
      setTimeout(spawnEnemy, 1000);
    }
    return;
  }
  
  let maxEnemies = isMobile ? 14 : 22;
  let count = 1;
  let nextSpawnMult = 1.0;
  
  if (globals.gameMode === 'classic') {
    const stage = globals.currentStage || 1;
    maxEnemies = (isMobile ? 16 : 24) + Math.min(10, Math.floor(stage * 1.5));
    if (stage >= 8) {
      count = Math.min(4, 2 + Math.floor((stage - 8) / 3));
      nextSpawnMult = Math.max(0.40, 0.70 - (stage - 8) * 0.03);
    } else if (stage >= 4) {
      count = 2;
      nextSpawnMult = 0.65;
    } else if (stage >= 2) {
      count = Math.random() < 0.4 ? 2 : 1;
      nextSpawnMult = 0.80;
    }
  } else if (globals.difficulty === 'easy') {
    maxEnemies = Math.round(maxEnemies * 0.6);
    if (globals.score > 20) count = 2;
    nextSpawnMult = 1.5;
  } else if (globals.difficulty === 'normal') {
    maxEnemies = Math.round(maxEnemies * 0.85);
    if (globals.score > 15) count = 2;
    if (globals.score > 45) count = 3;
    nextSpawnMult = 1.2;
  } else if (globals.difficulty === 'insane') {
    maxEnemies = Math.round(maxEnemies * 1.6);
    if (globals.score > 2) count = 2;
    if (globals.score > 8) count = 3;
    if (globals.score > 20) count = 4;
    if (globals.score > 40) count = 5;
    if (globals.score > 65) count = 6;
    nextSpawnMult = 0.35;
  } else { // hard
    maxEnemies = Math.round(maxEnemies * 1.25);
    if (globals.score > 5) count = 2;
    if (globals.score > 20) count = 3;
    if (globals.score > 45) count = 4;
    if (globals.score > 70) count = 5;
    nextSpawnMult = 0.7;
  }

  if (globals.gameMode === 'pvp') {
    if (pvpManager.subMode !== 'insane_survival' || pvpManager.role !== 'host') {
      // Don't run standard spawner in classic PvP or if client
      const nextSpawn = 1000;
      setTimeout(spawnEnemy, nextSpawn);
      return;
    }
  }

  // Insane difficulty is used for insane_survival
  if (globals.enemies.filter(e => e.state !== 'dead' && !e.isPvpRemote).length < maxEnemies) {
     for(let i=0; i<count; i++) {
       const angle = Math.random() * Math.PI * 2;
       const dist = 800 + Math.random() * 400 + (i * 100);
       const enemy = new Enemy(globals.player.x + Math.cos(angle)*dist, globals.player.y + Math.sin(angle)*dist, globals.player);
       
       // Assign unique ID for network synchronization
       const enemyId = 'enemy_' + Math.random().toString(36).substring(2, 9);
       (enemy as any).id = enemyId;
       
       globals.enemies.push(enemy);

       // Broadcast spawn to client
       pvpManager.send({
         type: 'pvp_enemy_spawn',
         id: enemyId,
         subType: enemy.subType,
         x: enemy.x,
         y: enemy.y
       });
     }
  }
  
  const nextSpawn = (1200 - Math.min(700, globals.score * 15)) * nextSpawnMult;
  setTimeout(spawnEnemy, nextSpawn);
}

function triggerFlowingCounterReset() {
  if (globals.flowingCounterActive && globals.player) {
    const wasOnCooldown = globals.player.dashCooldown > 0 || (globals.selectedSkill === 'dash' && globals.enhanceCooldown > 0);
    if ((globals.flowState as string) === 'awakened' || (globals.flowState as string) === 'storm_god') {
      globals.player.dashCooldown = 0.2;
    } else {
      globals.player.dashCooldown = 0;
    }
    if (globals.selectedSkill === 'dash') {
      globals.enhanceCooldown = 0;
    }
    if (wasOnCooldown) {
      globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 100, globals.currentLang === 'ja' ? '瞬歩リセット！' : 'DODGE RESET!', "#00ffff", 28));
      globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, 'rgba(0, 255, 255, 0.6)'));
      for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 150 + Math.random() * 200;
        globals.particles.push(Particle.acquire(globals.player.x, globals.player.y, '#00ffff', speed, 0.4, 2 + Math.random() * 2, angle));
      }
    }
  }
}

function checkPlayerHit(enemy: Enemy, damageAmount = 1) {
  if (globals.invulnTimer > 0) return;

  // Blood Surge & Blood Tithe Affixes: Enemies deal +1 damage
  if (globals.activeStageAffix?.id === 'blood_surge' || globals.activeStageAffix?.id === 'blood_tithe') {
    damageAmount += 1;
  }

  if (globals.selectedSkill === 'shield' && globals.enhanceActiveTimer > 0) {
    if (globals.playerStats.shieldBlastLevel && globals.playerStats.shieldBlastLevel > 0 && enemy && enemy.state !== 'dead') {
      const thornDmg = 8 * globals.playerStats.shieldBlastLevel;
      hitEnemy(enemy, thornDmg);
      const pushAngle = Math.atan2(enemy.y - globals.player.y, enemy.x - globals.player.x);
      enemy.vx = Math.cos(pushAngle) * 1200;
      enemy.vy = Math.sin(pushAngle) * 1200;
      enemy.stunTimer = Math.max(enemy.stunTimer || 0, 0.6);
      globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, 'rgba(0, 200, 255, 0.4)'));
      globals.floatingTexts.push(FloatingText.acquire(enemy.x, enemy.y - 40, globals.currentLang === 'ja' ? '棘！' : 'THORNS!', '#00ccff', 20));
      for (let i = 0; i < 10; i++) {
        const a = Math.random() * Math.PI * 2;
        globals.particles.push(Particle.acquire(enemy.x, enemy.y, Math.random() < 0.5 ? '#00ffff' : '#00ccff', 250, 0.3, 2 + Math.random() * 2, a));
      }
    }
    return; 
  }
  if (globals.petalArmorActive && enemy && enemy.state !== 'dead') {
    globals.petalArmorActive = false;
    globals.petalArmorCooldown = 15.0;
    globals.invulnTimer = 0.5;
    playSynthesizedParry(); 
    globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 60, globals.currentLang === 'ja' ? '桜花の鎧 防御！' : 'BARRIER BLOCKED!', '#ffb7c5', 24));
    const defUp = (vfxAnims as any).spells?.defenseUp;
    if (defUp && defUp.length > 0) {
      globals.animatedEffects.push(new AnimatedEffect(globals.player.x, globals.player.y, defUp, 0.45, 1.8));
    }
    for (let i = 0; i < 15; i++) {
      globals.particles.push(Particle.acquire(globals.player.x, globals.player.y, '#ffb7c5', 250, 0.5, 3 + Math.random()*2));
    }
    updateUI();
    return;
  }

  if (globals.player.state === 'dash' || globals.flowState === 'awakened') { 
    globals.runStats.perfectDodges++;
    playSynthesizedDodge();
    globals.screenShake = 30; 
    addFlow(6.0);
    addCombo();
    addCombo();

    globals.invulnTimer = 1.3;
    
    const speedlines = document.getElementById('speedlines-overlay');
    if (speedlines) {
      speedlines.classList.add('active');
      setTimeout(() => { speedlines.classList.remove('active'); }, 250);
    }
    
    triggerFlowingCounterReset();
    
    globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#ffd700'));
    const pY = (vfxAnims as any).impacts?.parryYellow;
    if (pY?.length > 0) {
      globals.animatedEffects.push(new AnimatedEffect(globals.player.x, globals.player.y, pY, 0.28, 1.8));
    }

    if (globals.gameMode === 'zen' && enemy && enemy.state !== 'dead') {
      hitEnemy(enemy, 2);
      globals.slashes.push(Slash.acquire(enemy.x, enemy.y, Math.random() * Math.PI * 2, 1.8, true));
      globals.floatingTexts.push(FloatingText.acquire(enemy.x, enemy.y - 40, "COUNTER!", "#ffd700", 24));
      globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 120, '閃', 'neon-#ffd700', 72));
    } else {
      globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 60, t('dodgeText'), "#ffd700", 28));
      globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 120, '閃', 'neon-#ffd700', 72));
    }
    
    const dodgeSparkCount = globals.graphicsSettings === 'low' ? 8 : 24;
    for (let i = 0; i < dodgeSparkCount; i++) {
      const angle = (i / dodgeSparkCount) * Math.PI * 2;
      const speed = 500 + Math.random() * 300;
      globals.particles.push(Particle.acquire(globals.player.x, globals.player.y, '#ffd700', speed, 0.6, 3 + Math.random() * 3, angle, 0, 0.95));
    }

    const enemyAngle = Math.atan2(enemy.y - globals.player.y, enemy.x - globals.player.x);
    for (let i = 0; i < 3; i++) {
      const dist = (i + 1) * 60;
      const shadowX = globals.player.x - Math.cos(enemyAngle) * dist;
      const shadowY = globals.player.y - Math.sin(enemyAngle) * dist;
      
      const afterimg = Afterimage.acquire(globals.player, '#ffd700');
      afterimg.x = shadowX;
      afterimg.y = shadowY;
      afterimg.life = 0.5 - (i * 0.1);
      afterimg.maxLife = 0.5;
      globals.afterimages.push(afterimg);
    }
    
    updateUI();
    return;
  }
  
  const isParryMasterActive = globals.selectedSkill === 'parry_master' && globals.enhanceActiveTimer > 0;
  if ((globals.player.state === 'attack' && globals.player.stateTime < 0.3 && isParryMasterActive)) {
    playSynthesizedParry();
    globals.runStats.parries++;
    addCombo();
    globals.hitStop = 0; 
    globals.screenShake = 14; 
    addFlow(4.0);
    globals.invulnTimer = 0.55;
    
    // Mechanic 1: Kinetic Parry Sparks & Ascending Palette Streak
    const streak = getConsecutiveParries();
    let sparkColor = '#f59e0b'; // 1: Amber
    let shockColor = '#f59e0b';
    let sparkCount = 14;
    let parryLabel = '🛡️ PARRY!';
    if (streak === 2) {
      sparkColor = '#fde047'; // 2: Blazing Gold
      shockColor = '#fde047';
      sparkCount = 18;
      parryLabel = '⚡ PARRY STREAK x2!';
    } else if (streak === 3) {
      sparkColor = '#38bdf8'; // 3: Electric Cyan
      shockColor = '#38bdf8';
      sparkCount = 24;
      parryLabel = '⚡ PARRY STREAK x3!';
    } else if (streak >= 4) {
      sparkColor = '#ffffff'; // 4+: Blinding Starlight White-Blue
      shockColor = '#e0f2fe';
      sparkCount = 32;
      parryLabel = `🌟 PERFECT CADENCE x${streak}!`;
      const goldImpact = (vfxAnims as any).shockwaves?.impactGold;
      if (goldImpact && goldImpact.length > 0) {
        globals.animatedEffects.push(new AnimatedEffect(globals.player.x, globals.player.y, goldImpact, 0.35, 2.2));
      }
      const lightBurst = (vfxAnims as any).shockwaves?.lightBurst;
      if (lightBurst && lightBurst.length > 0) {
        globals.animatedEffects.push(new AnimatedEffect(globals.player.x, globals.player.y, lightBurst, 0.32, 2.0));
      }
    }
    
    // Parry blast pushing nearby enemies back!
    globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, shockColor));
    for (let i = 0; i < sparkCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 300 + Math.random() * 250;
      globals.particles.push(Particle.acquire(globals.player.x, globals.player.y, sparkColor, spd, 0.45, 2.5 + Math.random() * 2, a));
    }
    const pYParry = (vfxAnims as any).impacts?.parryYellow;
    if (pYParry?.length > 0 && enemy) {
      globals.animatedEffects.push(new AnimatedEffect((globals.player.x + enemy.x) / 2, (globals.player.y + enemy.y) / 2, pYParry, 0.28, 1.8));
    }
    globals.enemies.forEach(other => {
      if (other.state === 'dead') return;
      const dx = other.x - globals.player.x;
      const dy = other.y - globals.player.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < 220 * 220) {
        const pushAngle = Math.atan2(dy, dx);
        other.vx = Math.cos(pushAngle) * 700;
        other.vy = Math.sin(pushAngle) * 700;
        other.stunTimer = Math.max(other.stunTimer || 0, 0.8);
      }
    });

    globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 70, parryLabel, sparkColor, 22));
    hitEnemy(enemy, 3); // deal 3 damage on parry riposte!
    triggerFlowingCounterReset();
    return;
  }
  
  if (globals.player.state !== 'dead') {
    recordHurt(enemy?.subType || 'attack', damageAmount);
    if (isPractice()) return;
    playSynthesizedHurt();
    globals.consecutiveParries = 0;
    const isAnyBossAlive = globals.enemies.some(en => en.state !== 'dead' && (en.subType === 'oni_boss' || en.subType === 'shogun_boss' || en.subType === 'agis_colossus' || en.subType === 'skeleton_warlord' || (en as any).isBoss));
    if (isAnyBossAlive) {
      bossEncounterDamaged = true;
    }
    
    // Step 3: Ronin's Resolve (Lethal One-Shot Protection)
    if (globals.lives >= 2 && globals.lives - damageAmount <= 0 && globals.roninResolveCooldown <= 0) {
      globals.lives = 1; // Preserve samurai on brink of defeat!
      globals.roninResolveCooldown = 60.0; // 60s cooldown
      globals.invulnTimer = globals.unlockedSeals.includes(2) ? 2.5 : 1.5; // Emergency i-frames (buffed by Seal II)
      globals.screenShake = 35;
      playSynthesizedPerfectParry();
      globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#ffd700'));
      const pYResolve = (vfxAnims as any).impacts?.parryYellow;
      if (pYResolve?.length > 0) {
        globals.animatedEffects.push(new AnimatedEffect(globals.player.x, globals.player.y, pYResolve, 0.35, 2.2));
      }
      const lightBurstResolve = (vfxAnims as any).shockwaves?.lightBurst;
      if (lightBurstResolve && lightBurstResolve.length > 0) {
        globals.animatedEffects.push(new AnimatedEffect(globals.player.x, globals.player.y, lightBurstResolve, 0.35, 2.4));
      }
      globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 80, globals.currentLang === 'ja' ? '武士の気迫！ 🛡️' : "RONIN'S RESOLVE! 🛡️", "neon-#ffd700", 36));
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 250 + Math.random() * 250;
        globals.particles.push(Particle.acquire(globals.player.x, globals.player.y, '#ffd700', speed, 0.7, 3, angle));
      }
    } else {
      globals.lives -= damageAmount;
      globals.invulnTimer = 0.5;
      globals.screenShake = 20;
    }
    
    const flashOverlay = document.getElementById('flash-overlay')!;
    flashOverlay.style.background = 'red';
    flashOverlay.style.opacity = '0.5';
    setTimeout(() => {
      flashOverlay.style.opacity = '0';
      flashOverlay.style.background = 'white';
    }, 150);

    updateUI();

    if (globals.lives <= 0 && globals.gameMode !== 'pvp') {
      triggerGameOver(false);
    }
  }
}

export function triggerStormGodLightning(x: number, y: number) {
  globals.lightningBeams.push(new LightningBeam(x, y));
  if (vfxAnims.gigapack?.lightning?.length > 0) {
    globals.animatedEffects.push(new AnimatedEffect(x, y - 20, vfxAnims.gigapack.lightning, 0.45, 2.2));
  }
  
  const radius = 200;
  const hitEnemies: Enemy[] = [];
  const lowGraphics = globals.graphicsSettings === 'low';

  globals.enemies.forEach(e => {
    if (e.state === 'dead') return;
    const dx = e.x - x;
    const dy = e.y - y;
    if (dx * dx + dy * dy < radius * radius) {
      hitEnemy(e, 6);
      e.stunTimer = Math.max(e.stunTimer || 0, 3.0); // 3.0s stun
      hitEnemies.push(e);
      const hitSparks = lowGraphics ? 1 : 3;
      for (let i = 0; i < hitSparks; i++) {
        globals.particles.push(Particle.acquire(e.x, e.y, '#fbbf24', 200, 0.4, 2));
      }
    }
  });

  let chainCount = 0;
  const otherEnemies = globals.enemies
    .filter(e => e.state !== 'dead' && !hitEnemies.includes(e))
    .sort((a, b) => {
      const da = (a.x - x) * (a.x - x) + (a.y - y) * (a.y - y);
      const db = (b.x - x) * (b.x - x) + (b.y - y) * (b.y - y);
      return da - db;
    });

  const maxChains = lowGraphics ? 2 : 4;
  for (const nextEnemy of otherEnemies) {
    if (chainCount >= maxChains) break;
    
    hitEnemy(nextEnemy, 2);
    nextEnemy.stunTimer = Math.max(nextEnemy.stunTimer || 0, 2.0);
    
    const ex = nextEnemy.x;
    const ey = nextEnemy.y;
    const dist = Math.hypot(ex - x, ey - y);
    const particleSteps = lowGraphics ? Math.min(3, Math.floor(dist / 80)) : Math.min(6, Math.floor(dist / 45));
    for (let i = 0; i <= particleSteps; i++) {
      const t = i / particleSteps;
      const px = x + (ex - x) * t;
      const py = y + (ey - y) * t;
      globals.particles.push(Particle.acquire(px, py, '#fef08a', 0, 0.35, 1.2));
    }
    
    chainCount++;
  }
}

export function triggerZanFinisher(onComplete: () => void) {
  if (isZanFinisherActive) return;
  isZanFinisherActive = true;
  globals.gameState = 'stageclear';

  // Immediately hide and cancel any active or queued level-up or ult popups
  const levelUpModal = document.getElementById('level-up-screen');
  if (levelUpModal) levelUpModal.style.display = 'none';
  const ultModal = document.getElementById('ult-screen');
  if (ultModal) ultModal.style.display = 'none';

  // 1. Visceral Audio Cues
  playSynthesizedSingingBowl();
  playSynthesizedTempleBell();
  playSound(sfx.slash);

  // 2. High-Impact Screen Shake & Hit Stop
  globals.screenShake = Math.max(globals.screenShake, 45);
  globals.hitStop = 0.25;
  globals.invulnTimer = Math.max(globals.invulnTimer, 2.5); // Invincible during victory cinematic

  // 3. Magnetic Vacuum: suck all on-screen collectibles at hyper-speed into player
  if (globals.collectibles && globals.collectibles.length > 0) {
    for (let i = 0; i < globals.collectibles.length; i++) {
      const c = globals.collectibles[i];
      globals.particles.push(Particle.acquire(c.x, c.y, '#ffd700', 40, 0.4, 3));
      c.x = globals.player.x + (Math.random() - 0.5) * 20;
      c.y = globals.player.y + (Math.random() - 0.5) * 20;
    }
  }

  // Mechanic 5: "Slash Through Sunrise" — Transmute remaining enemy bullets into floating sakura petals
  if (globals.projectiles && globals.projectiles.length > 0) {
    for (let i = 0; i < globals.projectiles.length; i++) {
      const proj = globals.projectiles[i];
      if (proj && proj.isEnemy) {
        for (let p = 0; p < 4; p++) {
          const petalSpeed = 40 + Math.random() * 60;
          const petalAngle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
          globals.particles.push(Particle.acquire(proj.x, proj.y, '#ffb7c5', petalSpeed, 1.8, 3.5, petalAngle));
        }
      }
    }
    globals.projectiles = globals.projectiles.filter(p => !p.isEnemy);
  }

  // Sumi-e Ink Wash Wipe & Sunrise Flash
  globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#ffd700', 240));
  globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 140, globals.currentLang === 'ja' ? '黎明一閃 🌸' : 'SLASH THROUGH SUNRISE 🌸', 'neon-#ffd700', 36));

  // 4. Speedlines activation
  const speedlines = document.getElementById('speedlines-overlay');
  if (speedlines) {
    speedlines.classList.add('active');
    setTimeout(() => speedlines.classList.remove('active'), 500);
  }

  // 5. Visceral "斬" Calligraphy Slash DOM Overlay
  const zanOverlay = document.getElementById('zan-overlay');
  const zanKanji = document.getElementById('zan-kanji');
  const zanSlashline = document.getElementById('zan-slashline');

  if (zanOverlay && zanKanji && zanSlashline) {
    zanOverlay.style.display = 'flex';
    void zanOverlay.offsetWidth; // Force layout reflow
    zanKanji.style.transform = 'scale(1.15)';
    zanKanji.style.opacity = '1';
    zanSlashline.style.transform = 'rotate(-35deg) scaleX(1)';
    zanSlashline.style.opacity = '1';

    setTimeout(() => {
      zanKanji.style.transform = 'scale(1.35)';
      zanKanji.style.opacity = '0';
      zanSlashline.style.opacity = '0';
      setTimeout(() => {
        zanOverlay.style.display = 'none';
        zanKanji.style.transform = 'scale(0.5)';
        zanSlashline.style.transform = 'rotate(-35deg) scaleX(0)';
        isZanFinisherActive = false;
        onComplete();
      }, 250);
    }, 900);
  } else {
    setTimeout(() => {
      isZanFinisherActive = false;
      onComplete();
    }, 300);
  }
}

function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function triggerVortexShatter(x: number, y: number) {
  globals.shockwaves.push(new Shockwave(x, y, '#a855f7', 200));
  globals.screenShake += 15;
  playSound(sfx.slash);
  playSynthesizedGravity();
  globals.floatingTexts.push(FloatingText.acquire(x, y - 50, "VORTEX SHATTER!", "#a855f7", 26));

  // Pull in enemies
  globals.enemies.forEach(e => {
    if (e.state === 'dead') return;
    const dx = x - e.x;
    const dy = y - e.y;
    const distSq = dx * dx + dy * dy;
    if (distSq < 350 * 350) {
      e.x = x;
      e.y = y;
      hitEnemy(e, 8);
      e.stunTimer = Math.max(e.stunTimer || 0, 1.0);
      // Spark particles
      for (let i = 0; i < 4; i++) {
        globals.particles.push(Particle.acquire(e.x + (Math.random()-0.5)*60, e.y + (Math.random()-0.5)*60, '#a855f7', 100, 0.4, 2));
      }
    }
  });

  // Inward particles
  for (let i = 0; i < 15; i++) {
    const pAngle = Math.random() * Math.PI * 2;
    const pDist = 80 + Math.random() * 200;
    const px = x + Math.cos(pAngle) * pDist;
    const py = y + Math.sin(pAngle) * pDist;
    const speed = pDist / 0.35;
    globals.particles.push(Particle.acquire(px, py, '#a855f7', speed, 0.35, 1.5 + Math.random() * 1.5, pAngle + Math.PI));
  }
}

function triggerLightningDischarge(sx: number, sy: number, ex: number, ey: number) {
  // Spawn 5 lightning beams along the teleport path
  const dx = ex - sx;
  const dy = ey - sy;
  const steps = 5;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const px = sx + dx * t;
    const py = sy + dy * t;
    globals.lightningBeams.push(new LightningBeam(px, py));
  }
  
  globals.floatingTexts.push(FloatingText.acquire(ex, ey - 80, "LIGHTNING DISCHARGE!", "#fbbf24", 28));
  globals.screenShake += 20;
  playSound(sfx.slash);
  playSynthesizedThunder();

  // Hit all enemies near the path
  globals.enemies.forEach(e => {
    if (e.state === 'dead') return;
    const d = distToSegment(e.x, e.y, sx, sy, ex, ey);
    if (d < 250) {
      hitEnemy(e, 10);
      e.stunTimer = Math.max(e.stunTimer || 0, 2.0);
      for (let j = 0; j < 8; j++) {
        globals.particles.push(Particle.acquire(e.x, e.y, '#fbbf24', 300, 0.4, 2.5));
      }
    }
  });
}

function fireFullyChargedIaijutsu(angle: number) {
  globals.lastIaijutsuFireTime = performance.now();
  globals.lastIaijutsuAngle = angle;
  globals.invertScreenTimer = 0.25;

  globals.screenShake = Math.max(globals.screenShake, 20 * 1.8);
  
  if (globals.decoyInvisibilityTimer > 0) {
    executeMirrorStrike(angle, 12);
  } else {
    let enhancedType = '';
    let projDmg = 6;
    let txtColor = '#00ffff';
    let txtLabel = t('iaijutsuText');
    
    if (globals.flowState === 'awakened') {
      enhancedType = 'shadow_awakening';
      projDmg = 11;
      txtColor = '#aa66ff';
      txtLabel = "🔥 SHADOW IAIJUTSU! 🔥";
    } else if (globals.flowState === 'storm_god') {
      enhancedType = 'storm_god';
      projDmg = 12;
      txtColor = '#fbbf24';
      txtLabel = "⚡ LIGHTNING IAIJUTSU! ⚡";
    } else if (globals.zenFieldActiveTimer > 0 && globals.flowState !== 'omnislash') {
      enhancedType = 'zen_field';
      projDmg = 12;
      txtColor = '#22d3ee';
      txtLabel = "🌀 CHRONO IAIJUTSU! 🌀";
    } else if (globals.selectedSkill === 'enhance' && globals.enhanceActiveTimer > 0) {
      enhancedType = 'dragon';
      projDmg = 14;
      txtColor = '#ff4400';
      txtLabel = "🔥 DRAGON IAIJUTSU! 🔥";
    } else if (globals.selectedSkill === 'shield' && globals.enhanceActiveTimer > 0) {
      enhancedType = 'shield';
      projDmg = 10;
      txtColor = '#00ffc8';
      txtLabel = "🌀 TORNADO IAIJUTSU! 🌀";
    } else if (globals.selectedSkill === 'firewheel' && globals.enhanceActiveTimer > 0) {
      enhancedType = 'firewheel';
      projDmg = 11;
      txtColor = '#ff8800';
      txtLabel = "🔥 INFERNO IAIJUTSU! 🔥";
    } else if (globals.selectedSkill === 'gravity' && globals.enhanceActiveTimer > 0) {
      enhancedType = 'gravity';
      projDmg = 9;
      txtColor = '#c084fc';
      txtLabel = "🌌 GRAVITY IAIJUTSU! 🌌";
    } else if (globals.selectedSkill === 'parry_master' && globals.enhanceActiveTimer > 0) {
      enhancedType = 'parry';
      projDmg = 10;
      txtColor = '#ffd700';
      txtLabel = "🛡️ PARRY IAIJUTSU! 🛡️";
    } else if (globals.selectedSkill === 'decoy_illusion' && globals.enhanceActiveTimer > 0) {
      enhancedType = 'decoy';
      projDmg = 12;
      txtColor = '#a855f7';
      txtLabel = "👤 DECOY IAIJUTSU! 👤";
    } else if (globals.selectedSkill === 'dash' && globals.enhanceActiveTimer > 0) {
      enhancedType = 'storm_god';
      projDmg = 12;
      txtColor = '#fbbf24';
      txtLabel = "⚡ LIGHTNING IAIJUTSU! ⚡";
    }

    if (enhancedType === 'dragon' || enhancedType === 'firewheel') {
      playSynthesizedFirewheel();
    } else if (enhancedType === 'storm_god') {
      playSynthesizedThunder();
    }

    globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 40, txtLabel, txtColor, 28));
    globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, txtColor));
    globals.projectiles.push(Projectile.acquire(globals.player.x, globals.player.y, angle, false, projDmg, true, false, enhancedType));
  }

  if (globals.playerStats.judgementCutLevel && globals.playerStats.judgementCutLevel > 0) {
    let targetX = globals.player.x + Math.cos(angle) * 400;
    let targetY = globals.player.y + Math.sin(angle) * 400;
    let closestEnemy: Enemy | null = null;
    let minDistance = Infinity;
    for (const e of globals.enemies) {
      if (e.state === 'dead') continue;
      const dist = Math.hypot(e.x - globals.player.x, e.y - globals.player.y);
      const enemyAngle = Math.atan2(e.y - globals.player.y, e.x - globals.player.x);
      let angleDiff = Math.abs(enemyAngle - angle);
      if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
      if (angleDiff < Math.PI / 3 && dist < minDistance && dist < 600) {
        minDistance = dist;
        closestEnemy = e;
      }
    }
    if (closestEnemy) {
      targetX = closestEnemy.x;
      targetY = closestEnemy.y;
    } else if (!globals.joystickActive && !globals.useMobileIaijutsuAimAngle) {
      const dist = Math.min(600, Math.hypot(globals.mouse.x - globals.width/2, globals.mouse.y - globals.height/2));
      targetX = globals.player.x + Math.cos(angle) * dist;
      targetY = globals.player.y + Math.sin(angle) * dist;
    }
    
    globals.judgementDomes.push({
      x: targetX,
      y: targetY,
      timer: 1.5,
      maxLife: 1.5,
      ticks: 0,
      hitEnemies: new Set<any>()
    });
  }

  const chargeSlashSparkCount = globals.graphicsSettings === 'low' ? 5 : 20;
  for (let i = 0; i < chargeSlashSparkCount; i++) {
    const pAngle = angle + (Math.random() - 0.5) * 0.5;
    const pSpeed = 800 + Math.random() * 600;
    let p = Particle.acquire(globals.player.x, globals.player.y, '#00ffff', 0, 0.4, 3 + Math.random() * 3);
    p.vx = Math.cos(pAngle) * pSpeed;
    p.vy = Math.sin(pAngle) * pSpeed;
    globals.particles.push(p);
  }

  for (let i = 0; i < 3; i++) {
    const dist = (i + 1) * 80;
    const shadowX = globals.player.x + Math.cos(angle) * dist;
    const shadowY = globals.player.y + Math.sin(angle) * dist;
    const afterimg = Afterimage.acquire(globals.player, '#00ffff');
    afterimg.x = shadowX;
    afterimg.y = shadowY;
    afterimg.life = 0.4 - (i * 0.1);
    afterimg.maxLife = 0.4;
    globals.afterimages.push(afterimg);
  }
}

function executeSwiftCounter() {
  // Check for Perfect Dodge on Swift Counter execution
  let perfectDodgeTriggered = false;
  for (const e of globals.enemies) {
    if (e.state === 'dead') continue;
    const dx = e.x - globals.player.x;
    const dy = e.y - globals.player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 360) {
      const isEnemyAttacking = e.state === 'attack' || (e.state === 'charge' && e.stateTime > e.chargeTimeMax - 0.25);
      if (isEnemyAttacking) {
        perfectDodgeTriggered = true;
        break;
      }
    }
  }

  if (perfectDodgeTriggered) {
    globals.runStats.perfectDodges++;
    playSynthesizedPerfectParry();
    globals.screenShake = 30;
    globals.flow = Math.min(globals.playerStats.flowMax, globals.flow + 8.0);
    globals.combo += 2;

    globals.invulnTimer = 1.5;
    
    globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 70, globals.currentLang === 'ja' ? '完璧な回避！' : 'PERFECT DODGE!', "neon-#00ffff", 30));
    globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#ffd700'));
  } else {
    globals.invulnTimer = Math.max(globals.invulnTimer, 0.4);
  }

  globals.player.setState('attack');
  globals.player.attackCooldown = globals.playerStats.attackCooldownBase;
  playSound(sfx.slash);
  
  const startX = globals.player.x;
  const startY = globals.player.y;
  
  // Teleport forward by 250px
  const angle = Math.atan2(globals.player.vy, globals.player.vx) || (globals.player.dir === 1 ? 0 : Math.PI);
  globals.player.x += Math.cos(angle) * 250;
  globals.player.y += Math.sin(angle) * 250;
  globals.player.vx = 0;
  globals.player.vy = 0;
  playTeleportSfx(0.6);
  
  globals.screenShake += 8;
  globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 50, "SWIFT COUNTER!", "#ffb7c5", 22));
  
  // Spawn sakura slash and particles along the path
  const midX = startX + Math.cos(angle) * 125;
  const midY = startY + Math.sin(angle) * 125;
  globals.slashes.push(Slash.acquire(midX, midY, angle, 1.3, true, 'sakura', false, globals.player));
  const dirBlue = (vfxAnims as any).impacts?.directionalBlue;
  if (dirBlue && dirBlue.length > 0) {
    globals.animatedEffects.push(new AnimatedEffect(midX, midY, dirBlue, 0.32, 1.8, angle));
  }
  
  for (let i = 0; i <= 12; i++) {
    const ratio = i / 12;
    const px = startX + Math.cos(angle) * 250 * ratio;
    const py = startY + Math.sin(angle) * 250 * ratio;
    globals.particles.push(Particle.acquire(px, py, '#ffb7c5', 80, 0.45, 2.5 + Math.random() * 2));
  }
  
  // Damage enemies along the line
  globals.enemies.forEach(e => {
    if (e.state === 'dead') return;
    const dist = distToSegment(e.x, e.y, startX, startY, globals.player.x, globals.player.y);
    if (dist < 100) {
      hitEnemy(e, 3);
      for (let j = 0; j < 3; j++) {
        globals.particles.push(Particle.acquire(e.x, e.y, '#ffb7c5', 200, 0.4, 2));
      }
    }
  });
}

function executeThunderclapAndFlash() {
  // Check for Perfect Dodge on Thunderclap execution
  let perfectDodgeTriggered = false;
  for (const e of globals.enemies) {
    if (e.state === 'dead') continue;
    const dx = e.x - globals.player.x;
    const dy = e.y - globals.player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 360) {
      const isEnemyAttacking = e.state === 'attack' || (e.state === 'charge' && e.stateTime > e.chargeTimeMax - 0.25);
      if (isEnemyAttacking) {
        perfectDodgeTriggered = true;
        break;
      }
    }
  }

  if (perfectDodgeTriggered) {
    globals.runStats.perfectDodges++;
    playSynthesizedPerfectParry();
    globals.screenShake = 35;
    globals.flow = Math.min(globals.playerStats.flowMax, globals.flow + 10.0);
    globals.combo += 2;

    globals.invulnTimer = 1.5;
    
    globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 70, globals.currentLang === 'ja' ? '完璧な回避！' : 'PERFECT DODGE!', "neon-#00ffff", 30));
    globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#ffd700'));
  } else {
    globals.invulnTimer = Math.max(globals.invulnTimer, 0.4);
  }

  globals.player.setState('attack');
  globals.player.attackCooldown = globals.playerStats.attackCooldownBase;
  playSound(sfx.slash);
  playSynthesizedThunder();
  
  const startX = globals.player.dashStartX;
  const startY = globals.player.dashStartY;
  const endX = globals.player.x;
  const endY = globals.player.y;
  
  globals.player.vx = 0;
  globals.player.vy = 0;
  
  globals.raijinDashActive = false; // consume
  globals.screenShake += 12;
  globals.floatingTexts.push(FloatingText.acquire(endX, endY - 60, "THUNDERCLAP & FLASH!", "#fbbf24", 24));
  
  // Lightning slash visual
  const angle = Math.atan2(endY - startY, endX - startX) || (globals.player.dir === 1 ? 0 : Math.PI);
  const midX = startX + (endX - startX) / 2;
  const midY = startY + (endY - startY) / 2;
  globals.slashes.push(Slash.acquire(midX, midY, angle, 2.0, true, '#fbbf24', false, globals.player));
  globals.lightningBeams.push(new LightningBeam(endX, endY));
  const lBurst = (vfxAnims as any).skills?.lightningBurst;
  if (lBurst && lBurst.length > 0) {
    globals.animatedEffects.push(new AnimatedEffect(endX, endY, lBurst, 0.35, 2.0));
  }
  const lStrike = (vfxAnims as any).skills?.lightningStrike;
  if (lStrike && lStrike.length > 0) {
    globals.animatedEffects.push(new AnimatedEffect(endX, endY - 20, lStrike, 0.4, 2.2));
  }

  // Hit path enemies
  let firstHit: Enemy | null = null;
  globals.enemies.forEach(e => {
    if (e.state === 'dead') return;
    const dist = distToSegment(e.x, e.y, startX, startY, endX, endY);
    if (dist < 180) {
      hitEnemy(e, 6);
      e.stunTimer = Math.max(e.stunTimer || 0, 1.5);
      if (!firstHit) firstHit = e;
      
      for (let j = 0; j < 5; j++) {
        globals.particles.push(Particle.acquire(e.x, e.y, '#fbbf24', 250, 0.4, 2));
      }
    }
  });
  
  if (firstHit) {
    triggerChainLightning(firstHit);
  }
}

function executeRisingDragon() {
  globals.player.setState('attack');
  globals.player.attackCooldown = globals.playerStats.attackCooldownBase * 1.2;
  playSound(sfx.slash);
  playSynthesizedGravity();
  
  globals.player.yVelocity = -750;
  globals.screenShake += 8;
  globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 60, "RISING DRAGON!", "#00ffc8", 24));
  
  let angle = globals.player.dir === 1 ? 0 : Math.PI;
  if (!globals.joystickActive) {
    angle = Math.atan2(globals.mouse.y - globals.height/2, globals.mouse.x - globals.width/2);
  }
  
  globals.slashes.push(Slash.acquire(globals.player.x, globals.player.y, angle, 1.8, true, '#00ffc8', false, globals.player));
  globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#00ffc8'));
  
  globals.enemies.forEach(e => {
    if (e.state === 'dead') return;
    const dx = e.x - globals.player.x;
    const dy = e.y - globals.player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 160) {
      hitEnemy(e, 4);
      e.yVelocity = -750;
      e.stunTimer = Math.max(e.stunTimer || 0, 0.85);
      
      const pushAngle = Math.atan2(dy, dx);
      e.vx = Math.cos(pushAngle) * 200;
      e.vy = Math.sin(pushAngle) * 200;
      
      for (let i = 0; i < 6; i++) {
        globals.particles.push(Particle.acquire(e.x, e.y, '#00ffc8', 250, 0.4, 2));
      }
    }
  });
}

function executeMirrorStrike(angle: number, baseDmg: number) {
  globals.decoyInvisibilityTimer = 0; // break invisibility
  globals.screenShake += 15;
  playSound(sfx.slash);
  playSynthesizedPerfectParry();
  
  globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 60, "👤 MIRROR STRIKE! 👤", "#aa66ff", 28));
  globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#aa66ff', 200));
  
  const perpX = -Math.sin(angle) * 50;
  const perpY = Math.cos(angle) * 50;
  
  const leftX = globals.player.x - perpX;
  const leftY = globals.player.y - perpY;
  const leftAngle = angle + 0.15;
  globals.projectiles.push(Projectile.acquire(leftX, leftY, leftAngle, false, baseDmg / 2, true, false, 'decoy'));
  
  const rightX = globals.player.x + perpX;
  const rightY = globals.player.y + perpY;
  const rightAngle = angle - 0.15;
  globals.projectiles.push(Projectile.acquire(rightX, rightY, rightAngle, false, baseDmg / 2, true, false, 'decoy'));
  
  for (let i = 0; i < 8; i++) {
    globals.particles.push(Particle.acquire(globals.player.x + (Math.random()-0.5)*100, globals.player.y + (Math.random()-0.5)*100, '#aa66ff', 120, 0.45, 2.5));
  }
}

function triggerChainLightning(startEnemy: Enemy, chainDmg = 2) {
  const chainLimit = 4;
  let currentSource = startEnemy;
  const hitSet = new Set<Enemy>([startEnemy]);
  
  for (let chain = 0; chain < chainLimit; chain++) {
    let closest: Enemy | null = null;
    let minDist = Infinity;
    for (const e of globals.enemies) {
      if (e.state === 'dead' || hitSet.has(e)) continue;
      const dist = Math.hypot(e.x - currentSource.x, e.y - currentSource.y);
      if (dist < minDist && dist < 400) {
        minDist = dist;
        closest = e;
      }
    }
    
    if (!closest) break;
    
    const ex = closest.x;
    const ey = closest.y;
    const sx = currentSource.x;
    const sy = currentSource.y;
    const dist = Math.hypot(ex - sx, ey - sy);
    const steps = Math.min(10, Math.floor(dist / 30));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = sx + (ex - sx) * t;
      const py = sy + (ey - sy) * t;
      const perp = (Math.sin(i * 1.5 + performance.now() * 0.1) > 0 ? 1 : -1) * (Math.random() * 8);
      const perpX = -Math.sin(Math.atan2(ey - sy, ex - sx)) * perp;
      const perpY = Math.cos(Math.atan2(ey - sy, ex - sx)) * perp;
      globals.particles.push(Particle.acquire(px + perpX, py + perpY, '#fbbf24', 0, 0.25, 2.0));
    }
    
    hitEnemy(closest, chainDmg);
    closest.stunTimer = Math.max(closest.stunTimer || 0, 1.5);
    
    hitSet.add(closest);
    currentSource = closest;
  }
}

function triggerVictory() {
  playSynthesizedLevelUp();
  globals.gameState = 'gameover';
  checkAndSaveHighScores();
  const gameOverTitle = document.getElementById('game-over-title');
  if (gameOverTitle) {
    gameOverTitle.innerText = t('victory') || 'VICTORY';
    gameOverTitle.className = 'victory-title';
  }
  document.getElementById('game-over')!.style.display = 'block';
  
  for (let i = 0; i < 80; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 100 + Math.random() * 300;
    const color = Math.random() > 0.5 ? '#ffd700' : '#00ffff';
    globals.particles.push(Particle.acquire(globals.player.x, globals.player.y, color, speed, 1.5, 3 + Math.random() * 2, angle));
  }

  const statsSummary = document.getElementById('stats-summary')!;
  if (statsSummary) {
    const modeCompletedStr = (globals.timerLimit !== 'endless' && globals.gameMode !== 'level') ? t('timeModeCompleted') || 'TIME SURVIVED!' : t('levelModeCompleted') || 'TARGET LEVEL REACHED!';
    statsSummary.innerHTML = `
      <div style="text-align: center; color: #ffd700; font-family: 'Orbitron', sans-serif; font-size: 16px; margin-bottom: 12px; font-weight: bold; text-shadow: 0 0 10px rgba(255, 215, 0, 0.4);">
        ${modeCompletedStr}
      </div>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; font-size:14px; text-transform:uppercase; font-family:'Outfit',sans-serif;">
        <div style="background:rgba(255,255,255,0.05); padding:8px 12px; border-radius:6px; border-left:3px solid #ff3366;">
          <span style="color:#8899a6; font-size:11px; display:block;">${t('statsKills')}</span>
          <strong style="color:#ff3366; font-size:18px;">${globals.runStats.kills}</strong>
        </div>
        <div style="background:rgba(255,255,255,0.05); padding:8px 12px; border-radius:6px; border-left:3px solid #ffcc00;">
          <span style="color:#8899a6; font-size:11px; display:block;">${t('statsMaxCombo')}</span>
          <strong style="color:#ffcc00; font-size:18px;">x${globals.runStats.maxCombo}</strong>
        </div>
        <div style="background:rgba(255,255,255,0.05); padding:8px 12px; border-radius:6px; border-left:3px solid #00ffaa;">
          <span style="color:#8899a6; font-size:11px; display:block;">${t('statsParries')}</span>
          <strong style="color:#00ffaa; font-size:18px;">${globals.runStats.parries}</strong>
        </div>
        <div style="background:rgba(255,255,255,0.05); padding:8px 12px; border-radius:6px; border-left:3px solid #ffd700;">
          <span style="color:#8899a6; font-size:11px; display:block;">${t('statsPerfectParries')}</span>
          <strong style="color:#ffd700; font-size:18px;">${globals.runStats.perfectParries}</strong>
        </div>
        <div style="background:rgba(255,255,255,0.05); padding:8px 12px; border-radius:6px; border-left:3px solid #00ffff;">
          <span style="color:#8899a6; font-size:11px; display:block;">${t('statsPerfectDodges')}</span>
          <strong style="color:#00ffff; font-size:18px;">${globals.runStats.perfectDodges}</strong>
        </div>
        <div style="background:rgba(255,255,255,0.05); padding:8px 12px; border-radius:6px; border-left:3px solid #ff5500;">
          <span style="color:#8899a6; font-size:11px; display:block;">${t('statsDamage')}</span>
          <strong style="color:#ff5500; font-size:18px;">${globals.runStats.damageDealt}</strong>
        </div>
      </div>
    `;
  }
}

function checkAndSaveHighScores() {
  if (isPractice()) return;
  const rs = globals.runStats;
  const hs = globals.highScores;
  
  let newRecord = false;
  if (rs.kills > hs.score) { hs.score = rs.kills; newRecord = true; }
  if (rs.maxCombo > hs.maxCombo) { hs.maxCombo = rs.maxCombo; newRecord = true; }
  if (rs.parries > hs.parries) { hs.parries = rs.parries; newRecord = true; }
  if (rs.perfectParries > hs.perfectParries) { hs.perfectParries = rs.perfectParries; newRecord = true; }
  if (rs.perfectDodges > hs.perfectDodges) { hs.perfectDodges = rs.perfectDodges; newRecord = true; }
  
  if (newRecord) {
    safeStorage.setItem('highScores', JSON.stringify(hs));
    if ((callbacks as any).updateHighScoresDisplay) {
      (callbacks as any).updateHighScoresDisplay();
    }
  }
}

function triggerGameOver(showTimeLimitExceeded = false) {
  if (isPractice()) return;
  globals.player.setState('dead');
  globals.gameState = 'gameover';
  checkAndSaveHighScores();

  const gameOverTitle = document.getElementById('game-over-title');
  if (gameOverTitle) {
    gameOverTitle.innerText = t('death') || 'DEATH';
    gameOverTitle.className = 'death-title';
  }

  // Manage Honor Revive button display
  const reviveBtn = document.getElementById('ad-revive-btn');
  if (reviveBtn) {
    if (!globals.hasRevivedThisRun && (globals.gameMode === 'classic' || globals.gameMode === 'level')) {
      reviveBtn.style.display = 'inline-flex';
    } else {
      reviveBtn.style.display = 'none';
    }
  }

  document.getElementById('game-over')!.style.display = 'block';
  clearGameInputs();
  showDefeatFeedback(showTimeLimitExceeded);
  
  for (let i = 0; i < 50; i++) {
    globals.particles.push(Particle.acquire(globals.player.x, globals.player.y, '#ff3333', 300, 1, 4));
  }

  const statsSummary = document.getElementById('stats-summary')!;
  if (statsSummary) {
    statsSummary.innerHTML = `
      ${showTimeLimitExceeded ? `
        <div style="text-align: center; color: #ff3333; font-family: 'Orbitron', sans-serif; font-size: 16px; margin-bottom: 12px; font-weight: bold;">
          TIME LIMIT EXCEEDED!
        </div>` : ''}
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; font-size:14px; text-transform:uppercase; font-family:'Outfit',sans-serif;">
        <div style="background:rgba(255,255,255,0.05); padding:8px 12px; border-radius:6px; border-left:3px solid #ff3366;">
          <span style="color:#8899a6; font-size:11px; display:block;">${t('statsKills')}</span>
          <strong style="color:#ff3366; font-size:18px;">${globals.runStats.kills}</strong>
        </div>
        <div style="background:rgba(255,255,255,0.05); padding:8px 12px; border-radius:6px; border-left:3px solid #ffcc00;">
          <span style="color:#8899a6; font-size:11px; display:block;">${t('statsMaxCombo')}</span>
          <strong style="color:#ffcc00; font-size:18px;">x${globals.runStats.maxCombo}</strong>
        </div>
        <div style="background:rgba(255,255,255,0.05); padding:8px 12px; border-radius:6px; border-left:3px solid #00ffaa;">
          <span style="color:#8899a6; font-size:11px; display:block;">${t('statsParries')}</span>
          <strong style="color:#00ffaa; font-size:18px;">${globals.runStats.parries}</strong>
        </div>
        <div style="background:rgba(255,255,255,0.05); padding:8px 12px; border-radius:6px; border-left:3px solid #ffd700;">
          <span style="color:#8899a6; font-size:11px; display:block;">${t('statsPerfectParries')}</span>
          <strong style="color:#ffd700; font-size:18px;">${globals.runStats.perfectParries}</strong>
        </div>
        <div style="background:rgba(255,255,255,0.05); padding:8px 12px; border-radius:6px; border-left:3px solid #00ffff;">
          <span style="color:#8899a6; font-size:11px; display:block;">${t('statsPerfectDodges')}</span>
          <strong style="color:#00ffff; font-size:18px;">${globals.runStats.perfectDodges}</strong>
        </div>
        <div style="background:rgba(255,255,255,0.05); padding:8px 12px; border-radius:6px; border-left:3px solid #ff5500;">
          <span style="color:#8899a6; font-size:11px; display:block;">${t('statsDamage')}</span>
          <strong style="color:#ff5500; font-size:18px;">${globals.runStats.damageDealt}</strong>
        </div>
      </div>
    `;
  }
}

export function revivePlayer() {
  if (globals.gameState !== 'gameover') return;
  
  globals.hasRevivedThisRun = true;
  globals.gameState = 'playing';
  globals.lives = 3;
  globals.invulnTimer = 2.0; // 2s invulnerability
  
  // Set player state back to normal
  if (globals.player) {
    globals.player.setState('idle');
    globals.player.deathProgress = 0;
  }
  
  // Clear any existing enemies around the player to give them breathing room
  globals.enemies = []; 
  
  // Hide Game Over screen
  document.getElementById('game-over')!.style.display = 'none';
  
  // Trigger a screen flash & play sfx
  globals.screenShake = 15;
  playSynthesizedAwaken();
  
  // Create flash particles
  for (let i = 0; i < 40; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 150 + Math.random() * 200;
    globals.particles.push(Particle.acquire(globals.player.x, globals.player.y, '#ffd700', speed, 1.2, 3 + Math.random() * 2, angle));
  }
  
  // Update HUD
  callbacks.updateUI?.();
  
  // Trigger floating text
  globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 100, "BLADE HONORED - REVIVED!", "#ffd700", 28));
  
  // Restart spawning loop
  spawnEnemy();
  
  console.log("[AdManager] Player revived successfully!");
}

/* hack: had to separate awakening execution hits from standard normal hits */
function hitEnemy(e: Enemy, dmg = 1, killedByClient = false) {
  if (e.state === 'dead') return;
  // Shadow Doppelganger Mirror Counter-Parry
  if ((e as any).isShadowDoppelganger && e.state === 'charge' && Math.random() < 0.45) {
    playSynthesizedParry();
    globals.floatingTexts.push(FloatingText.acquire(e.x, e.y - 50, globals.currentLang === 'ja' ? '影の受け流し！ 🛡️' : 'SHADOW PARRY! 🛡️', '#a855f7', 26));
    globals.shockwaves.push(new Shockwave(e.x, e.y, '#9333ea'));
    e.setState('attack');
    e.lungeSpeed = 1200;
    return;
  }
  if ((e as any).iceShieldActive) {
    (e as any).iceShieldActive = false;
    globals.floatingTexts.push(FloatingText.acquire(e.x, e.y - 45, globals.currentLang === 'ja' ? '防ぐ！' : 'BLOCKED!', '#60a5fa', 22));
    playSynthesizedParry();
    for (let i = 0; i < 10; i++) {
      globals.particles.push(Particle.acquire(e.x, e.y, '#60a5fa', 200, 0.4, 2 + Math.random() * 2));
    }
    return;
  }
  // Skeleton Warlord Guard Stance Parry & Counter-Thrust
  if (e.subType === 'skeleton_warlord' && e.state === 'react') {
    playSynthesizedParry();
    playSwordClash();
    globals.screenShake = Math.max(globals.screenShake, 18);
    globals.floatingTexts.push(FloatingText.acquire(e.x, e.y - 60, globals.currentLang === 'ja' ? '骨刃受け流し！ 🛡️' : 'BONE DEFLECTION! 🛡️', '#cbd5e1', 26));
    globals.shockwaves.push(new Shockwave(e.x, e.y, '#f59e0b'));
    e.setState('attack');
    e.targetAngle = Math.atan2(globals.player.y - e.y, globals.player.x - e.x);
    e.lungeCos = Math.cos(e.targetAngle);
    e.lungeSin = Math.sin(e.targetAngle);
    e.vx = e.lungeCos * e.lungeSpeed;
    e.vy = e.lungeSin * e.lungeSpeed;
    return;
  }
  if ((e as any).isPvpRemote && pvpManager.subMode === 'insane_survival') return;

  if (globals.gameMode === 'pvp' && pvpManager.subMode === 'insane_survival') {
    if (pvpManager.role === 'client') {
      // Client reports damage to Host instead of applying it locally
      pvpManager.send({
        type: 'pvp_enemy_hit',
        id: (e as any).id,
        damage: dmg
      });
      return;
    }
  }

  globals.runStats.damageDealt += dmg;
  if (globals.playerStats.fireStanceLevel && globals.playerStats.fireStanceLevel > 0) {
    e.burnTimer = 3.0;
    if (e.burnTickTimer <= 0) e.burnTickTimer = 0.5;
  }
  if (globals.activeFusions.has('plasma_tempest') && e.burnTimer > 0) {
    triggerChainLightning(e, 8);
  }
  if (globals.frostStanceActive) {
    e.chillTimer = 3.0;
  }

  playSynthesizedHit();
  
  // Critical Hit calculation (hero base crit + powerup crit, with powerup bonus capped at 40%)
  const heroCritChance = globals.playerStats?.heroCritChance || 0;
  const powerupCritChance = Math.min(0.4, globals.playerStats?.critChanceBonus || 0);
  const critChance = Math.min(1.0, heroCritChance + powerupCritChance);
  const isCrit = Math.random() < critChance;
  
  let finalDmg = dmg;

  // Skeleton Warlord Punish window (+50% bonus damage)
  if (e.subType === 'skeleton_warlord' && e.state === 'recover') {
    finalDmg = Math.round(finalDmg * 1.5);
    globals.floatingTexts.push(FloatingText.acquire(e.x, e.y - 80, "PUNISH! 💥", "#ef4444", 24));
  }

  const hasExecutionPerk = Boolean(globals.executionUnlocked || (globals.playerStats.executionLevel && globals.playerStats.executionLevel > 0));
  const isPostureBroken = (e as any).postureBrokenTimer > 0;
  const isExecution = isPostureBroken && hasExecutionPerk;
  const isUpwardInput = globals.keys['KeyW'] || globals.keys['ArrowUp'] || (globals.joystickActive && globals.joystickVector && globals.joystickVector.y < -0.35);

  if (isPostureBroken && isUpwardInput && !(e as any).airborneZ) {
    // Option 3: Rising Aerial Launcher
    (e as any).airborneZ = 15;
    (e as any).airborneVz = 820;
    (e as any).canAerialCleave = true;
    (e as any).postureBrokenTimer = 1.4;
    (e as any).stunTimer = 1.4;

    globals.screenShake = Math.max(globals.screenShake, 18);
    globals.slashes.push(Slash.acquire(e.x, e.y, -Math.PI / 2, 2.2, false, '#38bdf8'));
    globals.shockwaves.push(new Shockwave(e.x, e.y, '#38bdf8'));
    globals.floatingTexts.push(FloatingText.acquire(e.x, e.y - 65, t('aerialLaunchedText') || "LAUNCHED! 🌪️", "neon-#38bdf8", 30));
    playSound(sfx.slash);
    addFlow(8);
    addCombo();
    return;
  }

  if (isExecution) {
    (e as any).postureBrokenTimer = 0;
    (e as any).posture = 0;
    const isBoss = e.subType === 'oni_boss' || e.subType === 'shogun_boss' || e.subType === 'agis_colossus' || e.subType === 'skeleton_warlord' || (e as any).isBoss;
    if (isBoss) {
      // Boss execution: lower to ~12% max HP (capped at 25, min 12), stun boss for 2.5s
      finalDmg = Math.min(25, Math.max(12, Math.round((e.maxHp || 100) * 0.12)));
      e.stunTimer = 2.5;
      e.knockbackTimer = 0.45;
      const kbAngle = Math.atan2(e.y - globals.player.y, e.x - globals.player.x);
      e.knockbackVx = Math.cos(kbAngle) * 900;
      e.knockbackVy = Math.sin(kbAngle) * 900;
      globals.floatingTexts.push(FloatingText.acquire(e.x, e.y - 65, `BOSS STAGGERED! 💥 -${finalDmg}`, 'neon-#ffd700', 34));
    } else {
      // Regular execution: reduced to ~20% of max HP (min 8 DMG)
      finalDmg = Math.max(8, Math.round((e.maxHp || 10) * 0.20));
      globals.floatingTexts.push(FloatingText.acquire(e.x, e.y - 55, `EXECUTION! 💀 -${finalDmg}`, '#ff003c', 30));
    }

    globals.screenShake = Math.max(globals.screenShake, isBoss ? 28 : 12);
    globals.hitStop = 0;
    if (isBoss) {
      globals.shockwaves.push(new Shockwave(e.x, e.y, '#ffd700', 220));
    }
    const bloodFx = (vfxAnims as any).combat?.bloodSplatter;
    if (bloodFx && bloodFx.length > 0) {
      const bAngle = Math.atan2(e.y - globals.player.y, e.x - globals.player.x);
      globals.animatedEffects.push(new AnimatedEffect(e.x, e.y, bloodFx, 0.45, isBoss ? 2.5 : 1.8, bAngle));
    }
    if (isBoss) {
      const execBurst = (vfxAnims as any).combat?.executionBurst;
      if (execBurst && execBurst.length > 0) {
        globals.animatedEffects.push(new AnimatedEffect(e.x, e.y, execBurst, 0.45, 2.6));
      }
    }
    addFlow(20);

    // Execution Magatama Bounty (boosted by Fortune & Blood Surge / Blood Tithe)
    const bloodSurgeMult = globals.activeStageAffix?.id === 'blood_surge' ? 2 : (globals.activeStageAffix?.id === 'blood_tithe' ? 3 : 1);
    const execMag = Math.round((isBoss ? 15 : 3) * (globals.playerStats?.fortuneMult || 1.0) * bloodSurgeMult);
    globals.magatama = (globals.magatama || 0) + execMag;
    safeStorage.setItem('stickmurai_magatama', globals.magatama.toString());
    playMagatamaPickup(0.65);
    globals.floatingTexts.push(FloatingText.acquire(e.x + 25, e.y - 85, `+${execMag} 🔮`, '#c084fc', 22));

    // Nightborne Sovereign execution passive: Soul Siphon restores +1 Heart and siphons +25 extra Magatama
    if (globals.selectedHero === 'nightborne') {
      globals.lives = Math.min(globals.maxLives, globals.lives + 1);
      globals.magatama = (globals.magatama || 0) + 25;
      safeStorage.setItem('stickmurai_magatama', globals.magatama.toString());
      playMagatamaPickup(1.0);
      globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 110, "+1 ❤️ SOUL SIPHON! (+25 🔮)", "#c084fc", 26));
      globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#c084fc'));
    }

    // Primal Satyr Sovereign execution passive: Earthshaker Tremor (balanced with 4.5s ICD & target cap)
    if (globals.selectedHero === 'satyr' && (globals.satyrEarthshakerCD || 0) <= 0) {
      globals.satyrEarthshakerCD = 4.5;
      globals.screenShake = Math.max(globals.screenShake, 18);
      globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#10b981', 200));
      playPrimalZap(0.9);
      globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 110, "EARTHSHAKER TREMOR! 🌿", "#10b981", 28));
      
      // Stagger and damage nearby enemies (capped to max 4 targets to preserve 60 FPS)
      let staggeredCount = 0;
      for (let i = 0; i < globals.enemies.length && staggeredCount < 4; i++) {
        const other = globals.enemies[i];
        if (!other || other === e || other.state === 'dead') continue;
        const odx = other.x - globals.player.x;
        const ody = other.y - globals.player.y;
        if (odx * odx + ody * ody < 350 * 350) {
          staggeredCount++;
          other.addPostureDamage(28);
          other.knockbackTimer = 0.4;
          const kAng = Math.atan2(ody, odx);
          other.knockbackVx = Math.cos(kAng) * 600;
          other.knockbackVy = Math.sin(kAng) * 600;
          other.hp -= 15;
          if (other.hp <= 0) killEnemy(other);
        }
      }
    }

    // Execution Stance Synergy 1: Fire Stance — Inferno Corpse Detonation + Burn
    if (globals.playerStats?.fireStanceLevel && globals.playerStats.fireStanceLevel > 0) {
      const infBlast = (vfxAnims as any).explosions?.infernoBlast || vfxAnims.explosions?.fire;
      if (infBlast && infBlast.length > 0) {
        globals.animatedEffects.push(new AnimatedEffect(e.x, e.y, infBlast, 0.55, 2.2));
      }
      globals.floatingTexts.push(FloatingText.acquire(e.x, e.y - 75, "INFERNAL DETONATION! 💥🔥", "#ea580c", 26));
      playSynthesizedFirewheel();
      
      let fireHits = 0;
      for (let i = 0; i < globals.enemies.length && fireHits < 5; i++) {
        const other = globals.enemies[i];
        if (!other || other === e || other.state === 'dead') continue;
        const fdx = other.x - e.x;
        const fdy = other.y - e.y;
        if (fdx * fdx + fdy * fdy < 180 * 180) {
          fireHits++;
          other.burnTimer = Math.max(other.burnTimer || 0, 4.0);
          other.burnDmg = Math.max(other.burnDmg || 0, 2);
          other.hp -= (18 + 4 * (globals.playerStats.fireStanceLevel || 1));
          if (other.hp <= 0) killEnemy(other);
        }
      }
    }

    // Execution Stance Synergy 2: Frost Stance — Ice Shrapnel Shatter & Deep Freeze
    if (globals.frostStanceActive) {
      const iceSpike = (vfxAnims as any).frostKnight?.vfx3;
      if (iceSpike && iceSpike.length > 0) {
        globals.animatedEffects.push(new AnimatedEffect(e.x, e.y, iceSpike, 0.5, 2.0));
      }
      globals.floatingTexts.push(FloatingText.acquire(e.x, e.y - 75, "FROST SHATTER! ❄️", "#38bdf8", 26));
      playSynthesizedAwaken();

      let frostHits = 0;
      for (let i = 0; i < globals.enemies.length && frostHits < 5; i++) {
        const other = globals.enemies[i];
        if (!other || other === e || other.state === 'dead') continue;
        const idx = other.x - e.x;
        const idy = other.y - e.y;
        if (idx * idx + idy * idy < 180 * 180) {
          frostHits++;
          other.stunTimer = Math.max(other.stunTimer || 0, 1.8);
          other.isChilled = true;
          other.chillTimer = Math.max(other.chillTimer || 0, 4.0);
          other.hp -= 16;
          if (other.hp <= 0) killEnemy(other);
        }
      }
    }

    // Execution Stance Synergy 3: Void Stance — Event Horizon Mini-Vacuum Collapse
    if (globals.voidStanceActive) {
      const warpFx = (vfxAnims as any).skills?.phantomWarp || (vfxAnims as any).skills?.voidWarp;
      if (warpFx && warpFx.length > 0) {
        globals.animatedEffects.push(new AnimatedEffect(e.x, e.y, warpFx, 0.5, 2.2));
      }
      globals.floatingTexts.push(FloatingText.acquire(e.x, e.y - 75, "VOID COLLAPSE! 🌌", "#c084fc", 26));
      playSynthesizedGravity();

      let voidHits = 0;
      for (let i = 0; i < globals.enemies.length && voidHits < 5; i++) {
        const other = globals.enemies[i];
        if (!other || other === e || other.state === 'dead') continue;
        const vdx = e.x - other.x;
        const vdy = e.y - other.y;
        const vDistSq = vdx * vdx + vdy * vdy;
        if (vDistSq < 260 * 260 && vDistSq > 1) {
          voidHits++;
          const vDist = Math.sqrt(vDistSq);
          other.vx += (vdx / vDist) * 750;
          other.vy += (vdy / vDist) * 750;
          other.hp -= 15;
          if (other.hp <= 0) killEnemy(other);
        }
      }
    }

    const mangaCutin = document.getElementById('manga-cutin');
    if (mangaCutin) {
      mangaCutin.style.display = 'block';
      mangaCutin.style.opacity = '0.9';
      setTimeout(() => {
        if (mangaCutin) {
          mangaCutin.style.opacity = '0';
          setTimeout(() => { mangaCutin.style.display = 'none'; }, 200);
        }
      }, 180);
    }

    playSynthesizedAwaken();
    playSound(sfx.slash);

    for (let i = 0; i < 20; i++) {
      const spd = 300 + Math.random() * 400;
      const ang = Math.random() * Math.PI * 2;
      globals.particles.push(Particle.acquire(e.x, e.y, '#ff003c', spd, 0.45, 3.5, ang));
    }
  } else if (isPostureBroken) {
    (e as any).postureBrokenTimer = 0;
    (e as any).posture = 0;
    finalDmg = Math.round(finalDmg * 1.4);
    e.stunTimer = Math.max(e.stunTimer || 0, 0.45);
    globals.screenShake = Math.max(globals.screenShake, 12);
    globals.floatingTexts.push(FloatingText.acquire(e.x, e.y - 50, `STAGGER HIT! 💥 -${finalDmg}`, '#f59e0b', 26));
    const staggerSparks = globals.graphicsSettings === 'low' ? 3 : 8;
    for (let i = 0; i < staggerSparks; i++) {
      globals.particles.push(Particle.acquire(e.x, e.y, '#f59e0b', 240, 0.35, 2));
    }
  } else if (globals.guaranteedCrit) {
    globals.guaranteedCrit = false;
    finalDmg = Math.round(dmg * 2.5);
    globals.screenShake = Math.max(globals.screenShake, 18);
    globals.hitStop = 0;
    globals.floatingTexts.push(FloatingText.acquire(e.x + (Math.random()-0.5)*40, e.y - 45, `CRITICAL SHING! 💥 -${finalDmg}`, '#fde047', 30));
    globals.shockwaves.push(new Shockwave(e.x, e.y, '#fde047'));
    playSynthesizedClash();

    if (typeof (e as any).addPostureDamage === 'function') {
      (e as any).addPostureDamage(35);
    }
    const critSparkCount = globals.graphicsSettings === 'low' ? 6 : 18;
    for (let i = 0; i < critSparkCount; i++) {
      const spd = 250 + Math.random() * 350;
      const ang = Math.random() * Math.PI * 2;
      globals.particles.push(Particle.acquire(e.x, e.y, '#fde047', spd, 0.45, 3.5, ang));
    }
  } else if (isCrit) {
    finalDmg = dmg * 2;
    globals.screenShake = Math.max(globals.screenShake, 14);
    globals.hitStop = 0;
    globals.floatingTexts.push(FloatingText.acquire(e.x + (Math.random()-0.5)*40, e.y - 35, `CRIT! 💥 -${finalDmg}`, '#ffaa00', 26));

    if (typeof (e as any).addPostureDamage === 'function') {
      (e as any).addPostureDamage(18);
    }

    // Golden crit particles
    const critSparkCount = globals.graphicsSettings === 'low' ? 3 : 12;
    for(let i=0; i<critSparkCount; i++) {
      const spd = 200 + Math.random() * 300;
      const ang = Math.random() * Math.PI * 2;
      globals.particles.push(Particle.acquire(e.x, e.y, '#ffd700', spd, 0.35, 3, ang));
    }
  } else {
    globals.screenShake = Math.max(globals.screenShake, 6);
    globals.floatingTexts.push(FloatingText.acquire(e.x + (Math.random()-0.5)*40, e.y - 30, `-${finalDmg}`, '#ff5555', 18));

    if (typeof (e as any).addPostureDamage === 'function') {
      (e as any).addPostureDamage(10);
    }
  }

  // Deflect Karakuri Barrel Bomber into enemy ranks
  if (e.subType === 'barrel_bomber') {
    const dx = e.x - globals.player.x;
    const dy = e.y - globals.player.y;
    const dist = Math.hypot(dx, dy) || 1;
    e.knockbackTimer = 0.6;
    e.knockbackVx = (dx / dist) * 1200;
    e.knockbackVy = (dy / dist) * 1200;
    globals.floatingTexts.push(FloatingText.acquire(e.x, e.y - 30, "DEFLECTED! 🎯", "#f97316", 20));
  }
  
  e.hp -= finalDmg;
  e.hitFlash = 0.15;
  
  const hitSparkCount = globals.graphicsSettings === 'low' ? 2 : 8;
  for(let i=0; i<hitSparkCount; i++) globals.particles.push(Particle.acquire(e.x, e.y, '#d0d4d8', 300, 0.3, 3));
  
  if (e.hp <= 0) {
    if (globals.gameMode === 'pvp' && pvpManager.subMode === 'insane_survival' && pvpManager.role === 'host') {
      if (killedByClient) {
        globals.p2Kills++;
      } else {
        globals.p1Kills++;
      }
      broadcastSurvivalState();
    }
    killEnemy(e);
  }
}

function triggerShatterAoE(x: number, y: number) {
  playSound(sfx.slash, 0.4);
  playSynthesizedParry();
  globals.shockwaves.push(new Shockwave(x, y, '#00ffff'));
  
  const sparkCount = globals.graphicsSettings === 'low' ? 6 : 20;
  for (let i = 0; i < sparkCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 200 + Math.random() * 400;
    globals.particles.push(Particle.acquire(x, y, '#00ffff', speed, 0.6, 2 + Math.random() * 2, angle));
  }

  globals.enemies.forEach(other => {
    if (other.state === 'dead') return;
    const dx = other.x - x;
    const dy = other.y - y;
    const dist = Math.hypot(dx, dy);
    if (dist <= 250) {
      other.chillTimer = 3.0;
      hitEnemy(other, 8);
    }
  });
}



function checkVampireHeal(e: Enemy) {
  if (globals.gameMode !== 'zen' && globals.playerStats.vampireChance > 0 && Math.random() < globals.playerStats.vampireChance) {
    globals.collectibles.push(new Collectible(e.x, e.y, 'heart'));
  }
}

function killEnemy(e: Enemy) {
  e.setState('dead'); 
  addCombo();
  globals.runStats.kills++;
  globals.chiburuiKills = (globals.chiburuiKills || 0) + 1;
  checkVampireHeal(e);

  if (e.subType === 'barrel_bomber') {
    triggerBarrelExplosion(e);
  }

  // Corpse Ignition & Infernal Domain Stage Affix (slain enemies burst into burning embers)
  if (globals.activeStageAffix?.id === 'corpse_ignition' || globals.activeStageAffix?.id === 'infernal_domain') {
    playSynthesizedFirewheel();
    globals.shockwaves.push(new Shockwave(e.x, e.y, '#ef4444'));
    const emberCount = globals.activeStageAffix?.id === 'infernal_domain' ? 20 : 12;
    for (let p = 0; p < emberCount; p++) {
      const pAngle = Math.random() * Math.PI * 2;
      const pSpeed = 80 + Math.random() * 200;
      globals.particles.push(Particle.acquire(e.x, e.y, '#f97316', pSpeed, 0.6, 4.0, pAngle));
    }
    // Harm nearby enemies (cap 5 targets per rule 2, squared distance check)
    let hitCount = 0;
    for (let i = 0; i < globals.enemies.length; i++) {
      const other = globals.enemies[i];
      if (other !== e && other.state !== 'dead') {
        const dx = other.x - e.x;
        const dy = other.y - e.y;
        if (dx * dx + dy * dy < 14400) { // 120^2
          hitCount++;
          callbacks.hitEnemy(other, globals.activeStageAffix?.id === 'infernal_domain' ? 6 : 4);
          if (hitCount >= 5) break;
        }
      }
    }
  }

  // Phantom Convergence / Phantom Ambush Stage Affix (Ethereal shadow phantoms flank on death)
  if (globals.activeStageAffix?.id === 'phantom_ambush' && Math.random() < 0.25) {
    playTeleportSfx(0.45);
    globals.floatingTexts.push(FloatingText.acquire(e.x, e.y - 45, "👥 PHANTOM AMBUSH!", "#a855f7", 20));
    globals.shockwaves.push(new Shockwave(e.x, e.y, '#a855f7'));
    const phantom = new Enemy(e.x + (Math.random() - 0.5) * 60, e.y + (Math.random() - 0.5) * 60, globals.player);
    phantom.subType = 'assassin';
    (phantom as any).colorTint = 'rgba(168, 85, 247, 0.85)';
    phantom.hp = 6;
    phantom.maxHp = 6;
    globals.enemies.push(phantom);
  }

  // Stage Mode Progress & Clear Condition (Visceral "斬" Finisher Trigger)
  globals.stageKills = (globals.stageKills || 0) + 1;
  if (globals.gameState === 'playing' && globals.gameMode === 'classic') {
    const stage = globals.currentStage || 1;
    const isBossStage = stage % 5 === 0;
    const isBossDefeated = e.subType === 'oni_boss' || e.subType === 'agis_colossus' || e.subType === 'skeleton_warlord' || e.subType === 'shogun_boss' || (e as any).isBoss;
    if ((isBossStage && isBossDefeated) || (!isBossStage && globals.stageKills >= globals.stageTargetKills)) {
      globals.gameState = 'stageclear';
      const lvlScreen = document.getElementById('level-up-screen');
      if (lvlScreen) lvlScreen.style.display = 'none';
      const ultScreen = document.getElementById('ult-screen');
      if (ultScreen) ultScreen.style.display = 'none';

      if (!isZanFinisherActive && callbacks.triggerStageClear) {
        triggerZanFinisher(() => {
          callbacks.triggerStageClear();
        });
      }
    }
  }

  if (e.subType === 'oni_boss' || e.subType === 'shogun_boss' || e.subType === 'agis_colossus' || e.subType === 'skeleton_warlord' || (e as any).isBoss) {
    globals.runStats.bossesKilled++;
    if ((e as any).isSupremeShogun || (globals.runTime >= 540 && e.subType === 'shogun_boss')) {
      globals.shogunDefeatedAtDawn = true;
      callbacks.triggerDawnVictory();
    }
    if (!bossEncounterDamaged && !globals.unlockedSeals.includes(3)) {
      spawnShrine(3);
    }
  }
  if ((e as any).isShadowDoppelganger && !globals.unlockedSeals.includes(5)) {
    spawnShrine(5);
  }

  // Award Yomi Magatama based on enemy tier (boosted by Fortune & Blood Surge / Blood Tithe)
  const isBossEnemy = e.subType === 'oni_boss' || e.subType === 'shogun_boss' || e.subType === 'agis_colossus' || e.subType === 'skeleton_warlord' || (e as any).isBoss;
  const isEliteOrRanged = e.subType === 'musketeer' || e.subType === 'pyromancer' || e.subType === 'necromancer' || e.subType === 'orc_brute';
  const fortuneMult = globals.playerStats?.fortuneMult || 1.0;
  const bloodSurgeMult = globals.activeStageAffix?.id === 'blood_surge' ? 2 : (globals.activeStageAffix?.id === 'blood_tithe' ? 3 : 1);
  const earnedMagatama = Math.round((isBossEnemy ? 50 : (isEliteOrRanged ? 3 : 1)) * fortuneMult * bloodSurgeMult);
  globals.magatama = (globals.magatama || 0) + earnedMagatama;
  safeStorage.setItem('stickmurai_magatama', globals.magatama.toString());
  if (isBossEnemy || Math.random() < 0.35) {
    playMagatamaPickup(0.45);
    globals.floatingTexts.push(FloatingText.acquire(e.x, e.y - 45, `+${earnedMagatama} 🔮`, '#c084fc', isBossEnemy ? 26 : 18));
  }


  if (globals.activeBounty && globals.activeBounty.type === 'slay') {
    globals.activeBounty.current++;
  }

  if (globals.bloodThirstCurseActive) {
    addFlow(2);
    if (Math.random() < 0.35) {
      triggerChainLightning(e);
    }
  }

  if (e.subType === 'pyromancer') {
    const fireExp = new AnimatedEffect(e.x, e.y, vfxAnims.explosions.fire, 0.7, 2.0);
    globals.animatedEffects.push(fireExp);
    // Deal splash damage to player if close (squared distance comparison for 60 FPS invariant)
    const dx = globals.player.x - e.x;
    const dy = globals.player.y - e.y;
    if ((dx * dx + dy * dy) < 140 * 140 && globals.player.state !== 'dead') {
      callbacks.checkPlayerHit(e, 1);
    }
  } else if (e.subType === 'necromancer') {
    const voidExp = new AnimatedEffect(e.x, e.y, vfxAnims.warlock.vfx3, 0.8, 2.2);
    globals.animatedEffects.push(voidExp);
  }
  
  const killSparkCount = globals.graphicsSettings === 'low' ? 6 : 20;
  for(let i=0; i<killSparkCount; i++) {
    const speed = 300 + Math.random() * 500;
    const sprayAngle = -Math.PI/4 - Math.random() * Math.PI/2;
    globals.particles.push(Particle.acquire(
      e.x, e.y, '#ff3333', speed, 0.6 + Math.random()*0.4, (2 + Math.random() * 3) * e.scaleMult, sprayAngle, 1200, 0.97
    ));
  }

  globals.screenShake += 5;
  globals.collectibles.push(new Collectible(e.x, e.y, 'exp', e.expValue));
  
  // Reaper's Mark reset kill count
  if (globals.playerStats.reapersMarkLevel && globals.playerStats.reapersMarkLevel > 0) {
    globals.reapersMarkKills = (globals.reapersMarkKills || 0) + 1;
    if (globals.reapersMarkKills >= 10) {
      globals.reapersMarkKills = 0;
      globals.reapersMarkTimer = 25.0;
      globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 65, "MARK RECOVERY!", "#00ff66", 20));
    }
  }
  
  updateUI();
  if (globals.exp >= globals.maxExp && globals.gameState === 'playing') {
    triggerLevelUp();
  }
}

function addCombo() {
  globals.combo++; 
  globals.comboTimer = 6.0; 
  globals.score += globals.curseOfGreedActive ? 2 : 1;
  if (globals.combo > globals.runStats.maxCombo) {
    globals.runStats.maxCombo = globals.combo;
  }
  
  if (globals.activeBounty && globals.activeBounty.type === 'combo') {
    globals.activeBounty.current = Math.max(globals.activeBounty.current, globals.combo);
  }

  if (globals.combo % 10 === 0 && globals.combo > 0) {
    globals.comboFinisherReady = true;
    globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 120, "FINISHER READY!", "#ffcc00", 24));
  }

  if (!globals.unlockedSeals.includes(4) && (globals.combo === 25 || globals.combo === 40)) {
    notifyFeatMilestone(4, globals.combo, 50, "Combo Streak", "コンボ数");
  }

  // Combo Milestone Magatama Bounties (boosted by Fortune)
  if (globals.combo === 25 || globals.combo === 50 || globals.combo === 100 || (globals.combo > 100 && globals.combo % 50 === 0)) {
    const bountyBase = Math.min(150, globals.combo);
    const comboBounty = Math.round(bountyBase * (globals.playerStats?.fortuneMult || 1.0));
    globals.magatama = (globals.magatama || 0) + comboBounty;
    safeStorage.setItem('stickmurai_magatama', globals.magatama.toString());
    globals.floatingTexts.push(FloatingText.acquire(
      globals.player.x,
      globals.player.y - 140,
      globals.currentLang === 'ja' ? `🔥 ${globals.combo}連撃ボーナス: +${comboBounty} 🔮` : `🔥 ${globals.combo} COMBO BOUNTY: +${comboBounty} 🔮`,
      'neon-#ffd700',
      30
    ));
    try { playSynthesizedParry(); } catch(err) {}
  }

  addFlow(1.2);
  callbacks.updateComboDisplay?.();
  globals.hitStop = 0; 
  updateUI();
}

function addFlow(amount: number) {
  if (globals.flowState !== 'normal' || globals.zenFieldActiveTimer > 0) return;
  const prevFlow = globals.flow;
  let mult = globals.playerStats.flowGenMult || 1.0;
  if (globals.difficulty === 'insane') {
    mult *= 0.5; // Significantly reduce flow accumulation in insane mode
  } else if (globals.difficulty === 'hard') {
    mult *= 0.75;
  }
  // Soft diminishing returns as combo grows very large to prevent runaway flow accumulation in hordes
  if (globals.combo > 40) {
    mult *= 0.6;
  } else if (globals.combo > 20) {
    mult *= 0.8;
  }
  globals.flow += amount * mult;
  if (globals.flow >= globals.playerStats.flowMax) {
    globals.flow = globals.playerStats.flowMax;
    if (globals.ultCooldown <= 0) {
      document.getElementById('btn-ult')?.classList.add('ready');
      if (prevFlow < globals.playerStats.flowMax) {
        playSynthesizedPerfectParry(); 
        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 120, "ULTIMATE READY!", "#ffd700", 32));
        for(let i=0; i<15; i++) {
          const speed = 200 + Math.random() * 200;
          globals.particles.push(Particle.acquire(globals.player.x, globals.player.y, '#ffd700', speed, 0.8, 3));
        }
      }
    }
  }
  updateUI();
}

function update(realDt: number) {
  pollGamepad();
  practiceStep();
  updateThreats(realDt);
  if (globals.mobileDashDown && (globals.flowState === 'awakened' || globals.flowState === 'storm_god')) {
    globals.mobileDashJustPressed = true;
  }
  if (globals.gameState === 'mainmenu') return;
  
  if ((globals.gameMode as string) === 'pvp') {
    if (pvpManager.subMode === 'insane_survival') {
      runPvpSurvivalStep(realDt);
      // Let the rest of the update function run for normal single-player logic!
    } else {
      runPvpStep(realDt);
      return;
    }
  }

  if (globals.gameState === 'levelup' || globals.gameState === 'ultchoice' || globals.gameState === 'paused') return; 
  if (globals.gameState !== 'playing' && (!globals.player || globals.player.state !== 'dead')) return;
  // Slow-motion and freeze-frame hitStop removed completely to ensure seamless 60fps
  globals.hitStop = 0;

  if (globals.timerLimit !== 'endless' && globals.gameState === 'playing') {
    globals.timeModeTimeRemaining -= realDt;
    if (globals.timeModeTimeRemaining <= 0) {
      globals.timeModeTimeRemaining = 0;
      if (globals.gameMode === 'level') {
        // Failed to reach level goal in time -> Game Over
        triggerGameOver(true);
        return;
      } else {
        // Survived in classic or zen mode!
        triggerVictory();
        return;
      }
    }
  }

  if (globals.gameMode === 'level' && globals.gameState === 'playing') {
    if (globals.level >= globals.levelModeTarget) {
      triggerVictory();
      return;
    }
  }

  // Progression: Run Time, Day/Night Phase, Calamities, Shrines & Hermit
  if (globals.gameState === 'playing') {
    globals.runTime += realDt;
    globals.dayNightPhase = 'dawn';

    // 10-Minute Showdown: Supreme Shogun Boss Spawn (Survival / Endless modes only)
    if (globals.runTime >= 540 && globals.gameMode !== 'zen' && globals.gameMode !== 'classic' && !shogunSpawned) {
      shogunSpawned = true;
      playSynthesizedTempleBell();
      const shogun = new Enemy(globals.player.x + 350, globals.player.y, globals.player);
      shogun.subType = 'shogun_boss';
      shogun.hp = 350;
      shogun.maxHp = 350;
      (shogun as any).isBoss = true;
      (shogun as any).isSupremeShogun = true;
      globals.enemies.push(shogun);
      globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 120, globals.currentLang === 'ja' ? '【最終決戦】最高司令官・将軍 顕現！ ⚔️' : '【FINAL SHOWDOWN】 SUPREME SHOGUN HAS AWAKENED! ⚔️', 'neon-#ef4444', 36));
      globals.shockwaves.push(new Shockwave(shogun.x, shogun.y, '#ffd700'));
    }

    // Calamity & Shrine checks
    if (!isPractice()) { triggerCalamityCheck(realDt); checkShrineSpawns(); }

    // Calamity Winds Stage Affix: Thunder Gale periodic strikes
    if (globals.activeStageAffix?.id === 'thunder_gale') {
      thunderGaleTimer += realDt;
      if (thunderGaleTimer >= 12.0) {
        thunderGaleTimer = 0.0;
        const aliveEnemies = globals.enemies.filter(e => e.state !== 'dead');
        if (aliveEnemies.length > 0) {
          playSynthesizedThunder();
          globals.screenShake = Math.max(globals.screenShake, 15);
          const targets = [aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)]];
          if (aliveEnemies.length > 1 && Math.random() < 0.5) {
            const rem = aliveEnemies.filter(e => e !== targets[0]);
            if (rem.length > 0) targets.push(rem[Math.floor(Math.random() * rem.length)]);
          }
          for (const t of targets) {
            globals.lightningBeams.push(new LightningBeam(t.x, t.y));
            globals.shockwaves.push(new Shockwave(t.x, t.y, '#38bdf8'));
            callbacks.hitEnemy(t, 8);
            globals.floatingTexts.push(FloatingText.acquire(t.x, t.y - 40, "⚡ GALE STRIKE", "#38bdf8", 18));
          }
        }
      }
    }

    // Endless Abyss Affix: Void Collapse (Gravity Collapse) periodic vortex
    if (globals.activeStageAffix?.id === 'gravity_collapse') {
      gravityCollapseTimer += realDt;
      if (gravityCollapseTimer >= 14.0) {
        gravityCollapseTimer = 0.0;
        globals.gravityWellX = globals.player.x + (Math.random() - 0.5) * 220;
        globals.gravityWellY = globals.player.y + (Math.random() - 0.5) * 220;
        globals.gravityWellTimer = 3.5;
        playSynthesizedSingingBowl();
        globals.floatingTexts.push(FloatingText.acquire(globals.gravityWellX, globals.gravityWellY - 60, "🌀 VOID COLLAPSE!", "#c084fc", 24));
      }
    }

    // Interaction checks with Active Shrine & Wandering Hermit
    const isInteractRequested = globals.keys['Space'] || globals.mouse.justReleased || globals.mobileAttackJustPressed;
    if (globals.activeShrine) {
      globals.activeShrine.update(realDt);
      const dSq = (globals.player.x - globals.activeShrine.x) ** 2 + (globals.player.y - globals.activeShrine.y) ** 2;
      if (dSq < globals.activeShrine.radius ** 2 && isInteractRequested) {
        callbacks.openShrineCommuneModal(globals.activeShrine.sealId);
      }
    }

    if (globals.activeHermit) {
      globals.activeHermit.update(realDt);
      const dSq = (globals.player.x - globals.activeHermit.x) ** 2 + (globals.player.y - globals.activeHermit.y) ** 2;
      if (dSq < globals.activeHermit.radius ** 2 && isInteractRequested) {
        callbacks.openHermitPactModal();
      }
    }

    // Low HP Survival Tracking for Seal II
    if (globals.lives === 1 && globals.gameMode !== 'zen') {
      const prevInt = Math.floor(globals.lowHpSurviveTimer);
      globals.lowHpSurviveTimer += realDt;
      const curInt = Math.floor(globals.lowHpSurviveTimer);
      if (!globals.unlockedSeals.includes(2) && curInt !== prevInt && (curInt === 10 || curInt === 20)) {
        notifyFeatMilestone(2, curInt, 25, "1-Heart Survival", "瀕死生存時間");
      }
      if (globals.lowHpSurviveTimer >= 25 && !globals.unlockedSeals.includes(2)) {
        spawnShrine(2);
      }
    } else {
      globals.lowHpSurviveTimer = 0;
    }

    // Plasma Tempest Trails Update
    for (let i = globals.plasmaTrails.length - 1; i >= 0; i--) {
      const pt = globals.plasmaTrails[i];
      pt.life -= realDt;
      if (pt.life <= 0) {
        globals.plasmaTrails.splice(i, 1);
        continue;
      }
      const rSq = (pt.radius || 50) ** 2;
      for (let j = 0; j < globals.enemies.length; j++) {
        const en = globals.enemies[j];
        if (en.state === 'dead') continue;
        const dSq = (en.x - pt.x) ** 2 + (en.y - pt.y) ** 2;
        if (dSq < rSq) {
          en.burnTimer = 3.0;
          hitEnemy(en, 6 * realDt);
        }
      }
    }

    // Kamaitachi Bouncing Sickles Update
    for (let i = globals.bouncingSickles.length - 1; i >= 0; i--) {
      const s = globals.bouncingSickles[i];
      s.life -= realDt;
      if (s.life <= 0) {
        globals.bouncingSickles.splice(i, 1);
        continue;
      }
      s.x += s.vx * realDt;
      s.y += s.vy * realDt;
      if (s.x < 50) { s.x = 50; s.vx = Math.abs(s.vx); }
      else if (s.x > globals.width - 50) { s.x = globals.width - 50; s.vx = -Math.abs(s.vx); }
      if (s.y < 50) { s.y = 50; s.vy = Math.abs(s.vy); }
      else if (s.y > globals.height - 50) { s.y = globals.height - 50; s.vy = -Math.abs(s.vy); }

      // Kamaitachi Projectile Deflection Vortex
      for (let pIdx = 0; pIdx < globals.projectiles.length; pIdx++) {
        const pr = globals.projectiles[pIdx];
        if (pr.isEnemy && pr.active) {
          const pdx = pr.x - s.x;
          const pdy = pr.y - s.y;
          if (pdx * pdx + pdy * pdy < 65 * 65) {
            pr.isEnemy = false;
            pr.angle = Math.atan2(-pdy, -pdx);
            pr.speed = Math.max(pr.speed, 650);
            globals.particles.push(Particle.acquire(pr.x, pr.y, '#4ade80', 250, 0.35, 2.5));
          }
        }
      }

      const rSq = (s.radius || 30) ** 2;
      for (let j = 0; j < globals.enemies.length; j++) {
        const en = globals.enemies[j];
        if (en.state === 'dead') continue;
        const dSq = (en.x - s.x) ** 2 + (en.y - s.y) ** 2;
        if (dSq < rSq) {
          hitEnemy(en, s.damage || 5);
          globals.particles.push(Particle.acquire(s.x, s.y, '#4ade80', 180, 0.3, 2));
        }
      }
    }
  }

  // Option 5: Battlefield Bounty Contracts Update
  if (globals.gameState === 'playing' && globals.gameMode !== 'zen') {
    if (!globals.activeBounty) {
      globals.bountyTimer -= realDt;
      if (globals.bountyTimer <= 0) {
        const roll = Math.random();
        if (roll < 0.35) {
          globals.activeBounty = {
            type: 'slay',
            target: 6,
            current: 0,
            timeRemaining: 18,
            description: globals.currentLang === 'ja' ? '18秒以内に敵を6体撃破せよ' : 'Slay 6 enemies in 18s'
          };
        } else if (roll < 0.60) {
          globals.activeBounty = {
            type: 'deflect',
            target: 2,
            current: 0,
            timeRemaining: 22,
            description: globals.currentLang === 'ja' ? '22秒以内に飛び道具を2回弾き返せ' : 'Deflect 2 projectiles in 22s'
          };
        } else if (roll < 0.80) {
          globals.activeBounty = {
            type: 'parry',
            target: 2,
            current: 0,
            timeRemaining: 20,
            description: globals.currentLang === 'ja' ? '20秒以内に受け流しを2回成功させよ' : 'Parry 2 attacks in 20s'
          };
        } else {
          globals.activeBounty = {
            type: 'combo',
            target: 25,
            current: globals.combo,
            timeRemaining: 16,
            description: globals.currentLang === 'ja' ? '16秒以内に25連撃に到達せよ' : 'Reach 25 combo in 16s'
          };
        }
        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 80, "NEW BOUNTY!", "#fbbf24", 26));
        playSynthesizedLevelUp();
      }
    } else {
      globals.activeBounty.timeRemaining -= realDt;
      if (globals.activeBounty.current >= globals.activeBounty.target) {
        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 80, "BOUNTY CLAIMED! 🏆", "#10b981", 28));
        globals.screenShake = 16;
        globals.score += 500;
        addFlow(35);
        playSynthesizedAwaken();
        for (let i = 0; i < 20; i++) {
          globals.particles.push(Particle.acquire(globals.player.x, globals.player.y, '#10b981', 300 + Math.random() * 200, 0.5, 3));
        }
        globals.activeBounty = null;
        globals.bountyTimer = 45;
      } else if (globals.activeBounty.timeRemaining <= 0) {
        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 60, "BOUNTY EXPIRED", "#94a3b8", 18));
        globals.activeBounty = null;
        globals.bountyTimer = 35;
      }
    }
  }

  // Corrupted Blessing: Blood Thirst Bleed
  if (globals.bloodThirstCurseActive && globals.gameState === 'playing' && globals.player.state !== 'dead') {
    globals.bloodThirstBleedTimer -= realDt;
    if (globals.bloodThirstBleedTimer <= 0) {
      globals.bloodThirstBleedTimer = 45.0;
      if (globals.lives > 1) {
        globals.lives--;
        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 60, "BLOOD DRAIN -1 HP", "#ef4444", 20));
        playSynthesizedHurt();
        callbacks.updateUI();
      }
    }
  }

  if (globals.weatherEngine) {
    globals.weatherEngine.update(realDt);
  }

  if (globals.invertScreenTimer > 0) globals.invertScreenTimer -= realDt;
  if (globals.invulnTimer > 0) globals.invulnTimer -= realDt;
  
  if (globals.petalArmorLevel > 0 && !globals.petalArmorActive) {
    globals.petalArmorCooldown -= realDt;
    if (globals.petalArmorCooldown <= 0) {
      globals.petalArmorActive = true;
      playSynthesizedLevelUp();
      globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 60, globals.currentLang === 'ja' ? '桜花の鎧 展開！' : 'BARRIER READY!', '#ffb7c5', 20));
      const defUp = (vfxAnims as any).spells?.defenseUp;
      if (defUp && defUp.length > 0) {
        globals.animatedEffects.push(new AnimatedEffect(globals.player.x, globals.player.y, defUp, 0.45, 1.8));
      }
      for (let i = 0; i < 8; i++) {
        globals.particles.push(Particle.acquire(globals.player.x, globals.player.y, '#ffb7c5', 100, 0.4, 3));
      }
    }
  }
  
  if (globals.enhanceCooldown > 0) globals.enhanceCooldown -= realDt;
  if (globals.keys[globals.keyMaps.skill] || globals.mobileEnhanceJustPressed) {
    globals.mobileEnhanceJustPressed = false;
    if (globals.gameMode === 'zen') {
      const now = performance.now();
      if (now - globals.lastZenWarningTime > 1000) {
        globals.lastZenWarningTime = now;
        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 80, t('zenWarningText'), "#ff3355", 24));
      }
    } else if (globals.enhanceCooldown <= 0) {
      if (globals.selectedSkill === 'enhance') {
        playSynthesizedEnhance();
        globals.enhanceActiveTimer = globals.playerStats.enhanceDuration; 
        globals.enhanceCooldown = globals.playerStats.enhanceCooldownMax;
        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 80, t('swordEnhancedText'), "#ff6600", 24));
        const atkUp = (vfxAnims as any).spells?.attackUp;
        if (atkUp && atkUp.length > 0) {
          globals.animatedEffects.push(new AnimatedEffect(globals.player.x, globals.player.y, atkUp, 0.5, 2.0));
        }
      } else if (globals.selectedSkill === 'shield') {
        playSynthesizedParry();
        globals.enhanceActiveTimer = globals.playerStats.enhanceDuration;
        globals.enhanceCooldown = globals.playerStats.enhanceCooldownMax;
        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 80, globals.currentLang === 'ja' ? '烈風 of 加護！' : 'WIND AEGIS!', '#00ffff', 24));
        const defUp = (vfxAnims as any).spells?.defenseUp;
        if (defUp && defUp.length > 0) {
          globals.animatedEffects.push(new AnimatedEffect(globals.player.x, globals.player.y, defUp, 0.5, 2.0));
        }
        for (let i = 0; i < 12; i++) {
          globals.particles.push(Particle.acquire(globals.player.x, globals.player.y, '#00ffc8', 150, 0.4, 2));
        }
      } else if (globals.selectedSkill === 'dash') {
        playSynthesizedThunder();
        globals.enhanceActiveTimer = globals.playerStats.enhanceDuration;
        globals.enhanceCooldown = globals.playerStats.enhanceCooldownMax;
        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 80, globals.currentLang === 'ja' ? '雷神の瞬歩！' : 'RAIJIN STEP!', '#00ffff', 24));
        
        globals.player.setState('dash');
        globals.player.dashStartX = globals.player.x;
        globals.player.dashStartY = globals.player.y;
        globals.raijinDashActive = true;
        const now = performance.now();
        if (now - globals.lastIaijutsuFireTime < 350) {
          globals.lightningDischargeActive = true;
        } else {
          globals.lightningDischargeActive = false;
        }
        globals.raijinHitEnemies.clear();
        globals.mobileRaijinAimActive = false;
        globals.mobileDashAimActive = false;
        triggerStormGodLightning(globals.player.x, globals.player.y);

        // Check for Perfect Dodge on Raijin Step initiation near attacking enemies
        let perfectDodgeTriggered = false;
        for (const e of globals.enemies) {
          if (e.state === 'dead') continue;
          const dx = e.x - globals.player.x;
          const dy = e.y - globals.player.y;
          if (dx * dx + dy * dy < 102400) { // 320 * 320
            const isEnemyAttacking = e.state === 'attack' || (e.state === 'charge' && e.stateTime > e.chargeTimeMax - 0.2);
            if (isEnemyAttacking) {
              perfectDodgeTriggered = true;
              break;
            }
          }
        }

        if (perfectDodgeTriggered) {
          globals.runStats.perfectDodges++;
          playSynthesizedDodge();
          globals.screenShake = 30;
          addFlow(6.0);
          addCombo();
          addCombo();

          globals.invulnTimer = 1.6; // generous i-frames
          globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 70, t('dodgeText'), "neon-#00ffff", 30));
          globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#ffd700'));
          
          triggerFlowingCounterReset();
        }

        let angle;
        if (globals.useMobileRaijinAimAngle) {
          angle = globals.mobileRaijinAimAngle;
          globals.useMobileRaijinAimAngle = false;
        } else {
          angle = globals.player.dir === 1 ? 0 : Math.PI;
          if (globals.player.vx !== 0 || globals.player.vy !== 0) {
            angle = Math.atan2(globals.player.vy, globals.player.vx);
          } else if (!globals.joystickActive) {
            angle = Math.atan2(globals.mouse.y - globals.height/2, globals.mouse.x - globals.width/2);
          }
        }
        
        let baseSpeed = 4000;
        if (globals.playerStats.dashRangeLevel) {
          baseSpeed *= (1 + 0.20 * globals.playerStats.dashRangeLevel);
        }
        globals.player.vx = Math.cos(angle) * baseSpeed;
        globals.player.vy = Math.sin(angle) * baseSpeed;
        
        const lungeRange = 700 * (1 + 0.30 * (globals.playerStats.dashRangeLevel || 0));
        const steps = 12;
        for (let i = 0; i < steps; i++) {
          const ratio = i / steps;
          const px = globals.player.x + Math.cos(angle) * lungeRange * ratio;
          const py = globals.player.y + Math.sin(angle) * lungeRange * ratio;
          const pColor = Math.random() > 0.5 ? '#00ffff' : '#ffd700';
          globals.particles.push(Particle.acquire(px + (Math.random()-0.5)*30, py + (Math.random()-0.5)*30, pColor, 150, 0.4, 2));
        }

        // Apply Lightning Chain upgrade
        if (globals.playerStats.dashThunderLevel) {
          const chainDmg = 2 * globals.playerStats.dashThunderLevel;
          const chainTargets = globals.enemies
            .filter(e => e.state !== 'dead')
            .map(e => ({ enemy: e, dist: Math.hypot(e.x - globals.player.x, e.y - globals.player.y) }))
            .filter(t => t.dist < 400)
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 3);
          
          let prevX = globals.player.x;
          let prevY = globals.player.y;
          chainTargets.forEach(t => {
            hitEnemy(t.enemy, chainDmg);
            t.enemy.stunTimer = Math.max(t.enemy.stunTimer || 0, 0.8);
            const segments = 6;
            for (let s = 0; s < segments; s++) {
              const ratio = s / segments;
              const lx = prevX + (t.enemy.x - prevX) * ratio + (Math.random() - 0.5) * 40;
              const ly = prevY + (t.enemy.y - prevY) * ratio + (Math.random() - 0.5) * 40;
              globals.particles.push(Particle.acquire(lx, ly, Math.random() < 0.5 ? '#00ffff' : '#ffd700', 200, 0.3, 1.5 + Math.random()));
            }
            for (let k = 0; k < 8; k++) {
              globals.particles.push(Particle.acquire(t.enemy.x, t.enemy.y, '#00ffff', 300, 0.25, 2 + Math.random(), Math.random() * Math.PI * 2));
            }
            globals.shockwaves.push(new Shockwave(t.enemy.x, t.enemy.y, 'rgba(0, 255, 255, 0.3)'));
            prevX = t.enemy.x;
            prevY = t.enemy.y;
          });
          if (chainTargets.length > 0) {
            playSynthesizedThunder();
          }
        }
      } else if (globals.selectedSkill === 'firewheel') {
        playSynthesizedFirewheel();
        globals.enhanceActiveTimer = globals.playerStats.enhanceDuration;
        globals.enhanceCooldown = globals.playerStats.enhanceCooldownMax;
        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 80, globals.currentLang === 'ja' ? '業火の回天！' : 'INFERNO SWEEP!', '#ff4400', 24));
        
        for (let i = 0; i < 20; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 30 + Math.random() * 50;
          globals.particles.push(Particle.acquire(
            globals.player.x + Math.cos(angle) * dist,
            globals.player.y + Math.sin(angle) * dist,
            Math.random() < 0.5 ? '#ffaa00' : '#ff4400',
            100 + Math.random() * 150,
            0.5,
            3,
            angle,
            -50
          ));
        }
      } else if (globals.selectedSkill === 'gravity') {
        playSynthesizedGravity();
        globals.gravityWellX = globals.player.x;
        globals.gravityWellY = globals.player.y;
        globals.gravityWellTimer = 4.0;
        globals.enhanceActiveTimer = 4.0;
        globals.enhanceCooldown = globals.playerStats.enhanceCooldownMax;
        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 80, globals.currentLang === 'ja' ? '重力崩壊！' : 'GRAVITY WELL!', '#aa55ff', 24));
        globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#aa55ff'));
      } else if (globals.selectedSkill === 'parry_master') {
        playSynthesizedPerfectParry();
        globals.enhanceActiveTimer = globals.playerStats.enhanceDuration;
        globals.enhanceCooldown = globals.playerStats.enhanceCooldownMax;
        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 80, globals.currentLang === 'ja' ? '弾きの極意！' : 'PARRY MASTER!', '#ffd700', 24));
        globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#ffd700'));
        for (let i = 0; i < 15; i++) {
          globals.particles.push(Particle.acquire(globals.player.x, globals.player.y, '#ffd700', 200, 0.4, 3, Math.random() * Math.PI * 2));
        }
      } else if (globals.selectedSkill === 'decoy_illusion') {
        playSynthesizedPerfectParry();
        globals.enhanceActiveTimer = globals.playerStats.enhanceDuration;
        globals.enhanceCooldown = globals.playerStats.enhanceCooldownMax;
        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 80, globals.currentLang === 'ja' ? '影遁の術！' : 'SHADOW STEP!', '#c084fc', 24));
        
        globals.decoys.push(new Decoy(globals.player.x - 100, globals.player.y));
        globals.decoys.push(new Decoy(globals.player.x + 100, globals.player.y));
        globals.decoys.push(new Decoy(globals.player.x, globals.player.y - 80));
        const smokeFrames = (vfxAnims as any).skills?.decoySmoke;
        if (smokeFrames && smokeFrames.length > 0) {
          globals.animatedEffects.push(new AnimatedEffect(globals.player.x, globals.player.y, smokeFrames, 0.45, 2.0));
        }
        globals.decoyInvisibilityTimer = 5.0;
        globals.decoyCritPrimed = true;

        globals.screenShake = 12;
        for (let i = 0; i < 15; i++) {
          globals.particles.push(Particle.acquire(globals.player.x, globals.player.y, '#c084fc', 250, 0.45, 3, Math.random() * Math.PI * 2));
        }
      }
    }
  }

  if (globals.enhanceActiveTimer > 0) {
    globals.enhanceActiveTimer -= realDt;
    
    if (globals.selectedSkill === 'enhance') {
      // Spawn purple dragon fury fire particles!
      if (Math.random() < 0.35 && globals.particles.length < 300) {
        const pAngle = -Math.PI/2 + (Math.random() - 0.5) * 0.8;
        const pSpeed = 80 + Math.random() * 120;
        globals.particles.push(Particle.acquire(
          globals.player.x + (Math.random() - 0.5) * 35,
          globals.player.y + (Math.random() - 0.5) * 60,
          Math.random() < 0.5 ? '#c084fc' : '#a855f7',
          pSpeed,
          0.5 + Math.random() * 0.3,
          2 + Math.random() * 2,
          pAngle,
          -80,
          0.93
        ));
      }
    }
    
    // Aegis pulse (Tier III - 15,000 🔮)
    if (globals.selectedSkill === 'shield') {
      globals.shieldPulseTimer += realDt;
      if (globals.shieldPulseTimer >= 0.6) {
        globals.shieldPulseTimer = 0;
        globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, 'rgba(0, 255, 200, 0.45)'));
        const cyanFx = (vfxAnims as any).shockwaves?.impactCyan;
        if (cyanFx && cyanFx.length > 0) {
          globals.animatedEffects.push(new AnimatedEffect(globals.player.x, globals.player.y, cyanFx, 0.4, 1.8));
        }
        globals.enemies.forEach(e => {
          if (e.state === 'dead') return;
          const dx = e.x - globals.player.x;
          const dy = e.y - globals.player.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 250 * 250) {
            hitEnemy(e, 14 + 4 * (globals.playerStats.shieldPulseLevel || 0));
            // pull enemies slightly toward player center
            if (distSq > 100) {
              const dist = Math.sqrt(distSq);
              const pullAmt = 70;
              const ratio = Math.min(1, pullAmt / dist);
              e.x -= dx * ratio;
              e.y -= dy * ratio;
            }
          }
        });
      }
    }

    // Firewheel update (Tier V - 25,000 🔮)
    if (globals.selectedSkill === 'firewheel') {
      const radius = 260 * (1 + 0.25 * (globals.playerStats.firewheelRangeLevel || 0));
      const angle = (performance.now() / 150) + Math.random() * Math.PI * 2;
      const px = globals.player.x + Math.cos(angle) * radius;
      const py = globals.player.y + Math.sin(angle) * radius;
      globals.particles.push(Particle.acquire(
        px + (Math.random()-0.5)*10,
        py + (Math.random()-0.5)*10,
        Math.random() < 0.5 ? '#ffaa00' : '#ff4400',
        50 + Math.random() * 50,
        0.4,
        1.5 + Math.random() * 1.5,
        angle + Math.PI / 2,
        -30
      ));

      // Launch a rotating cross of 4 fire projectiles outward every 0.45s
      firewheelProjectileTimer += realDt;
      if (firewheelProjectileTimer >= 0.45) {
        firewheelProjectileTimer = 0;
        const baseAngle = (performance.now() / 250);
        const projDmg = 12 + 4 * (globals.playerStats.firewheelBlazeLevel || 0);
        for (let i = 0; i < 4; i++) {
          const a = baseAngle + (i * Math.PI / 2);
          globals.projectiles.push(Projectile.acquire(globals.player.x, globals.player.y, a, false, projDmg, false, true));
        }
        playSynthesizedFirewheel();
      }

      firewheelTickTimer += realDt;
      if (firewheelTickTimer >= 0.25) {
        firewheelTickTimer = 0;
        const rangeSq = (260 * (1 + 0.25 * (globals.playerStats.firewheelRangeLevel || 0))) ** 2;
        globals.enemies.forEach(e => {
          if (e.state === 'dead') return;
          const dx = e.x - globals.player.x;
          const dy = e.y - globals.player.y;
          
          if (dx * dx + dy * dy < rangeSq) {
            hitEnemy(e, 10 + 3 * (globals.playerStats.firewheelBlazeLevel || 0));
            e.burnTimer = 6.0;
            e.burnBonusDmg = (globals.playerStats.firewheelBlazeLevel || 0) + 2;
            
            for (let k = 0; k < 6; k++) {
              globals.particles.push(Particle.acquire(
                e.x, e.y,
                Math.random() < 0.5 ? '#ff8800' : '#ff3300',
                150 + Math.random() * 100,
                0.3,
                2
              ));
            }
            
            if (globals.playerStats.firewheelEchoLevel && globals.playerStats.firewheelEchoLevel > 0) {
              const echoDmg = globals.playerStats.firewheelEchoLevel * 3;
              let echoTargetsCount = 0;
              for (let idx = 0; idx < globals.enemies.length; idx++) {
                const other = globals.enemies[idx];
                if (other === e || other.state === 'dead') continue;
                const odx = other.x - e.x;
                const ody = other.y - e.y;
                if (odx * odx + ody * ody < 25600) { // 160 * 160
                  hitEnemy(other, echoDmg);
                  globals.particles.push(Particle.acquire(other.x, other.y, '#ffd700', 100, 0.3, 1.5));
                  echoTargetsCount++;
                  if (echoTargetsCount >= 5) break; 
                }
              }
            }
          }
        });
      }
    }

    if (globals.enhanceActiveTimer <= 0) {
      globals.enhanceActiveTimer = 0;
      if (globals.selectedSkill === 'firewheel') {
        // Inferno Sweep expiration: expanding Flame Shockwave + Inferno Blast VFX!
        globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#ff4400'));
        globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#ffaa00'));
        const infBlast = (vfxAnims as any).explosions?.infernoBlast;
        if (infBlast && infBlast.length > 0) {
          globals.animatedEffects.push(new AnimatedEffect(globals.player.x, globals.player.y, infBlast, 0.55, 2.5));
        }
        playSynthesizedThunder();
        globals.screenShake = Math.max(globals.screenShake, 25);
        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 80, globals.currentLang === 'ja' ? '業火大爆裂！ 🔥' : 'INFERNO SUPERNOVA! 🔥', 'neon-#ff4400', 32));
        const burstRadiusSq = 300 * 300;
        globals.enemies.forEach(other => {
          if (other.state === 'dead') return;
          const dx = other.x - globals.player.x;
          const dy = other.y - globals.player.y;
          if (dx * dx + dy * dy < burstRadiusSq) {
            hitEnemy(other, 25 + 5 * (globals.playerStats.firewheelBlazeLevel || 0));
            other.burnTimer = 6.0;
            other.burnBonusDmg = (globals.playerStats.firewheelBlazeLevel || 0) + 3;
            const pushAngle = Math.atan2(dy, dx);
            other.vx = Math.cos(pushAngle) * 950;
            other.vy = Math.sin(pushAngle) * 950;
          }
        });
      }
    }
  }

  // Gravity Well active and collapse logic (APEX Tier - 50,000 🔮)
  if (globals.gravityWellTimer > 0) {
    globals.gravityWellTimer -= realDt;
    const pullRadius = 420 * (1 + 0.25 * (globals.playerStats.gravityRadiusLevel || 0));
    const pullRadiusSq = pullRadius * pullRadius;
    const pullSpeed = 1800;
    const tickDmg = 6 + 3 * (globals.playerStats.gravityDamageLevel || 0);
    
    if (Math.random() < 0.6) {
      const angle = Math.random() * Math.PI * 2;
      const dist = pullRadius * (0.3 + Math.random() * 0.7);
      const px = globals.gravityWellX + Math.cos(angle) * dist;
      const py = globals.gravityWellY + Math.sin(angle) * dist;
      const pSpeed = dist / 0.35;
      globals.particles.push(Particle.acquire(
        px, py,
        Math.random() < 0.5 ? '#c084fc' : '#f472b6',
        pSpeed,
        0.35,
        2.0 + Math.random() * 2.0,
        angle + Math.PI,
        0
      ));
    }

    // Devour enemy bullets entering the gravity well
    globals.projectiles.forEach(proj => {
      if (proj.isEnemy && proj.life > 0) {
        const dx = globals.gravityWellX - proj.x;
        const dy = globals.gravityWellY - proj.y;
        if (dx * dx + dy * dy < pullRadiusSq) {
          proj.life = 0; // devour
          for (let i = 0; i < 5; i++) {
            globals.particles.push(Particle.acquire(proj.x, proj.y, '#c084fc', 120, 0.25, 2.0));
          }
        }
      }
    });
    
    // Aggressively vacuum all enemies
    globals.enemies.forEach(e => {
      if (e.state === 'dead') return;
      const dx = globals.gravityWellX - e.x;
      const dy = globals.gravityWellY - e.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < pullRadiusSq) {
        // Damp velocity inside gravity well and interrupt lunges/attacks
        e.vx *= 0.1;
        e.vy *= 0.1;
        if (e.state === 'attack') {
          e.setState('idle');
        }
        
        if (distSq > 100) {
          const dist = Math.sqrt(distSq);
          const pullRatio = Math.min(1, pullSpeed * realDt / dist);
          e.x += dx * pullRatio;
          e.y += dy * pullRatio;
        }
      }
    });
    
    gravityTickTimer += realDt;
    if (gravityTickTimer >= 0.25) {
      gravityTickTimer = 0;
      globals.enemies.forEach(e => {
        if (e.state === 'dead') return;
        const dx = globals.gravityWellX - e.x;
        const dy = globals.gravityWellY - e.y;
        if (dx * dx + dy * dy < pullRadiusSq) {
          hitEnemy(e, tickDmg);
          for(let i=0; i<5; i++) {
            globals.particles.push(Particle.acquire(e.x, e.y, '#a855f7', 120, 0.3, 2.0));
          }
        }
      });
    }
    
    if (globals.gravityWellTimer <= 0) {
      globals.gravityWellTimer = 0;
      const explosionDmg = 50 + 15 * (globals.playerStats.gravityExplosionLevel || 0);
      
      globals.shockwaves.push(new Shockwave(globals.gravityWellX, globals.gravityWellY, '#c084fc'));
      globals.shockwaves.push(new Shockwave(globals.gravityWellX, globals.gravityWellY, '#ec4899'));
      
      const goldImpact = (vfxAnims as any).shockwaves?.impactGold;
      if (goldImpact && goldImpact.length > 0) {
        globals.animatedEffects.push(new AnimatedEffect(globals.gravityWellX, globals.gravityWellY, goldImpact, 0.5, 3.2));
      }
      
      globals.screenShake = Math.max(globals.screenShake, 35);
      
      for (let i = 0; i < 35; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 350 + Math.random() * 350;
        globals.particles.push(Particle.acquire(
          globals.gravityWellX, 
          globals.gravityWellY, 
          Math.random() < 0.5 ? '#f472b6' : '#c084fc', 
          speed, 
          0.6, 
          3.0 + Math.random() * 2.0, 
          angle
        ));
      }
      
      if (explosionDmg > 0) {
        globals.enemies.forEach(e => {
          if (e.state === 'dead') return;
          const dx = globals.gravityWellX - e.x;
          const dy = globals.gravityWellY - e.y;
          if (dx * dx + dy * dy < pullRadiusSq) {
            hitEnemy(e, explosionDmg);
            globals.floatingTexts.push(FloatingText.acquire(e.x, e.y - 70, `SUPERNOVA -${explosionDmg}`, '#f472b6', 28));
          }
        });
      }
      playSynthesizedPerfectParry();
    }
  }
  
  if (globals.ultCooldown > 0) {
    globals.ultCooldown -= realDt;
    if (globals.ultCooldown <= 0) {
      globals.ultCooldown = 0;
      if (globals.flow >= globals.playerStats.flowMax && globals.flowState === 'normal') {
        playSynthesizedPerfectParry();
        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 120, "ULTIMATE READY!", "#ffd700", 32));
      }
    }
  }

  if (globals.roninResolveCooldown > 0) {
    globals.roninResolveCooldown -= realDt;
    if (globals.roninResolveCooldown < 0) globals.roninResolveCooldown = 0;
  }
  if (globals.singularityCleaveCD > 0) {
    globals.singularityCleaveCD -= realDt;
    if (globals.singularityCleaveCD < 0) globals.singularityCleaveCD = 0;
  }
  
  const autoUltCondition = globals.autoUltEnabled === 'on' && globals.flow >= globals.playerStats.flowMax && globals.flowState === 'normal' && globals.ultCooldown <= 0;
  if ((globals.keys[globals.keyMaps.ult] || globals.mobileUltJustPressed || autoUltCondition) && globals.ultCooldown <= 0) {
    globals.mobileUltJustPressed = false;
    globals.keys[globals.keyMaps.ult] = false; // consume key
    activateAwakening();
  }

  if (globals.flowState === 'awakened') {
    globals.flow -= (globals.playerStats.flowMax / 6.0) * realDt;
    updateUI();
    if (globals.flow <= 0) {
      globals.flow = 0;
      globals.flowState = 'normal';
      globals.ultCooldown = globals.ultCooldownMax; // 6s cooldown starts ONLY after awakening duration finishes
    }
  } else if (globals.flowState === 'storm_god') {
    globals.flow -= (globals.playerStats.flowMax / 8.0) * realDt;
    updateUI();
    if (globals.flow <= 0) {
      globals.flow = 0;
      globals.flowState = 'normal';
      globals.ultCooldown = globals.ultCooldownMax; // 6s cooldown starts ONLY after awakening duration finishes
    }
  }
  // Slow-motion time dilation removed completely to prevent perceived lag
  globals.timeSlowDuration = 0;
  globals.timeSlowFactor = 1.0;
  globals.targetTimeSlowFactor = 1.0;
  if (globals.satyrEarthshakerCD > 0) globals.satyrEarthshakerCD -= realDt;

  // Zen Field Ultimate Ticking
  if (globals.zenFieldActiveTimer > 0) {
    globals.zenFieldActiveTimer -= realDt;
    globals.zenFieldTickTimer += realDt;
    if (globals.zenFieldTickTimer >= 0.4) {
      globals.zenFieldTickTimer = 0;
      playSynthesizedParry();
      globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, 'rgba(0, 255, 255, 0.4)'));
      globals.enemies.forEach(e => {
        if (e.state === 'dead') return;
        const dx = e.x - globals.player.x;
        const dy = e.y - globals.player.y;
        if (dx * dx + dy * dy < 260 * 260) {
          const pushAngle = Math.atan2(dy, dx);
          e.vx = Math.cos(pushAngle) * 800;
          e.vy = Math.sin(pushAngle) * 800;
          e.stunTimer = Math.max(e.stunTimer || 0, 0.6);
          hitEnemy(e, 6);
        }
      });
    }
    if (globals.zenFieldActiveTimer <= 0) {
      globals.zenFieldActiveTimer = 0;
      globals.ultCooldown = globals.ultCooldownMax; // 6s cooldown starts ONLY after Zen Field duration finishes
    }
  }
  
  const dt = realDt; // Time scaling disabled to prevent laggy feel

  if (globals.comboTimer > 0 && globals.gameState === 'playing') {
    // Step 5: Freeze combo timer during Blade Clash, boss windups, and execution cut-in
    const isBossCharging = globals.enemies.some(e => e.state !== 'dead' && (e.subType === 'oni_boss' || e.subType === 'shogun_boss' || e.subType === 'agis_colossus' || e.subType === 'skeleton_warlord' || (e as any).isBoss) && (e.state === 'charge' || e.state === 'attack'));
    const isExecutionCutinActive = globals.flowState === 'omnislash' || (document.getElementById('manga-cutin')?.style.display === 'block');
    const isClashActive = globals.activeBladeClash !== null;

    if (!isClashActive && !isBossCharging && !isExecutionCutinActive) {
      globals.comboTimer -= realDt; 
      if (globals.comboTimer <= 0) { 
        globals.combo = 0; 
        globals.comboFinisherReady = false; 
        callbacks.updateComboDisplay?.(); 
        updateUI(); 
      }
    }
  }

  if (globals.decoyInvisibilityTimer > 0) {
    globals.decoyInvisibilityTimer -= realDt;
    if (globals.decoyInvisibilityTimer < 0) globals.decoyInvisibilityTimer = 0;
  }
  if (globals.riposteTimer > 0) {
    globals.riposteTimer -= realDt;
    if (globals.riposteTimer < 0) globals.riposteTimer = 0;
  }

  // Reaper's Mark ticking
  if (globals.playerStats.reapersMarkLevel && globals.playerStats.reapersMarkLevel > 0 && globals.player && globals.player.state !== 'dead' && globals.gameState === 'playing') {
    globals.reapersMarkTimer -= realDt;
    if (globals.reapersMarkTimer <= 0) {
      globals.reapersMarkTimer = 25.0;
      globals.reapersMarkKills = 0;
      globals.lives--;
      playSynthesizedHurt();
      globals.screenShake = 20;
      globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 50, "REAPER'S DEBT! -1 HP", "#ff3333", 24));
      updateUI();
      
      if (globals.lives <= 0 && globals.gameMode !== 'pvp') {
        triggerGameOver(false);
      }
    }
  }

  // Update decoys
  if (globals.decoys) {
    let decoyWriteIndex = 0;
    for (let i = 0; i < globals.decoys.length; i++) {
      const decoy = globals.decoys[i];
      decoy.update(realDt);
      if (decoy.life <= 0) {
        decoy.explode();
      } else {
        globals.decoys[decoyWriteIndex++] = decoy;
      }
    }
    globals.decoys.length = decoyWriteIndex;
  }

  // Update sakura petals (in-place compaction without heap allocation)
  if (globals.sakuraPetals) {
    let writeIdx = 0;
    for (let i = 0; i < globals.sakuraPetals.length; i++) {
      const petal = globals.sakuraPetals[i];
      petal.life -= realDt;
      if (petal.life <= 0) continue;
      
      let exploded = false;
      for (let j = 0; j < globals.enemies.length; j++) {
        const e = globals.enemies[j];
        if (e.state === 'dead') continue;
        const dx = e.x - petal.x;
        const dy = e.y - petal.y;
        const enemyHitRadius = (e.scaleMult - 1) * 60;
        const radiusSum = petal.radius + enemyHitRadius;
        if (dx * dx + dy * dy < radiusSum * radiusSum) {
          exploded = true;
          hitEnemy(e, 1);
          playSound(sfx.slash, 0.15);
          for (let k = 0; k < 4; k++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 150;
            globals.particles.push(Particle.acquire(petal.x, petal.y, '#ffb7c5', speed, 0.4, 2.5 + Math.random()*2, angle));
          }
          break;
        }
      }
      if (!exploded) {
        globals.sakuraPetals[writeIdx++] = petal;
      }
    }
    globals.sakuraPetals.length = writeIdx;
  }

  // Update collectibles (in-place compaction without heap allocation)
  if (globals.collectibles) {
    let writeIdx = 0;
    for (let i = 0; i < globals.collectibles.length; i++) {
      const c = globals.collectibles[i];
      c.update(realDt);
      const dx = globals.player.x - c.x;
      const dy = globals.player.y - c.y;
      if (dx * dx + dy * dy < 1600 && globals.player.state !== 'dead') {
        c.life = 0; // consume
        if (c.type === 'exp') {
          globals.exp += c.value;
          globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 30, `+${c.value} EXP`, '#ffd700', 14));
          updateUI();
          if (globals.exp >= globals.maxExp && globals.gameState === 'playing') {
            triggerLevelUp();
          }
        } else if (c.type === 'heart') {
          if (globals.lives < globals.maxLives) {
            globals.lives++;
            updateUI();
            globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 30, "+1 HP", "#ff3366", 20));
          }
        }
      }
      if (c.life > 0) {
        globals.collectibles[writeIdx++] = c;
      }
    }
    globals.collectibles.length = writeIdx;
  }

  // Update Lightning Beams (in-place compaction)
  if (globals.lightningBeams) {
    let writeIdx = 0;
    for (let i = 0; i < globals.lightningBeams.length; i++) {
      const lb = globals.lightningBeams[i];
      lb.update(realDt);
      if (lb.life > 0) {
        globals.lightningBeams[writeIdx++] = lb;
      }
    }
    globals.lightningBeams.length = writeIdx;
  }

  // Update Judgement Domes (in-place compaction)
  if (globals.judgementDomes) {
    let writeIdx = 0;
    for (let i = 0; i < globals.judgementDomes.length; i++) {
      const dome = globals.judgementDomes[i];
      dome.timer -= realDt;
      const currentTick = Math.floor((dome.maxLife - dome.timer) / 0.25);
      if (currentTick > dome.ticks && currentTick <= 6) {
        dome.ticks = currentTick;
        const radius = 180;
        playSound(sfx.slash, 0.2);
        
        const sliceAngle = Math.random() * Math.PI * 2;
        const offsetDist = (Math.random() - 0.5) * 80;
        const sx = dome.x + Math.cos(sliceAngle + Math.PI/2) * offsetDist;
        const sy = dome.y + Math.sin(sliceAngle + Math.PI/2) * offsetDist;
        globals.slashes.push(Slash.acquire(sx, sy, sliceAngle, 0.6, false, 'rgba(0, 255, 255, 0.6)'));
        
        for (let k = 0; k < 3; k++) {
          const sa = Math.random() * Math.PI * 2;
          const ss = 100 + Math.random() * 150;
          globals.particles.push(Particle.acquire(dome.x + (Math.random()-0.5)*120, dome.y + (Math.random()-0.5)*120, '#00ffff', ss, 0.2, 1.5, sa));
        }

        for (let j = 0; j < globals.enemies.length; j++) {
          const e = globals.enemies[j];
          if (e.state === 'dead') continue;
          const dx = e.x - dome.x;
          const dy = e.y - dome.y;
          if (dx * dx + dy * dy < radius * radius) {
            hitEnemy(e, 0.5);
          }
        }
      }
      if (dome.timer > 0) {
        globals.judgementDomes[writeIdx++] = dome;
      }
    }
    globals.judgementDomes.length = writeIdx;
  }

  // Update AnimatedEffects (in-place compaction without heap allocation + effect capping)
  if (globals.animatedEffects) {
    const maxAnimatedEffects = globals.graphicsSettings === 'low' ? 6 : (isMobile ? 8 : 14);
    if (globals.animatedEffects.length > maxAnimatedEffects) {
      globals.animatedEffects.splice(0, globals.animatedEffects.length - maxAnimatedEffects);
    }
    let writeIdx = 0;
    for (let i = 0; i < globals.animatedEffects.length; i++) {
      const fx = globals.animatedEffects[i];
      fx.update(realDt);
      if (fx.life > 0) {
        globals.animatedEffects[writeIdx++] = fx;
      }
    }
    globals.animatedEffects.length = writeIdx;
  }

  const rawAttack = globals.mouse.justPressed || globals.mobileAttackJustPressed;
  const bufferNow = performance.now();
  if (rawAttack && globals.gameMode !== 'pvp' && qolSettings.buffer > 0) actionBuffer.queue('attack', bufferNow, qolSettings.buffer);
  const canAttack = !!globals.player && globals.player.attackCooldown <= 0 && globals.player.state !== 'dash';
  const bufferedAttack = globals.gameMode !== 'pvp' && actionBuffer.consume('attack', bufferNow, canAttack);
  const isAttackPressed = rawAttack || bufferedAttack;
  const isAttackReleased = globals.mouse.justReleased || globals.mobileAttackReleased;

  // Option 2: Active Blade Clash (Tsubazeriai) Update & Input
  if (globals.activeBladeClash) {
    const clash = globals.activeBladeClash;
    clash.timer -= realDt;
    clash.x = (globals.player.x + clash.enemy.x) / 2;
    clash.y = (globals.player.y + clash.enemy.y) / 2;

    if (Math.random() < 0.4) {
      const spd = 120 + Math.random() * 200;
      const ang = Math.random() * Math.PI * 2;
      globals.particles.push(Particle.acquire(clash.x, clash.y, '#ffd700', spd, 0.2, 2.5, ang));
    }

    clash.enemy.vx = 0; clash.enemy.vy = 0;
    clash.enemy.stunTimer = Math.max(clash.enemy.stunTimer || 0, 0.25);

    if (isAttackPressed) {
      clash.tapsCurrent++;
      clash.timer = Math.min(clash.timer + 0.08, clash.maxTimer);
      playSynthesizedClash();
      globals.screenShake = Math.max(globals.screenShake, 8);
      for (let p = 0; p < 8; p++) {
        const spd = 200 + Math.random() * 250;
        const ang = Math.random() * Math.PI * 2;
        globals.particles.push(Particle.acquire(clash.x, clash.y, '#ffd700', spd, 0.3, 3, ang));
      }

      if (clash.tapsCurrent >= clash.tapsRequired) {
        // VICTORY!
        const enemy = clash.enemy;
        globals.activeBladeClash = null;
        globals.shockwaves.push(new Shockwave(clash.x, clash.y, '#ffd700'));
        globals.floatingTexts.push(FloatingText.acquire(clash.x, clash.y - 65, t('clashVictoryText') || "CLASH VICTORY! ⚔️", "neon-#ffd700", 32));
        globals.bladeClashVictories++;
        if (!globals.unlockedSeals.includes(1)) {
          notifyFeatMilestone(1, globals.bladeClashVictories, 3, "Blade Clashes Won", "鍔迫り合い勝利数");
        }
        if (globals.bladeClashVictories >= 3 && !globals.unlockedSeals.includes(1)) {
          spawnShrine(1);
        }
        playSynthesizedAwaken();
        globals.screenShake = Math.max(globals.screenShake, 25);
        addFlow(10);
        addCombo();
        addCombo();

        if (enemy && enemy.state !== 'dead') {
          if (typeof enemy.addPostureDamage === 'function') {
            enemy.addPostureDamage(60);
          }
          const kbAngle = Math.atan2(enemy.y - globals.player.y, enemy.x - globals.player.x);
          enemy.knockbackTimer = 0.45;
          enemy.knockbackVx = Math.cos(kbAngle) * 1900;
          enemy.knockbackVy = Math.sin(kbAngle) * 1900;
          enemy.vx = enemy.knockbackVx;
          enemy.vy = enemy.knockbackVy;
          enemy.setState('idle');
          hitEnemy(enemy, 5);
        }
      }
    } else if (clash.timer <= 0 || clash.enemy.state === 'dead') {
      // DRAW / Expiry
      if (clash.enemy && clash.enemy.state !== 'dead') {
        const kbAngle = Math.atan2(clash.enemy.y - globals.player.y, clash.enemy.x - globals.player.x);
        clash.enemy.knockbackTimer = 0.25;
        clash.enemy.knockbackVx = Math.cos(kbAngle) * 700;
        clash.enemy.knockbackVy = Math.sin(kbAngle) * 700;
        clash.enemy.vx = clash.enemy.knockbackVx;
        clash.enemy.vy = clash.enemy.knockbackVy;
        clash.enemy.setState('idle');
      }
      globals.floatingTexts.push(FloatingText.acquire(clash.x, clash.y - 50, t('clashDrawText') || "CLASH DRAW", "#94a3b8", 22));
      globals.activeBladeClash = null;
    }
  }

  globals.player.update(realDt);

  // Mechanic 2: Interactive Blade Sheathing / Blood-Flick (Chiburui & Noto)
  // Standing still for 1.2s after 3+ kills performs blood-flick particle burst & blade sheathe sound for +15 Flow and guaranteed next-hit 2.5x critical strike.
  if (globals.player && globals.gameState === 'playing' && globals.player.state === 'idle' && Math.abs(globals.player.vx || 0) < 5 && Math.abs(globals.player.vy || 0) < 5) {
    globals.chiburuiTimer = (globals.chiburuiTimer || 0) + realDt;
    if ((globals.chiburuiKills || 0) >= 3 && globals.chiburuiTimer >= 1.2 && !globals.guaranteedCrit) {
      globals.chiburuiKills = 0;
      globals.chiburuiTimer = 0;
      globals.guaranteedCrit = true;
      addFlow(15);
      playSynthesizedSheathe();
      
      const bloodDir = globals.player.dir || 1;
      // Visceral blood-flick particles (red arc flicking off katana)
      for (let p = 0; p < 14; p++) {
        const spd = 120 + Math.random() * 180;
        const angle = (bloodDir === 1 ? -0.3 : Math.PI + 0.3) + (Math.random() - 0.5) * 0.6;
        globals.particles.push(Particle.acquire(globals.player.x + bloodDir * 15, globals.player.y + 10, '#dc2626', spd, 0.45, 3.0, angle));
      }
      // Glint spark on blade sheathe
      for (let p = 0; p < 8; p++) {
        const spd = 60 + Math.random() * 100;
        const angle = Math.random() * Math.PI * 2;
        globals.particles.push(Particle.acquire(globals.player.x - bloodDir * 10, globals.player.y + 5, '#fde047', spd, 0.3, 2.5, angle));
      }
      globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 75, globals.currentLang === 'ja' ? '血振るい・納刀 ⚔️ 会心の一撃！' : 'CHIBURUI! ⚔️ +CRIT STRIKE!', '#fde047', 26));
      globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#fde047'));
    }
  } else {
    globals.chiburuiTimer = 0;
  }

  // Option 3: Mid-Air Pursuit & Aerial Helm-Splitter Cleave
  const isDashJustPressed = (globals.keys[globals.keyMaps.dash] || globals.mobileDashJustPressed);
  if (isAttackPressed || isDashJustPressed) {
    const airborneEnemy = globals.enemies.find(e => {
      if (e.state === 'dead' || !(e as any).canAerialCleave) return false;
      const dx = e.x - globals.player.x;
      const dy = e.y - globals.player.y;
      return (e as any).airborneZ > 20 && (dx * dx + dy * dy < 360 * 360);
    });

    if (airborneEnemy) {
      (airborneEnemy as any).canAerialCleave = false;
      (airborneEnemy as any).aerialCleaveTriggered = true;
      (airborneEnemy as any).airborneVz = -1750; // Drive enemy violently back down to earth!

      // Player teleports airborne directly above the target
      globals.player.x = airborneEnemy.x - (globals.player.dir || 1) * 25;
      globals.player.y = airborneEnemy.y;
      globals.player.airborneZ = (airborneEnemy as any).airborneZ + 20;
      globals.player.airborneVz = 0;
      globals.player.setState('attack');

      // Aerial cross-slash
      globals.slashes.push(Slash.acquire(airborneEnemy.x, airborneEnemy.y - (airborneEnemy as any).airborneZ, Math.PI / 4, 2.2, false, '#38bdf8'));
      globals.slashes.push(Slash.acquire(airborneEnemy.x, airborneEnemy.y - (airborneEnemy as any).airborneZ, -Math.PI / 4, 2.2, false, '#38bdf8'));

      globals.screenShake = Math.max(globals.screenShake, 20);
      playSound(sfx.slash);
      addFlow(10);
      addCombo();
    }
  }
  if (globals.player.state !== 'dash' && globals.raijinDashActive) {
    globals.raijinDashActive = false;
    if (globals.lightningDischargeActive) {
      globals.lightningDischargeActive = false;
      triggerLightningDischarge(globals.player.dashStartX, globals.player.dashStartY, globals.player.x, globals.player.y);
    } else {
      triggerStormGodLightning(globals.player.x, globals.player.y);
    }
  }

  let dashAttackTriggered = false;
  const isAttackDownOrPressed = isAttackPressed || globals.mouse.down || globals.mobileAttackDown;
  if (globals.player.state === 'dash' && isAttackDownOrPressed) {
    dashAttackTriggered = true;
    if (globals.raijinDashActive) {
      executeThunderclapAndFlash();
    } else {
      executeSwiftCounter();
    }
  }

  let parryTriggered = false;
  const isCharging = globals.player.state === 'charge';
  const isFullyCharged = globals.player.chargeTimer >= 0.8;
  const isParryInput = (isCharging && isFullyCharged && isAttackReleased) || (isAttackPressed && globals.selectedSkill === 'parry_master' && globals.enhanceActiveTimer > 0);
  if (!dashAttackTriggered && isParryInput && globals.player.state !== 'dash' && globals.player.state !== 'dead') {
    globals.enemies.forEach(e => {
      if (!parryTriggered && (e.state === 'attack' || (e.state === 'charge' && e.stateTime > e.chargeTimeMax - 0.15))) {
        const dx = e.x - globals.player.x; const dy = e.y - globals.player.y;
        const maxDist = 200 + (e.scaleMult - 1) * 60;
        if (dx * dx + dy * dy < maxDist * maxDist) {
          parryTriggered = true;
          
          triggerFlowingCounterReset();
          const isChilled = e.chillTimer > 0;

          if (isCharging) {
            globals.riposteTimer = 0.4;
            globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 110, "RIPOSTE READY!", "#ff0055", 22));
            if (isFullyCharged) {
              fireFullyChargedIaijutsu(Math.atan2(dy, dx));
            }
          }

          const parryWindowMult = globals.selectedHero === 'default' ? 1.35 : 1.0;
          const isPerfect = (e.state === 'attack' && e.stateTime < 0.18 * parryWindowMult) || (e.state === 'charge' && e.stateTime > e.chargeTimeMax - 0.08 * parryWindowMult);
          
          if (isPerfect) {
            globals.runStats.perfectParries++;
            globals.runStats.parries++;
            globals.consecutiveParries++;

            // Perfect Parry Magatama Bounty (boosted by Fortune & Blood Surge)
            const bloodSurgeMult = globals.activeStageAffix?.id === 'blood_surge' ? 2 : 1;
            const parryMag = Math.round(2 * (globals.playerStats?.fortuneMult || 1.0) * bloodSurgeMult);
            globals.magatama = (globals.magatama || 0) + parryMag;
            safeStorage.setItem('stickmurai_magatama', globals.magatama.toString());
            globals.floatingTexts.push(FloatingText.acquire(globals.player.x + 35, globals.player.y - 85, `+${parryMag} 🔮`, '#c084fc', 20));

            if (globals.consecutiveParries >= 10 && !globals.unlockedSeals.includes(6)) {
              spawnShrine(6);
            }
            if (globals.unlockedSeals.includes(6)) {
              e.stunTimer = Math.max(e.stunTimer || 0, 2.0);
            }
            if (globals.activeFusions.has('asura_storm')) {
              let asuraHits = 0;
              globals.screenShake = Math.max(globals.screenShake, 38);
              globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#ef4444'));

              // Hexagonal Asura ground scars & radiating crimson slashes
              for (let a = 0; a < 6; a++) {
                const scAngle = (a * Math.PI) / 3;
                globals.groundScars.push(new GroundScar(
                  globals.player.x + Math.cos(scAngle) * 55,
                  globals.player.y + Math.sin(scAngle) * 55,
                  scAngle,
                  90,
                  '#ef4444'
                ));
                globals.slashes.push(Slash.acquire(
                  globals.player.x + Math.cos(scAngle) * 65,
                  globals.player.y + Math.sin(scAngle) * 65,
                  scAngle,
                  1.5,
                  true,
                  '#ef4444'
                ));
              }

              const asuraRadiusSq = 360 * 360;
              const nearby = globals.enemies.filter(other => {
                if (other.state === 'dead') return false;
                const dX = other.x - globals.player.x;
                const dY = other.y - globals.player.y;
                return (dX * dX + dY * dY) < asuraRadiusSq;
              });
              nearby.forEach((other, idx) => {
                if (idx < 6) {
                  asuraHits++;
                  hitEnemy(other, 12);
                  globals.shockwaves.push(new Shockwave(other.x, other.y, '#ef4444'));
                }
              });
              if (asuraHits >= 3) {
                globals.lives = Math.min(globals.maxLives, globals.lives + 1);
                globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 100, globals.currentLang === 'ja' ? '【六腕阿修羅】血肉再生！ 心臓全快！' : "【SIX-ARMED ASURA】 FLESH REBORN! +1 HEART!", '#ef4444', 32));
                callbacks.updateUI();
              }
            }
            addCombo();
            addCombo();
            globals.hitStop = 0; globals.screenShake = (globals.graphicsSettings === 'low' ? 0.5 : 1) * 35;
            addFlow(8.0);
            globals.invulnTimer = 2.0;
            globals.invertScreenTimer = 0.25;
            globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#ffaa00'));
            globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 70, t('perfectParryText'), "neon-#ffaa00", 34));
            
            e.setState('idle');
            e.knockbackTimer = 0.45;
            e.knockbackVx = -Math.cos(e.targetAngle) * 2200;
            e.knockbackVy = -Math.sin(e.targetAngle) * 2200;
            e.vx = e.knockbackVx; e.vy = e.knockbackVy;
            if (typeof (e as any).addPostureDamage === 'function') {
              (e as any).addPostureDamage(45);
            }
            hitEnemy(e, 3);
            if (globals.activeBounty && globals.activeBounty.type === 'parry') {
              globals.activeBounty.current++;
            }

            globals.player.setState('attack');
            playSound(sfx.slash);
            playSynthesizedPerfectParry();

            const parrySparkCount = globals.graphicsSettings === 'low' ? 10 : 30;
            for(let i=0; i<parrySparkCount; i++) {
              const speed = 400 + Math.random() * 500;
              globals.particles.push(Particle.acquire(globals.player.x, globals.player.y, '#ffd700', speed, 0.5, 3 + Math.random()*2));
            }
          } else {
            globals.runStats.parries++;
            addCombo();
            globals.hitStop = 0; globals.screenShake = (globals.graphicsSettings === 'low' ? 0.5 : 1) * 25;
            addFlow(4.0);
            globals.invulnTimer = 0.8;
            globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#ffd700'));
            globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 60, t('parryText'), "#ffd700", 28));

            e.setState('idle');
            e.knockbackTimer = 0.35;
            e.knockbackVx = -Math.cos(e.targetAngle) * 1800;
            e.knockbackVy = -Math.sin(e.targetAngle) * 1800;
            e.vx = e.knockbackVx; e.vy = e.knockbackVy;
            if (typeof (e as any).addPostureDamage === 'function') {
              (e as any).addPostureDamage(25);
            }
            hitEnemy(e, 2);
            if (globals.activeBounty && globals.activeBounty.type === 'parry') {
              globals.activeBounty.current++;
            }

            globals.player.setState('attack');
            playSound(sfx.slash);
            playSynthesizedParry();

            const normalParrySparkCount = globals.graphicsSettings === 'low' ? 4 : 12;
            for(let i=0; i<normalParrySparkCount; i++) {
              const speed = 300 + Math.random() * 400;
              globals.particles.push(Particle.acquire(globals.player.x, globals.player.y, '#ffd700', speed, 0.4, 2 + Math.random()*2));
            }
          }

          if (globals.frostStanceActive && isChilled) {
            triggerShatterAoE(e.x, e.y);
          }
          
          globals.player.attackCooldown = 0.2;
          globals.player.vx = 0; globals.player.vy = 0;
          globals.slashes.push(Slash.acquire(globals.player.x, globals.player.y, Math.atan2(dy, dx), globals.playerStats.slashSizeMult * 1.5, true, undefined, false, globals.player));
        }
      }
    });
  }

  if (globals.gameMode === 'zen') {
    if (isAttackPressed) {
      const now = performance.now();
      if (now - globals.lastZenWarningTime > 1000) {
        globals.lastZenWarningTime = now;
        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 60, t('zenWarningText'), "#ff3355", 22));
      }
    }
  } else if (!dashAttackTriggered && !parryTriggered && globals.player.attackCooldown <= 0 && globals.player.state !== 'dash' && globals.player.state !== 'dead') {
    let shouldAttack = false;
    let attackPower = 1.0;
    
    if (isAttackReleased) {
      if (globals.player.state === 'charge') {
        const isFullyCharged = globals.player.chargeTimer >= 0.8;
        if (globals.comboSlashesCount === 2 && !isFullyCharged) {
          executeRisingDragon();
          globals.comboSlashesCount = 0;
          globals.player.chargeTimer = 0;
          return;
        }
        shouldAttack = true;
        attackPower = isFullyCharged ? 1.8 : 1.0;
      } else {
        // Tapped basic slash: execute on release
        shouldAttack = true;
        attackPower = 1.0;
      }
    }

    if (shouldAttack) {
      if (attackPower < 1.7) {
        const nowBasic = performance.now();
        if (nowBasic - globals.lastBasicSlashTime < 800) {
          globals.comboSlashesCount++;
        } else {
          globals.comboSlashesCount = 1;
        }
        globals.lastBasicSlashTime = nowBasic;
      } else {
        globals.comboSlashesCount = 0;
      }

      globals.player.setState('attack'); 
      playSound(sfx.slash);
      
      let currentAtkCooldown = globals.playerStats.attackCooldownBase;
      if (globals.flowState === 'awakened') currentAtkCooldown *= 0.5;
      
      if (globals.tempoMasteryLevel > 0) {
        const speedBonus = Math.min(0.20, globals.combo * 0.02 * globals.tempoMasteryLevel);
        currentAtkCooldown *= (1 - speedBonus);
      }
      globals.player.attackCooldown = currentAtkCooldown;

      let angle = globals.player.dir === 1 ? 0 : Math.PI;
      if (globals.useMobileIaijutsuAimAngle) {
        angle = globals.mobileIaijutsuAimAngle;
        globals.player.dir = Math.cos(angle) >= 0 ? 1 : -1;
      } else {
        if (!globals.joystickActive) { angle = Math.atan2(globals.mouse.y - globals.height/2, globals.mouse.x - globals.width/2); }
        
        let closestEnemy: Enemy | null = null;
        let minDistanceSq = 360000; // 600 * 600
        for (let j = 0; j < globals.enemies.length; j++) {
          const e = globals.enemies[j];
          if (e.state === 'dead') continue;
          const edx = e.x - globals.player.x;
          const edy = e.y - globals.player.y;
          const dSq = edx * edx + edy * edy;
          if (dSq < minDistanceSq) {
            minDistanceSq = dSq;
            closestEnemy = e;
          }
        }
        if (closestEnemy) {
          angle = Math.atan2(closestEnemy.y - globals.player.y, closestEnemy.x - globals.player.x);
          globals.player.dir = closestEnemy.x > globals.player.x ? 1 : -1;
        }
      }
      
      let lungePower = 1000 * attackPower;
      if (globals.flowState === 'awakened') lungePower *= 2; 
      
      globals.player.vx = Math.cos(angle) * lungePower; globals.player.vy = Math.sin(angle) * lungePower; globals.screenShake += 3 * attackPower;

      let size = globals.playerStats.slashSizeMult * attackPower;
      let dmg = attackPower >= 1.7 ? 4 : 1;
      let isEnhanced = attackPower >= 1.7;
      let isRiposteStrike = false;

      const isDragonFuryActive = globals.selectedSkill === 'enhance' && globals.enhanceActiveTimer > 0;
      if (isDragonFuryActive) {
        size *= globals.playerStats.enhanceSizeMult;
        dmg += globals.playerStats.enhanceBonusDmg;
        isEnhanced = true;
      }

      if (globals.playerStats.reapersMarkLevel && globals.playerStats.reapersMarkLevel > 0) {
        dmg += 2 * globals.playerStats.reapersMarkLevel;
      }

      if (globals.flowState === 'awakened') {
        dmg += 2;
      }

      if (attackPower < 1.7 && globals.riposteTimer > 0) {
        globals.riposteTimer = 0; // consume
        dmg *= 2.0;
        size *= 2.0;
        isEnhanced = true;
        isRiposteStrike = true;
        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 40, "RIPOSTE!", "#ff0055", 26));
        globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, 'rgba(255, 0, 85, 0.7)'));
        playSynthesizedPerfectParry();
      }

      if (globals.decoyCritPrimed) {
        globals.decoyCritPrimed = false; // consume
        dmg *= 5.0;
        size *= 1.6;
        isEnhanced = true;
        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 100, "CRITICAL STRIKE!", "#ff0055", 30));
        playSynthesizedPerfectParry();
        globals.screenShake = Math.max(globals.screenShake, 35);
      }

      if (globals.flowState === 'awakened') {
        size *= 1.8;
        globals.projectiles.push(Projectile.acquire(globals.player.x, globals.player.y, angle));
      }

      if (isDragonFuryActive) {
        globals.projectiles.push(Projectile.acquire(globals.player.x, globals.player.y, angle, false, dmg, true));
      }
      if (globals.activeFusions.has('kamaitachi')) {
        const sSpd = 650;
        globals.bouncingSickles.push({
          x: globals.player.x,
          y: globals.player.y,
          vx: Math.cos(angle - 0.35) * sSpd,
          vy: Math.sin(angle - 0.35) * sSpd,
          life: 4.0,
          maxLife: 4.0,
          radius: 32,
          damage: 6
        });
        globals.bouncingSickles.push({
          x: globals.player.x,
          y: globals.player.y,
          vx: Math.cos(angle + 0.35) * sSpd,
          vy: Math.sin(angle + 0.35) * sSpd,
          life: 4.0,
          maxLife: 4.0,
          radius: 32,
          damage: 6
        });
        playSound(sfx.slash, 0.5);
      }
      if (globals.activeFusions.has('singularity_cleave') && globals.singularityCleaveCD <= 0) {
        const bhX = globals.player.x + Math.cos(angle) * 150;
        const bhY = globals.player.y + Math.sin(angle) * 150;
        globals.gravityWellTimer = 2.0;
        globals.gravityWellX = bhX;
        globals.gravityWellY = bhY;
        globals.singularityCleaveCD = 4.0;
        playEnergyBeam(0.6);
        globals.shockwaves.push(new Shockwave(bhX, bhY, '#a855f7'));
        if (vfxAnims.gigapack?.explosion?.length > 0) {
          globals.animatedEffects.push(new AnimatedEffect(bhX, bhY, vfxAnims.gigapack.explosion, 0.65, 2.5));
        }
      }
      if (globals.playerStats.slashBonusDmg) {
        dmg += globals.playerStats.slashBonusDmg;
      }
      
      if (attackPower >= 1.7) {
        fireFullyChargedIaijutsu(angle);
      }

      globals.slashes.push(Slash.acquire(
        globals.player.x + Math.cos(angle)*50, 
        globals.player.y + Math.sin(angle)*50, 
        angle, 
        size, 
        isEnhanced, 
        isRiposteStrike ? 'rgba(255, 0, 85, ALPHA)' : undefined, 
        isRiposteStrike,
        globals.player
      ));

      // Akakage passive: Crimson Aftermath leaves one delayed echo slash.
      // The single scheduled echo keeps the effect powerful while bounded.
      if (globals.selectedHero === 'akakage' && attackPower < 1.7) {
        const echoAngle = angle;
        const echoX = globals.player.x;
        const echoY = globals.player.y;
        globals.delayedActions.push({
          delay: 0.14,
          run: () => {
            if (globals.gameState !== 'playing' || globals.player.state === 'dead') return;
            globals.slashes.push(Slash.acquire(
              echoX + Math.cos(echoAngle) * 50,
              echoY + Math.sin(echoAngle) * 50,
              echoAngle,
              size * 0.9,
              true,
              'rgba(239, 68, 68, ALPHA)',
              false,
              globals.player
            ));
            globals.projectiles.push(Projectile.acquire(echoX, echoY, echoAngle, false, 1.5, false, true));
          }
        });
      }

      // Grandmaster Samurai passive: Kensei 360-degree cross-cleave on every 3rd strike
      if (globals.selectedHero === 'samurai' && globals.comboSlashesCount >= 3 && attackPower < 1.7) {
        globals.comboSlashesCount = 0;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
          globals.slashes.push(Slash.acquire(
            globals.player.x + Math.cos(a) * 50,
            globals.player.y + Math.sin(a) * 50,
            a,
            size * 1.35,
            true,
            'rgba(251, 191, 36, ALPHA)',
            false,
            globals.player
          ));
        }
        globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#fbbf24'));
        globals.screenShake = Math.max(globals.screenShake, 14);
        playSynthesizedPerfectParry();
        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 75, "KENSEI CROSS-CLEAVE! ⚔️", "#fbbf24", 22));
      }

      // Nightborne Sovereign passive: lingering void flame particles along slash trajectory
      if (globals.selectedHero === 'nightborne') {
        for (let i = 0; i < 4; i++) {
          const px = globals.player.x + Math.cos(angle) * (30 + i * 25) + (Math.random() - 0.5) * 16;
          const py = globals.player.y + Math.sin(angle) * (30 + i * 25) + (Math.random() - 0.5) * 16;
          globals.particles.push(Particle.acquire(
            px, py,
            Math.random() > 0.5 ? '#8b5cf6' : '#c084fc',
            50,
            0.35 + Math.random() * 0.2,
            12 + Math.random() * 8
          ));
        }
      }

      // Primal Satyr Sovereign passive: emerald nature thorns along slash trajectory
      if (globals.selectedHero === 'satyr') {
        for (let i = 0; i < 4; i++) {
          const px = globals.player.x + Math.cos(angle) * (32 + i * 25) + (Math.random() - 0.5) * 16;
          const py = globals.player.y + Math.sin(angle) * (32 + i * 25) + (Math.random() - 0.5) * 16;
          globals.particles.push(Particle.acquire(
            px, py,
            Math.random() > 0.5 ? '#10b981' : '#34d399',
            55,
            0.35 + Math.random() * 0.2,
            12 + Math.random() * 8
          ));
        }
      }
      
      if (attackPower < 1.7 && globals.comboFinisherReady) {
        globals.comboFinisherReady = false;
        const angles = [angle - 0.25, angle, angle + 0.25];
        angles.forEach(a => {
          globals.projectiles.push(Projectile.acquire(globals.player.x, globals.player.y, a, false, 2.5, false, true));
        });
        globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#ffcc00'));
        globals.screenShake += 15;
        playSound(sfx.slash, 0.8);
        playSynthesizedPerfectParry(); // Add high-frequency crunch sound feedback
        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 100, "💥 COMBO FINISHER! 💥", "#ffcc00", 24));
      }
      
      if (globals.echoLevel > 0) {
        const echoDmg = 0.5 * globals.echoLevel;
        const currentAngle = angle;
        globals.delayedActions.push({
          delay: 0.12,
          run: () => {
            if (globals.gameState === 'playing' && globals.player.state !== 'dead') {
              globals.projectiles.push(Projectile.acquire(globals.player.x, globals.player.y, currentAngle, false, echoDmg, false, true));
              playSound(sfx.slash, 0.4);
            }
          }
        });
      }
      
      const slashSparkCount = globals.graphicsSettings === 'low' ? 2 : 8;
      for(let i=0; i<slashSparkCount; i++) {
        const sparkAngle = sparkAngleCalculate(angle);
        const speed = 400 + Math.random() * 500;
        globals.particles.push(Particle.acquire(
          globals.player.x + Math.cos(angle)*150*size, 
          globals.player.y + Math.sin(angle)*150*size, 
          isEnhanced ? '#ff6600' : '#c0c8d0', 
          speed, 
          0.25, 
          2 + Math.random() * 2, 
          sparkAngle, 
          0, 
          0.92
        ));
      }

      // Option 1: Blade Deflection / Projectile Baseball (Hane-Kaeshi)
      for (let j = 0; j < globals.projectiles.length; j++) {
        const proj = globals.projectiles[j];
        if (!proj.isEnemy || proj.isDeflected || proj.life <= 0) continue;
        const pdx = proj.x - globals.player.x;
        const pdy = proj.y - globals.player.y;
        const slashDeflectRange = 280 * size;
        if (pdx * pdx + pdy * pdy < slashDeflectRange * slashDeflectRange) {
          const pa = Math.atan2(pdy, pdx);
          let diff = Math.abs(pa - angle);
          if (diff > Math.PI) diff = Math.PI * 2 - diff;
          if (diff < Math.PI / 1.5 || isRiposteStrike) {
            proj.isEnemy = false;
            proj.isDeflected = true;
            proj.life = 3.5;

            let targetEnemy: Enemy | null = (proj.shooter && proj.shooter.state !== 'dead') ? proj.shooter : null;
            if (!targetEnemy) {
              let minDistanceSq = Infinity;
              for (const otherEnemy of globals.enemies) {
                if (otherEnemy.state === 'dead') continue;
                const edx = otherEnemy.x - proj.x;
                const edy = otherEnemy.y - proj.y;
                const edSq = edx * edx + edy * edy;
                if (edSq < minDistanceSq) {
                  minDistanceSq = edSq;
                  targetEnemy = otherEnemy;
                }
              }
            }

            let deflectAngle = angle;
            if (targetEnemy) {
              deflectAngle = Math.atan2(targetEnemy.y - proj.y, targetEnemy.x - proj.x);
            }

            const deflectSpeed = 2400;
            proj.vx = Math.cos(deflectAngle) * deflectSpeed;
            proj.vy = Math.sin(deflectAngle) * deflectSpeed;
            proj.angle = deflectAngle;
            proj.damage = (globals.playerStats.deflectedDmg || 2) * 3 + Math.round(dmg * 0.5);

            playSynthesizedParry();
            globals.screenShake = 16;
            globals.shockwaves.push(new Shockwave(proj.x, proj.y, '#ffd700'));
            globals.floatingTexts.push(FloatingText.acquire(proj.x, proj.y - 45, "BATTER UP!", "#ffd700", 24));

            addFlow(15);
            if (globals.activeBounty && globals.activeBounty.type === 'deflect') {
              globals.activeBounty.current++;
            }

            const sparkCount = globals.graphicsSettings === 'low' ? 6 : 14;
            for (let k = 0; k < sparkCount; k++) {
              globals.particles.push(Particle.acquire(
                proj.x,
                proj.y,
                '#ffd700',
                400 + Math.random() * 200,
                0.35,
                2 + Math.random() * 2,
                deflectAngle + (Math.random() - 0.5) * 0.8
              ));
            }
          }
        }
      }

      let hasChained = false;
      for (let j = 0; j < globals.enemies.length; j++) {
        const e = globals.enemies[j];
        if (e.state === 'dead') continue;
        const dx = e.x - globals.player.x; const dy = e.y - globals.player.y;
        const enemyHitRadius = (e.scaleMult - 1) * 60; 
        const hitRange = 325 * size + enemyHitRadius;
        const distSq = dx * dx + dy * dy;
        if (distSq < hitRange * hitRange) {
          let isHit = isRiposteStrike;
          if (!isHit) {
            const a = Math.atan2(dy, dx);
            let diff = Math.abs(a - angle); if (diff > Math.PI) diff = Math.PI * 2 - diff;
            isHit = diff < Math.PI / 1.5;
          }
          if (isHit) {
            // Option 2: Blade Clash (Tsubazeriai) Trigger
            const isMeleeEnemy = e.subType !== 'pyromancer' && e.subType !== 'musketeer';
            const isEnemyAttackingOrCharging = e.state === 'attack' || (e.state === 'charge' && e.stateTime > e.chargeTimeMax * 0.65);
            if (!globals.activeBladeClash && !isRiposteStrike && isMeleeEnemy && isEnemyAttackingOrCharging && distSq < 140 * 140) {
              const clashX = (globals.player.x + e.x) / 2;
              const clashY = (globals.player.y + e.y) / 2;
              globals.activeBladeClash = {
                enemy: e,
                timer: 0.45,
                maxTimer: 0.45,
                tapsRequired: globals.difficulty === 'insane' ? 3 : 2,
                tapsCurrent: 0,
                x: clashX,
                y: clashY
              };
              e.vx = 0; e.vy = 0;
              e.stunTimer = 0.55;
              globals.screenShake = Math.max(globals.screenShake, 12);
              playSynthesizedClash();
              globals.shockwaves.push(new Shockwave(clashX, clashY, '#ffd700'));
              for (let p = 0; p < 12; p++) {
                const spd = 200 + Math.random() * 300;
                const pAng = Math.random() * Math.PI * 2;
                globals.particles.push(Particle.acquire(clashX, clashY, '#ffd700', spd, 0.35, 3, pAng));
              }
              continue;
            }

            hitEnemy(e, dmg);
            if (globals.flowState === 'storm_god' && !hasChained) {
              hasChained = true;
              triggerChainLightning(e);
            }
            if (isRiposteStrike) {
              const knockbackAngle = Math.atan2(e.y - globals.player.y, e.x - globals.player.x);
              e.knockbackTimer = 0.5;
              e.knockbackVx = Math.cos(knockbackAngle) * 2600;
              e.knockbackVy = Math.sin(knockbackAngle) * 2600;
              e.setState('idle');
            }
          }
        }
      }

      if (globals.bladeEchoesActive && globals.flowState === 'awakened') {
        const topY = globals.player.y - 90;
        const bottomY = globals.player.y + 90;
        const cloneSlashSize = size * 2.0;
        const cloneDmg = Math.max(1, Math.round(dmg * 0.4));
        
        globals.slashes.push(Slash.acquire(globals.player.x + Math.cos(angle)*50, topY + Math.sin(angle)*50, angle, cloneSlashSize, false, 'rgba(0, 255, 255, ALPHA)', false, globals.player));
        globals.slashes.push(Slash.acquire(globals.player.x + Math.cos(angle)*50, bottomY + Math.sin(angle)*50, angle, cloneSlashSize, false, 'rgba(0, 255, 255, ALPHA)', false, globals.player));
        
        const topCloneHitRange = 280 * cloneSlashSize;
        for (let j = 0; j < globals.enemies.length; j++) {
          const e = globals.enemies[j];
          if (e.state === 'dead') continue;
          const enemyHitRadius = (e.scaleMult - 1) * 60;
          const totalRange = topCloneHitRange + enemyHitRadius;
          const totalRangeSq = totalRange * totalRange;

          // Check top clone
          const dxTop = e.x - globals.player.x; const dyTop = e.y - topY;
          if (dxTop * dxTop + dyTop * dyTop < totalRangeSq) {
            const a = Math.atan2(dyTop, dxTop);
            let diff = Math.abs(a - angle); if (diff > Math.PI) diff = Math.PI * 2 - diff;
            if (diff < Math.PI / 1.5) { hitEnemy(e, cloneDmg); continue; }
          }

          // Check bottom clone
          const dxBot = e.x - globals.player.x; const dyBot = e.y - bottomY;
          if (dxBot * dxBot + dyBot * dyBot < totalRangeSq) {
            const a = Math.atan2(dyBot, dxBot);
            let diff = Math.abs(a - angle); if (diff > Math.PI) diff = Math.PI * 2 - diff;
            if (diff < Math.PI / 1.5) { hitEnemy(e, cloneDmg); }
          }
        }
      }

      if (globals.playerStats.shadowClonesLevel && globals.playerStats.shadowClonesLevel > 0) {
        const cloneDelays = [18];
        if (globals.playerStats.shadowClonesLevel >= 2) {
          cloneDelays.push(36);
        }
        cloneDelays.forEach(delay => {
          const delaySec = delay / 60;
          globals.delayedActions.push({
            delay: delaySec,
            run: () => {
              const historyIdx = globals.playerPosHistory.length - 1 - delay;
              if (historyIdx >= 0) {
                const hist = globals.playerPosHistory[historyIdx];
                const cloneSize = size * 0.7;
                globals.slashes.push(Slash.acquire(hist.x + Math.cos(angle)*50, hist.y + Math.sin(angle)*50, angle, cloneSize, false, 'rgba(136, 51, 255, ALPHA)'));
                globals.enemies.forEach(e => {
                  if (e.state === 'dead') return;
                  const dx = e.x - hist.x; const dy = e.y - hist.y;
                  const dist = Math.hypot(dx, dy); const a = Math.atan2(dy, dx);
                  let diff = Math.abs(a - angle); if (diff > Math.PI) diff = Math.PI * 2 - diff;
                  const enemyHitRadius = (e.scaleMult - 1) * 60; 
                  if (dist < 280 * cloneSize + enemyHitRadius && diff < Math.PI/1.5) {
                    hitEnemy(e, 1);
                  }
                });
              }
            }
          });
        });
      }
      if (globals.flowState === 'awakened') {
        globals.shadowAutoAttackTimer = (globals.shadowAutoAttackTimer || 0) - realDt;
        if (globals.shadowAutoAttackTimer <= 0) {
          globals.shadowAutoAttackTimer = 0.22;
          
          let nearestEnemy: Enemy | null = null;
          let minDistSq = 360000; // 600 * 600
          for (let j = 0; j < globals.enemies.length; j++) {
            const enemy = globals.enemies[j];
            if (enemy.state === 'dead') continue;
            const edx = enemy.x - globals.player.x;
            const edy = enemy.y - globals.player.y;
            const dSq = edx * edx + edy * edy;
            if (dSq < minDistSq) {
              minDistSq = dSq;
              nearestEnemy = enemy;
            }
          }
          if (nearestEnemy) {
            const clone = Afterimage.acquire(globals.player, '#c084fc');
            clone.x = nearestEnemy.x;
            clone.y = nearestEnemy.y;
            clone.life = 0.35;
            clone.maxLife = 0.35;
            globals.afterimages.push(clone);
            
            globals.slashes.push(Slash.acquire(nearestEnemy.x, nearestEnemy.y, Math.random() * Math.PI * 2, 1.2, false, 'rgba(192, 132, 252, ALPHA)'));
            hitEnemy(nearestEnemy, 4);
            
            const lowGraphics = globals.graphicsSettings === 'low';
            const particleCount = lowGraphics ? 1 : 3;
            for (let i = 0; i < particleCount; i++) {
              globals.particles.push(Particle.acquire(nearestEnemy.x, nearestEnemy.y, '#c084fc', 120, 0.3, 1.5));
            }
          }
        }
      }
    }
  }
  
  function sparkAngleCalculate(angle: number) {
    return angle + (Math.random() - 0.5) * 1.2;
  }

  globals.mobileAttackJustPressed = false;
  globals.mobileAttackReleased = false;
  globals.mobileDashJustPressed = false;
  globals.mobileUltJustPressed = false;
  globals.mobileEnhanceJustPressed = false;
  globals.mouse.justPressed = false;
  globals.mouse.justReleased = false;
  globals.useMobileDashAimAngle = false;
  globals.useMobileRaijinAimAngle = false;
  globals.useMobileIaijutsuAimAngle = false;

  globals.projectiles.forEach(proj => {
    if (proj.isDeflected) {
      let targetEnemy: Enemy | null = null;
      let minDistanceSq = Infinity;
      for (const e of globals.enemies) {
        if (e.state === 'dead') continue;
        const dx = e.x - proj.x;
        const dy = e.y - proj.y;
        const dSq = dx * dx + dy * dy;
        if (dSq < minDistanceSq) {
          minDistanceSq = dSq;
          targetEnemy = e;
        }
      }
      if (targetEnemy) {
        const dx = targetEnemy.x - proj.x;
        const dy = targetEnemy.y - proj.y;
        const dist = Math.sqrt(minDistanceSq) || 0.001;
        if (dist > 10) {
          const speed = globals.galeVortexActive ? 2400 : 1600;
          const targetVx = (dx / dist) * speed;
          const targetVy = (dy / dist) * speed;
          proj.vx += (targetVx - proj.vx) * 12 * dt;
          proj.vy += (targetVy - proj.vy) * 12 * dt;
          const len = Math.hypot(proj.vx, proj.vy);
          proj.vx = (proj.vx / len) * speed;
          proj.vy = (proj.vy / len) * speed;
          proj.angle = Math.atan2(proj.vy, proj.vx);
        }
      }
      if (Math.random() < 0.3) {
        globals.particles.push(Particle.acquire(proj.x, proj.y, '#ffd700', 80, 0.25, 1.5, Math.random()*Math.PI*2));
      }
    }

    proj.update(dt);
    if (proj.isEnemy) {
      const dx = globals.player.x - proj.x; const dy = globals.player.y - proj.y;
      const distSq = dx*dx + dy*dy;
      const isShieldActive = globals.selectedSkill === 'shield' && globals.enhanceActiveTimer > 0;
      const deflectDist = isShieldActive ? 140 : 100;
      if (distSq < deflectDist*deflectDist) {
        if (globals.player.state === 'dash' || isShieldActive) {
          proj.isEnemy = false;
          proj.isDeflected = true;
          proj.life = 3.0;
          
          let targetEnemy: Enemy | null = null;
          if (globals.galeVortexActive && proj.shooter && proj.shooter.state !== 'dead') {
            targetEnemy = proj.shooter;
          } else {
            let minDistanceSq = Infinity;
            for (const e of globals.enemies) {
              if (e.state === 'dead') continue;
              const edx = e.x - proj.x;
              const edy = e.y - proj.y;
              const edSq = edx * edx + edy * edy;
              if (edSq < minDistanceSq) {
                minDistanceSq = edSq;
                targetEnemy = e;
              }
            }
          }
          
          let angle = Math.atan2(-dy, -dx);
          if (targetEnemy) {
            angle = Math.atan2(targetEnemy.y - proj.y, targetEnemy.x - proj.x);
          }
          
          const deflectSpeed = globals.galeVortexActive ? 2400 : 1600;
          proj.vx = Math.cos(angle) * deflectSpeed;
          proj.vy = Math.sin(angle) * deflectSpeed;
          proj.angle = angle;
          proj.damage = (globals.playerStats.deflectedDmg || 1);
          
          playSynthesizedParry();
          globals.screenShake = 15;
          globals.shockwaves.push(new Shockwave(proj.x, proj.y, '#00ffff'));
          globals.floatingTexts.push(FloatingText.acquire(proj.x, proj.y - 40, "DEFLECT!", "#00ffff", 22));
          triggerFlowingCounterReset();
          
          const deflectSparkCount = globals.graphicsSettings === 'low' ? 4 : 12;
          for (let i = 0; i < deflectSparkCount; i++) {
            globals.particles.push(Particle.acquire(proj.x, proj.y, '#00ffff', 400, 0.4, 2 + Math.random()*2, angle + (Math.random()-0.5)*0.5));
          }
        } else if (globals.player.state !== 'dead' && globals.invulnTimer <= 0 && distSq < 80*80) {
           const dummy = new Enemy(proj.x, proj.y, globals.player);
           checkPlayerHit(dummy);
           proj.life = 0;
        }
      }
    } else {
      globals.enemies.forEach(e => {
        if (e.state === 'dead' || proj.hitEnemies.has(e)) return;
        const enemyHitRadius = (e.scaleMult - 1) * 60;
        const dx = e.x - proj.x;
        const dy = e.y - proj.y;
        let baseRadius = proj.isDeflected ? 60 : (200 * (globals.playerStats.iaijutsuRangeMult || 1.0) * 1.3);
        if (proj.isHuge) {
          baseRadius *= 1.8;
        }
        if (dx * dx + dy * dy < (baseRadius + enemyHitRadius) * (baseRadius + enemyHitRadius)) {
          if (proj.isDeflected) {
            hitEnemy(e, proj.damage || 5);
            if (typeof (e as any).addPostureDamage === 'function') {
              (e as any).addPostureDamage(35);
            }
            e.knockbackTimer = 0.45;
            e.knockbackVx = Math.cos(proj.angle) * 1900;
            e.knockbackVy = Math.sin(proj.angle) * 1900;
            e.vx = e.knockbackVx; e.vy = e.knockbackVy;
            triggerLightningExplosion(proj.x, proj.y);
            proj.life = 0;
          } else {
            hitEnemy(e, proj.damage);
            proj.hitEnemies.add(e);
            
            if (proj.enhancedType) {
              const dx = e.x - proj.x;
              const dy = e.y - proj.y;
              const pushAngle = Math.atan2(dy, dx);
              
              if (proj.enhancedType === 'dragon') {
                e.vx += Math.cos(pushAngle) * 900;
                e.vy += Math.sin(pushAngle) * 900;
                e.burnTimer = 4.0;
                for (let i = 0; i < 8; i++) {
                  globals.particles.push(Particle.acquire(e.x, e.y, '#ff4400', 200 + Math.random() * 200, 0.4, 2));
                }
              } else if (proj.enhancedType === 'shield') {
                e.vx += Math.cos(pushAngle) * 800;
                e.vy += Math.sin(pushAngle) * 800;
                e.stunTimer = Math.max(e.stunTimer || 0, 0.5);
              } else if (proj.enhancedType === 'firewheel') {
                e.burnTimer = 6.0;
                e.burnBonusDmg = (globals.playerStats.firewheelBlazeLevel || 0) + 1;
                for (let i = 0; i < 6; i++) {
                  globals.particles.push(Particle.acquire(e.x, e.y, '#ff8800', 150 + Math.random() * 150, 0.35, 2));
                }
              } else if (proj.enhancedType === 'gravity') {
                e.stunTimer = Math.max(e.stunTimer || 0, 0.4);
                e.vx -= Math.cos(pushAngle) * 300;
                e.vy -= Math.sin(pushAngle) * 300;
              } else if (proj.enhancedType === 'parry') {
                e.stunTimer = Math.max(e.stunTimer || 0, 1.5);
                e.vx += Math.cos(pushAngle) * 300;
                e.vy += Math.sin(pushAngle) * 300;
              } else if (proj.enhancedType === 'decoy') {
                globals.floatingTexts.push(FloatingText.acquire(e.x, e.y - 50, "CRIT!", "#aa66ff", 20));
              } else if (proj.enhancedType === 'shadow_awakening') {
                globals.delayedActions.push({
                  delay: 0.15,
                  run: () => {
                    if (e.state !== 'dead') {
                      hitEnemy(e, 4);
                      globals.floatingTexts.push(FloatingText.acquire(e.x, e.y - 40, "SHADOW STRIKE!", "#c084fc", 16));
                      globals.particles.push(Particle.acquire(e.x, e.y, '#aa66ff', 100, 0.3, 2));
                    }
                  }
                });
              } else if (proj.enhancedType === 'storm_god') {
                triggerStormGodLightning(e.x, e.y);
                e.stunTimer = Math.max(e.stunTimer || 0, 2.0);
              } else if (proj.enhancedType === 'zen_field') {
                e.chillTimer = 4.0;
              }
            }
          }
        }
      });
    }
  });
  inplaceFilter(globals.projectiles, p => p.life > 0, p => Projectile.release(p));

  // offscreen culling
  const cullDist = 950;
  for (let i = 0; i < globals.enemies.length; i++) {
    const e = globals.enemies[i];
    if (e.isPvpRemote) {
      e.update(dt);
      continue;
    }
    if (e.state === 'dead') {
      e.update(dt);
      continue;
    }
    const dx = e.x - globals.player.x;
    const dy = e.y - globals.player.y;
    const distSq = dx * dx + dy * dy;
    
    if (distSq > cullDist * cullDist) {
      // offscreen logic bypass
      // move directly
      const dist = Math.sqrt(distSq) || 0.001;
      let speed = 300;
      if (e.subType === 'giant') speed = 160;
      else if (e.subType === 'assassin') speed = 450;
      else if (e.subType === 'berserker') speed = 380;
      else if (e.subType === 'musketeer') speed = 200;
      
      e.x += -(dx / dist) * speed * dt;
      e.y += -(dy / dist) * speed * dt;
      e.vx = 0; e.vy = 0;
      e.stateTime += dt;
      continue;
    }
    
    // standard update
    e.update(dt);
    if (globals.selectedSkill === 'shield' && globals.enhanceActiveTimer > 0 && e.state !== 'dead') {
      const pushRadius = 140;
      const dist = Math.sqrt(distSq) || 0.001;
      if (dist < pushRadius) {
        const angle = Math.atan2(dy, dx);
        e.x = globals.player.x + Math.cos(angle) * pushRadius;
        e.y = globals.player.y + Math.sin(angle) * pushRadius;
        e.vx = Math.cos(angle) * 350;
        e.vy = Math.sin(angle) * 350;
        if (e.state === 'charge' || e.state === 'walk') {
          e.setState('idle');
        }
      }
    }
  }
  inplaceFilter(globals.enemies, e => {
    if (e.isPvpRemote || e.state !== 'dead') return true;
    const isBoss = e.subType === 'oni_boss' || e.subType === 'shogun_boss' || e.subType === 'agis_colossus' || e.subType === 'skeleton_warlord' || (e as any).isBoss;
    const maxDeadTime = isBoss ? 3.0 : 0.8;
    return e.deadTimer !== undefined && e.deadTimer < maxDeadTime;
  });
  
  for (let i = 0; i < globals.slashes.length; i++) {
    globals.slashes[i].update(realDt);
  }
  inplaceFilter(globals.slashes, s => s.life > 0, s => Slash.release(s));

  if (globals.graphicsSettings === 'low') {
    if (globals.groundScars.length > 0) globals.groundScars.length = 0;
  } else {
    for (let i = 0; i < globals.groundScars.length; i++) {
      const gs = globals.groundScars[i];
      if (gs && typeof gs.update === 'function') {
        gs.update(realDt);
      }
    }
    inplaceFilter(globals.groundScars, s => s && s.life > 0);
  }

  let particleWriteIndex = 0;
  for (let i = 0; i < globals.particles.length; i++) {
    const p = globals.particles[i];
    p.update(realDt);
    if (p.life > 0) {
      globals.particles[particleWriteIndex++] = p;
    } else {
      Particle.release(p);
    }
  }
  const maxParticles = globals.graphicsSettings === 'low' ? 15 : (isMobile ? 40 : 85);
  if (particleWriteIndex > maxParticles) {
    const toReleaseCount = particleWriteIndex - maxParticles;
    for (let i = 0; i < toReleaseCount; i++) {
      Particle.release(globals.particles[i]);
    }
    for (let i = 0; i < maxParticles; i++) {
      globals.particles[i] = globals.particles[i + toReleaseCount];
    }
    particleWriteIndex = maxParticles;
  }
  globals.particles.length = particleWriteIndex;

  let afterimageWriteIndex = 0;
  for (let i = 0; i < globals.afterimages.length; i++) {
    const a = globals.afterimages[i];
    a.update(realDt);
    if (a.life > 0) {
      globals.afterimages[afterimageWriteIndex++] = a;
    } else {
      Afterimage.release(a);
    }
  }
  const maxAfterimages = globals.graphicsSettings === 'low' ? 6 : (isMobile ? 14 : 24);
  if (afterimageWriteIndex > maxAfterimages) {
    const toReleaseCount = afterimageWriteIndex - maxAfterimages;
    for (let i = 0; i < toReleaseCount; i++) {
      Afterimage.release(globals.afterimages[i]);
    }
    for (let i = 0; i < maxAfterimages; i++) {
      globals.afterimages[i] = globals.afterimages[i + toReleaseCount];
    }
    afterimageWriteIndex = maxAfterimages;
  }
  globals.afterimages.length = afterimageWriteIndex;

  const maxShockwaves = globals.graphicsSettings === 'low' ? 1 : (isMobile ? 2 : 3);
  if (globals.shockwaves.length > maxShockwaves) {
    globals.shockwaves.splice(0, globals.shockwaves.length - maxShockwaves);
  }
  for (let i = 0; i < globals.shockwaves.length; i++) {
    globals.shockwaves[i].update(realDt);
  }
  inplaceFilter(globals.shockwaves, s => s.life > 0);

  let floatingTextWriteIndex = 0;
  for (let i = 0; i < globals.floatingTexts.length; i++) {
    const f = globals.floatingTexts[i];
    f.update(realDt);
    if (f.life > 0) {
      globals.floatingTexts[floatingTextWriteIndex++] = f;
    } else {
      FloatingText.release(f);
    }
  }
  globals.floatingTexts.length = floatingTextWriteIndex;

  for (let i = 0; i < globals.delayedActions.length; i++) {
    const a = globals.delayedActions[i];
    a.delay -= realDt;
    if (a.delay <= 0) {
      a.run();
    }
  }
  inplaceFilter(globals.delayedActions, a => a.delay > 0);

  const camDx = globals.player.x - globals.camera.x;
  const camDy = globals.player.y - globals.camera.y;
  const camDist = Math.sqrt(camDx * camDx + camDy * camDy);
  const followSpeed = 5 + Math.min(30, camDist / 10);
  const step = Math.min(1.0, followSpeed * realDt);
  globals.camera.x += camDx * step;
  globals.camera.y += camDy * step;
  if (globals.screenShake > 0) {
    if (globals.screenShake > 45) globals.screenShake = 45;
    let shakeMult = globals.graphicsSettings === 'low' ? 0.12 : 0.4;
    if (globals.screenShakeEnabled === 'reduced') {
      shakeMult *= 0.35;
    } else if (globals.screenShakeEnabled === 'off') {
      shakeMult = 0;
    }
    globals.camera.x += (Math.random() - 0.5) * globals.screenShake * shakeMult;
    globals.camera.y += (Math.random() - 0.5) * globals.screenShake * shakeMult;
    globals.screenShake *= Math.pow(0.0001, realDt / 0.15);
    if (globals.screenShake < 0.5) globals.screenShake = 0;
  }

  uiUpdateAccumulator += realDt;
  if (uiUpdateAccumulator >= 0.033) {
    uiUpdateAccumulator = 0;
    callbacks.updateUI?.();
  }
}

let loopAnimId: number | null = null;
let isLoopActive = false;

function loop(time: number) {
  try {
    const dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;
    update(dt);
    draw();
  } catch (err) {
    console.error("Critical error inside game loop:", err);
  } finally {
    loopAnimId = requestAnimationFrame(loop);
    isLoopActive = true;
  }
}

export function startOrResumeGameLoop() {
  if (!isLoopActive || loopAnimId === null) {
    isLoopActive = true;
    lastTime = performance.now();
    loopAnimId = requestAnimationFrame(loop);
  }
}

loopAnimId = requestAnimationFrame(loop);
isLoopActive = true;

function triggerLightningExplosion(x: number, y: number) {
  playSynthesizedThunder();
  globals.shockwaves.push(new Shockwave(x, y, '#ffd700'));
  
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 250 + Math.random() * 250;
    globals.particles.push(Particle.acquire(x, y, '#ffd700', speed, 0.35, 2.5 + Math.random()*2, angle));
  }

  globals.enemies.forEach(e => {
    if (e.state === 'dead') return;
    const dx = e.x - x;
    const dy = e.y - y;
    const dist = Math.hypot(dx, dy);
    if (dist <= 160) {
      hitEnemy(e, (globals.playerStats.deflectedDmg || 1) + 2);
      e.stunTimer = Math.max(e.stunTimer || 0, 0.5);
    }
  });
}

function triggerElementalExplosion(x: number, y: number, wasChilled: boolean, wasBurning: boolean) {
  playSynthesizedThunder();
  globals.screenShake = Math.max(globals.screenShake, 25);
  
  const color = wasChilled && wasBurning ? '#ff88ff' : (wasChilled ? '#00ffff' : '#ff4400');
  globals.shockwaves.push(new Shockwave(x, y, color));
  
  for (let i = 0; i < 15; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 200 + Math.random() * 300;
    const pColor = Math.random() > 0.5 ? '#ffaa00' : '#00ffff';
    globals.particles.push(Particle.acquire(x, y, pColor, speed, 0.45, 3 + Math.random()*2, angle));
  }

  globals.enemies.forEach(other => {
    if (other.state === 'dead') return;
    const dist = Math.hypot(other.x - x, other.y - y);
    if (dist <= 220) {
      hitEnemy(other, 5);
    }
  });
}

function updateRematchStatusText() {
  const statusEl = document.getElementById('pvp-rematch-status');
  if (!statusEl) return;
  
  const readyCount = (localRematchReady ? 1 : 0) + (remoteRematchReady ? 1 : 0);
  statusEl.innerText = t('pvpRematchStatus').replace('{count}', readyCount.toString());
  
  const rematchBtn = document.getElementById('pvp-rematch-btn');
  if (rematchBtn) {
    if (localRematchReady) {
      rematchBtn.innerText = t('pvpRematchBtnReady');
      rematchBtn.style.borderColor = '#10b981';
      rematchBtn.setAttribute('disabled', 'true');
    } else {
      rematchBtn.innerText = t('pvpRematchBtn');
      rematchBtn.style.borderColor = '#10b981';
      rematchBtn.removeAttribute('disabled');
    }
  }
}

function triggerLightningWarning(target: 'left' | 'right') {
  globals.pvpStormWarningTarget = target;
  globals.pvpStormWarningTimer = 1.0;
  playSynthesizedCharge();
}

function checkAndStartRematch() {
  if (localRematchReady && remoteRematchReady) {
    const gameOverScreen = document.getElementById('pvp-game-over-screen');
    if (gameOverScreen) gameOverScreen.style.display = 'none';

    localRematchReady = false;
    remoteRematchReady = false;

    if (pvpManager.role === 'host') {
      if (pvpManager.subMode === 'insane_survival') {
        globals.p1Kills = 0;
        globals.p2Kills = 0;
        globals.timeModeTimeRemaining = 180;
        globals.lives = 5;
        globals.maxLives = 5;
        pvpManager.p1Lives = 5;
        pvpManager.p2Lives = 5;
        pvpManager.matchState = 'banner';

        pvpManager.send({
          type: 'sync_game_state',
          state: 'banner',
          p1Lives: 5,
          p2Lives: 5,
          p1Kills: 0,
          p2Kills: 0,
          timeRemaining: 180,
          subMode: 'insane_survival',
          turn: pvpManager.currentTurn || 'left',
          round: pvpManager.round || 1,
          rallyCount: pvpManager.rallyCount || 0
        });
        
        startPvpRound();
      } else {
        pvpManager.p1Lives = pvpManager.subMode === 'sudden_death' ? 1 : 3;
        pvpManager.p2Lives = pvpManager.subMode === 'sudden_death' ? 1 : 3;
        pvpManager.round = 1;
        pvpManager.rallyCount = 0;
        pvpManager.roundStartTurn = pvpManager.roundStartTurn === 'left' ? 'right' : 'left';
        pvpManager.currentTurn = pvpManager.roundStartTurn;

        pvpManager.send({
          type: 'sync_game_state',
          state: 'banner',
          turn: pvpManager.currentTurn,
          p1Lives: pvpManager.p1Lives,
          p2Lives: pvpManager.p2Lives,
          round: pvpManager.round,
          rallyCount: pvpManager.rallyCount,
          subMode: pvpManager.subMode
        });
        
        startPvpRound();
      }
    }
  }
}

function setupPvpRematchListeners() {
  const rematchBtn = document.getElementById('pvp-rematch-btn');
  const quitBtn = document.getElementById('pvp-rematch-quit-btn');

  if (rematchBtn) {
    rematchBtn.addEventListener('click', () => {
      if (localRematchReady) return;
      localRematchReady = true;
      pvpManager.send({ type: 'rematch_request' });
      updateRematchStatusText();
      checkAndStartRematch();
    });
  }

  if (quitBtn) {
    quitBtn.addEventListener('click', () => {
      pvpManager.disconnect();
      window.location.reload();
    });
  }
}

function showPvPEmote(playerId: 'local' | 'remote', id: number) {
  const opp = globals.enemies[0];
  const player = globals.player;
  const targetEntity = playerId === 'local' ? player : opp;
  if (!targetEntity) return;

  const phrases = [
    "Nice Parry! 👍",
    "Unbelievable! 😮",
    "Good Game! 💀",
    "Let's Duel! ⚔️"
  ];
  const text = phrases[id - 1] || "Hello!";
  
  // Format the text: [SenderName]: [EmoteText]
  const senderName = playerId === 'local' 
    ? (pvpManager.role === 'host' ? pvpManager.p1Name : pvpManager.p2Name) 
    : (pvpManager.role === 'host' ? pvpManager.p2Name : pvpManager.p1Name);
  
  const formattedText = `${senderName}: ${text}`;
  const color = playerId === 'local' ? "#00ffff" : "#ffaa00";
  
  // Display floating text bubble
  const ft = FloatingText.acquire(
    targetEntity.x,
    targetEntity.y - 120, // display higher above head
    formattedText,
    color,
    22
  );
  ft.life = 2.5;
  ft.maxLife = 2.5;
  globals.floatingTexts.push(ft);
}

// ==========================================
// IAIJUTSU DUEL PvP MODE CORE FUNCTIONS
// ==========================================

function initPvpGame() {
  // Setup remote network message handler hooks
  pvpManager.onMessageReceived = (msg) => {
    if (msg.type === 'rematch_request') {
      remoteRematchReady = true;
      updateRematchStatusText();
      checkAndStartRematch();
      return;
    }

    if (msg.type === 'lightning_strike') {
      triggerLightningWarning(msg.target);
      return;
    }

    if (msg.type === 'emote') {
      showPvPEmote('remote', msg.id);
      return;
    }

    if (msg.type === 'name_exchange') {
      updatePvpHud();
      return;
    }

    if (msg.type === 'pvp_enemy_spawn') {
      // Client spawns AI enemy mirrored from Host
      const enemy = new Enemy(msg.x, msg.y, globals.player);
      (enemy as any).id = msg.id;
      enemy.subType = msg.subType as any;
      enemy.configureSubType();
      globals.enemies.push(enemy);
      return;
    }

    if (msg.type === 'pvp_enemy_sync') {
      // Client synchronizes AI enemies from Host list
      const syncList = msg.list;
      const syncMap = new Map(syncList.map(item => [item.id, item]));
      
      // Update or kill existing AI enemies
      for (let i = globals.enemies.length - 1; i >= 0; i--) {
        const e = globals.enemies[i];
        if (e.isPvpRemote) continue; // Skip the remote player
        
        const enemyId = (e as any).id;
        if (syncMap.has(enemyId)) {
          const syncData = syncMap.get(enemyId)!;
          e.x = syncData.x;
          e.y = syncData.y;
          e.hp = syncData.hp;
          e.setState(syncData.state);
          e.dir = syncData.dir;
          syncMap.delete(enemyId); // Handled
        } else {
          // No longer in Host list, kill/remove it
          if (e.state !== 'dead') {
            e.setState('dead');
            e.deadTimer = 2.0; // trigger fade out
          }
        }
      }
      
      // Spawn any missing enemies that were in sync list but not local
      syncMap.forEach((syncData) => {
        const enemy = new Enemy(syncData.x, syncData.y, globals.player);
        (enemy as any).id = syncData.id;
        enemy.subType = (syncData as any).subType as any;
        enemy.configureSubType();
        enemy.hp = syncData.hp;
        enemy.setState(syncData.state);
        enemy.dir = syncData.dir;
        globals.enemies.push(enemy);
      });
      return;
    }

    if (msg.type === 'pvp_enemy_hit' && pvpManager.role === 'host') {
      // Host processes damage reported by Client
      const enemy = globals.enemies.find(e => (e as any).id === msg.id);
      if (enemy && enemy.state !== 'dead') {
        hitEnemy(enemy, msg.damage, true); // killedByClient = true!
      }
      return;
    }

    if (msg.type === 'pvp_lives_sync') {
      pvpManager.p1Lives = msg.p1Lives;
      pvpManager.p2Lives = msg.p2Lives;
      updatePvpHud();
      if (pvpManager.p1Lives <= 0 || pvpManager.p2Lives <= 0) {
        if (pvpManager.role === 'host') {
          handlePvpSurvivalDeathResolution(pvpManager.p1Lives <= 0 ? 'host' : 'client');
        }
      }
      return;
    }

    // 1. Round/Match starts
    if (msg.type === 'sync_game_state') {
      if (pvpManager.subMode === 'insane_survival') {
        pvpManager.matchState = msg.state;
        pvpManager.p1Lives = msg.p1Lives;
        pvpManager.p2Lives = msg.p2Lives;
        if (msg.p1Kills !== undefined) globals.p1Kills = msg.p1Kills;
        if (msg.p2Kills !== undefined) globals.p2Kills = msg.p2Kills;
        if (msg.timeRemaining !== undefined) globals.timeModeTimeRemaining = msg.timeRemaining;
        
        updatePvpHud();
        
        if (msg.state === 'game_over') {
          // Trigger local client game over
          const winnerName = pvpManager.p1Lives > pvpManager.p2Lives ? pvpManager.p1Name : 
                             (pvpManager.p2Lives > pvpManager.p1Lives ? pvpManager.p2Name : 
                             (globals.p1Kills > globals.p2Kills ? pvpManager.p1Name : pvpManager.p2Name));
          
          const winnerTitle = document.getElementById('pvp-winner-title');
          if (winnerTitle) {
            winnerTitle.innerText = t('pvpWins').replace('{name}', winnerName);
          }
          showRoundBanner(t('pvpSurvivalOver'), t('pvpWins').replace('{name}', winnerName), 3000).then(() => {
            const gameOverScreen = document.getElementById('pvp-game-over-screen');
            if (gameOverScreen) {
              gameOverScreen.style.display = 'flex';
            }
          });
        } else if (msg.state === 'banner') {
          const gameOverScreen = document.getElementById('pvp-game-over-screen');
          if (gameOverScreen) gameOverScreen.style.display = 'none';

          localRematchReady = false;
          remoteRematchReady = false;

          pvpManager.matchState = 'banner';
          startPvpRound();
        }
      } else {
        if (msg.state === 'banner') {
          // Hide rematch screen on client
          const gameOverScreen = document.getElementById('pvp-game-over-screen');
          if (gameOverScreen) gameOverScreen.style.display = 'none';

          localRematchReady = false;
          remoteRematchReady = false;

          pvpManager.matchState = 'banner';
          pvpManager.currentTurn = msg.turn;
          pvpManager.p1Lives = msg.p1Lives;
          pvpManager.p2Lives = msg.p2Lives;
          pvpManager.round = msg.round;
          pvpManager.rallyCount = msg.rallyCount;
          
          startPvpRound();
        } else if (msg.state === 'game_over') {
          pvpManager.matchState = 'game_over';
          pvpManager.p1Lives = msg.p1Lives;
          pvpManager.p2Lives = msg.p2Lives;
          
          const p1Dead = pvpManager.p1Lives <= 0;
          const winnerName = p1Dead ? pvpManager.p2Name : pvpManager.p1Name;
          
          const emoteTray = document.getElementById('pvp-emote-tray');
          if (emoteTray) emoteTray.style.display = 'none';

          // Record match results locally based on role
          const localWinner = !p1Dead ? (pvpManager.role === 'host') : (pvpManager.role === 'client');
          recordMatchResult(localWinner);

          localRematchReady = false;
          remoteRematchReady = false;

          const winnerTitle = document.getElementById('pvp-winner-title');
          if (winnerTitle) {
            winnerTitle.innerText = t('pvpWins').replace('{name}', winnerName);
          }
          updateRematchStatusText();

          showRoundBanner(t('pvpDuelOver'), t('pvpWins').replace('{name}', winnerName), 3000).then(() => {
            const gameOverScreen = document.getElementById('pvp-game-over-screen');
            if (gameOverScreen) {
              gameOverScreen.style.display = 'flex';
            }
          });
        }
      }
    }
    
    // 2. Charging states
    if (msg.type === 'charge_start') {
      if (globals.enemies[0]) {
        globals.enemies[0].setState('charge');
      }
    }
    
    if (msg.type === 'charge_cancel') {
      if (globals.enemies[0]) {
        globals.enemies[0].setState('idle');
        globals.enemies[0].chargeTimer = 0;
        
        // Spawn cancel particles for remote player
        const opp = globals.enemies[0];
        for(let i=0; i<8; i++) {
          globals.particles.push(Particle.acquire(opp.x, opp.y, '#9ca3af', 150, 0.3, 1));
        }
      }
    }
    
    // 3. Opponent released the slash
    if (msg.type === 'charge_release') {
      if (globals.enemies[0]) {
        const opp = globals.enemies[0];
        opp.setState('attack');
        playSound(sfx.slash);
        
        // Spawn the hostile shockwave moving towards us!
        const direction = globals.player.x > opp.x ? 1 : -1;
        const velocityX = direction * 900 * msg.speedMultiplier;
        
        const hostileWave = new PvPShockwave(
          opp.x,
          opp.y,
          velocityX,
          0,
          true, // hostile to us, so we must parry
          velocityX,
          pvpManager.rallyCount
        );
        globals.pvpShockwaves.push(hostileWave);
        
        updateTurnBadge();
      }
    }
    
    // 4. Opponent successfully parried
    if (msg.type === 'parry_success') {
      // Dispel the shockwave in flight (since it was our shockwave that got parried)
      globals.pvpShockwaves = globals.pvpShockwaves.filter(w => w.isHostile);
      
      if (globals.enemies[0]) {
        globals.enemies[0].setState('attack');
        playSound(sfx.slash);
        
        const opp = globals.enemies[0];
        const sparkCount = msg.isPerfect ? 25 : 10;
        for (let j = 0; j < sparkCount; j++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 250 + Math.random() * 450;
          globals.particles.push(Particle.acquire(opp.x, opp.y, '#ffd700', speed, 0.4, 2, angle));
        }
        
        globals.floatingTexts.push(FloatingText.acquire(
          opp.x,
          opp.y - 80,
          msg.isPerfect ? t('pvpPerfectParryFloating') : t('pvpParryFloating'),
          msg.isPerfect ? "neon-#ffaa00" : "#ffd700",
          msg.isPerfect ? 32 : 24
        ));
      }
      
      pvpManager.rallyCount++;
      
      // Shift turn to opponent to attack
      pvpManager.currentTurn = pvpManager.role === 'host' ? 'right' : 'left';
      updateTurnBadge();
      updatePvpHud();
    }
    
    // 5. Opponent got hit
    if (msg.type === 'hit_taken') {
      globals.pvpShockwaves = [];
      
      if (globals.enemies[0]) {
        const opp = globals.enemies[0];
        opp.setState('dead');
        playSound(sfx.dash);
        
        // Spawn premium hit visual shockwave and sparks
        globals.shockwaves.push(new Shockwave(opp.x, opp.y, '#ff3355'));
        for (let j = 0; j < 30; j++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 300 + Math.random() * 500;
          globals.particles.push(Particle.acquire(opp.x, opp.y, '#ff3355', speed, 0.5, 3, angle));
        }

        globals.floatingTexts.push(FloatingText.acquire(opp.x, opp.y - 80, t('pvpCriticalHitFloating'), "#ff3355", 30));
      }
      
      if (pvpManager.role === 'host') {
        pvpManager.p2Lives--;
      } else {
        pvpManager.p1Lives--;
      }
      
      updatePvpHud();
      handlePvpRoundResolution();
    }
  };

  callbacks.triggerPvPEmote = (id: number) => {
    if (globals.gameMode !== 'pvp' || pvpManager.matchState !== 'playing') return;
    pvpManager.send({ type: 'emote', id });
    showPvPEmote('local', id);
  };

  // Bind Mobile emote buttons click listeners
  document.querySelectorAll('.pvp-emote-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const emoteIdAttr = (btn as HTMLElement).getAttribute('data-emote');
      if (emoteIdAttr) {
        const id = parseInt(emoteIdAttr, 10);
        callbacks.triggerPvPEmote(id);
      }
    });
  });

  // Start initial round
  startPvpRound();
}

async function startPvpRound() {
  pvpManager.matchState = 'banner';
  globals.pvpShockwaves = [];
  globals.lightningBeams = [];
  globals.pvpStormWarningTarget = null;
  globals.pvpStormWarningTimer = 0;

  if (pvpManager.subMode === 'insane_survival') {
    globals.p1Kills = 0;
    globals.p2Kills = 0;
    globals.timeModeTimeRemaining = 180;
    globals.lives = 5;
    globals.maxLives = 5;
    globals.difficulty = 'insane';
    
    // Clear all enemies, keep only remote opponent
    const remoteOpponent = globals.enemies.find(e => e.isPvpRemote);
    if (remoteOpponent) {
      remoteOpponent.setState('idle');
      globals.enemies = [remoteOpponent];
    } else {
      const opp = new Player();
      opp.isPvpRemote = true;
      globals.enemies = [opp];
    }
  }
  
  // Show mobile emote tray
  const emoteTray = document.getElementById('pvp-emote-tray');
  if (emoteTray) {
    emoteTray.style.display = 'flex';
  }
  
  if (pvpManager.subMode === 'storm_god') {
    stormLightningTimer = 3.0 + Math.random() * 4.0;
  }
  
  // Reset local player stance, timer and parry cooldowns
  globals.player.setState('idle');
  globals.player.chargeTimer = 0;
  globals.player.pvpParryActiveTimer = 0;
  globals.player.pvpParryCooldownTimer = 0;
  
  const opp = globals.enemies[0];
  if (opp) {
    opp.setState('idle');
    opp.chargeTimer = 0;
  }
  
  updatePvpHud();
  
  // Make sure game over is hidden
  document.getElementById('game-over')!.style.display = 'none';

  // Clear stuck inputs on round start
  globals.mouse.justPressed = false;
  globals.mouse.justReleased = false;
  globals.mobileAttackJustPressed = false;
  globals.mobileAttackReleased = false;
  globals.mobileParryJustPressed = false;
  globals.mobileDashJustPressed = false;

  await showRoundBanner(`${t('pvpRound')} ${pvpManager.round}`, t('pvpReadyBanner'), 1500);
  
  pvpManager.matchState = 'playing';
  updateTurnBadge();
}

function handlePvpRoundResolution() {
  pvpManager.matchState = 'round_end';
  globals.pvpShockwaves = [];

  if (pvpManager.role === 'client') return; // Client awaits Host authority via sync_game_state

  setTimeout(async () => {
    const p1Dead = pvpManager.p1Lives <= 0;
    const p2Dead = pvpManager.p2Lives <= 0;
    
    if (p1Dead || p2Dead) {
      pvpManager.matchState = 'game_over';
      const winnerName = p1Dead ? pvpManager.p2Name : pvpManager.p1Name;
      
      if (pvpManager.role === 'host') {
        pvpManager.send({
          type: 'sync_game_state',
          state: 'game_over',
          p1Lives: pvpManager.p1Lives,
          p2Lives: pvpManager.p2Lives,
          round: pvpManager.round,
          rallyCount: pvpManager.rallyCount,
          subMode: pvpManager.subMode,
          turn: pvpManager.currentTurn
        });
      }
      
      // Hide mobile emote tray on game over
      const emoteTray = document.getElementById('pvp-emote-tray');
      if (emoteTray) emoteTray.style.display = 'none';

      // Record match results locally
      if (pvpManager.role === 'host') {
        recordMatchResult(!p1Dead);
      } else {
        recordMatchResult(!p2Dead);
      }
      
      // Reset local/remote rematch flags
      localRematchReady = false;
      remoteRematchReady = false;

      // Update rematch screen winner name
      const winnerTitle = document.getElementById('pvp-winner-title');
      if (winnerTitle) {
        winnerTitle.innerText = t('pvpWins').replace('{name}', winnerName);
      }
      updateRematchStatusText();

      // Show banner first
      await showRoundBanner(t('pvpDuelOver'), t('pvpWins').replace('{name}', winnerName), 3000);

      // Show rematch screen overlay
      const gameOverScreen = document.getElementById('pvp-game-over-screen');
      if (gameOverScreen) {
        gameOverScreen.style.display = 'flex';
      }
    } else {
      pvpManager.round++;
      pvpManager.rallyCount = 0;
      
      // Toggle starting turn strictly alternating
      pvpManager.roundStartTurn = pvpManager.roundStartTurn === 'left' ? 'right' : 'left';
      pvpManager.currentTurn = pvpManager.roundStartTurn;
      
      if (pvpManager.role === 'host') {
        pvpManager.send({
          type: 'sync_game_state',
          state: 'banner',
          turn: pvpManager.currentTurn,
          p1Lives: pvpManager.p1Lives,
          p2Lives: pvpManager.p2Lives,
          round: pvpManager.round,
          rallyCount: pvpManager.rallyCount,
          subMode: pvpManager.subMode
        });
      }
      
      startPvpRound();
    }
  }, 2000);
}

function handlePvpCombatInput(dt: number, isAttackPressed: boolean, isAttackReleased: boolean, isParryPressed: boolean) {
  const isMyTurn = (pvpManager.currentTurn === 'left' && pvpManager.role === 'host') || 
                   (pvpManager.currentTurn === 'right' && pvpManager.role === 'client');

  const player = globals.player;
  const opponent = globals.enemies[0];

  if (player.state === 'dead' || pvpManager.matchState !== 'playing') return;

  const hasHostileShockwave = globals.pvpShockwaves.some(w => w.isHostile);
  const hasFriendlyShockwave = globals.pvpShockwaves.some(w => !w.isHostile);

  if (hasHostileShockwave || !isMyTurn) {
    // Defense Mode: Parry (supports Attack buttons OR dedicated Parry keys/buttons)
    if (isAttackPressed || isParryPressed) {
      if (player.pvpParryCooldownTimer <= 0 && player.pvpParryActiveTimer <= 0) {
        player.setState('charge'); // Parry Stance
        player.pvpParryActiveTimer = 0.25; // 250ms active parry frames
        playSound(sfx.dash, 0.01);
      }
    }
  } else {
    // Attack Mode: Charge and Attack (only if no friendly shockwave in flight)
    if (!hasFriendlyShockwave) {
      const isAttackHeld = globals.mouse.down || globals.mobileAttackDown;

      // 1. Feint charge check (Spacebar or Dash key cancel)
      const isFeintPressed = globals.keys[globals.keyMaps.dash] || globals.mobileDashJustPressed;
      if (isFeintPressed && player.state === 'charge') {
        globals.mobileDashJustPressed = false;
        player.setState('idle');
        player.chargeTimer = 0;
        playSound(sfx.dash, 0.015);
        pvpManager.send({ type: 'charge_cancel' });
        
        for(let i=0; i<8; i++) {
          globals.particles.push(Particle.acquire(player.x, player.y, '#9ca3af', 150, 0.3, 1));
        }
        return;
      }

      // 2. Charging Logic
      if (isAttackHeld && player.pvpParryCooldownTimer <= 0) {
        player.chargeTimer += dt;
        if (player.state !== 'charge' && player.chargeTimer > 0.2) {
          player.setState('charge');
          pvpManager.send({ type: 'charge_start' });
        }
      } else {
        if (player.state !== 'charge') {
          player.chargeTimer = 0;
        }
      }

      // 3. Attack Release Logic
      if (isAttackReleased && player.state === 'charge') {
        const chargeDuration = player.chargeTimer;
        player.setState('attack');
        playSound(sfx.slash);
        
        let speedMult = 1.0;
        if (chargeDuration >= 1.5) {
          speedMult = 1.4; // Delayed Heavy
        } else if (chargeDuration >= 0.7) {
          speedMult = 1.25; // Charged
        } else {
          speedMult = 0.85; // Light/Quick
        }
        
        let baseMult = 1.0;
        let scaleFactor = 0.15;
        if (pvpManager.subMode === 'sudden_death') {
          baseMult = 1.4;
          scaleFactor = 0.2;
        } else if (pvpManager.subMode === 'hyper_speed') {
          baseMult = 1.0;
          scaleFactor = 0.35;
        }
        const totalSpeedMult = speedMult * (baseMult + pvpManager.rallyCount * scaleFactor);
        
        const direction = opponent.x > player.x ? 1 : -1;
        const velocityX = direction * 900 * totalSpeedMult;
        
        const wave = new PvPShockwave(
          player.x,
          player.y,
          velocityX,
          0,
          false,
          velocityX,
          pvpManager.rallyCount
        );
        globals.pvpShockwaves.push(wave);
        
        pvpManager.send({
          type: 'charge_release',
          duration: chargeDuration,
          speedMultiplier: totalSpeedMult,
          isInstant: false
        });
        
        player.chargeTimer = 0;
        
        updateTurnBadge();
      }
    }
  }
}

let enemySyncTick = 0;

function broadcastSurvivalState() {
  if (pvpManager.role === 'host') {
    pvpManager.send({
      type: 'pvp_lives_sync',
      p1Lives: pvpManager.p1Lives,
      p2Lives: pvpManager.p2Lives
    });
    pvpManager.send({
      type: 'sync_game_state',
      state: pvpManager.matchState,
      turn: pvpManager.currentTurn,
      p1Lives: pvpManager.p1Lives,
      p2Lives: pvpManager.p2Lives,
      round: pvpManager.round,
      rallyCount: pvpManager.rallyCount,
      subMode: pvpManager.subMode,
      p1Kills: globals.p1Kills,
      p2Kills: globals.p2Kills,
      timeRemaining: globals.timeModeTimeRemaining
    });
  }
}

function handlePvpSurvivalDeathResolution(deadPlayer: 'host' | 'client') {
  pvpManager.matchState = 'round_end';
  
  if (deadPlayer === 'host') {
    pvpManager.p1Lives = 0;
  } else {
    pvpManager.p2Lives = 0;
  }
  
  broadcastSurvivalState();
  updatePvpHud();
  
  setTimeout(async () => {
    pvpManager.matchState = 'game_over';
    broadcastSurvivalState();
    
    const winnerName = deadPlayer === 'host' ? pvpManager.p2Name : pvpManager.p1Name;
    const emoteTray = document.getElementById('pvp-emote-tray');
    if (emoteTray) emoteTray.style.display = 'none';
    
    if (pvpManager.role === 'host') {
      recordMatchResult(deadPlayer === 'client');
    } else {
      recordMatchResult(deadPlayer === 'host');
    }
    
    localRematchReady = false;
    remoteRematchReady = false;
    
    const winnerTitle = document.getElementById('pvp-winner-title');
    if (winnerTitle) {
      winnerTitle.innerText = t('pvpWins').replace('{name}', winnerName);
    }
    updateRematchStatusText();
    
    await showRoundBanner(t('pvpSurvivalOver'), t('pvpWins').replace('{name}', winnerName), 3000);
    
    const gameOverScreen = document.getElementById('pvp-game-over-screen');
    if (gameOverScreen) {
      gameOverScreen.style.display = 'flex';
    }
  }, 1500);
}

function handlePvpSurvivalTimeoutResolution() {
  pvpManager.matchState = 'round_end';
  
  let winner: 'host' | 'client' | 'draw' = 'draw';
  if (pvpManager.p1Lives > pvpManager.p2Lives) {
    winner = 'host';
  } else if (pvpManager.p2Lives > pvpManager.p1Lives) {
    winner = 'client';
  } else {
    if (globals.p1Kills > globals.p2Kills) {
      winner = 'host';
    } else if (globals.p2Kills > globals.p1Kills) {
      winner = 'client';
    }
  }
  
  broadcastSurvivalState();
  updatePvpHud();
  
  setTimeout(async () => {
    pvpManager.matchState = 'game_over';
    broadcastSurvivalState();
    
    let winnerName = 'NO ONE';
    if (winner === 'host') {
      winnerName = pvpManager.p1Name;
    } else if (winner === 'client') {
      winnerName = pvpManager.p2Name;
    }
    
    const emoteTray = document.getElementById('pvp-emote-tray');
    if (emoteTray) emoteTray.style.display = 'none';
    
    if (winner !== 'draw') {
      if (pvpManager.role === 'host') {
        recordMatchResult(winner === 'host');
      } else {
        recordMatchResult(winner === 'client');
      }
    }
    
    localRematchReady = false;
    remoteRematchReady = false;
    
    const winnerTitle = document.getElementById('pvp-winner-title');
    if (winnerTitle) {
      winnerTitle.innerText = winner === 'draw' ? t('pvpDraw') : t('pvpWins').replace('{name}', winnerName);
    }
    updateRematchStatusText();
    
    await showRoundBanner(t('pvpTimeUp'), winner === 'draw' ? t('pvpDraw') : t('pvpWins').replace('{name}', winnerName), 3000);
    
    const gameOverScreen = document.getElementById('pvp-game-over-screen');
    if (gameOverScreen) {
      gameOverScreen.style.display = 'flex';
    }
  }, 1500);
}

function runPvpSurvivalStep(realDt: number) {
  if (pvpManager.matchState !== 'playing') return;

  // 1. Decrement match timer (only Host counts down authoritatively and syncs it)
  if (pvpManager.role === 'host') {
    globals.timeModeTimeRemaining -= realDt;
    if (globals.timeModeTimeRemaining <= 0) {
      globals.timeModeTimeRemaining = 0;
      handlePvpSurvivalTimeoutResolution();
      return;
    }
    
    // Broadcast survival stats and remaining time periodically
    enemySyncTick++;
    if (enemySyncTick % 3 === 0) {
      // Sync game timer and lives/scores
      pvpManager.send({
        type: 'sync_game_state',
        state: pvpManager.matchState,
        turn: pvpManager.currentTurn,
        p1Lives: pvpManager.p1Lives,
        p2Lives: pvpManager.p2Lives,
        round: pvpManager.round,
        rallyCount: pvpManager.rallyCount,
        subMode: pvpManager.subMode,
        p1Kills: globals.p1Kills,
        p2Kills: globals.p2Kills,
        timeRemaining: globals.timeModeTimeRemaining
      });

      // Sync active AI enemy positions
      const list = globals.enemies
        .filter(e => !e.isPvpRemote)
        .map(e => ({
          id: (e as any).id,
          x: e.x,
          y: e.y,
          hp: e.hp,
          state: e.state,
          dir: e.dir,
          subType: e.subType
        }));
      pvpManager.send({
        type: 'pvp_enemy_sync',
        list: list
      });
    }
  }

  // 3. Lives sync for local player
  if (pvpManager.role === 'host') {
    if (pvpManager.p1Lives !== globals.lives) {
      pvpManager.p1Lives = globals.lives;
      broadcastSurvivalState();
      if (globals.lives <= 0) {
        handlePvpSurvivalDeathResolution('host');
      }
    }
  } else {
    if (pvpManager.p2Lives !== globals.lives) {
      pvpManager.p2Lives = globals.lives;
      pvpManager.send({
        type: 'pvp_lives_sync',
        p1Lives: pvpManager.p1Lives,
        p2Lives: pvpManager.p2Lives
      });
      if (globals.lives <= 0) {
        // Report death to host
        pvpManager.send({
          type: 'pvp_lives_sync',
          p1Lives: pvpManager.p1Lives,
          p2Lives: 0
        });
      }
    }
  }
}

function runPvpStep(realDt: number) {
  // Storm God Mode Lightning Hazard Logic
  if (pvpManager.subMode === 'storm_god' && pvpManager.matchState === 'playing') {
    if (globals.pvpStormWarningTarget === null) {
      if (pvpManager.role === 'host') {
        stormLightningTimer -= realDt;
        if (stormLightningTimer <= 0) {
          const target = Math.random() < 0.5 ? 'left' : 'right';
          pvpManager.send({ type: 'lightning_strike', target: target });
          triggerLightningWarning(target);
          stormLightningTimer = 4.0 + Math.random() * 4.0;
        }
      }
    } else {
      globals.pvpStormWarningTimer -= realDt;
      if (globals.pvpStormWarningTimer <= 0) {
        const target = globals.pvpStormWarningTarget;
        const targetX = target === 'left' ? 300 : 1100;
        
        // Spawn vertical lightning hazard beam
        globals.lightningBeams.push(new LightningBeam(targetX, 350));
        playSynthesizedThunder();
        
        // Check deflection / hit on the target player
        const isTargetLocal = (target === 'left' && pvpManager.role === 'host') || 
                              (target === 'right' && pvpManager.role === 'client');
                              
        if (isTargetLocal) {
          if (globals.player.pvpParryActiveTimer > 0) {
            // Deflected!
            playSound(sfx.slash);
            for (let j = 0; j < 15; j++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = 200 + Math.random() * 400;
              globals.particles.push(Particle.acquire(targetX, 350, '#ffd700', speed, 0.4, 2, angle));
            }
            globals.floatingTexts.push(FloatingText.acquire(targetX, 270, "LIGHTNING DEFLECTED!", "#ffd700", 22));
          } else {
            // Hit! Electrocuted!
            globals.player.setState('dead');
            playSound(sfx.dash); // hurt sound
            globals.shockwaves.push(new Shockwave(targetX, 350, '#ff3355'));
            for (let j = 0; j < 30; j++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = 300 + Math.random() * 500;
              globals.particles.push(Particle.acquire(targetX, 350, '#ff3355', speed, 0.5, 3, angle));
            }
            globals.floatingTexts.push(FloatingText.acquire(targetX, 270, "ELECTROCUTED!", "#ff3355", 26));

            if (pvpManager.role === 'host') {
              pvpManager.p1Lives--;
            } else {
              pvpManager.p2Lives--;
            }

            pvpManager.send({ type: 'hit_taken', damage: 1 });
            updatePvpHud();
            handlePvpRoundResolution();
          }
        }
        
        globals.pvpStormWarningTarget = null;
      }
    }
  }

  // 1. Process local combat inputs
  const isAttackPressed = globals.mouse.justPressed || globals.mobileAttackJustPressed;
  const isAttackReleased = globals.mouse.justReleased || globals.mobileAttackReleased;
  
  // Dedicated Parry trigger: E or K or S keys, or mobile Parry button
  const isParryPressed = globals.keys['KeyE'] || globals.keys['KeyK'] || globals.keys['KeyS'] || globals.mobileParryJustPressed;
  
  handlePvpCombatInput(realDt, isAttackPressed, isAttackReleased, isParryPressed);

  // 2. Update local player and remote player
  globals.player.update(realDt);
  globals.enemies.forEach(e => e.update(realDt));

  // 3. Update PvP Shockwaves
  for (let i = 0; i < globals.pvpShockwaves.length; i++) {
    globals.pvpShockwaves[i].update(realDt);
  }
  
  // Collision detection and response
  let shockwavesActive = false;
  for (let i = globals.pvpShockwaves.length - 1; i >= 0; i--) {
    const w = globals.pvpShockwaves[i];
    if (w.life <= 0) {
      globals.pvpShockwaves.splice(i, 1);
      continue;
    }

    if (w.isHostile) {
      shockwavesActive = true;
      const player = globals.player;
      const dx = w.x - player.x;
      const dy = w.y - player.y;
      const dist = Math.hypot(dx, dy);

      if (dist < w.radius + 30) {
        // Shockwave collided with local player
        globals.pvpShockwaves.splice(i, 1);

        if (player.pvpParryActiveTimer > 0) {
          // Success Parry!
          const isPerfect = player.pvpParryActiveTimer >= 0.20; // within 50ms of activation
          player.pvpParryActiveTimer = 0;
          player.setState('attack');
          playSound(sfx.slash);
          if (isPerfect) {
            globals.invulnTimer = 2.0;
          }

          // Visuals
          globals.screenShake = isPerfect ? 35 : 20;
          globals.invertScreenTimer = isPerfect ? 0.25 : 0.1;

          // Spawn clash sparks
          const sparkCount = isPerfect ? 25 : 10;
          for (let j = 0; j < sparkCount; j++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 250 + Math.random() * 450;
            globals.particles.push(Particle.acquire(player.x, player.y, '#ffd700', speed, 0.4, 2, angle));
          }

          globals.floatingTexts.push(FloatingText.acquire(
            player.x,
            player.y - 80,
            isPerfect ? t('pvpPerfectParryFloating') : t('pvpParryFloating'),
            isPerfect ? "neon-#ffaa00" : "#ffd700",
            isPerfect ? 32 : 24
          ));

          pvpManager.rallyCount++;

          // Send success parry to opponent
          pvpManager.send({
            type: 'parry_success',
            isPerfect: isPerfect
          });

          if (isPerfect) {
            // Perfect Parry counter-attacks instantly!
            let baseMult = 1.0;
            let scaleFactor = 0.15;
            if (pvpManager.subMode === 'sudden_death') {
              baseMult = 1.4;
              scaleFactor = 0.2;
            } else if (pvpManager.subMode === 'hyper_speed') {
              baseMult = 1.0;
              scaleFactor = 0.35;
            }
            const totalSpeedMult = 1.25 * (baseMult + pvpManager.rallyCount * scaleFactor);
            const direction = player.x < 700 ? 1 : -1;
            const velocityX = direction * 900 * totalSpeedMult;

            const returnWave = new PvPShockwave(
              player.x,
              player.y,
              velocityX,
              0,
              false, // fired by us, so not hostile
              velocityX,
              pvpManager.rallyCount
            );
            globals.pvpShockwaves.push(returnWave);

            pvpManager.send({
              type: 'charge_release',
              duration: 0.8,
              speedMultiplier: totalSpeedMult,
              isInstant: true
            });
          }

          // Turn becomes local player's turn (since we parried)
          pvpManager.currentTurn = pvpManager.role === 'host' ? 'left' : 'right';
          updateTurnBadge();

          updatePvpHud();
        } else {
          // Staggered / Hit!
          player.setState('dead');
          playSound(sfx.dash); // stagger/hurt sound

          // Spawn premium hit visual shockwave and sparks
          globals.shockwaves.push(new Shockwave(player.x, player.y, '#ff3355'));
          for (let j = 0; j < 30; j++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 300 + Math.random() * 500;
            globals.particles.push(Particle.acquire(player.x, player.y, '#ff3355', speed, 0.5, 3, angle));
          }

          globals.floatingTexts.push(FloatingText.acquire(player.x, player.y - 80, t('pvpCriticalHitFloating'), "#ff3355", 30));

          if (pvpManager.role === 'host') {
            pvpManager.p1Lives--;
          } else {
            pvpManager.p2Lives--;
          }

          pvpManager.send({
            type: 'hit_taken',
            damage: 1
          });

          updatePvpHud();
          handlePvpRoundResolution();
        }
      }
    }
  }

  // Set dataset flag on HUD so we can display defend badge vs wait badge
  const pvpHud = document.getElementById('pvp-hud');
  if (pvpHud) {
    pvpHud.dataset.hasShockwave = shockwavesActive ? 'true' : 'false';
    const hasFriendly = globals.pvpShockwaves.some(w => !w.isHostile);
    pvpHud.dataset.hasFriendly = hasFriendly ? 'true' : 'false';
    updateTurnBadge();
  }

  // Clear single-frame input flags at the end of the PvP step
  globals.mouse.justPressed = false;
  globals.mouse.justReleased = false;
  globals.mobileAttackJustPressed = false;
  globals.mobileAttackReleased = false;
  globals.mobileParryJustPressed = false;
  globals.mobileDashJustPressed = false;

  // 4. Update particles and other visual collections
  let shockwaveWriteIndex = 0;
  for (let i = 0; i < globals.shockwaves.length; i++) {
    const s = globals.shockwaves[i];
    s.update(realDt);
    if (s.life > 0) {
      globals.shockwaves[shockwaveWriteIndex++] = s;
    }
  }
  globals.shockwaves.length = shockwaveWriteIndex;

  if (globals.lightningBeams) {
    globals.lightningBeams.forEach(lb => lb.update(realDt));
    globals.lightningBeams = globals.lightningBeams.filter(lb => lb.life > 0);
  }

  let particleWriteIndex = 0;
  for (let i = 0; i < globals.particles.length; i++) {
    const p = globals.particles[i];
    p.update(realDt);
    if (p.life > 0) {
      globals.particles[particleWriteIndex++] = p;
    } else {
      Particle.release(p);
    }
  }
  const maxParticles = globals.graphicsSettings === 'low' ? 15 : (isMobile ? 40 : 85);
  if (particleWriteIndex > maxParticles) {
    const toReleaseCount = particleWriteIndex - maxParticles;
    for (let i = 0; i < toReleaseCount; i++) {
      Particle.release(globals.particles[i]);
    }
    for (let i = 0; i < maxParticles; i++) {
      globals.particles[i] = globals.particles[i + toReleaseCount];
    }
    particleWriteIndex = maxParticles;
  }
  globals.particles.length = particleWriteIndex;

  let afterimageWriteIndex = 0;
  for (let i = 0; i < globals.afterimages.length; i++) {
    const a = globals.afterimages[i];
    a.update(realDt);
    if (a.life > 0) {
      globals.afterimages[afterimageWriteIndex++] = a;
    } else {
      Afterimage.release(a);
    }
  }
  const maxAfterimages = globals.graphicsSettings === 'low' ? 4 : (isMobile ? 8 : 15);
  if (afterimageWriteIndex > maxAfterimages) {
    const toReleaseCount = afterimageWriteIndex - maxAfterimages;
    for (let i = 0; i < toReleaseCount; i++) {
      Afterimage.release(globals.afterimages[i]);
    }
    for (let i = 0; i < maxAfterimages; i++) {
      globals.afterimages[i] = globals.afterimages[i + toReleaseCount];
    }
    afterimageWriteIndex = maxAfterimages;
  }
  globals.afterimages.length = afterimageWriteIndex;

  let floatingTextWriteIndex = 0;
  for (let i = 0; i < globals.floatingTexts.length; i++) {
    const f = globals.floatingTexts[i];
    f.update(realDt);
    if (f.life > 0) {
      globals.floatingTexts[floatingTextWriteIndex++] = f;
    } else {
      FloatingText.release(f);
    }
  }
  globals.floatingTexts.length = floatingTextWriteIndex;

  // 5. Update Camera (static center screen)
  globals.camera.x = 700;
  globals.camera.y = 350;

  // Screen shake decay
  if (globals.screenShake > 0) {
    if (globals.screenShake > 45) globals.screenShake = 45;
    globals.camera.x += (Math.random() - 0.5) * globals.screenShake;
    globals.camera.y += (Math.random() - 0.5) * globals.screenShake;
    globals.screenShake *= Math.pow(0.0001, realDt / 0.15);
    if (globals.screenShake < 0.5) globals.screenShake = 0;
  }

  if (globals.invertScreenTimer > 0) {
    globals.invertScreenTimer -= realDt;
  }
}
