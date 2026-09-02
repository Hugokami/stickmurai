import { globals } from './globals';
import { callbacks } from './callbacks';
import { i18n } from './assets';
import {
  playSynthesizedLevelUp,
  playSynthesizedAwaken,
  playSynthesizedThunder,
  playSound,
  sfx
} from './audio';
import { Slash, FloatingText, Shockwave, Particle } from './entities';

const t = (key: string): string => i18n[globals.currentLang]?.[key] || key;

export interface PowerUp {
  nameKey: string;
  descKey: string;
  apply: () => void;
  skill?: 'enhance' | 'shield' | 'dash' | 'firewheel' | 'gravity' | 'parry_master';
  isCorrupted?: boolean;
}

export const powerUps: PowerUp[] = [
  { nameKey: "puGiantName", descKey: "puGiantDesc", apply: () => globals.playerStats.slashSizeMult += 0.25 },
  { nameKey: "puWindName", descKey: "puWindDesc", apply: () => globals.playerStats.attackCooldownBase *= 0.85 },
  { skill: "dash", nameKey: "puFeatherName", descKey: "puFeatherDesc", apply: () => globals.playerStats.dashCooldownBase *= 0.75 },
  { nameKey: "puSwiftName", descKey: "puSwiftDesc", apply: () => globals.playerStats.moveSpeedMult += 0.20 },
  { nameKey: "puBloodName", descKey: "puBloodDesc", apply: () => globals.playerStats.flowGenMult += 0.15 },
  
  // Dragon's Fury (Enhance) specific
  { skill: "enhance", nameKey: "puLethalName", descKey: "puLethalDesc", apply: () => globals.playerStats.enhanceBonusDmg += 1 },
  { skill: "enhance", nameKey: "puColossalName", descKey: "puColossalDesc", apply: () => globals.playerStats.enhanceSizeMult += 0.5 },
  { skill: "enhance", nameKey: "puDurationName", descKey: "puDurationDesc", apply: () => globals.playerStats.enhanceDuration += 1.5 },
  
  // Wind Aegis (Shield) specific
  { skill: "shield", nameKey: "puShieldDurationName", descKey: "puShieldDurationDesc", apply: () => globals.playerStats.enhanceDuration += 1.5 },
  { skill: "shield", nameKey: "puShieldPulseName", descKey: "puShieldPulseDesc", apply: () => globals.playerStats.shieldPulseLevel = (globals.playerStats.shieldPulseLevel || 0) + 1 },
  { skill: "shield", nameKey: "puShieldBlastName", descKey: "puShieldBlastDesc", apply: () => globals.playerStats.shieldBlastLevel = (globals.playerStats.shieldBlastLevel || 0) + 1 },
  
  // Raijin Step (Dash) specific
  { skill: "dash", nameKey: "puDashDamageName", descKey: "puDashDamageDesc", apply: () => globals.playerStats.dashDamageLevel = (globals.playerStats.dashDamageLevel || 0) + 1 },
  { skill: "dash", nameKey: "puDashRangeName", descKey: "puDashRangeDesc", apply: () => globals.playerStats.dashRangeLevel = (globals.playerStats.dashRangeLevel || 0) + 1 },
  { skill: "dash", nameKey: "puDashThunderName", descKey: "puDashThunderDesc", apply: () => globals.playerStats.dashThunderLevel = (globals.playerStats.dashThunderLevel || 0) + 1 },
  
  // Inferno Sweep (Firewheel) specific
  { skill: "firewheel", nameKey: "puFirewheelRangeName", descKey: "puFirewheelRangeDesc", apply: () => globals.playerStats.firewheelRangeLevel = (globals.playerStats.firewheelRangeLevel || 0) + 1 },
  { skill: "firewheel", nameKey: "puFirewheelBlazeName", descKey: "puFirewheelBlazeDesc", apply: () => globals.playerStats.firewheelBlazeLevel = (globals.playerStats.firewheelBlazeLevel || 0) + 1 },
  { skill: "firewheel", nameKey: "puFirewheelEchoName", descKey: "puFirewheelEchoDesc", apply: () => globals.playerStats.firewheelEchoLevel = (globals.playerStats.firewheelEchoLevel || 0) + 1 },
  
  // Gravity Well (Gravity) specific
  { skill: "gravity", nameKey: "puGravityRadiusName", descKey: "puGravityRadiusDesc", apply: () => globals.playerStats.gravityRadiusLevel = (globals.playerStats.gravityRadiusLevel || 0) + 1 },
  { skill: "gravity", nameKey: "puGravityDamageName", descKey: "puGravityDamageDesc", apply: () => globals.playerStats.gravityDamageLevel = (globals.playerStats.gravityDamageLevel || 0) + 1 },
  { skill: "gravity", nameKey: "puGravityExplosionName", descKey: "puGravityExplosionDesc", apply: () => globals.playerStats.gravityExplosionLevel = (globals.playerStats.gravityExplosionLevel || 0) + 1 },
  
  { nameKey: "puChargeSpeedName", descKey: "puChargeSpeedDesc", apply: () => globals.playerStats.iaijutsuChargeSpeed += 0.35 },
  { nameKey: "puDeflectDmgName", descKey: "puDeflectDmgDesc", apply: () => globals.playerStats.deflectedDmg += 2 },
  { nameKey: "puVampireName", descKey: "puVampireDesc", apply: () => globals.playerStats.vampireChance += 0.06 },
  { nameKey: "puDimensionalName", descKey: "puDimensionalDesc", apply: () => globals.playerStats.iaijutsuRangeMult += 0.3 },
  { nameKey: "puFireName", descKey: "puFireDesc", apply: () => globals.playerStats.fireStanceLevel = (globals.playerStats.fireStanceLevel || 0) + 1 },
  { nameKey: "puClonesName", descKey: "puClonesDesc", apply: () => globals.playerStats.shadowClonesLevel = (globals.playerStats.shadowClonesLevel || 0) + 1 },
  { nameKey: "puStoutHeartName", descKey: "puStoutHeartDesc", apply: () => { globals.maxLives = Math.min(7, globals.maxLives + 1); globals.lives = Math.min(globals.maxLives, globals.lives + 1); callbacks.updateUI(); } },
  { nameKey: "puPetalArmorName", descKey: "puPetalArmorDesc", apply: () => { globals.petalArmorLevel++; if (!globals.petalArmorActive && globals.petalArmorCooldown <= 0) globals.petalArmorActive = true; } },
  { nameKey: "puEchoSlashName", descKey: "puEchoSlashDesc", apply: () => { globals.echoLevel++; } },
  { nameKey: "puTempoMasteryName", descKey: "puTempoMasteryDesc", apply: () => { globals.tempoMasteryLevel++; } },
  { nameKey: "puFrostName", descKey: "puFrostDesc", apply: () => { globals.frostStanceActive = true; } },
  { nameKey: "puVoidName", descKey: "puVoidDesc", apply: () => { globals.voidStanceActive = true; } },
  { skill: "dash", nameKey: "puFlowingCounterName", descKey: "puFlowingCounterDesc", apply: () => { globals.flowingCounterActive = true; } },
  { skill: "shield", nameKey: "puGaleVortexName", descKey: "puGaleVortexDesc", apply: () => { globals.galeVortexActive = true; globals.playerStats.enhanceDuration = Math.max(1.0, globals.playerStats.enhanceDuration - 1.0); } },
  { nameKey: "puBladeEchoesName", descKey: "puBladeEchoesDesc", apply: () => { globals.bladeEchoesActive = true; } },

  // Option 6: Corrupted Blessings / Cursed Relics (High-Risk, High-Reward)
  {
    nameKey: "puCursedGlassName",
    descKey: "puCursedGlassDesc",
    isCorrupted: true,
    apply: () => {
      globals.maxLives = 1;
      globals.lives = 1;
      globals.playerStats.enhanceBonusDmg += 3;
      globals.playerStats.slashSizeMult += 0.5;
      callbacks.updateUI();
    }
  },
  {
    nameKey: "puCursedBloodName",
    descKey: "puCursedBloodDesc",
    isCorrupted: true,
    apply: () => {
      globals.bloodThirstCurseActive = true;
      globals.playerStats.flowGenMult += 0.5;
      globals.playerStats.vampireChance += 0.15;
    }
  },
  {
    nameKey: "puCursedIronName",
    descKey: "puCursedIronDesc",
    isCorrupted: true,
    apply: () => {
      globals.playerStats.moveSpeedMult *= 0.8;
      globals.playerStats.slashSizeMult += 0.8;
      globals.playerStats.deflectedDmg += 4;
    }
  },
  {
    nameKey: "puCursedGreedName",
    descKey: "puCursedGreedDesc",
    isCorrupted: true,
    apply: () => {
      globals.curseOfGreedActive = true;
    }
  }
];

