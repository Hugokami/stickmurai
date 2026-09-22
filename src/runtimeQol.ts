import { globals } from './globals';
import { setPracticeStorage, safeStorage } from './storage';
import { bindQolButton, showToast } from './qol';
import { callbacks } from './callbacks';
import { TrainingDummy } from './trainingDummy';
import {
  createTutorialSession,
  processLessonEvent,
} from './tutorialCore';
import type {
  Lesson,
  TutorialSessionState,
} from './tutorialCore';

export class TrainingMetricsTracker {
  lastHit = 0;
  comboDamage = 0;
  bestComboDamage = 0;
  parries = 0;
  dodges = 0;
  lastHitTime = 0;
  samples: Array<{ time: number; dmg: number }> = [];

  recordDamage(dmg: number, now = (typeof performance !== 'undefined' ? performance.now() : Date.now())) {
    this.lastHit = dmg;
    if (now - this.lastHitTime > 2000) {
      this.comboDamage = 0;
    }
    this.comboDamage += dmg;
    this.bestComboDamage = Math.max(this.bestComboDamage, this.comboDamage);
    this.lastHitTime = now;
    this.samples.push({ time: now, dmg });
    this.pruneSamples(now);
  }

  recordParry() {
    this.parries++;
  }

  recordDodge() {
    this.dodges++;
  }

  pruneSamples(now = (typeof performance !== 'undefined' ? performance.now() : Date.now())) {
    const cutoff = now - 5000;
    while (this.samples.length > 0 && this.samples[0].time < cutoff) {
      this.samples.shift();
    }
  }

  update(now = (typeof performance !== 'undefined' ? performance.now() : Date.now())) {
    if (this.comboDamage > 0 && now - this.lastHitTime > 2000) {
      this.comboDamage = 0;
    }
    this.pruneSamples(now);
  }

  getDps(now = (typeof performance !== 'undefined' ? performance.now() : Date.now())): number {
    this.pruneSamples(now);
    if (this.samples.length === 0) return 0;
    const totalDmg = this.samples.reduce((sum, s) => sum + s.dmg, 0);
    return Math.round((totalDmg / 5) * 10) / 10;
  }

  reset() {
    this.lastHit = 0;
    this.comboDamage = 0;
    this.bestComboDamage = 0;
    this.parries = 0;
    this.dodges = 0;
    this.lastHitTime = 0;
    this.samples = [];
  }
}

let practice = false;
let isTutorial = false;
let tutorialSession: TutorialSessionState | null = null;
let tutorialEventSeq = 0;
let tutorialLaunchedFromCampaign = false;
let tutorialPlayerMovedDist = 0;
let tutorialPlayerLastX = 0;
let tutorialPlayerLastY = 0;

let returnToMenu: (() => void) | null = null;
let threatTimer = 0;
let threatRoot: HTMLElement | null = null;
let hurtCount = 0;
let hurtSources: Record<string, number> = {};

const metricsTracker = new TrainingMetricsTracker();
let lastDomUpdateTime = 0;
let lastRenderedMetricsText = '';

export const isPractice = () => practice;
export const isTutorialActive = () => isTutorial;
export const getTutorialSession = () => tutorialSession;
export function setPracticeState(val: boolean) { practice = val; }
export const getTrainingMetrics = () => metricsTracker;

export function refillDojoResources() {
  if (globals.player) {
    globals.lives = globals.maxLives || 3;
    globals.flow = globals.playerStats ? globals.playerStats.flowMax : 100;
    globals.enhanceActiveTimer = 0;
    globals.enhanceCooldown = 0;
    (globals.player as any).hyperArmorTimer = 0;
    callbacks.updateUI?.();
  }
}

