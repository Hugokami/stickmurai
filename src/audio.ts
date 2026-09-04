export const bgmAudio = new Audio();
export const playlist = ['audio/Bushido_Storm_Intense_Battle_Mix.m4a'];

export let currentBgmIndex = 0;
export let bgmStarted = false;

// BGM setup
try {
  bgmAudio.preload = 'auto';
  bgmAudio.loop = true;
  bgmAudio.src = playlist[currentBgmIndex];
  bgmAudio.load();
} catch (e) {
  console.warn('Failed to load initial BGM:', e);
}

export function createAudio(src: string): HTMLAudioElement {
  try {
    const audio = new Audio(src);
    audio.preload = 'auto';
    audio.load();
    return audio;
  } catch (e) {
    console.warn(`Failed to create/preload audio for src: ${src}`, e);
    // Return a safe mock element that won't throw on play / properties
    return {
      play: () => Promise.resolve(),
      pause: () => {},
      load: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      cloneNode: function() { return this; },
      volume: 1.0,
      currentTime: 0,
      paused: true,
      ended: false
    } as any;
  }
}

export const sfx = {
  dash: [
    createAudio('audio/dash.wav'),
    createAudio('audio/dash.wav'),
    createAudio('audio/dash.wav'),
    createAudio('audio/dash.wav'),
    createAudio('audio/dash.wav')
  ],
  enemySlash: [
    createAudio('audio/enemy_slash.wav'),
    createAudio('audio/enemy_slash.wav'),
    createAudio('audio/enemy_slash.wav'),
    createAudio('audio/enemy_slash.wav')
  ],
  slash: [
    createAudio('audio/slash.wav'),
    createAudio('audio/slash.wav'),
    createAudio('audio/slash.wav'),
    createAudio('audio/slash.wav'),
    createAudio('audio/slash.wav'),
    createAudio('audio/slash.wav'),
    createAudio('audio/slash.wav'),
    createAudio('audio/slash.wav')
  ],
  gameStart: [createAudio('audio/game_start.wav')],
  swordClash: [
    createAudio('audio/sfx_sword_clash.wav'),
    createAudio('audio/sfx_sword_clash.wav'),
    createAudio('audio/sfx_sword_clash.wav'),
    createAudio('audio/sfx_sword_clash.wav')
  ],
  energyBeam: [
    createAudio('audio/sfx_energy_beam.mp3'),
    createAudio('audio/sfx_energy_beam.mp3'),
    createAudio('audio/sfx_energy_beam.mp3'),
    createAudio('audio/sfx_energy_beam.mp3')
  ],
  teleport: [
    createAudio('audio/sfx_teleport.ogg'),
    createAudio('audio/sfx_teleport.ogg'),
    createAudio('audio/sfx_teleport.ogg')
  ],
  sciExplosion: [
    createAudio('audio/sfx_sci_explosion.ogg'),
    createAudio('audio/sfx_sci_explosion.ogg'),
    createAudio('audio/sfx_sci_explosion.ogg')
  ],
  affixAlert: [
    createAudio('audio/sfx_affix_alert.ogg'),
    createAudio('audio/sfx_affix_alert.ogg')
  ],
  magatamaPickup: [
    createAudio('audio/sfx_magatama_pickup.wav'),
    createAudio('audio/sfx_magatama_pickup.wav'),
    createAudio('audio/sfx_magatama_pickup.wav'),
    createAudio('audio/sfx_magatama_pickup.wav')
  ],
  shrineBlessing: [
    createAudio('audio/sfx_shrine_blessing.wav'),
    createAudio('audio/sfx_shrine_blessing.wav')
  ],
  primalZap: [
    createAudio('audio/sfx_primal_zap.wav'),
    createAudio('audio/sfx_primal_zap.wav'),
    createAudio('audio/sfx_primal_zap.wav')
  ],
  stageConquered: [
    createAudio('audio/sfx_stage_conquered.wav'),
    createAudio('audio/sfx_stage_conquered.wav')
  ]
};

const fetchedBuffers: Record<string, ArrayBuffer> = {};
const audioBuffers: Record<string, AudioBuffer> = {};

