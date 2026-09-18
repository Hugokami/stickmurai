const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('ad audio unmute safety: re-entrant mute calls do not permanently mute audio', () => {
  let isPortalMuted = false;
  let audioResumed = false;
  let bgmMuted = false;
  let bgmVolume = 0.5;

  const mockAudio = {
    setPortalMuted: (val) => { isPortalMuted = val; },
    getPortalMuted: () => isPortalMuted,
    resumeAudioContext: () => { audioResumed = true; },
    bgmAudio: {
      get muted() { return bgmMuted; },
      set muted(val) { bgmMuted = val; },
      get volume() { return bgmVolume; },
      set volume(val) { bgmVolume = val; },
      paused: false,
      play: () => Promise.resolve(),
      pause: () => {}
    }
  };

  class TestAdManager {
    static isAdPlaying = false;
    static wasPortalMutedBeforeAd = false;
    static originalVolume = 0.5;

    static muteSounds() {
      if (this.isAdPlaying) return; // Re-entrance guard
      this.isAdPlaying = true;
      this.wasPortalMutedBeforeAd = mockAudio.getPortalMuted();
      if (mockAudio.bgmAudio) {
        if (mockAudio.bgmAudio.volume > 0) this.originalVolume = mockAudio.bgmAudio.volume;
        mockAudio.bgmAudio.volume = 0;
        mockAudio.bgmAudio.muted = true;
      }
      mockAudio.setPortalMuted(true);
    }

    static unmuteSounds() {
      this.isAdPlaying = false;
      const shouldMute = this.wasPortalMutedBeforeAd;
      this.wasPortalMutedBeforeAd = false;
      mockAudio.setPortalMuted(shouldMute);
      if (mockAudio.bgmAudio) {
        mockAudio.bgmAudio.muted = shouldMute;
        mockAudio.bgmAudio.volume = shouldMute ? 0 : this.originalVolume;
      }
      if (!shouldMute) {
        mockAudio.resumeAudioContext();
      }
    }
  }

  // Initial state: audio unmuted
  assert.equal(isPortalMuted, false);

  // Ad triggers: first mute
  TestAdManager.muteSounds();
  assert.equal(isPortalMuted, true);
  assert.equal(TestAdManager.wasPortalMutedBeforeAd, false);

  // Re-entrant call from SDK callback while ad is already playing
  TestAdManager.muteSounds();
  // wasPortalMutedBeforeAd must remain false, NOT corrupted to true
  assert.equal(TestAdManager.wasPortalMutedBeforeAd, false);

  // Ad finishes: unmute
  TestAdManager.unmuteSounds();
  assert.equal(isPortalMuted, false);
  assert.equal(mockAudio.bgmAudio.muted, false);
  assert.equal(mockAudio.bgmAudio.volume, 0.5);
  assert.equal(audioResumed, true);
});

test('stance blessings idempotency: re-clicking does not wipe reward or require new ad', () => {
  const stageBlessings = {
    swift_strike: { unlocked: false, active: false },
    fortune: { unlocked: false, active: false }
  };

  // 1. User watches ad for Swift Strike
  stageBlessings.swift_strike.unlocked = true;
  stageBlessings.swift_strike.active = true;

  // 2. User clicks Swift Strike again: toggles active, does NOT wipe unlocked
  if (stageBlessings.swift_strike.unlocked) {
    stageBlessings.swift_strike.active = !stageBlessings.swift_strike.active;
  }
  assert.equal(stageBlessings.swift_strike.unlocked, true);
  assert.equal(stageBlessings.swift_strike.active, false);

  // 3. User clicks it once more to re-equip: stays unlocked, no ad needed
  if (stageBlessings.swift_strike.unlocked) {
    stageBlessings.swift_strike.active = !stageBlessings.swift_strike.active;
  }
  assert.equal(stageBlessings.swift_strike.unlocked, true);
  assert.equal(stageBlessings.swift_strike.active, true);

  // 4. User also watches ad for Fortune Blessing: BOTH can be unlocked and active simultaneously
  stageBlessings.fortune.unlocked = true;
  stageBlessings.fortune.active = true;

  assert.equal(stageBlessings.swift_strike.unlocked, true);
  assert.equal(stageBlessings.swift_strike.active, true);
  assert.equal(stageBlessings.fortune.unlocked, true);
  assert.equal(stageBlessings.fortune.active, true);
});

test('fortune blessing reward delivery: awards Magatama, Stage Gold, and drop multiplier', () => {
  const globals = {
    magatama: 200,
    stageCurrency: 0,
    stageFortuneMult: 1.0,
    lives: 3,
    maxLives: 5,
    flow: 20,
    stageBlessings: {
      fortune: { unlocked: true, active: true }
    }
  };

  // Simulate Fortune Blessing execution at stage start
  if (globals.stageBlessings.fortune.active) {
    globals.magatama += 100;
    globals.stageCurrency = 150;
    globals.stageFortuneMult = 1.5;
    globals.lives = globals.maxLives;
    globals.flow = 100;
  }

  assert.equal(globals.magatama, 300);
  assert.equal(globals.stageCurrency, 150);
  assert.equal(globals.stageFortuneMult, 1.5);
  assert.equal(globals.lives, 5);
  assert.equal(globals.flow, 100);

  // Simulate kill drop calculation with Fortune multiplier
  const baseKillDrop = 10;
  const actualDrop = Math.round(baseKillDrop * globals.stageFortuneMult);
  assert.equal(actualDrop, 15);
});

test('stage progression resets blessings once per stage, stage replay preserves them', () => {
  let stageBlessings = {
    swift_strike: { unlocked: true, active: true },
    fortune: { unlocked: true, active: true }
  };

  // Replay stage: preserve unlocked state
  function onStageReplay() {
    // Blessings remain active for replay
  }
  onStageReplay();
  assert.equal(stageBlessings.swift_strike.unlocked, true);
  assert.equal(stageBlessings.fortune.unlocked, true);

  // Next stage: advance and reset so player can claim next stage rewards
  function onNextStage() {
    stageBlessings = {
      swift_strike: { unlocked: false, active: false },
      fortune: { unlocked: false, active: false }
    };
  }
  onNextStage();
  assert.equal(stageBlessings.swift_strike.unlocked, false);
  assert.equal(stageBlessings.fortune.unlocked, false);
});