export function resetDojoSandbox() {
  const dummy = globals.enemies?.find((e: any) => e?.isTrainingDummy);
  if (dummy && typeof dummy.resetDummy === 'function') {
    dummy.resetDummy();
  }
  metricsTracker.reset();
  if (globals.projectiles) globals.projectiles.length = 0;
  if (globals.slashes) globals.slashes.length = 0;
  if (globals.shockwaves) globals.shockwaves.length = 0;
  if (globals.floatingTexts) globals.floatingTexts.length = 0;
  refillDojoResources();
  lastRenderedMetricsText = '';
}

export function ensureTrainingDummy(): any {
  if (!practice || !globals.player) return null;
  if (!globals.enemies) globals.enemies = [];
  let dummy = globals.enemies.find((e: any) => e && e.isTrainingDummy);
  if (!dummy) {
    const pX = globals.player ? globals.player.x : 0;
    const pY = globals.player ? globals.player.y : 0;
    const spawnX = pX + 180;
    const spawnY = pY;
    dummy = new TrainingDummy(spawnX, spawnY, globals.player);
    globals.enemies.push(dummy);
  }
  if (globals.enemies.length > 1) {
    globals.enemies = globals.enemies.filter((e: any) => e && e.isTrainingDummy);
  }
  return dummy;
}

export function initRuntimeQol(onReturn: () => void) {
  returnToMenu = onReturn;

  // Wire training hooks in callbacks
  callbacks.onTrainingHit = (_e: any, dmg = 0, _isCrit = false) => {
    if (!practice) return;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    metricsTracker.recordDamage(dmg, now);
    if (isTutorial && tutorialSession) {
      dispatchTutorialEvent('slash', { hitDummy: true, attackId: Date.now() });
      if (tutorialSession.currentLesson === 'skill') {
        dispatchTutorialEvent('skill', { hitDummy: true, activated: true });
      }
      if (tutorialSession.currentLesson === 'iaijutsu' && ((globals.player as any)?.lastIaijutsuFullyCharged || (globals.player as any)?.lastIaijutsuChargeScale >= 0.85)) {
        dispatchTutorialEvent('iaijutsu', { fullyCharged: true, hitDummy: true });
      }
      if (tutorialSession.currentLesson === 'charge-dash') {
        const timeSinceChargeDash = now - ((globals.player as any)?.lastChargeDashTime || 0);
        if (timeSinceChargeDash <= 2500 && (globals.player as any)?.wasChargedDash) {
          dispatchTutorialEvent('charge-dash', { fromChargeDash: true, hitDummy: true });
        }
      }
      if (tutorialSession.currentLesson === 'dash-slash') {
        const timeSinceDash = now - ((globals.player as any)?.lastDashTime || 0);
        if (timeSinceDash <= 1500) {
          dispatchTutorialEvent('dash-slash', { hitDummy: true, timeSinceDashMs: Math.min(500, timeSinceDash) });
        }
      }
      if (tutorialSession.currentLesson === 'shop' && tutorialSession.shopPurchased) {
        dispatchTutorialEvent('shop', { phase: 'attack', hitDummy: true });
      }
    }
  };

  callbacks.onTrainingDummyAttack = (data: any) => {
    if (!practice) return;
    if (data.dodged) {
      metricsTracker.recordDodge();
      if (isTutorial) dispatchTutorialEvent('dodge', { perfectDodge: true, fromDummy: Boolean(data.fromDummy ?? true) });
    }
    if (data.parried) {
      metricsTracker.recordParry();
      if (isTutorial) dispatchTutorialEvent('parry', { perfectParry: true, fromDummy: Boolean(data.fromDummy ?? true) });
    }
  };

  callbacks.onTrainingAction = (action: any) => {
    if (!practice || !isTutorial) return;
    dispatchTutorialEvent(action.type, action);
  };

  // Dojo free training event
  window.addEventListener('qol-practice', (e: any) => {
    const hero = String((e as CustomEvent).detail || 'default');
    startPractice(hero);
  });

  // Guided training tutorial event
  window.addEventListener('qol-tutorial', (e: any) => {
    const fromCampaign = Boolean((e as CustomEvent).detail?.fromCampaign);
    const hero = String((e as CustomEvent).detail?.hero || 'default');
    startTutorial(hero, fromCampaign);
  });

  window.addEventListener('qol-clear-inputs', clearThreats);
}