const sfxFiles = [
  'audio/dash.wav',
  'audio/enemy_slash.wav',
  'audio/slash.wav',
  'audio/game_start.wav',
  'audio/sfx_sword_clash.wav',
  'audio/sfx_energy_beam.mp3',
  'audio/sfx_teleport.ogg',
  'audio/sfx_sci_explosion.ogg',
  'audio/sfx_affix_alert.ogg',
  'audio/sfx_magatama_pickup.wav',
  'audio/sfx_shrine_blessing.wav',
  'audio/sfx_primal_zap.wav',
  'audio/sfx_stage_conquered.wav'
];

export function playSwordClash(volumeMult: number = 1.0) {
  playSound(sfx.swordClash, volumeMult);
}

export function playEnergyBeam(volumeMult: number = 1.0) {
  playSound(sfx.energyBeam, volumeMult);
}

export function playTeleportSfx(volumeMult: number = 1.0) {
  playSound(sfx.teleport, volumeMult);
}

export function playExplosionSfx(volumeMult: number = 1.0) {
  playSound(sfx.sciExplosion, volumeMult);
}

export function playAffixAlert(volumeMult: number = 1.0) {
  playSound(sfx.affixAlert, volumeMult);
}

export function playMagatamaPickup(volumeMult: number = 1.0) {
  playSound(sfx.magatamaPickup, volumeMult);
}

export function playShrineBlessing(volumeMult: number = 1.0) {
  playSound(sfx.shrineBlessing, volumeMult);
}

export function playPrimalZap(volumeMult: number = 1.0) {
  playSound(sfx.primalZap, volumeMult);
}

export function playStageConquered(volumeMult: number = 1.0) {
  playSound(sfx.stageConquered, volumeMult);
}
sfxFiles.forEach(src => {
  fetch(src)
    .then(r => r.arrayBuffer())
    .then(buf => {
      fetchedBuffers[src] = buf;
      decodeIfContextReady(src);
    })
    .catch(e => console.warn(`Failed to fetch raw buffer for ${src}:`, e));
});

function decodeIfContextReady(src: string) {
  try {
    const ctx = getAudioContext();
    const raw = fetchedBuffers[src];
    if (ctx && raw && !audioBuffers[src]) {
      ctx.decodeAudioData(raw.slice(0))
        .then(decoded => {
          audioBuffers[src] = decoded;
        })
        .catch(e => console.warn(`Failed to decode Web Audio for ${src}:`, e));
    }
  } catch (e) {}
}

export function decodeAllSfx() {
  sfxFiles.forEach(src => decodeIfContextReady(src));
}

export function playSound(pool: HTMLAudioElement[], volumeMult: number = 1.0) {
  if (pool.length > 0) {
    const firstSound = pool[0];
    const src = firstSound.getAttribute('src') || firstSound.src;
    let relativeSrc = src;
    if (src.includes('audio/')) {
      relativeSrc = 'audio/' + src.split('audio/')[1];
    }
    const buffer = audioBuffers[relativeSrc];
    if (buffer) {
      try {
        const ctx = getAudioContext();
        if (ctx) {
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          const gainNode = ctx.createGain();
          gainNode.gain.setValueAtTime(bgmAudio.volume * 0.6 * volumeMult, ctx.currentTime);
          source.connect(gainNode);
          gainNode.connect(getSoundDestination(ctx));
          source.start(0);
          return; // Success, skip HTML5 Audio playback
        }
      } catch (e) {
        console.warn(`Web Audio play failed for ${relativeSrc}, falling back:`, e);
      }
    }
  }

  let sound = pool.find(s => s.paused || s.ended);
  if (!sound && pool.length > 0) {
    const firstSound = pool[0];
    sound = firstSound.cloneNode(true) as HTMLAudioElement;
    if (pool.length < 32) {
      pool.push(sound);
    }
  }
  if (sound) {
    sound.volume = bgmAudio.volume * 0.6 * volumeMult;
    sound.currentTime = 0;
    sound.play().catch(() => {});
  }
}

