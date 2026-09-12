import { bgmAudio } from './audio';
import { globals } from './globals';

export interface AdCallbacks {
  onComplete: () => void;
  onFailed: (error?: string) => void;
}

export class AdManager {
  private static originalVolume: number = 0.5;

  /**
   * Triggers a rewarded ad flow.
   * Automatically detects if the game is running on a partner portal (CrazyGames/Poki) 
   * and uses their SDK. Otherwise, displays the custom premium Japanese Mock Ad overlay.
   */
  public static async showRewardedAd(type: 'revive' | 'blessing', callbacks: AdCallbacks) {
    // 1. Check for CrazyGames SDK (supports both window.CrazyGames and window.crazygames)
    const cgSdk = typeof window !== 'undefined' ? ((window as any).CrazyGames?.SDK || (window as any).crazygames?.SDK) : null;
    if (cgSdk && cgSdk.ad && typeof cgSdk.ad.requestAd === 'function') {
      console.log(`[AdManager] Invoking CrazyGames SDK for: ${type}`);

      // Ensure SDK is initialized
      try {
        if (typeof cgSdk.init === 'function') {
          await cgSdk.init().catch(() => {});
        }
      } catch(e) {}

      const inGameplay = typeof globals !== 'undefined' && globals.gameState === 'playing';
      if (inGameplay) {
        try {
          if (cgSdk.game && typeof cgSdk.game.gameplayStop === 'function') cgSdk.game.gameplayStop();
        } catch(e) {}
      }

      let adDidStart = false;

      const adCallbacks = {
        adStarted: () => {
          adDidStart = true;
          console.log("[AdManager] CrazyGames rewarded ad started.");
          this.muteSounds();
        },
        adFinished: () => {
          console.log("[AdManager] CrazyGames rewarded ad finished successfully.");
          if (adDidStart) this.unmuteSounds();
          if (inGameplay) {
            try {
              if (cgSdk.game && typeof cgSdk.game.gameplayStart === 'function') cgSdk.game.gameplayStart();
            } catch(e) {}
          }
          callbacks.onComplete();
        },
        adError: (error: any) => {
          console.warn("[AdManager] CrazyGames rewarded ad error:", error);
          if (adDidStart) this.unmuteSounds();
          if (inGameplay) {
            try {
              if (cgSdk.game && typeof cgSdk.game.gameplayStart === 'function') cgSdk.game.gameplayStart();
            } catch(e) {}
          }
          const errCode = error?.code || error?.message || error?.toString() || "CrazyGames ad failed";
          callbacks.onFailed(errCode);
        }
      };

      try {
        cgSdk.ad.requestAd("rewarded", adCallbacks);
      } catch (err: any) {
        console.warn("[AdManager] CrazyGames requestAd exception:", err);
        adCallbacks.adError(err);
      }
      return;
    }

    // 2. Check for Poki SDK
    if (typeof window !== 'undefined' && (window as any).PokiSDK) {
      console.log(`[AdManager] Invoking Poki SDK for: ${type}`);
      const poki = (window as any).PokiSDK;
      this.muteSounds();
      poki.rewardedBreak().then((withReward: boolean) => {
        this.unmuteSounds();
        if (withReward) {
          console.log("[AdManager] Poki rewarded ad completed successfully.");
          callbacks.onComplete();
        } else {
          console.warn("[AdManager] Poki rewarded ad skipped/failed.");
          callbacks.onFailed("Poki ad skipped");
        }
      }).catch((err: any) => {
        this.unmuteSounds();
        console.warn("[AdManager] Poki rewarded ad error:", err);
        callbacks.onFailed(err?.toString() || "Poki ad error");
      });
      return;
    }

    // 3. Fallback: Display our premium Japanese-themed Mock Ad modal
    console.log(`[AdManager] Showing Mock Ad Modal for: ${type}`);
    this.showMockAdModal(type, callbacks);
  }

  /**
   * Mute game background music during ads.
   */
  private static muteSounds() {
    if (bgmAudio) {
      this.originalVolume = bgmAudio.volume;
      bgmAudio.volume = 0;
    }
  }

  /**
   * Restore game background music after ads.
   */
  private static unmuteSounds() {
    if (bgmAudio) {
      bgmAudio.volume = this.originalVolume;
    }
  }

  /**
   * Renders and animates the traditional Japanese themed mock ad modal.
   */
  private static showMockAdModal(type: 'revive' | 'blessing', callbacks: AdCallbacks) {
    this.muteSounds();

    // Create container
    const overlay = document.createElement('div');
    overlay.className = 'ad-modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      width: 100%; height: 100%;
      background: rgba(5, 5, 8, 0.9);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
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
      border: 2px solid #bc2c2c;
      border-top: 8px solid #bc2c2c;
      border-radius: 4px;
      padding: 30px;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 15px rgba(188, 44, 44, 0.3), inset 0 0 0 1.5px #d4af37;
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

    // Subtitle / Ad Partner notice
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

    // Glowing circle SVG
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

    // Animation & Countdown logic (5 seconds mock duration)
    let secondsLeft = 5;
    const totalDuration = 5;
    const circle = overlay.querySelector('#ad-progress-circle') as SVGCircleElement;
    const countText = overlay.querySelector('#ad-countdown-text') as HTMLDivElement;
    const totalDash = 213.6; // 2 * PI * r (2 * 3.14159 * 34)

    const interval = setInterval(() => {
      secondsLeft -= 0.1;
      const displaySeconds = Math.max(0, Math.ceil(secondsLeft));
      countText.innerText = displaySeconds.toString();

      // Update progress stroke offset
      const progressPercent = secondsLeft / totalDuration;
      const offset = totalDash * (1 - progressPercent);
      if (circle) circle.setAttribute('stroke-dashoffset', offset.toString());

      if (secondsLeft <= 0) {
        clearInterval(interval);
        
        // Unlock button
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