export function startPractice(hero = 'default') {
  practice = true;
  isTutorial = false;
  tutorialSession = null;
  setPracticeStorage(true);
  globals.selectedHero = hero;
  globals.gameMode = 'classic';
  metricsTracker.reset();

  document.querySelectorAll<HTMLElement>('.overlay').forEach(el => {
    if (el.id !== 'loader-screen') el.style.display = 'none';
  });

  buildPracticeBar(hero);
  globals.gameState = 'playing';
  if (returnToMenu) returnToMenu();
}

export function startTutorial(hero = 'default', fromCampaign = false) {
  practice = true;
  isTutorial = true;
  tutorialLaunchedFromCampaign = fromCampaign;
  tutorialEventSeq = 0;
  tutorialSession = createTutorialSession(Date.now());
  tutorialPlayerMovedDist = 0;
  tutorialPlayerLastX = globals.player ? globals.player.x : 0;
  tutorialPlayerLastY = globals.player ? globals.player.y : 0;
  setPracticeStorage(true);
  globals.selectedHero = hero;
  globals.gameMode = 'classic';
  metricsTracker.reset();

  document.querySelectorAll<HTMLElement>('.overlay').forEach(el => {
    if (el.id !== 'loader-screen') el.style.display = 'none';
  });

  buildTutorialBanner();
  globals.gameState = 'playing';
  if (returnToMenu) returnToMenu();
  applyLessonSetup(tutorialSession.currentLesson as Lesson);
}

function buildPracticeBar(hero: string) {
  document.getElementById('qol-practice-bar')?.remove();
  document.getElementById('muramasa-tutorial-banner')?.remove();

  const bar = document.createElement('div');
  bar.id = 'qol-practice-bar';

  const title = document.createElement('span');
  title.className = 'qol-practice-title';
  title.textContent = `DOJO · ${hero.toUpperCase()}`;
  bar.append(title);

  const metricsDisp = document.createElement('span');
  metricsDisp.id = 'qol-practice-metrics';
  metricsDisp.textContent = 'DPS: 0 | Combo: 0 | Parries: 0 | Dodges: 0';
  bar.append(metricsDisp);

  const controls = document.createElement('div');
  controls.className = 'qol-practice-controls';

  const modeBtn = document.createElement('button');
  modeBtn.className = 'qol-btn';
  modeBtn.textContent = 'Mode: Stationary';
  bindQolButton(modeBtn, () => {
    const dummy = globals.enemies?.find((e: any) => e?.isTrainingDummy);
    if (dummy && typeof dummy.setMode === 'function') {
      const nextMode = dummy.mode === 'stationary' ? 'sparring' : 'stationary';
      dummy.setMode(nextMode);
      modeBtn.textContent = nextMode === 'stationary' ? 'Mode: Stationary' : 'Mode: Sparring';
    }
  });
  controls.append(modeBtn);

  const refillBtn = document.createElement('button');
  refillBtn.className = 'qol-btn';
  refillBtn.textContent = 'Refill';
  bindQolButton(refillBtn, () => {
    refillDojoResources();
    showToast('Resources refilled.');
  });
  controls.append(refillBtn);

  const resetBtn = document.createElement('button');
  resetBtn.className = 'qol-btn';
  resetBtn.textContent = 'Reset';
  bindQolButton(resetBtn, () => {
    resetDojoSandbox();
    showToast('Sandbox reset.');
  });
  controls.append(resetBtn);

  const exitBtn = document.createElement('button');
  exitBtn.className = 'qol-btn qol-btn-danger';
  exitBtn.textContent = 'Exit Dojo';
  bindQolButton(exitBtn, () => exitPractice());
  controls.append(exitBtn);

  bar.append(controls);
  document.body.append(bar);
}