let audioCtx: AudioContext | null = null;
let compressor: DynamicsCompressorNode | null = null;

export function getAudioContext(): AudioContext | null {
  if (!audioCtx) {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
        compressor = audioCtx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-24, audioCtx.currentTime);
        compressor.knee.setValueAtTime(30, audioCtx.currentTime);
        compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
        compressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
        compressor.release.setValueAtTime(0.25, audioCtx.currentTime);
        compressor.connect(audioCtx.destination);
      }
    } catch (e) {
      console.warn('Failed to initialize AudioContext:', e);
      return null;
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function getSoundDestination(ctx: AudioContext): AudioNode {
  return compressor || ctx.destination;
}

export const resumeAudioContext = () => {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
    decodeAllSfx();
  } catch (e) {}
  startBgm();
};

let lastHitTime = 0;
let lastHurtTime = 0;
let lastParryTime = 0;
let lastPerfectParryTime = 0;
let lastDodgeTime = 0;
let lastThunderTime = 0;
let lastFirewheelTime = 0;
let lastGravityTime = 0;

export function playSynthesizedHit() {
  try {
    const nowTime = performance.now();
    if (nowTime - lastHitTime < 45) return;
    lastHitTime = nowTime;

    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(getSoundDestination(ctx));

    osc.type = 'triangle';
    const now = ctx.currentTime;
    
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);
    
    gain.gain.setValueAtTime(bgmAudio.volume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    
    osc.start(now);
    osc.stop(now + 0.13);
  } catch (e) {}
}

export function playSynthesizedHurt() {
  try {
    const nowTime = performance.now();
    if (nowTime - lastHurtTime < 100) return;
    lastHurtTime = nowTime;

    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(getSoundDestination(ctx));

    osc.type = 'sawtooth';
    const now = ctx.currentTime;
    
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.linearRampToValueAtTime(30, now + 0.22);
    
    gain.gain.setValueAtTime(bgmAudio.volume * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
    
    osc.start(now);
    osc.stop(now + 0.23);
  } catch (e) {}
}

export function playSynthesizedParry() {
  try {
    const nowTime = performance.now();
    if (nowTime - lastParryTime < 50) return;
    lastParryTime = nowTime;

    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const volume = bgmAudio.volume * 0.5;
    
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1200, now);
    osc1.frequency.exponentialRampToValueAtTime(600, now + 0.25);
    gain1.gain.setValueAtTime(volume, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(getSoundDestination(ctx));
    
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now);
    osc2.frequency.exponentialRampToValueAtTime(300, now + 0.15);
    gain2.gain.setValueAtTime(volume * 0.4, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc2.connect(gain2);
    gain2.connect(getSoundDestination(ctx));
    
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.26);
    osc2.stop(now + 0.16);
  } catch (e) {}
}

export function playSynthesizedClash() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const volume = Math.max(0.001, bgmAudio.volume * 0.6);
    
    // High metal resonant ping
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(1400 + Math.random() * 200, now);
    osc1.frequency.exponentialRampToValueAtTime(300, now + 0.2);
    gain1.gain.setValueAtTime(volume, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc1.connect(gain1);
    gain1.connect(getSoundDestination(ctx));

    // Heavy sword scrape body
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(950, now);
    osc2.frequency.exponentialRampToValueAtTime(400, now + 0.15);
    gain2.gain.setValueAtTime(volume * 0.7, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc2.connect(gain2);
    gain2.connect(getSoundDestination(ctx));

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.21);
    osc2.stop(now + 0.16);
  } catch (e) {}
}

