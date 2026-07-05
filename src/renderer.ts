import { globals } from './globals';
import { callbacks } from './callbacks';
import { bgLayers, bgImages, vfxAnims } from './assets';
import { Entity } from './entities';
import { Enemy } from './enemy';

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

let lastRenderTime = performance.now();
let frostStanceVisualScale = 0;
let voidStanceVisualScale = 0;
let petalArmorVisualScale = 0;
let riposteVisualScale = 0;

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
  
  const dprCap = globals.graphicsSettings === 'low' ? 1.0 : 1.25;
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
  ctx.fillStyle = isKamisori ? '#e5e5e5' : '#4a607a';
  ctx.fillRect(0, 0, globals.width, globals.height);
  ctx.imageSmoothingEnabled = false;

  bgLayers.forEach(layer => {
    if (globals.graphicsSettings === 'low' && layer.name !== 'sky' && layer.name !== 'stones&grass') {
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
      
      for(let x = startX; x < globals.width + imgW; x += imgW) {
        ctx.drawImage(img, x, offsetY, imgW, imgH);
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

  // Draw Gravity Well Vortex
  if (globals.gravityWellTimer > 0) {
    ctx.save();
    const gx = globals.gravityWellX - globals.camera.x + globals.vw/2;
    const gy = globals.gravityWellY - globals.camera.y + globals.vh/2;
    const baseRadius = 250 * (1 + 0.25 * (globals.playerStats.gravityRadiusLevel || 0));
    const timer = performance.now() / 1000;
    
    // gravity zone glow
    const pulse = 0.95 + Math.sin(timer * 10) * 0.05;
    const grad = ctx.createRadialGradient(gx, gy, 10, gx, gy, baseRadius * pulse);
    grad.addColorStop(0, 'rgba(138, 43, 226, 0.4)');
    grad.addColorStop(0.3, 'rgba(75, 0, 130, 0.25)');
    grad.addColorStop(0.7, 'rgba(255, 0, 127, 0.05)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(gx, gy, baseRadius * pulse, 0, Math.PI * 2);
    ctx.fill();
    
    // gravity spiral lines
    ctx.lineWidth = 3;
    // Removed shadowBlur to prevent lag
    const spiralCount = 4;
    for (let i = 0; i < spiralCount; i++) {
      ctx.strokeStyle = i % 2 === 0 ? '#ff007f' : '#8a2be2';
      ctx.beginPath();
      const startAngle = (timer * 3) + (i * Math.PI * 2 / spiralCount);
      for (let r = 20; r < baseRadius * 0.75; r += 5) {
        const theta = startAngle + (r / 50); // spiral twist
        const sx = gx + Math.cos(theta) * r;
        const sy = gy + Math.sin(theta) * r;
        if (r === 20) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }
    
    // black hole center
    // Removed shadowBlur to prevent lag
    ctx.fillStyle = '#0a0518';
    ctx.strokeStyle = '#8a2be2';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(gx, gy, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Tiny center event horizon
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(gx, gy, 16, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }

  visibleEntities.forEach(e => {
    if (e === globals.player && globals.player.state !== 'dead') {
      if (globals.playerStats.shadowClonesLevel && globals.playerStats.shadowClonesLevel > 0) {
        const cloneDelays = [18];
        if (globals.playerStats.shadowClonesLevel >= 2) {
          cloneDelays.push(36);
        }
        const originalX = globals.player.x;
        const originalY = globals.player.y;
        const originalDir = globals.player.dir;
        const originalState = globals.player.state;
        const originalFrame = globals.player.animFrame;
        
        cloneDelays.forEach(delay => {
          const historyIdx = globals.playerPosHistory.length - 1 - delay;
          if (historyIdx >= 0) {
            const hist = globals.playerPosHistory[historyIdx];
            globals.player.x = hist.x;
            globals.player.y = hist.y;
            const prevHist = globals.playerPosHistory[historyIdx - 1] || hist;
            if (hist.x !== prevHist.x) {
              globals.player.dir = hist.x < prevHist.x ? -1 : 1;
            }
            globals.player.draw(ctx, globals.camera.x, globals.camera.y, 0.45, '#aa66ff');
          }
        });
        
        globals.player.x = originalX;
        globals.player.y = originalY;
        globals.player.dir = originalDir;
        globals.player.state = originalState;
        globals.player.animFrame = originalFrame;
      }

      // stance effects
      const px = globals.player.x - globals.camera.x + globals.vw/2;
      const py = globals.player.y - globals.camera.y + globals.vh/2 - 10;
      const auraFrame = Math.floor((performance.now() / 60) % 16);

      if (riposteVisualScale > 0.01) {
        ctx.save();
        ctx.globalAlpha = riposteVisualScale * 0.7;
        const img = vfxAnims.auras.fire[auraFrame];
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, px - img.width * 1.3 / 2, py + 10 - img.height * 1.3 / 2, img.width * 1.3, img.height * 1.3);
        }
        ctx.restore();
      }

      if (frostStanceVisualScale > 0.01) {
        ctx.save();
        ctx.globalAlpha = frostStanceVisualScale * 0.6;
        const img = vfxAnims.auras.ice[auraFrame];
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, px - img.width * 1.25 / 2, py + 10 - img.height * 1.25 / 2, img.width * 1.25, img.height * 1.25);
        }
        ctx.restore();
      }

      if (voidStanceVisualScale > 0.01) {
        ctx.save();
        ctx.globalAlpha = voidStanceVisualScale * 0.6;
        const img = vfxAnims.auras.arcane[auraFrame];
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, px - img.width * 1.2 / 2, py + 10 - img.height * 1.2 / 2, img.width * 1.2, img.height * 1.2);
        }
        ctx.restore();
      }

      if (petalArmorVisualScale > 0.01) {
        ctx.save();
        ctx.globalAlpha = petalArmorVisualScale * 0.7;
        const img = vfxAnims.auras.poison[auraFrame];
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, px - img.width * 1.4 / 2, py + 10 - img.height * 1.4 / 2, img.width * 1.4, img.height * 1.4);
        }
        ctx.restore();
      }

      if (globals.gameMode === 'zen' && globals.timeSlowDuration > 0) {
        ctx.save();
        ctx.globalAlpha = 0.75;
        const img = vfxAnims.auras.holy[auraFrame];
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, px - img.width * 1.5 / 2, py + 10 - img.height * 1.5 / 2, img.width * 1.5, img.height * 1.5);
        }
        ctx.restore();
      }

      if (globals.bladeEchoesActive && globals.flowState === 'awakened') {
        const originalY = globals.player.y;
        // Top clone
        globals.player.y = originalY - 90;
        globals.player.draw(ctx, globals.camera.x, globals.camera.y, 0.4, '#00ffff');
        // Bottom clone
        globals.player.y = originalY + 90;
        globals.player.draw(ctx, globals.camera.x, globals.camera.y, 0.4, '#00ffff');
        
        globals.player.y = originalY;
      }
    }

    let alpha = 1;
    if (e.state === 'dead' && 'deadTimer' in e) {
      alpha = Math.max(0, 1 - ((e as Enemy).deadTimer / 3.0));
    } else if (e === globals.player && globals.decoyInvisibilityTimer > 0) {
      alpha = 0.35; // Translucent invisibility
    }
    
    const isKamisori = (globals.flowState === 'awakened') || (globals.flowState === 'storm_god') || (globals.zenFieldActiveTimer > 0);
    const baseTint = (e as any).colorTint || 'none';
    const tint = (isKamisori && e.state !== 'dead') ? '#121212' : (((e as any).hitFlash > 0) ? '#ffffff' : baseTint);
    e.draw(ctx, globals.camera.x, globals.camera.y, alpha, tint);
  });
  
  if (globals.sakuraPetals && globals.weatherEffectsEnabled === 'on' && globals.sakuraPetals.length > 0) {
    ctx.fillStyle = '#ffb7c5';
    globals.sakuraPetals.forEach(petal => {
      const px = petal.x - globals.camera.x + globals.vw/2;
      const py = petal.y - globals.camera.y + globals.vh/2;
      ctx.beginPath();
      ctx.ellipse(px, py, 11, 6, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  if (globals.collectibles) {
    globals.collectibles.forEach(c => c.draw(ctx, globals.camera.x, globals.camera.y));
  }

  if (globals.judgementDomes) {
    globals.judgementDomes.forEach(dome => {
      ctx.save();
      const dx = dome.x - globals.camera.x + globals.vw/2;
      const dy = dome.y - globals.camera.y + globals.vh/2;
      const radius = 180;
      
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.35)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(dx, dy, radius, 0, Math.PI * 2);
      ctx.stroke();
      
      const grad = ctx.createRadialGradient(dx, dy, 10, dx, dy, radius);
      grad.addColorStop(0, 'rgba(0, 255, 255, 0.08)');
      grad.addColorStop(1, 'rgba(0, 255, 255, 0.02)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(dx, dy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  ctx.filter = 'none';
  globals.projectiles.forEach(p => p.draw(ctx, globals.camera.x, globals.camera.y));
  if (globals.pvpShockwaves) {
    globals.pvpShockwaves.forEach(w => w.draw(ctx, globals.camera.x, globals.camera.y));
  }
  globals.slashes.forEach(s => s.draw(ctx, globals.camera.x, globals.camera.y));
  ctx.save();
  globals.particles.forEach(p => p.draw(ctx, globals.camera.x, globals.camera.y));
  ctx.restore();

  if (globals.animatedEffects) {
    let writeIdx = 0;
    for (let i = 0; i < globals.animatedEffects.length; i++) {
      const fx = globals.animatedEffects[i];
      fx.update(dt);
      if (fx.life > 0) {
        fx.draw(ctx, globals.camera.x, globals.camera.y);
        globals.animatedEffects[writeIdx++] = fx;
      }
    }
    globals.animatedEffects.length = writeIdx;
  }

  // Draw lightning beams and shockwaves with additive composition for premium glow aesthetics
  const hasAdditiveEffects = (globals.lightningBeams && globals.lightningBeams.length > 0) || (globals.shockwaves && globals.shockwaves.length > 0);
  if (hasAdditiveEffects) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    if (globals.lightningBeams) {
      globals.lightningBeams.forEach(lb => lb.draw(ctx, globals.camera.x, globals.camera.y));
    }
    globals.shockwaves.forEach(s => s.draw(ctx, globals.camera.x, globals.camera.y));
    ctx.restore();
  }
  globals.floatingTexts.forEach(f => f.draw(ctx, globals.camera.x, globals.camera.y));

  // Draw PvP Storm Mode lightning warning indicators
  if (globals.gameState === 'game' && globals.gameMode === 'pvp' && globals.pvpStormWarningTarget) {
    const targetX = globals.pvpStormWarningTarget === 'left' ? 300 : 1100;
    const rx = targetX - globals.camera.x + globals.vw / 2;
    ctx.save();
    
    // Flashing neon red warning column
    const flash = Math.sin(performance.now() * 0.035) * 0.5 + 0.5;
    ctx.strokeStyle = `rgba(239, 68, 68, ${0.12 + flash * 0.28})`;
    ctx.lineWidth = 24;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(rx, 0);
    ctx.lineTo(rx, globals.vh);
    ctx.stroke();

    // Warning text
    ctx.fillStyle = '#ef4444';
    ctx.font = "bold 13px 'Orbitron', sans-serif";
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 10;
    ctx.fillText("⚡ WARNING: LIGHTNING INCOMING ⚡", rx, 140 + Math.sin(performance.now() * 0.01) * 3);
    
    ctx.restore();
  }

  if (globals.weatherEngine) {
    globals.weatherEngine.draw(ctx, globals.camera.x, globals.camera.y);
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
}