function buildTutorialBanner() {
  document.getElementById('qol-practice-bar')?.remove();
  document.getElementById('muramasa-tutorial-banner')?.remove();

  const banner = document.createElement('div');
  banner.id = 'muramasa-tutorial-banner';

  const title = document.createElement('div');
  title.id = 'muramasa-tut-title';
  title.className = 'muramasa-tut-title';
  banner.append(title);

  const desc = document.createElement('div');
  desc.id = 'muramasa-tut-desc';
  desc.className = 'muramasa-tut-desc';
  banner.append(desc);

  const progress = document.createElement('div');
  progress.id = 'muramasa-tut-progress';
  progress.className = 'muramasa-tut-progress';
  banner.append(progress);

  const actions = document.createElement('div');
  actions.className = 'muramasa-tut-actions';

  const skipBtn = document.createElement('button');
  skipBtn.id = 'muramasa-tut-skip';
  skipBtn.className = 'qol-btn muramasa-skip-btn';
  skipBtn.textContent = 'Skip Tutorial';
  bindQolButton(skipBtn, () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('muramasa_tutorial_v2', 'skipped');
        window.localStorage.setItem('stickmurai_tutorial_completed', 'true');
      }
    } catch {}
    safeStorage.setItem('muramasa_tutorial_v2', 'skipped');
    safeStorage.setItem('stickmurai_tutorial_completed', 'true');
    exitPractice(true);
    showToast('Tutorial skipped.');
    if (tutorialLaunchedFromCampaign) {
      callbacks.advanceToNextWave?.();
    }
  });
  actions.append(skipBtn);

  const leaveBtn = document.createElement('button');
  leaveBtn.className = 'qol-btn';
  leaveBtn.textContent = 'Leave';
  bindQolButton(leaveBtn, () => {
    exitPractice(false);
  });
  actions.append(leaveBtn);

  banner.append(actions);
  document.body.append(banner);
  updateTutorialBannerUI();
}

function getLessonInfo(lesson: Lesson | 'complete') {
  switch (lesson) {
    case 'move':
      return {
        title: 'LESSON 1 / 11 · MOVEMENT',
        desc: 'Move into the golden target zone (WASD / Arrow keys / Joystick).',
      };
    case 'slash':
      return {
        title: 'LESSON 2 / 11 · BASIC SLASH',
        desc: 'Strike the training dummy with 1 basic attack (Left Click / J / Attack Button).',
      };
    case 'skill':
      return {
        title: 'LESSON 3 / 11 · HERO SKILL',
        desc: 'Activate your Hero Skill (E / Right Click / Skill Button).',
      };
    case 'awakening':
      return {
        title: 'LESSON 4 / 11 · FLOW AWAKENING',
        desc: 'Flow meter is 100% full! Activate an Awakening: [1] Hero Signature / Shadow, [2] Omnislash (or F), [3] Wrath of Storm God (or click HUD buttons).',
      };
    case 'dash':
      return {
        title: 'LESSON 5 / 11 · TACTICAL DASH',
        desc: 'Perform 1 tactical dash to evade danger (Space / Shift / Dash Button).',
      };
    case 'iaijutsu':
      return {
        title: 'LESSON 6 / 11 · IAIJUTSU CHARGE',
        desc: 'Hold attack (Left Click / J) until full blade aura, then release to strike!',
      };
    case 'dodge':
      return {
        title: 'LESSON 7 / 11 · PERFECT DODGE',
        desc: 'Dummy is attacking! Dash right before impact to execute 1 Perfect Dodge.',
      };
    case 'parry':
      return {
        title: 'LESSON 8 / 11 · PERFECT PARRY',
        desc: 'Time a basic slash right before the dummy attack lands to execute 1 Perfect Parry.',
      };
    case 'dash-slash':
      return {
        title: 'LESSON 9 / 11 · DASH-SLASH COMBO',
        desc: 'Dash towards the dummy and slash immediately within 0.6s.',
      };
    case 'charge-dash':
      return {
        title: 'LESSON 10 / 11 · CHARGED DASH THRUST',
        desc: 'Hold attack to charge, then tap Dash to perform a high-speed Charged Thrust!',
      };
    case 'shop':
      return {
        title: 'LESSON 11 / 11 · MERCHANT UPGRADE',
        desc: 'Open the shop and purchase 1 upgrade using your starting gold.',
      };
    case 'complete':
      return {
        title: 'ONBOARDING COMPLETE! ⚔️',
        desc: 'You have mastered the foundational arts of MURAMASA.',
      };
  }
}