export function playSynthesizedPerfectParry() {
  try {
    const nowTime = performance.now();
    if (nowTime - lastPerfectParryTime < 100) return;
    lastPerfectParryTime = nowTime;

    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const volume = bgmAudio.volume * 0.75;
    
    // Core metallic strike
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1600, now);
    osc1.frequency.exponentialRampToValueAtTime(800, now + 0.35);
    gain1.gain.setValueAtTime(volume, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(getSoundDestination(ctx));
    
    // Resonance frequency
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1000, now);
    osc2.frequency.exponentialRampToValueAtTime(400, now + 0.2);
    gain2.gain.setValueAtTime(volume * 0.5, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc2.connect(gain2);
    gain2.connect(getSoundDestination(ctx));

    // High metal chime ring
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(3200, now);
    osc3.frequency.exponentialRampToValueAtTime(2000, now + 0.15);
    gain3.gain.setValueAtTime(volume * 0.3, now);
    gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc3.connect(gain3);
    gain3.connect(getSoundDestination(ctx));
    
    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    osc1.stop(now + 0.36);
    osc2.stop(now + 0.21);
    osc3.stop(now + 0.16);
  } catch (e) {}
}

export function playSynthesizedDodge() {
  try {
    const nowTime = performance.now();
    if (nowTime - lastDodgeTime < 100) return;
    lastDodgeTime = nowTime;

    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const volume = bgmAudio.volume * 0.4;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(1800, now + 0.2);
    
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    osc.connect(gain);
    gain.connect(getSoundDestination(ctx));
    
    osc.start(now);
    osc.stop(now + 0.21);
  } catch (e) {}
}

export function playSynthesizedEnhance() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const volume = bgmAudio.volume * 0.5;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.4);
    
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(2000, now + 0.4);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(getSoundDestination(ctx));
    
    osc.start(now);
    osc.stop(now + 0.41);
  } catch (e) {}
}

export function playSynthesizedLevelUp() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const volume = bgmAudio.volume * 0.45;
    
    const notes = [261.63, 329.63, 392.00, 523.25];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      
      gain.gain.setValueAtTime(volume, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.18);
      
      osc.connect(gain);
      gain.connect(getSoundDestination(ctx));
      
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.19);
    });
  } catch (e) {}
}

export function playSynthesizedAwaken() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const volume = bgmAudio.volume * 0.6;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.7);
    
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.7);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(getSoundDestination(ctx));
    
    osc.start(now);
    osc.stop(now + 0.71);
  } catch (e) {}
}

bgmAudio.addEventListener('ended', () => {
  currentBgmIndex = (currentBgmIndex + 1) % playlist.length;
  bgmAudio.src = playlist[currentBgmIndex];
  bgmAudio.play().catch(e => console.log('BGM play error:', e));
});

export function playSynthesizedThunder() {
  try {
    const nowTime = performance.now();
    if (nowTime - lastThunderTime < 150) return;
    lastThunderTime = nowTime;

    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const volume = bgmAudio.volume * 0.75;

    // 1. Initial sharp crack (lightning strike)
    const crackOsc = ctx.createOscillator();
    const crackGain = ctx.createGain();
    crackOsc.type = 'sawtooth';
    crackOsc.frequency.setValueAtTime(250, now);
    crackOsc.frequency.exponentialRampToValueAtTime(30, now + 0.15);

    const crackFilter = ctx.createBiquadFilter();
    crackFilter.type = 'bandpass';
    crackFilter.frequency.setValueAtTime(400, now);
    crackFilter.Q.setValueAtTime(2.0, now);

    crackGain.gain.setValueAtTime(volume * 0.8, now);
    crackGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    crackOsc.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(getSoundDestination(ctx));

    crackOsc.start(now);
    crackOsc.stop(now + 0.16);

    // 2. Deep rumble tail
    const rumbleOsc = ctx.createOscillator();
    const rumbleGain = ctx.createGain();
    rumbleOsc.type = 'triangle';
    rumbleOsc.frequency.setValueAtTime(70, now);
    rumbleOsc.frequency.linearRampToValueAtTime(35, now + 1.2);

    const rumbleFilter = ctx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.setValueAtTime(100, now);
    rumbleFilter.frequency.exponentialRampToValueAtTime(40, now + 1.2);

    rumbleGain.gain.setValueAtTime(0.01, now);
    rumbleGain.gain.linearRampToValueAtTime(volume * 0.9, now + 0.08);
    rumbleGain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

    rumbleOsc.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(getSoundDestination(ctx));

    rumbleOsc.start(now);
    rumbleOsc.stop(now + 1.21);
  } catch (e) {}
}