export function triggerLevelUp() {
  playSynthesizedLevelUp();
  globals.gameState = 'levelup';
  
  const levelUpScreen = document.getElementById('level-up-screen')!;
  const powerChoicesContainer = document.getElementById('power-choices')!;
  const levelDisplay = document.getElementById('level-display')!;
  
  levelUpScreen.style.display = 'flex';
  powerChoicesContainer.innerHTML = '';
  
  // Heal 1 heart on level up
  const maxHearts = globals.gameMode === 'zen' ? 3 : 5;
  if (globals.lives < maxHearts) globals.lives++;
  callbacks.updateUI();
  
  let availablePowers = [...powerUps];
  if (globals.gameMode === 'zen') {
    availablePowers = [
      { nameKey: "puFeatherName", descKey: "puFeatherDesc", apply: () => globals.playerStats.dashCooldownBase *= 0.75 },
      { nameKey: "puSwiftName", descKey: "puSwiftDesc", apply: () => globals.playerStats.moveSpeedMult += 0.20 },
      { nameKey: "puBloodName", descKey: "puBloodDesc", apply: () => globals.playerStats.flowGenMult += 0.15 },
      { nameKey: "puDeflectDmgName", descKey: "puDeflectDmgDesc", apply: () => globals.playerStats.deflectedDmg += 2 },
      { nameKey: "puZenRestoreName", descKey: "puZenRestoreDesc", apply: () => { globals.lives = Math.min(3, globals.lives + 1); callbacks.updateUI(); return 0; } }
    ];
  } else {
    // Filter powerups dynamically based on chosen skill and uniqueness
    availablePowers = availablePowers.filter(power => {
      // Filter out unique one-time upgrades that are already acquired
      if (power.nameKey === 'puFrostName' && globals.frostStanceActive) return false;
      if (power.nameKey === 'puVoidName' && globals.voidStanceActive) return false;
      if (power.nameKey === 'puFlowingCounterName' && globals.flowingCounterActive) return false;
      if (power.nameKey === 'puGaleVortexName' && globals.galeVortexActive) return false;
      if (power.nameKey === 'puBladeEchoesName' && globals.bladeEchoesActive) return false;

      if (power.skill) {
        return power.skill === globals.selectedSkill;
      }
      return true;
    });
  }
  
  const normalPowers = availablePowers.filter(p => !p.isCorrupted);
  const cursedPowers = availablePowers.filter(p => p.isCorrupted);
  const shuffledNormal = [...normalPowers].sort(() => 0.5 - Math.random());
  const choices: PowerUp[] = [];

  // 35% chance to offer a Cursed Blessing in non-zen mode when level >= 3
  const offerCurse = (globals.gameMode !== 'zen' && globals.level >= 3 && Math.random() < 0.35 && cursedPowers.length > 0);
  if (offerCurse) {
    const randomCurse = cursedPowers[Math.floor(Math.random() * cursedPowers.length)];
    choices.push(shuffledNormal[0], shuffledNormal[1], randomCurse);
  } else {
    choices.push(...shuffledNormal.slice(0, 3));
  }
  
  choices.forEach((power, index) => {
    const card = document.createElement('div');
    card.className = 'power-card';
    card.style.animation = 'power-card-entrance 0.45s cubic-bezier(0.16, 1, 0.3, 1) both, card-glow-pulse 3s infinite alternate';
    card.style.animationDelay = `${index * 0.08}s, ${index * 0.08 + 0.45}s`;
    
    let category = 'basic';
    const nk = power.nameKey;
    if (power.isCorrupted) {
      category = 'cursed';
      card.style.borderColor = 'rgba(239, 68, 68, 0.7)';
      card.style.background = 'linear-gradient(135deg, rgba(30, 10, 20, 0.95), rgba(15, 5, 10, 0.98))';
      card.style.boxShadow = '0 0 25px rgba(239, 68, 68, 0.35)';
      card.innerHTML = `<span style="display:inline-block; font-size:10px; font-weight:800; letter-spacing:1px; color:#ef4444; background:rgba(239,68,68,0.18); padding:2px 8px; border-radius:10px; margin-bottom:8px; border:1px solid rgba(239,68,68,0.4);">☠ CURSED RELIC</span><h3 style="color:#fee2e2;">${t(power.nameKey)}</h3><p style="color:#fca5a5;">${t(power.descKey)}</p>`;
    } else {
      if (nk.includes('Fire') || nk.includes('Blaze')) {
        category = 'fire';
      } else if (nk.includes('Wind') || nk.includes('Shield') || nk.includes('Gale') || nk.includes('Swift') || nk.includes('Feather')) {
        category = 'wind';
      } else if (nk.includes('Dash') || nk.includes('Thunder') || nk.includes('Charge')) {
        category = 'thunder';
      } else if (nk.includes('Void') || nk.includes('Gravity') || nk.includes('Clones') || nk.includes('Dimensional') || nk.includes('Echo')) {
        category = 'void';
      } else if (nk.includes('Giant') || nk.includes('Lethal') || nk.includes('Colossal') || nk.includes('Vampire') || nk.includes('Heart') || nk.includes('Armor') || nk.includes('Frost') || nk.includes('Tempo')) {
        if (nk.includes('Frost')) {
          category = 'frost';
        } else {
          category = 'vitality';
        }
      }
      card.classList.add(`category-${category}`);
      card.innerHTML = `<h3>${t(power.nameKey)}</h3><p>${t(power.descKey)}</p>`;
    }
    card.addEventListener('click', () => {
      power.apply();
      globals.chosenPowerUps.push(power.nameKey);
      if (power.isCorrupted) {
        const idx = powerUps.indexOf(power);
        if (idx !== -1) powerUps.splice(idx, 1);
      }
      globals.exp -= globals.maxExp;
      globals.maxExp = Math.round(globals.maxExp * 1.25);
      globals.level++;
      levelDisplay.textContent = globals.level.toString();
      levelUpScreen.style.display = 'none';
      
      globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 50, t('levelUpText'), "#00ff00", 30));
      callbacks.updateUI();
      globals.gameState = 'playing';
    });
    powerChoicesContainer.appendChild(card);
  });
}