function applyLessonSetup(lesson: Lesson) {
  const dummy = globals.enemies?.find((e: any) => e?.isTrainingDummy);
  if (dummy && typeof dummy.resetDummy === 'function') {
    dummy.resetDummy();
  }

  if (lesson === 'dodge' || lesson === 'parry') {
    if (dummy && typeof dummy.setMode === 'function') {
      dummy.setMode('sparring');
      dummy.sparringCadenceTimer = 0.5;
    }
    globals.lastMikiriStrideTime = 0;
  } else {
    if (dummy && typeof dummy.setMode === 'function') dummy.setMode('stationary');
  }

  if (lesson === 'skill') {
    globals.enhanceCooldown = 0;
    if (globals.player) (globals.player as any).skillCooldown = 0;
    callbacks.updateUI?.();
  } else if (lesson === 'awakening') {
    globals.flow = globals.playerStats?.flowMax ?? 450;
    globals.ultCooldown = 0;
    globals.flowState = 'normal';
    callbacks.updateUI?.();
  } else if (lesson === 'dash' || lesson === 'charge-dash' || lesson === 'dash-slash') {
    if (globals.player) (globals.player as any).dashCooldown = 0;
    callbacks.updateUI?.();
  } else if (lesson === 'shop') {
    // Open tutorial shop with deterministic powerup
    globals.stageCurrency = 50;
    callbacks.openTutorialShop?.();
  }
}

function updateTutorialBannerUI() {
  if (!tutorialSession) return;
  const info = getLessonInfo(tutorialSession.currentLesson);
  const titleEl = document.getElementById('muramasa-tut-title');
  const descEl = document.getElementById('muramasa-tut-desc');
  const progEl = document.getElementById('muramasa-tut-progress');

  if (titleEl) titleEl.textContent = info.title;
  if (descEl) descEl.textContent = info.desc;

  if (progEl) {
    let progressText = '';
    switch (tutorialSession.currentLesson) {
      case 'move':
        progressText = `Objective: Reach target zone (${tutorialPlayerMovedDist >= 60 ? 1 : 0} / 1)`;
        break;
      case 'slash':
        progressText = `Objective: Strike dummy with basic slash (${Math.min(1, tutorialSession.slashHits)} / 1)`;
        break;
      case 'skill':
        progressText = `Objective: Activate Hero Skill (0 / 1)`;
        break;
      case 'awakening':
        progressText = `Objective: Activate any Flow Awakening [1, 2, 3] (0 / 1)`;
        break;
      case 'dash':
        progressText = `Objective: Execute tactical dash (${Math.min(1, tutorialSession.dashCount)} / 1)`;
        break;
      case 'iaijutsu':
        progressText = `Objective: Execute fully charged strike (0 / 1)`;
        break;
      case 'dodge':
        progressText = `Objective: Execute Perfect Dodge (${Math.min(1, tutorialSession.dodgeSuccesses)} / 1)`;
        break;
      case 'parry':
        progressText = `Objective: Execute Perfect Parry (${Math.min(1, tutorialSession.parrySuccesses)} / 1)`;
        break;
      case 'dash-slash':
        progressText = `Objective: Execute Dash-Slash combo (0 / 1)`;
        break;
      case 'charge-dash':
        progressText = `Objective: Execute Charged Dash thrust (0 / 1)`;
        break;
      case 'shop':
        progressText = tutorialSession.shopPurchased
          ? `Objective: Strike dummy to complete training (0 / 1)`
          : `Objective: Purchase 1 upgrade in shop (0 / 1)`;
        break;
      case 'complete':
        progressText = 'All objectives completed! Click Leave or Return to Menu.';
        break;
    }
    progEl.textContent = progressText;
  }
}

