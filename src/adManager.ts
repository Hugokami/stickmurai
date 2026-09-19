import { bgmAudio, setPortalMuted, getPortalMuted, resumeAudioContext } from './audio';
import { globals } from './globals';
import { clearGameInputs } from './qol';

export interface AdCallbacks {
  onComplete: () => void;
  onFailed: (error?: string) => void;
}

export class AdManager {
  private static originalVolume: number = 0.5;
  private static wasPortalMutedBeforeAd: boolean = false;
  private static lastMidrollTime: number = 0;
  private static readonly MIDROLL_COOLDOWN_MS = 60000;
  public static isAdPlaying: boolean = false;
  public static isPokiReady: boolean = false;
  private static isGameplayActive: boolean = false;

  /**
   * Initializes Poki SDK if present on the hosting portal.
   */
  public static async init(): Promise<void> {
    if (typeof window !== 'undefined' && (window as any).PokiSDK?.init) {
      try {
        await (window as any).PokiSDK.init();
        this.isPokiReady = true;
        console.log("[AdManager] Poki SDK successfully initialized");
      } catch (err) {
        console.log("[AdManager] Poki SDK initialized with notice/adblock:", err);
        this.isPokiReady = false;
      }
    }
  }

  /**
   * Fired when initial asset loading completes (Poki lifecycle).
   */
  public static gameLoadingFinished(): void {
    if (typeof window !== 'undefined' && (window as any).PokiSDK?.gameLoadingFinished) {
      try {
        (window as any).PokiSDK.gameLoadingFinished();
        console.log("[AdManager] Poki gameLoadingFinished fired");
      } catch (e) {}
    }
  }

  /**
   * Fired when active player gameplay begins or unpauses.
   */
  public static gameplayStart(): void {
    if (this.isGameplayActive) return; // Prevent duplicate gameplayStart()
    this.isGameplayActive = true;
    if (typeof window !== 'undefined' && (window as any).PokiSDK?.gameplayStart) {
      try {
        (window as any).PokiSDK.gameplayStart();
        console.log("[AdManager] Poki gameplayStart fired");
      } catch (e) {}
    }
  }

  /**
   * Fired when gameplay halts (pause, death, gameover, stage clear, quit to menu).
   */
  public static gameplayStop(): void {
    if (!this.isGameplayActive) return; // Prevent duplicate gameplayStop()
    this.isGameplayActive = false;
    if (typeof window !== 'undefined' && (window as any).PokiSDK?.gameplayStop) {
      try {
        (window as any).PokiSDK.gameplayStop();
        console.log("[AdManager] Poki gameplayStop fired");
      } catch (e) {}
    }
  }

  /**
   * Custom game event analytics for Poki SDK (sanitizes category/what/action).
   */
  public static measure(category: string, what: string, action: string, data?: any): void {
    if (typeof window !== 'undefined' && (window as any).PokiSDK?.measure) {
      try {
        const safeCat = (category || 'game').replace(/[\/\^]/g, '_').substring(0, 32);
        const safeWhat = (what || 'event').replace(/[\/\^]/g, '_').substring(0, 32);
        const safeAction = (action || 'action').replace(/[\/\^]/g, '_').substring(0, 32);
        (window as any).PokiSDK.measure(safeCat, safeWhat, safeAction, data);
      } catch (e) {}
    }
  }