const ultOptions = [
  { 
    nameKey: "ultShadowName", 
    descKey: "ultShadowDesc",
    apply: () => {
       globals.flowState = 'awakened';
       globals.screenShake = 35;
       globals.invertScreenTimer = 0.25;

       triggerMangaCutin('shadow');

       // Shadow awakening blast
       globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#c084fc'));
       globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 120, globals.currentLang === 'ja' ? '影の覚醒！' : 'SHADOW AWAKENING!', 'neon-#c084fc', 56));
       for (let i = 0; i < 20; i++) {
         const angle = Math.random() * Math.PI * 2;
         const speed = 150 + Math.random() * 250;
         globals.particles.push(Particle.acquire(globals.player.x, globals.player.y, '#c084fc', speed, 0.5, 2.5 + Math.random() * 2, angle));
       }
    }
  },
  {
    nameKey: "ultOmniName",
    descKey: "ultOmniDesc",
    apply: () => {
        globals.flowState = 'omnislash';
        globals.flow = 0;

        // get targets
        const targets = globals.enemies.filter(e => e.state !== 'dead');
        const maxVisuals = 10;
        const staggerInterval = 0.015;
        const finalDelay = (Math.min(targets.length, maxVisuals) * staggerInterval) + 0.15;

        // Slow-motion and hit-stop completely disabled to ensure butter-smooth 60fps
        globals.timeSlowDuration = 0; 
        globals.timeSlowFactor = 1.0;
        globals.targetTimeSlowFactor = 1.0;
        globals.hitStop = 0;
        globals.screenShake = 60;

        // stun all active enemies so they freeze in place
        globals.enemies.forEach(e => {
          if (e.state !== 'dead') {
            e.vx = 0; e.vy = 0;
            e.stunTimer = Math.max(e.stunTimer || 0, finalDelay + 0.5);
          }
        });
        globals.invulnTimer = finalDelay + 0.5;

        // Enable screen-wide speedlines overlay during the slashes
        const speedlines = document.getElementById('speedlines-overlay');
        if (speedlines) {
          speedlines.classList.add('active');
          setTimeout(() => { speedlines.classList.remove('active'); }, finalDelay * 1000 + 400);
        }

        triggerMangaCutin('omni');

        // play awakening sfx
        playSynthesizedAwaken();

        // floating text
        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 120, globals.currentLang === 'ja' ? '超究武神覇斬！' : 'OMNISLASH!', 'neon-#ffd700', 72));
        
        // start shockwave
        globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#ffd700'));

       // slash all targetable active enemies
       targets.forEach((e, idx) => {
         // stagger cross cuts
         const slashDelay = idx * staggerInterval;
         globals.delayedActions.push({
           delay: slashDelay,
           run: () => {
             if (e.state === 'dead') return;
             
             // hit target for 16 DMG (always applied)
             callbacks.hitEnemy(e, 16);
             
             // limit heavy canvas and sound context resources to prevent lag
             if (idx < maxVisuals) {
               if (idx % 2 === 0) {
                 playSound(sfx.slash, 1.2);
               }
               
               // spawn 3 cut lines (including a horizontal sweep)
               globals.slashes.push(Slash.acquire(e.x, e.y, Math.PI / 4, 2.5 * e.scaleMult, true));
               globals.slashes.push(Slash.acquire(e.x, e.y, -Math.PI / 4, 2.5 * e.scaleMult, true));
               globals.slashes.push(Slash.acquire(e.x, e.y, 0, 3.0 * e.scaleMult, true));
               
               // blast wave
               globals.shockwaves.push(new Shockwave(e.x, e.y, 'rgba(255, 30, 70, 0.5)'));

               // sparks
               for (let i = 0; i < 4; i++) {
                 const angle = Math.random() * Math.PI * 2;
                 const speed = 200 + Math.random() * 300;
                 globals.particles.push(Particle.acquire(e.x, e.y, i % 2 === 0 ? '#ff1e46' : '#00ffff', speed, 0.4, 1.5 + Math.random() * 1.5, angle));
               }
               
               globals.screenShake = Math.max(globals.screenShake, 18);
             }
           }
         });
       });

       // final screen clearing blast
       globals.delayedActions.push({
         delay: finalDelay,
         run: () => {

            // play lightning thunder sound
            playSynthesizedThunder();
            globals.invertScreenTimer = 0.3;
            
            globals.screenShake = 65;

            // golden shockwave
            globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#ffd700'));
            
            // Deal 20 DMG to all remaining active enemies
            globals.enemies.forEach(enemy => {
              if (enemy.state !== 'dead') {
                callbacks.hitEnemy(enemy, 20);
                for (let i = 0; i < 4; i++) {
                  globals.particles.push(Particle.acquire(enemy.x, enemy.y, '#ffd700', 150 + Math.random() * 150, 0.4, 2, Math.random() * Math.PI * 2));
                }
              }
            });

            // restore 2 Hearts
            globals.lives = Math.min(globals.maxLives, globals.lives + 2);
            globals.flowState = 'normal';
            globals.timeSlowDuration = 0;
            globals.timeSlowFactor = 1.0;
            globals.targetTimeSlowFactor = 1.0;
            callbacks.updateUI();
         }
       });
    }
  },
  {
    nameKey: "ultStormName",
    descKey: "ultStormDesc",
    apply: () => {
       globals.flowState = 'storm_god';
       globals.screenShake = 50;
       globals.invertScreenTimer = 0.25;

       triggerMangaCutin('storm');

       // play lightning/thunder sound
       playSynthesizedThunder();

       // Storm awakening blast
       globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#fbbf24'));
       globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 120, globals.currentLang === 'ja' ? '雷神の稲妻！' : 'WRATH OF THE STORM GOD!', 'neon-#fbbf24', 56));
       for (let i = 0; i < 25; i++) {
         const angle = Math.random() * Math.PI * 2;
         const speed = 180 + Math.random() * 300;
         globals.particles.push(Particle.acquire(globals.player.x, globals.player.y, '#fbbf24', speed, 0.5, 2.5 + Math.random() * 2, angle));
       }
    }
  }
];