function dispatchTutorialEvent(type: Lesson, payload: any = {}) {
  if (!tutorialSession || tutorialSession.currentLesson === 'complete') return;
  tutorialEventSeq++;
  const event = {
    sessionId: tutorialSession.sessionId,
    seq: tutorialEventSeq,
    type,
    ...payload,
  };

  const prevLesson = tutorialSession.currentLesson;
  const result = processLessonEvent(tutorialSession, event);
  tutorialSession = result.session;

  if (result.advanced) {
    showToast(`Mastered: ${prevLesson.toUpperCase()}! ⚔️`);
    if (tutorialSession.currentLesson !== 'complete') {
      applyLessonSetup(tutorialSession.currentLesson as Lesson);
    } else {
      onTutorialComplete();
    }
  }
  updateTutorialBannerUI();
}

function onTutorialComplete() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('muramasa_tutorial_v2', 'completed');
      window.localStorage.setItem('stickmurai_tutorial_completed', 'true');
    }
  } catch {}
  safeStorage.setItem('muramasa_tutorial_v2', 'completed');
  safeStorage.setItem('stickmurai_tutorial_completed', 'true');
  setPracticeStorage(false);
  showToast('TUTORIAL COMPLETE! 🏆 Beginning journey...');
  setTimeout(() => {
    exitPractice(true);
    if (tutorialLaunchedFromCampaign) {
      callbacks.advanceToNextWave?.();
    } else if (returnToMenu) {
      returnToMenu();
    }
  }, 1600);
}

export function exitPractice(silent = false) {
  practice = false;
  isTutorial = false;
  tutorialSession = null;
  setPracticeStorage(false);

  // Remove persistent training dummy from globals.enemies
  if (globals.enemies) {
    globals.enemies = globals.enemies.filter((e: any) => !e?.isTrainingDummy);
  }

  document.getElementById('qol-practice-bar')?.remove();
  document.getElementById('muramasa-tutorial-banner')?.remove();
  document.getElementById('qol-practice-dummy')?.remove();
  clearThreats();
  globals.gameState = 'mainmenu';
  if (returnToMenu) returnToMenu();
  if (!silent) showToast('Training ended. No rewards or progress were saved.');
}

export function practiceStep(
  _dt = 0.016,
  now = (typeof performance !== 'undefined' ? performance.now() : Date.now())
) {
  if (!practice) return;

  ensureTrainingDummy();
  metricsTracker.update(now);

  // If in tutorial move lesson, track movement distance and proximity to target marker
  if (isTutorial && tutorialSession && tutorialSession.currentLesson === 'move' && globals.player) {
    const dx = globals.player.x - tutorialPlayerLastX;
    const dy = globals.player.y - tutorialPlayerLastY;
    const stepDist = Math.hypot(dx, dy);
    // Ignore large jumps (teleport/respawn)
    if (stepDist > 0.05 && stepDist < 40) {
      tutorialPlayerMovedDist += stepDist;
    }
    tutorialPlayerLastX = globals.player.x;
    tutorialPlayerLastY = globals.player.y;

    const dummy = globals.enemies?.find((e: any) => e?.isTrainingDummy);
    const targetX = (dummy?.startX ?? 180) - 80;
    const targetY = dummy?.startY ?? 0;
    const distToMarker = Math.hypot(globals.player.x - targetX, globals.player.y - targetY);

    if (distToMarker <= 60 && tutorialPlayerMovedDist >= 60) {
      dispatchTutorialEvent('move', { distMoved: Math.max(100, tutorialPlayerMovedDist), distToMarker: Math.min(24, distToMarker) });
    }
    updateTutorialBannerUI();
  }

  // Ensure awakening lesson maintains 100% flow until manually activated
  if (isTutorial && tutorialSession && tutorialSession.currentLesson === 'awakening') {
    const targetFlow = globals.playerStats?.flowMax ?? 450;
    if (globals.flowState === 'normal' && (globals.flow < targetFlow || globals.ultCooldown > 0)) {
      globals.flow = targetFlow;
      globals.ultCooldown = 0;
      callbacks.updateUI?.();
    }
  }

  // Dirty check metrics DOM update at 200ms throttle
  if (typeof document !== 'undefined' && now - lastDomUpdateTime >= 200) {
    lastDomUpdateTime = now;
    const metricsEl = document.getElementById('qol-practice-metrics');
    if (metricsEl) {
      const text = `DPS (5s): ${metricsTracker.getDps(now)} | Combo: ${metricsTracker.comboDamage} | Best: ${metricsTracker.bestComboDamage} | Parries: ${metricsTracker.parries} | Dodges: ${metricsTracker.dodges}`;
      if (text !== lastRenderedMetricsText) {
        metricsEl.textContent = text;
        lastRenderedMetricsText = text;
      }
    }
  }
}

