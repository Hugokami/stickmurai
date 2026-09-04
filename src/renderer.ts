import { globals } from './globals';
import { callbacks } from './callbacks';
import { bgLayers, bgImages, vfxAnims, propImages } from './assets';
import { Entity } from './entities';

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

let lastRenderTime = performance.now();
let frostStanceVisualScale = 0;
let voidStanceVisualScale = 0;
let petalArmorVisualScale = 0;
let riposteVisualScale = 0;

interface SkyEffect {
  x: number;
  y: number;
  frame: number;
  timer: number;
  scale: number;
}
const skyEffects: SkyEffect[] = [];

const visibleEntities: Entity[] = [];
const depthCompare = (a: Entity, b: Entity) => a.y - b.y;



export function initRenderer(canvasElement: HTMLCanvasElement) {
  canvas = canvasElement;
  ctx = canvas.getContext('2d')!;
  
  resizeCanvas();
  window.addEventListener('resize', debouncedResize);
  window.addEventListener('orientationchange', debouncedResize);
  
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', debouncedResize);
  }
  
  if (screen.orientation) {
    screen.orientation.addEventListener('change', debouncedResize);
  }
}

export function resizeCanvas() {
  if (!canvas || !ctx) return;
  globals.width = window.innerWidth;
  globals.height = window.innerHeight;
  
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  const dprCap = (globals.graphicsSettings === 'low' || isTouchDevice) ? 1.0 : 1.25;
  const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
  
  canvas.width = globals.width * dpr;
  canvas.height = globals.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const targetVW = 1400;
  globals.gameZoom = Math.min(1, globals.width / targetVW);
  globals.vw = globals.width / globals.gameZoom;
  globals.vh = globals.height / globals.gameZoom;
}

let resizeTimeout: any = null;
let lastResizeTime = 0;
export function debouncedResize() {
  const now = Date.now();
  if (now - lastResizeTime > 150) {
    resizeCanvas();
    callbacks.updateUI();
    lastResizeTime = now;
  }
  if (resizeTimeout) clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    resizeCanvas();
    callbacks.updateUI();
    lastResizeTime = Date.now();
  }, 100);
}