export function activateAwakening() {
  if (globals.flow < globals.playerStats.flowMax || globals.flowState !== 'normal') return;
  
  playSynthesizedAwaken();
  globals.gameState = 'ultchoice';
  
  const ultScreen = document.getElementById('ult-screen')!;
  const ultChoicesContainer = document.getElementById('ult-choices')!;
  const btnUlt = document.getElementById('btn-ult')!;
  
  ultScreen.style.display = 'flex';
  ultChoicesContainer.innerHTML = '';
  
  let optionsToUse = ultOptions;
  if (globals.gameMode === 'zen') {
    optionsToUse = [{
      nameKey: "ultZenFieldName",
      descKey: "ultZenFieldDesc",
      apply: () => {
        globals.flowState = 'normal';
        globals.flow = 0;
        globals.zenFieldActiveTimer = 8.0;
        globals.zenFieldTickTimer = 0;
        globals.invulnTimer = 8.0; // Invulnerable for duration
        globals.timeSlowDuration = 0;
        globals.targetTimeSlowFactor = 1.0;
        globals.timeSlowFactor = 1.0;
        
        globals.screenShake = 40;
        globals.invertScreenTimer = 0.25;
        
        triggerMangaCutin('zen');

        globals.floatingTexts.push(FloatingText.acquire(globals.player.x, globals.player.y - 120, t('zenFieldText'), "neon-#00ffff", 48));
        globals.shockwaves.push(new Shockwave(globals.player.x, globals.player.y, '#00ffff'));
        
        for (let i = 0; i < 20; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 200 + Math.random() * 200;
          globals.particles.push(Particle.acquire(globals.player.x, globals.player.y, '#00ffff', speed, 0.6, 3, angle));
        }
      }
    }];
  }
  
  optionsToUse.forEach((ult, index) => {
    const card = document.createElement('div');
    card.className = 'power-card';
    card.style.animation = 'power-card-entrance 0.45s cubic-bezier(0.16, 1, 0.3, 1) both, card-glow-pulse 3s infinite alternate';
    card.style.animationDelay = `${index * 0.08}s, ${index * 0.08 + 0.45}s`;
    
    let category = 'basic';
    const nk = ult.nameKey;
    if (nk.includes('Shadow')) category = 'void';
    else if (nk.includes('Omni')) category = 'vitality';
    else if (nk.includes('Zen')) category = 'wind';
    else if (nk.includes('Storm')) category = 'thunder';
    
    card.classList.add(`category-${category}`);
    card.innerHTML = `<h3>${t(ult.nameKey)}</h3><p>${t(ult.descKey)}</p>`;
    card.addEventListener('click', () => {
      ultScreen.style.display = 'none';
      btnUlt.classList.remove('ready');
      ult.apply();

      
      globals.gameState = 'playing';
    });
    ultChoicesContainer.appendChild(card);
  });
}