  /**
   * Displays rewarded ad via Poki SDK if present, or displays the custom premium Japanese Mock Ad overlay.
   */
  public static async showRewardedAd(type: 'revive' | 'blessing' | 'blessing-swift' | 'blessing-fortune' | 'double-reward' | string, callbacks: AdCallbacks) {
    if (typeof window !== 'undefined' && (window as any).PokiSDK?.rewardedBreak) {
      console.log(`[AdManager] Invoking Poki SDK for rewarded: ${type}`);
      this.measure('rewarded', type, 'interact');
      const poki = (window as any).PokiSDK;
      this.muteSounds();
      poki.rewardedBreak(() => {
        this.muteSounds();
      }).then((withReward: boolean) => {
        this.unmuteSounds();
        if (withReward) {
          console.log("[AdManager] Poki rewarded ad completed successfully.");
          callbacks.onComplete();
        } else {
          console.warn("[AdManager] Poki rewarded ad skipped or unavailable.");
          const isStandalone = typeof window !== 'undefined' && (window.self === window.top && !window.location.search.includes('poki'));
          if (isStandalone) {
            this.showMockAdModal(type, callbacks);
          } else {
            callbacks.onFailed("Rewarded ad skipped or unavailable");
          }
        }
      }).catch((err: any) => {
        this.unmuteSounds();
        console.warn("[AdManager] Poki rewarded ad error:", err);
        const isStandalone = typeof window !== 'undefined' && (window.self === window.top && !window.location.search.includes('poki'));
        if (isStandalone) {
          this.showMockAdModal(type, callbacks);
        } else {
          callbacks.onFailed("Rewarded ad error");
        }
      });
      return;
    }

    // Standalone fallback: Display our premium Japanese-themed Mock Ad modal
    console.log(`[AdManager] Showing Mock Ad Modal for: ${type}`);
    this.showMockAdModal(type, callbacks);
  }

  /**
   * Triggers a midgame (interstitial) ad flow.
   */
  public static async showMidrollAd(onFinished?: () => void) {
    const now = Date.now();
    if (now - this.lastMidrollTime < this.MIDROLL_COOLDOWN_MS) {
      if (onFinished) onFinished();
      return;
    }

    if (typeof window !== 'undefined' && (window as any).PokiSDK?.commercialBreak) {
      this.lastMidrollTime = now;
      console.log("[AdManager] Invoking Poki commercialBreak");
      this.measure('commercial', 'midroll', 'trigger');
      const poki = (window as any).PokiSDK;
      this.muteSounds();
      const inGameplay = typeof globals !== 'undefined' && globals.gameState === 'playing';
      let pausedByAd = false;
      if (inGameplay) {
        pausedByAd = true;
        globals.gameState = 'paused';
        this.gameplayStop();
      }

      poki.commercialBreak(() => {
        this.muteSounds();
      }).then(() => {
        this.unmuteSounds();
        if (pausedByAd) {
          globals.gameState = 'playing';
          this.gameplayStart();
        }
        if (onFinished) onFinished();
      }).catch((err: any) => {
        console.warn("[AdManager] Poki commercialBreak error:", err);
        this.unmuteSounds();
        if (pausedByAd) {
          globals.gameState = 'playing';
          this.gameplayStart();
        }
        if (onFinished) onFinished();
      });
      return;
    }

    if (onFinished) onFinished();
  }

  /**
   * Adblock detection stub.
   */
  public static async hasAdblock(): Promise<boolean> {
    return false;
  }

  /**
   * Mute game background music and Web Audio during ads.
   */
  private static muteSounds() {
    if (this.isAdPlaying) return;
    this.isAdPlaying = true;
    try {
      if (typeof document !== 'undefined' && document.pointerLockElement) {
        document.exitPointerLock();
      }
    } catch (e) {}
    try { clearGameInputs(); } catch(e) {}
    const urlMuted = typeof window !== 'undefined' && (new URLSearchParams(window.location.search).get('muteAudio') === 'true');
    this.wasPortalMutedBeforeAd = urlMuted || (typeof getPortalMuted === 'function' ? getPortalMuted() : false);
    if (bgmAudio) {
      if (bgmAudio.volume > 0) this.originalVolume = bgmAudio.volume;
      bgmAudio.volume = 0;
      bgmAudio.muted = true;
      if (!bgmAudio.paused) {
        try { bgmAudio.pause(); } catch(e) {}
      }
    }
    if (typeof setPortalMuted === 'function') {
      try { setPortalMuted(true); } catch(e) {}
    }
  }