export function drawBackground(ctx: CanvasRenderingContext2D) {
  const isKamisori = (globals.flowState === 'awakened') || (globals.flowState === 'storm_god') || (globals.zenFieldActiveTimer > 0);
  let skyColor = '#4a607a';
  if (isKamisori) {
    skyColor = '#e5e5e5';
  } else if (globals.calamityEvent === 'blood_moon') {
    skyColor = '#240404';
  } else if (globals.dayNightPhase === 'sunset') {
    skyColor = '#5c241c';
  } else if (globals.dayNightPhase === 'midnight') {
    skyColor = '#0d0f1f';
  } else if (globals.dayNightPhase === 'final_showdown') {
    skyColor = '#2e1018';
  }
  ctx.fillStyle = skyColor;
  ctx.fillRect(0, 0, globals.width, globals.height);
  ctx.imageSmoothingEnabled = false;

  // Celestial Blood Moon Eclipse Rendering
  if (globals.calamityEvent === 'blood_moon') {
    const moonX = globals.width * 0.78;
    const moonY = globals.height * 0.22;
    const moonRadius = 62;
    const coronaPulse = 1.0 + Math.sin(performance.now() * 0.005) * 0.12;

    // 1. Bleeding Crimson Corona
    const corona = ctx.createRadialGradient(moonX, moonY, moonRadius * 0.7, moonX, moonY, moonRadius * 2.2 * coronaPulse);
    corona.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
    corona.addColorStop(0.5, 'rgba(185, 28, 28, 0.18)');
    corona.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = corona;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius * 2.2 * coronaPulse, 0, Math.PI * 2);
    ctx.fill();

    // 2. Obsidian Eclipsed Core
    ctx.fillStyle = '#160404';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
    ctx.fill();

    // 3. Blazing Crimson Corona Rim
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
    ctx.stroke();

    // 4. White-Hot Solar Flare Crescent
    ctx.strokeStyle = 'rgba(254, 202, 202, 0.65)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(moonX - 3, moonY - 3, moonRadius * 0.94, 0.15, Math.PI * 0.85);
    ctx.stroke();
  }

  const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  bgLayers.forEach(layer => {
    if (globals.graphicsSettings === 'low' && layer.name !== 'sky' && layer.name !== 'stones&grass') {
      return;
    }
    if (isTouch && layer.name !== 'sky' && layer.name !== 'hills&trees' && layer.name !== 'stones&grass') {
      return;
    }
    const img = bgImages[layer.name];
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save();
      if (isKamisori) {
        ctx.globalAlpha = 0.25;
      }
      
      const bufferFactor = 1.15;
      const scale = (globals.height * bufferFactor) / img.naturalHeight;
      const imgW = img.naturalWidth * scale;
      const imgH = img.naturalHeight * scale;
      
      const offsetX = -(globals.camera.x * layer.speed * globals.gameZoom) % imgW;
      let startX = offsetX > 0 ? offsetX - imgW : offsetX;
      
      const midY = (globals.height - imgH) / 2;
      const offsetY = midY - (globals.camera.y * 0.3 * globals.gameZoom);
      
      const maxDrawX = globals.width + 1;
      const maxDrawY = globals.height + 1;
      
      if (layer.name === 'stones&grass') {
        // Only the grass ground layer tiles infinitely in both directions
        const offsetYMod = offsetY % imgH;
        let startY = offsetYMod > 0 ? offsetYMod - imgH : offsetYMod;
        for(let x = startX; x < maxDrawX; x += imgW) {
          for(let y = startY; y < maxDrawY; y += imgH) {
            ctx.drawImage(img, x, y, imgW, imgH);
          }
        }
      } else {
        // Decorative layers: tile horizontally only, single vertical position
        for(let x = startX; x < maxDrawX; x += imgW) {
          ctx.drawImage(img, x, offsetY, imgW, imgH);
        }
        
        if (layer.name === 'sky') {
          // Update and draw sky starfall effects (atmospheric background meteors)
          if (Math.random() < 0.006 && skyEffects.length < 5) {
            skyEffects.push({
              x: Math.random() * globals.width,
              y: Math.random() * (globals.height * 0.4),
              frame: 0,
              timer: 0,
              scale: 0.6 + Math.random() * 0.6
            });
          }
          for (let i = skyEffects.length - 1; i >= 0; i--) {
            const fx = skyEffects[i];
            fx.timer += 0.016;
            fx.frame = Math.floor(fx.timer / 0.08); // 80ms per frame
            if (fx.frame >= 8) {
              skyEffects.splice(i, 1);
              continue;
            }
            const starImg = vfxAnims.custom.starfall[fx.frame];
            if (starImg && starImg.complete && starImg.naturalWidth > 0) {
              ctx.save();
              ctx.drawImage(starImg, fx.x - starImg.width * fx.scale / 2, fx.y - starImg.height * fx.scale / 2, starImg.width * fx.scale, starImg.height * fx.scale);
              ctx.restore();
            }
          }
        }
      }
      ctx.restore();
    }
  });
}