export function triggerMangaCutin(type: 'shadow' | 'omni' | 'storm' | 'zen') {
  const mangaCutin = document.getElementById('manga-cutin');
  if (mangaCutin) {
    mangaCutin.className = '';
    mangaCutin.classList.add('active', `ult-${type}`);
    
    const video = mangaCutin.querySelector('video');
    if (video) {
      video.currentTime = 0;
      video.play().catch(err => console.log("Video playback error:", err));
    }
    
    const existingTimeout = (mangaCutin as any).activeTimeout;
    if (existingTimeout) clearTimeout(existingTimeout);
    
    (mangaCutin as any).activeTimeout = setTimeout(() => {
      mangaCutin.classList.remove('active');
    }, 1650);
  }
}

export function applyRandomStartUpgrade(): string {
  let availablePowers = [...powerUps];
  if (globals.gameMode === 'zen') {
    availablePowers = [
      { nameKey: "puFeatherName", descKey: "puFeatherDesc", apply: () => globals.playerStats.dashCooldownBase *= 0.75 },
      { nameKey: "puSwiftName", descKey: "puSwiftDesc", apply: () => globals.playerStats.moveSpeedMult += 0.20 },
      { nameKey: "puBloodName", descKey: "puBloodDesc", apply: () => globals.playerStats.flowGenMult += 0.15 },
      { nameKey: "puDeflectDmgName", descKey: "puDeflectDmgDesc", apply: () => globals.playerStats.deflectedDmg += 2 }
    ];
  } else {
    availablePowers = availablePowers.filter(power => {
      if (power.skill) {
        return power.skill === globals.selectedSkill;
      }
      return true;
    });
  }

  if (availablePowers.length > 0) {
    const randomPower = availablePowers[Math.floor(Math.random() * availablePowers.length)];
    randomPower.apply();
    const name = t(randomPower.nameKey);
    globals.chosenPowerUps.push(randomPower.nameKey);
    return name;
  }
  return "None";
}