export function startBgm() {
  if (bgmStarted) return;
  bgmStarted = true;
  
  const bgmVolumeSlider = typeof document !== 'undefined' ? document.getElementById('bgm-volume') as HTMLInputElement : null;
  if (bgmVolumeSlider) {
    bgmAudio.volume = parseFloat(bgmVolumeSlider.value);
  } else {
    bgmAudio.volume = 0.5;
  }

  try {
    if (!bgmAudio.src) {
      bgmAudio.src = playlist[currentBgmIndex];
    }
    bgmAudio.load();
  } catch (e) {
    console.warn('Failed BGM load call:', e);
  }
  bgmAudio.play().catch(err => {
    console.warn('BGM play failed:', err);
    bgmStarted = false;
  });
}

export function pauseBgm() {
  if (bgmAudio) {
    bgmAudio.pause();
  }
  bgmStarted = false;
}

export function playSynthesizedFirewheel() {
  try {
    const nowTime = performance.now();
    if (nowTime - lastFirewheelTime < 120) return;
    lastFirewheelTime = nowTime;

    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const volume = bgmAudio.volume * 0.6;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.35);
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(150, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + 0.35);
    filter.Q.setValueAtTime(3.0, now);
    
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(getSoundDestination(ctx));
    
    osc.start(now);
    osc.stop(now + 0.46);
  } catch (e) {}
}

export function playSynthesizedGravity() {
  try {
    const nowTime = performance.now();
    if (nowTime - lastGravityTime < 120) return;
    lastGravityTime = nowTime;

    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const volume = bgmAudio.volume * 0.9;

    // Deep rumbling sine wave
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(180, now);
    osc1.frequency.exponentialRampToValueAtTime(45, now + 0.6);
    
    gain1.gain.setValueAtTime(volume, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    
    // Sawtooth lowpass sweep
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(90, now);
    osc2.frequency.linearRampToValueAtTime(30, now + 0.5);
    
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(8, now);
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(60, now + 0.5);
    
    gain2.gain.setValueAtTime(volume * 0.4, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    osc1.connect(gain1);
    gain1.connect(getSoundDestination(ctx));
    
    osc2.connect(filter);
    filter.connect(gain2);
    gain2.connect(getSoundDestination(ctx));
    
    osc1.start(now);
    osc1.stop(now + 0.6);
    osc2.start(now);
    osc2.stop(now + 0.5);
  } catch (e) {}
}

export function playSynthesizedCharge() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const volume = bgmAudio.volume * 0.5;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 1.0);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + 1.0);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(getSoundDestination(ctx));

    osc.start(now);
    osc.stop(now + 1.01);
  } catch (e) {}
}

export function playSynthesizedTempleBell() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const volume = Math.max(0.001, bgmAudio.volume * 0.7);

    // Fundamental and metallic minor third overtone
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(110, now);
    osc1.frequency.exponentialRampToValueAtTime(108, now + 3.5);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(228, now);
    osc2.frequency.exponentialRampToValueAtTime(224, now + 3.5);

    gainNode.gain.setValueAtTime(Math.max(0.001, volume), now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 3.5);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(getSoundDestination(ctx));

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 3.51);
    osc2.stop(now + 3.51);
  } catch(e) {}
}

export function playSynthesizedSingingBowl() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const volume = Math.max(0.001, bgmAudio.volume * 0.6);

    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(432, now); // Sacred frequency

    // Gentle 2.5Hz pulsating shimmer
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(2.5, now);
    lfoGain.gain.setValueAtTime(3.0, now);

    lfo.connect(osc.frequency);
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(Math.max(0.001, volume), now + 0.4);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 4.0);

    osc.connect(gainNode);
    gainNode.connect(getSoundDestination(ctx));

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + 4.01);
    osc.stop(now + 4.01);
  } catch(e) {}
}