  /**
   * Restore game background music and Web Audio after ads.
   */
  private static unmuteSounds() {
    this.isAdPlaying = false;
    try { clearGameInputs(); } catch(e) {}
    const urlMuted = typeof window !== 'undefined' && (new URLSearchParams(window.location.search).get('muteAudio') === 'true');
    const wasMuted = this.wasPortalMutedBeforeAd;
    const shouldMute = urlMuted || wasMuted;
    this.wasPortalMutedBeforeAd = false;
    if (typeof setPortalMuted === 'function') {
      try { setPortalMuted(shouldMute); } catch(e) {}
    }
    if (bgmAudio) {
      bgmAudio.muted = shouldMute;
      bgmAudio.volume = shouldMute ? 0 : (this.originalVolume > 0 ? this.originalVolume : 0.5);
      if (!shouldMute && bgmAudio.paused) {
        try { bgmAudio.play().catch(() => {}); } catch(e) {}
      }
    }
    if (!shouldMute && typeof resumeAudioContext === 'function') {
      try { resumeAudioContext(); } catch(e) {}
    }

    if (typeof window !== 'undefined' && !shouldMute) {
      const wakeAudio = () => {
        try {
          if (typeof resumeAudioContext === 'function') resumeAudioContext();
        } catch(e) {}
        window.removeEventListener('pointerdown', wakeAudio);
        window.removeEventListener('touchstart', wakeAudio);
        window.removeEventListener('keydown', wakeAudio);
      };
      window.addEventListener('pointerdown', wakeAudio, { once: true, passive: true });
      window.addEventListener('touchstart', wakeAudio, { once: true, passive: true });
      window.addEventListener('keydown', wakeAudio, { once: true, passive: true });
    }
  }

  public static describeAdError(error: any): string {
    if (!error) return 'Ad unavailable';
    if (typeof error === 'string') return error;
    return error.message || error.code || 'Ad unavailable';
  }