export function draw() {
  if (!canvas || !ctx) return;
  
  if (canvas.style.filter !== 'none' && canvas.style.filter !== '') {
    canvas.style.filter = 'none';
  }

  const now = performance.now();
  const dt = Math.min(0.1, (now - lastRenderTime) / 1000);
  lastRenderTime = now;

  // Stance visual scale smooth transitions
  const targetFrost = globals.frostStanceActive ? 1 : 0;
  frostStanceVisualScale += (targetFrost - frostStanceVisualScale) * Math.min(1, 12 * dt);

  const targetVoid = globals.voidStanceActive ? 1 : 0;
  voidStanceVisualScale += (targetVoid - voidStanceVisualScale) * Math.min(1, 12 * dt);

  const targetPetal = globals.petalArmorActive ? 1 : 0;
  petalArmorVisualScale += (targetPetal - petalArmorVisualScale) * Math.min(1, 12 * dt);

  const targetRiposte = (globals.riposteTimer > 0) ? 1 : 0;
  riposteVisualScale += (targetRiposte - riposteVisualScale) * Math.min(1, 12 * dt);

  ctx.clearRect(0, 0, globals.width, globals.height);
  drawBackground(ctx);

  if (globals.gameState === 'mainmenu') {
    return;
  }

  ctx.save();
  ctx.scale(globals.gameZoom, globals.gameZoom);
  
  const vignette = document.getElementById('vignette-overlay');
  if (vignette) {
    if (globals.lives === 1 && globals.gameState === 'playing' && globals.player.state !== 'dead') {
      const pulse = Math.abs(Math.sin(performance.now() / 200));
      vignette.style.opacity = (0.3 + pulse * 0.4).toString();
    } else {
      vignette.style.opacity = '0';
    }
  }

  const isMobileDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (!isMobileDevice && globals.graphicsSettings !== 'low') {
    ctx.save();
    ctx.translate(-globals.camera.x + globals.vw/2, -globals.camera.y + globals.vh/2);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 2;
    const startXGrid = Math.floor((globals.camera.x - globals.vw/2) / 150) * 150;
    const startYGrid = Math.floor((globals.camera.y - globals.vh/2) / 150) * 150;
    ctx.beginPath();
    for(let x = startXGrid; x < globals.camera.x + globals.vw; x += 150) {
      ctx.moveTo(x, startYGrid); ctx.lineTo(x, globals.camera.y + globals.vh);
    }
    for(let y = startYGrid; y < globals.camera.y + globals.vh; y += 150) {
      ctx.moveTo(startXGrid, y); ctx.lineTo(globals.camera.x + globals.vw, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  visibleEntities.length = 0;
  visibleEntities.push(globals.player);
  const cullBuffer = 300;
  const minX = globals.camera.x - globals.vw / 2 - cullBuffer;
  const maxX = globals.camera.x + globals.vw / 2 + cullBuffer;
  const minY = globals.camera.y - globals.vh / 2 - cullBuffer;
  const maxY = globals.camera.y + globals.vh / 2 + cullBuffer;

  for (let i = 0; i < globals.enemies.length; i++) {
    const e = globals.enemies[i];
    if (e.isPvpRemote || (e.x >= minX && e.x <= maxX && e.y >= minY && e.y <= maxY)) {
      visibleEntities.push(e);
    }
  }
  if (globals.decoys) {
    for (let i = 0; i < globals.decoys.length; i++) {
      const d = globals.decoys[i];
      if (d.x >= minX && d.x <= maxX && d.y >= minY && d.y <= maxY) {
        visibleEntities.push(d);
      }
    }
  }
  visibleEntities.sort(depthCompare);

  globals.afterimages.forEach(a => a.draw(ctx, globals.camera.x, globals.camera.y));
  if (globals.graphicsSettings !== 'low' && globals.groundScarsEnabled === 'on') {
    globals.groundScars.forEach(s => s.draw(ctx, globals.camera.x, globals.camera.y));
  }

  // Draw Yomi Shrine & Wandering Hermit
  if (globals.activeShrine) {
    ctx.save();
    ctx.translate(-globals.camera.x + globals.vw/2, -globals.camera.y + globals.vh/2);
    globals.activeShrine.draw(ctx);
    ctx.restore();
  }

  if (globals.activeHermit) {
    ctx.save();
    ctx.translate(-globals.camera.x + globals.vw/2, -globals.camera.y + globals.vh/2);
    globals.activeHermit.draw(ctx);
    ctx.restore();
  }

  // Draw Destructible Props (Barrels, crates, lanterns)
  if (globals.destructibleProps && globals.destructibleProps.length > 0) {
    ctx.save();
    ctx.translate((-globals.camera.x + globals.vw/2) | 0, (-globals.camera.y + globals.vh/2) | 0);
    for (let i = 0; i < globals.destructibleProps.length; i++) {
      const p = globals.destructibleProps[i];
      if (p.broken) continue;
      if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) continue;
      const img = propImages[p.propType % propImages.length];
      if (img && img.complete && img.naturalWidth > 0) {
        const drawW = (img.width * p.scale) | 0;
        const drawH = (img.height * p.scale) | 0;
        const dx = (p.x - drawW / 2) | 0;
        const dy = (p.y - drawH + 15) | 0;
        // Soft ground contact shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(p.x | 0, (p.y + 10) | 0, (drawW * 0.35) | 0, (drawH * 0.12) | 0, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.drawImage(img, dx, dy, drawW, drawH);
      }
    }
    ctx.restore();
  }

  // Draw Plasma Tempest Electric Napalm & Inter-Node Lightning Arcs
  if (globals.plasmaTrails && globals.plasmaTrails.length > 0) {
    ctx.save();
    ctx.translate(-globals.camera.x + globals.vw/2, -globals.camera.y + globals.vh/2);
    
    // Inter-node lightning conduction arcs
    const trails = globals.plasmaTrails;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.8;
    for (let i = 1; i < trails.length; i++) {
      const p1 = trails[i - 1];
      const p2 = trails[i];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < 160 * 160) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        const steps = 4;
        for (let s = 1; s < steps; s++) {
          const t = s / steps;
          const mx = p1.x + dx * t + (Math.random() - 0.5) * 12;
          const my = p1.y + dy * t + (Math.random() - 0.5) * 12;
          ctx.lineTo(mx, my);
        }
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }

    // Individual node fire & spark zones
    for (const pt of trails) {
      const alpha = Math.max(0, pt.life / pt.maxLife);
      
      // Electric ground burn zone
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(56, 189, 248, ${alpha * 0.28})`;
      ctx.fill();
      
      // Crackling gold inner ring
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = `rgba(251, 191, 36, ${alpha * 0.85})`;
      ctx.stroke();

      // Center discharge spark
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pt.x + (Math.random() - 0.5) * 6, pt.y + (Math.random() - 0.5) * 6, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Draw Kamaitachi Razor Wind Scythes with motion blur trails
  if (globals.bouncingSickles && globals.bouncingSickles.length > 0) {
    ctx.save();
    ctx.translate(-globals.camera.x + globals.vw/2, -globals.camera.y + globals.vh/2);
    const sickleRot = performance.now() * 0.016;
    for (const s of globals.bouncingSickles) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(sickleRot);

      // Motion blur outer wind ring
      ctx.beginPath();
      ctx.arc(0, 0, s.radius * 1.15, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.25)';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Twin razor crescent blades (opposing 180 deg)
      [0, Math.PI].forEach(armAngle => {
        ctx.save();
        ctx.rotate(armAngle);
        ctx.beginPath();
        ctx.moveTo(-4, -s.radius * 0.3);
        ctx.quadraticCurveTo(s.radius * 0.8, -s.radius * 0.2, s.radius, -s.radius * 0.9);
        ctx.quadraticCurveTo(s.radius * 0.5, -s.radius * 0.5, 0, 0);
        ctx.closePath();
        ctx.fillStyle = '#4ade80';
        ctx.fill();
        ctx.strokeStyle = '#bbf7d0'; // razor edge highlight
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      });

      // Central wind eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
    ctx.restore();
  }

  // Draw Gravity Well & Singularity Cleave Accretion Disk
  if (globals.gravityWellTimer > 0) {
    ctx.save();
    const gx = globals.gravityWellX - globals.camera.x + globals.vw/2;
    const gy = globals.gravityWellY - globals.camera.y + globals.vh/2;
    const baseRadius = 250 * (1 + 0.25 * (globals.playerStats.gravityRadiusLevel || 0));
    const timer = performance.now() / 1000;
    const isSingularity = globals.activeFusions.has('singularity_cleave');

    // Gravity zone background glow
    const pulse = 0.95 + Math.sin(timer * 12) * 0.06;
    const glowGrad = ctx.createRadialGradient(gx, gy, 10, gx, gy, baseRadius * pulse);
    glowGrad.addColorStop(0, isSingularity ? 'rgba(88, 28, 135, 0.45)' : 'rgba(138, 43, 226, 0.25)');
    glowGrad.addColorStop(0.7, isSingularity ? 'rgba(147, 51, 234, 0.18)' : 'rgba(138, 43, 226, 0.1)');
    glowGrad.addColorStop(1, 'rgba(138, 43, 226, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(gx, gy, baseRadius * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Singularity Cleave Accretion Disk & Gravitational Lensing Arms
    if (isSingularity) {
      const armCount = 4;
      ctx.lineWidth = 2.5;
      for (let i = 0; i < armCount; i++) {
        const armAngle = timer * 4 + (i * Math.PI * 2 / armCount);
        ctx.strokeStyle = i % 2 === 0 ? 'rgba(192, 132, 252, 0.85)' : 'rgba(236, 72, 153, 0.75)';
        ctx.beginPath();
        ctx.arc(gx, gy, 45 + Math.sin(timer * 10 + i) * 6, armAngle, armAngle + 1.2);
        ctx.stroke();
      }
      
      // Event Horizon Black Hole Center
      ctx.fillStyle = '#05020a';
      ctx.beginPath();
      ctx.arc(gx, gy, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2.0;
      ctx.stroke();
    }
    
    // Custom vortex sprite sheet animation loop
    const vortexFrames = vfxAnims.custom.vortex;
    const vfFrameIdx = Math.floor((performance.now() / 65) % vortexFrames.length);
    const img = vortexFrames[vfFrameIdx];
    if (img && img.complete && img.naturalWidth > 0) {
      const vfScale = 1.3 * (1 + 0.25 * (globals.playerStats.gravityRadiusLevel || 0));
      const drawW = img.width * vfScale;
      const drawH = img.height * vfScale;
      ctx.drawImage(img, gx - drawW / 2, gy - drawH / 2, drawW, drawH);
    }
    
    ctx.restore();
  }

  // dash aim preview
  if (globals.mobileDashAimActive && globals.player && globals.player.state !== 'dead' && globals.player.dashCooldown <= 0) {
    ctx.save();
    const px = globals.player.x - globals.camera.x + globals.vw/2;
    const py = globals.player.y - globals.camera.y + globals.vh/2 - 10;
    const angle = globals.mobileDashAimAngle;
    const length = 440;
    
    // Draw the preview path line
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.lineWidth = 5;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(px, py);
    const targetX = px + Math.cos(angle) * length;
    const targetY = py + Math.sin(angle) * length;
    ctx.lineTo(targetX, targetY);
    ctx.stroke();
    
    // Draw outer glow/indicator ring at player feet
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.85)';
    ctx.lineWidth = 3;
    // Removed shadowBlur to prevent lag
    ctx.beginPath();
    ctx.arc(px, py + 10, 26, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw arrowhead at target
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(targetX, targetY);
    const arrowSize = 14;
    ctx.lineTo(
      targetX - arrowSize * Math.cos(angle - Math.PI / 6),
      targetY - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      targetX - arrowSize * Math.cos(angle + Math.PI / 6),
      targetY - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }

  // Iaijutsu mobile aim preview
  if (globals.mobileIaijutsuAimActive && globals.player && globals.player.state !== 'dead') {
    ctx.save();
    const px = globals.player.x - globals.camera.x + globals.vw/2;
    const py = globals.player.y - globals.camera.y + globals.vh/2 - 10;
    const angle = globals.mobileIaijutsuAimAngle;
    const length = 600 * (globals.playerStats.iaijutsuRangeMult || 1.0);
    
    // Color depends on whether fully charged (chargeTimer >= 0.8)
    const isFullyCharged = globals.player.chargeTimer >= 0.8;
    const color = isFullyCharged ? '#00ffff' : 'rgba(0, 255, 255, 0.45)';
    
    ctx.strokeStyle = color;
    ctx.lineWidth = isFullyCharged ? 4 : 2;
    ctx.setLineDash([15, 10]);
    ctx.beginPath();
    ctx.moveTo(px, py);
    const targetX = px + Math.cos(angle) * length;
    const targetY = py + Math.sin(angle) * length;
    ctx.lineTo(targetX, targetY);
    ctx.stroke();
    
    // Draw small crescent preview at player feet facing the aim direction
    ctx.setLineDash([]);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(px, py, 40, angle - Math.PI/4, angle + Math.PI/4);
    ctx.stroke();

    ctx.restore();
  }

  // raijin aim preview
  if (globals.mobileRaijinAimActive && globals.player && globals.player.state !== 'dead' && globals.enhanceCooldown <= 0) {
    ctx.save();
    const px = globals.player.x - globals.camera.x + globals.vw/2;
    const py = globals.player.y - globals.camera.y + globals.vh/2 - 10;
    const angle = globals.mobileRaijinAimAngle;
    
    // Dynamically calculate Raijin Step range based on dashRangeLevel
    const length = 600 * (1 + 0.30 * (globals.playerStats.dashRangeLevel || 0));
    
    // Draw the preview path line (gold/yellow lightning-themed dash)
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
    ctx.lineWidth = 6;
    ctx.setLineDash([12, 6]);
    ctx.beginPath();
    ctx.moveTo(px, py);
    const targetX = px + Math.cos(angle) * length;
    const targetY = py + Math.sin(angle) * length;
    ctx.lineTo(targetX, targetY);
    ctx.stroke();
    
    // Draw outer glow/indicator ring at player feet (gold)
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.9)';
    ctx.lineWidth = 3.5;
    // Removed shadowBlur to prevent lag
    ctx.beginPath();
    ctx.arc(px, py + 10, 28, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw arrowhead at target
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(targetX, targetY);
    const arrowSize = 16;
    ctx.lineTo(
      targetX - arrowSize * Math.cos(angle - Math.PI / 6),
      targetY - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      targetX - arrowSize * Math.cos(angle + Math.PI / 6),
      targetY - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }

  ctx.restore();

  if (globals.invulnTimer > 1.5 && globals.graphicsSettings !== 'low' && globals.speedLinesEnabled === 'on') {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.25)';
    ctx.lineWidth = 2;
    const px = (globals.player.x - globals.camera.x) * globals.gameZoom + globals.width/2;
    const py = (globals.player.y - globals.camera.y) * globals.gameZoom + globals.height/2;
    
    ctx.beginPath();
    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2 + Math.random() * 0.15;
      const distStart = Math.min(globals.width, globals.height) * 0.35 + Math.random() * 150;
      const distEnd = distStart + 200 + Math.random() * 100;
      ctx.moveTo(px + Math.cos(angle) * distStart, py + Math.sin(angle) * distStart);
      ctx.lineTo(px + Math.cos(angle) * distEnd, py + Math.sin(angle) * distEnd);
    }
    ctx.stroke();
    ctx.restore();
  }

  if (globals.graphicsSettings === 'low' && globals.invertScreenTimer > 0) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(0, 0, globals.width, globals.height);
  }

  if (globals.playerStats.reapersMarkLevel && globals.playerStats.reapersMarkLevel > 0 && globals.player && globals.player.state !== 'dead') {
    ctx.save();
    const hx = globals.vw - 230;
    const hy = 110;
    ctx.fillStyle = globals.reapersMarkTimer <= 5 ? '#ff3333' : '#ffaa00';
    if (globals.reapersMarkTimer <= 5 && Math.floor(performance.now() / 200) % 2 === 0) {
      ctx.fillStyle = '#ffffff';
    }
    ctx.font = "bold 15px 'Outfit', sans-serif";
    const langLabel = globals.currentLang === 'ja' ? '死神タイマー' : 'REAPER';
    ctx.fillText(`${langLabel}: ${globals.reapersMarkTimer.toFixed(1)}s [${globals.reapersMarkKills}/10 Kills]`, hx, hy);
    ctx.restore();
  }

  // Option 2: Blade Clash Visual HUD Overlay
  if (globals.activeBladeClash) {
    const clash = globals.activeBladeClash;
    const cx = (clash.x - globals.camera.x) * globals.gameZoom + globals.width / 2;
    const cy = (clash.y - globals.camera.y) * globals.gameZoom + globals.height / 2;

    ctx.save();
    // Glowing clash center point
    const pulse = 1.0 + Math.sin(performance.now() / 40) * 0.15;
    ctx.fillStyle = 'rgba(255, 215, 0, 0.45)';
    ctx.beginPath();
    ctx.arc(cx, cy, 34 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Radial timer ring
    const timerRatio = Math.max(0, clash.timer / clash.maxTimer);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy - 40, 18, -Math.PI / 2, -Math.PI / 2 + timerRatio * Math.PI * 2);
    ctx.stroke();

    // Floating Tap Prompt Pill
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = "900 16px 'Outfit', sans-serif";
    
    const promptText = `⚔️ ${globals.currentLang === 'ja' ? '攻撃連打！' : 'TAP SLASH!'} (${clash.tapsCurrent}/${clash.tapsRequired})`;
    const textWidth = ctx.measureText(promptText).width;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cx - textWidth / 2 - 12, cy - 85, textWidth + 24, 28, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffd700';
    ctx.fillText(promptText, cx, cy - 71);

    ctx.restore();
  }

  // Option 3: Aerial Cleave Indicator
  globals.enemies.forEach(e => {
    if (e.state !== 'dead' && (e as any).canAerialCleave && (e as any).airborneZ > 20) {
      ctx.save();
      const ex = (e.x - globals.camera.x) * globals.gameZoom + globals.width / 2;
      const ey = ((e.y - (e as any).airborneZ) - globals.camera.y) * globals.gameZoom + globals.height / 2;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = "bold 13px 'Outfit', sans-serif";
      const cleavePrompt = `⚡ ${globals.currentLang === 'ja' ? '空中斬り [攻撃/回避]!' : 'AERIAL CLEAVE!'}`;
      const width = ctx.measureText(cleavePrompt).width;

      ctx.fillStyle = 'rgba(14, 165, 233, 0.9)';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(ex - width / 2 - 8, ey - 50, width + 16, 24, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(cleavePrompt, ex, ey - 38);
      ctx.restore();
    }
  });
}