export function playSynthesizedFusionUnlock() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const volume = Math.max(0.001, bgmAudio.volume * 0.65);

    // Fast celestial arpeggio: C5(523), E5(659), G5(784), B5(987), E6(1318)
    const notes = [523.25, 659.25, 783.99, 987.77, 1318.51];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = now + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(volume, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 1.2);

      osc.connect(gain);
      gain.connect(getSoundDestination(ctx));

      osc.start(noteTime);
      osc.stop(noteTime + 1.25);
    });
  } catch(e) {}
}

export function playSynthesizedShakuhachi() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const volume = Math.max(0.001, bgmAudio.volume * 0.7);

    // Traditional Japanese bamboo flute (Shakuhachi) - D4 bending to F4 with breath noise
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const mainGain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(293.66, now); // D4
    osc.frequency.exponentialRampToValueAtTime(349.23, now + 0.35); // grace note bend to F4
    osc.frequency.setValueAtTime(349.23, now + 1.2);
    osc.frequency.exponentialRampToValueAtTime(293.66, now + 2.0); // drop back down

    // 5.5Hz natural human vibrato
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(5.5, now);
    lfoGain.gain.setValueAtTime(0, now);
    lfoGain.gain.linearRampToValueAtTime(4.5, now + 0.5); // vibrato fades in after onset

    lfo.connect(osc.frequency);

    mainGain.gain.setValueAtTime(0.001, now);
    mainGain.gain.linearRampToValueAtTime(volume, now + 0.15);
    mainGain.gain.setValueAtTime(volume * 0.85, now + 1.5);
    mainGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    osc.connect(mainGain);
    mainGain.connect(getSoundDestination(ctx));

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + 2.55);
    osc.stop(now + 2.55);
  } catch(e) {}
}

export function playSynthesizedCampfireCrackle() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const volume = Math.max(0.001, bgmAudio.volume * 0.4);

    // Filtered noise buffer pop
    const bufferSize = Math.floor(ctx.sampleRate * 0.08);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400 + Math.random() * 800, now);
    filter.Q.setValueAtTime(3.0, now);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(getSoundDestination(ctx));

    whiteNoise.start(now);
  } catch(e) {}
}

export function playSynthesizedSealShatter() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const volume = Math.max(0.001, bgmAudio.volume * 0.75);

    // Deep sub-bass impact
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(90, now);
    subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.6);
    subGain.gain.setValueAtTime(volume, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    subOsc.connect(subGain);
    subGain.connect(getSoundDestination(ctx));
    subOsc.start(now);
    subOsc.stop(now + 0.82);

    // Crystalline glass shattering harmonic frequencies
    const glassNotes = [1480, 1850, 2220, 3100];
    glassNotes.forEach(freq => {
      const gOsc = ctx.createOscillator();
      const gGain = ctx.createGain();
      gOsc.type = 'sine';
      gOsc.frequency.setValueAtTime(freq, now);
      gOsc.frequency.exponentialRampToValueAtTime(freq * 0.8, now + 1.2);
      gGain.gain.setValueAtTime(volume * 0.4, now);
      gGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      gOsc.connect(gGain);
      gGain.connect(getSoundDestination(ctx));
      gOsc.start(now);
      gOsc.stop(now + 1.25);
    });
  } catch(e) {}
}

export function playSynthesizedBloodMoonRoar() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const volume = Math.max(0.001, bgmAudio.volume * 0.8);

    // Low-frequency demon drone with opening filter
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(55, now);
    osc2.frequency.setValueAtTime(58.5, now); // 3.5Hz sinister binaural beat

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, now);
    filter.frequency.exponentialRampToValueAtTime(750, now + 0.8);
    filter.frequency.exponentialRampToValueAtTime(80, now + 3.0);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(getSoundDestination(ctx));

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 3.25);
    osc2.stop(now + 3.25);
  } catch(e) {}
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (bgmAudio && !bgmAudio.paused) {
        bgmAudio.pause();
        bgmStarted = false;
      }
      try {
        if (audioCtx && audioCtx.state === 'running') {
          audioCtx.suspend();
        }
      } catch (e) {}
    } else {
      try {
        if (audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
      } catch (e) {}
      startBgm();
    }
  });
}