  /**
   * Renders and animates the traditional Japanese themed mock ad modal.
   */
  private static showMockAdModal(type: 'revive' | 'blessing' | 'blessing-swift' | 'blessing-fortune' | 'double-reward' | string, callbacks: AdCallbacks) {
    this.muteSounds();

    // Create container
    const overlay = document.createElement('div');
    overlay.className = 'ad-modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      width: 100%; height: 100%;
      background: rgba(5, 5, 8, 0.95);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: 'Noto Sans JP', 'Outfit', sans-serif;
    `;

    // Traditional washi card box
    const box = document.createElement('div');
    box.className = 'ad-modal-box';
    box.style.cssText = `
      position: relative;
      background: linear-gradient(135deg, #160404 0%, #0d0404 100%);
      border: 2px solid #d4a24e;
      border-top: 6px solid #d4a24e;
      border-radius: 0;
      clip-path: polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px);
      padding: 30px;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 20px rgba(212, 162, 78, 0.35);
      width: 90%;
      max-width: 380px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      box-sizing: border-box;
    `;

    // Header scroll brackets
    box.innerHTML = `
      <div style="position: absolute; left: -2%; right: -2%; top: -4px; height: 4px; background: #bc2c2c; border-left: 6px solid #d4af37; border-right: 6px solid #d4af37;"></div>
      <div style="position: absolute; left: -2%; right: -2%; bottom: -4px; height: 4px; background: #bc2c2c; border-left: 6px solid #d4af37; border-right: 6px solid #d4af37;"></div>
    `;

    // Title
    const title = document.createElement('h3');
    title.innerText = 'FOCUSING SPIRIT';
    title.style.cssText = `
      margin: 0;
      color: #ffd700;
      font-family: 'Shojumaru', sans-serif;
      font-size: 16px;
      letter-spacing: 2px;
      text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
    `;
    box.appendChild(title);

    // Subtitle
    const subtitle = document.createElement('div');
    subtitle.innerText = '修業中 (COMMERCIAL BREAK)';
    subtitle.style.cssText = `
      font-size: 10px;
      color: #bc2c2c;
      font-weight: 700;
      letter-spacing: 1.5px;
      border-bottom: 1px dashed rgba(212, 175, 55, 0.25);
      width: 100%;
      padding-bottom: 8px;
    `;
    box.appendChild(subtitle);

    // Radial Progress Indicator Wrapper
    const progressWrapper = document.createElement('div');
    progressWrapper.style.cssText = `
      position: relative;
      width: 80px;
      height: 80px;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 10px 0;
    `;

    progressWrapper.innerHTML = `
      <svg width="80" height="80" viewBox="0 0 80 80" style="transform: rotate(-90deg);">
        <circle cx="40" cy="40" r="34" stroke="rgba(255, 255, 255, 0.05)" stroke-width="6" fill="none" />
        <circle id="ad-progress-circle" cx="40" cy="40" r="34" stroke="#ffd700" stroke-width="6" fill="none" 
          stroke-dasharray="213.6" stroke-dashoffset="0" style="transition: stroke-dashoffset 0.1s linear;" />
      </svg>
      <div id="ad-countdown-text" style="position: absolute; font-family: 'Outfit', sans-serif; font-size: 24px; font-weight: bold; color: #fff; text-shadow: 0 0 10px rgba(255, 255, 255, 0.2);">5</div>
    `;
    box.appendChild(progressWrapper);

    // Description text
    const desc = document.createElement('p');
    desc.innerText = type === 'revive' 
      ? 'Honing blade path for honor revive...' 
      : 'Earning stance blessing for the battle...';
    desc.style.cssText = `
      margin: 0;
      font-size: 12.5px;
      color: #a0a4b8;
      line-height: 1.5;
    `;
    box.appendChild(desc);

    // Action button
    const actionBtn = document.createElement('button');
    actionBtn.innerText = 'SKIPPING IN 5s';
    actionBtn.disabled = true;
    actionBtn.style.cssText = `
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: rgba(255, 255, 255, 0.4);
      padding: 10px 20px;
      font-size: 12px;
      font-family: 'Outfit', sans-serif;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      border-radius: 2px;
      cursor: not-allowed;
      width: 100%;
      box-sizing: border-box;
      transition: all 0.3s ease;
    `;
    box.appendChild(actionBtn);

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    let secondsLeft = 5;
    const totalDuration = 5;
    const circle = overlay.querySelector('#ad-progress-circle') as SVGCircleElement;
    const countText = overlay.querySelector('#ad-countdown-text') as HTMLDivElement;
    const totalDash = 213.6;

    const interval = setInterval(() => {
      secondsLeft -= 0.1;
      const displaySeconds = Math.max(0, Math.ceil(secondsLeft));
      countText.innerText = displaySeconds.toString();

      const progressPercent = secondsLeft / totalDuration;
      const offset = totalDash * (1 - progressPercent);
      if (circle) circle.setAttribute('stroke-dashoffset', offset.toString());

      if (secondsLeft <= 0) {
        clearInterval(interval);
        
        actionBtn.disabled = false;
        actionBtn.innerText = 'CLAIM REWARD';
        actionBtn.style.cssText = `
          background: #bc2c2c;
          border: 1px solid #bc2c2c;
          color: #fff;
          padding: 10px 20px;
          font-size: 12px;
          font-family: 'Outfit', sans-serif;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          border-radius: 2px;
          cursor: pointer;
          width: 100%;
          box-sizing: border-box;
          box-shadow: 0 0 10px rgba(188, 44, 44, 0.5);
          transition: all 0.3s ease;
        `;
        actionBtn.addEventListener('click', () => {
          overlay.remove();
          this.unmuteSounds();
          callbacks.onComplete();
        });
      } else {
        actionBtn.innerText = `SKIPPING IN ${displaySeconds}s`;
      }
    }, 100);
  }
}