export function resetRunFeedback() {
  hurtCount = 0;
  hurtSources = {};
  threatTimer = 0;
  clearThreats();
}

export function recordHurt(source: string, damage: number) {
  if (practice) return;
  hurtCount += damage;
  hurtSources[source] = (hurtSources[source] || 0) + damage;
  showThreat(source);
}

function showThreat(source: string) {
  try {
    if (!threatRoot) {
      threatRoot = document.createElement('div');
      threatRoot.id = 'qol-threats';
      document.body.append(threatRoot);
    }
    const cleanSource = String(source || 'enemy').replace(/_/g, ' ');
    const e = document.createElement('div');
    e.className = 'qol-threat';
    e.textContent = `⚠ ${cleanSource} attack`;
    threatRoot.append(e);
    while (threatRoot.children.length > 2) threatRoot.firstElementChild?.remove();
    window.setTimeout(() => {
      try {
        e.remove();
      } catch (_err) {}
    }, 1100);
  } catch (err) {
    console.error('showThreat error:', err);
  }
}

export function updateThreats(dt: number) {
  try {
    if (!threatRoot) return;
    threatTimer -= dt;
    if (threatTimer <= 0) {
      threatTimer = 0.5;
      while (threatRoot.children.length > 2) threatRoot.firstElementChild?.remove();
    }
  } catch (err) {
    console.error('updateThreats error:', err);
  }
}

export function clearThreats() {
  try {
    threatRoot?.remove();
    threatRoot = null;
  } catch (err) {
    console.error('clearThreats error:', err);
  }
}

export function showDefeatFeedback(timeLimit = false) {
  const el = document.getElementById('stats-summary');
  if (!el) return;
  el.querySelector('.combat-recap')?.remove();
  const recap = document.createElement('div');
  recap.className = 'qol-note combat-recap';
  const top = Object.entries(hurtSources).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const summary = document.createElement('p');
  summary.textContent = `${timeLimit ? 'Objective timer expired.' : 'Run ended.'} Damage taken: ${hurtCount} · Best combo: ${globals.runStats?.maxCombo || 0} · Parries: ${globals.runStats?.parries || 0}`;
  recap.append(summary);
  const sources = document.createElement('p');
  sources.textContent =
    'Damage sources: ' +
    (top.map(([name, amount]) => `${name.replaceAll('_', ' ')} (${amount})`).join(', ') ||
      'none recorded');
  recap.append(sources);
  const tip = document.createElement('p');
  tip.textContent = timeLimit
    ? 'Try prioritizing the stage objective over optional fights.'
    : top.some(([name]) => /musketeer|mage|mancer|toaster/.test(name))
    ? 'Watch diamond-marked ranged aim; dodge after the aim locks.'
    : 'Dodge the amber lunge, then attack during the boss’s recovery window.';
  recap.append(tip);
  el.prepend(recap);
}
