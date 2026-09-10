import { globals } from './globals';
import { callbacks } from './callbacks';
import { bgLayers, bgImages, vfxAnims } from './assets';
import { Entity } from './entities';
import { reducedMotion } from './comfort';
import { drawCombatHazards } from './combatPolish';

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let currentDpr = 1;

let lastRenderTime = performance.now();
let frostStanceVisualScale = 0;
let voidStanceVisualScale = 0;
let petalArmorVisualScale = 0;
let riposteVisualScale = 0;



const visibleEntities: Entity[] = [];

function getEntityFootY(e: Entity): number {
  let baseFoot = 62;
  switch (e.type) {
    case 'boss_agis': baseFoot = 143; break;
    case 'boss_skeleton': baseFoot = 44; break;
    case 'enemy_barrel': baseFoot = 42; break;
    case 'enemy02': baseFoot = 39; break;
    case 'skeleton': baseFoot = 38; break;
    case 'enemy01': baseFoot = 35; break;
    case 'evil_wizard': baseFoot = 33; break;
    case 'heroluneblade': baseFoot = 30; break;
    case 'enemy_orc': baseFoot = 27; break;
    case 'enemy05': baseFoot = 18; break;
    case 'enemy03': baseFoot = 17; break;
    case 'heroninja': baseFoot = 48; break;
    case 'heronightborne': baseFoot = 52; break;
    case 'herosamurai': baseFoot = 56; break;
    case 'herosatyr': baseFoot = 46; break;
    case 'heroakakage': baseFoot = 52; break;
    case 'toaster_bot': baseFoot = 20; break;
    case 'sword':
    default:
      baseFoot = 62;
      break;
  }
  return e.y + baseFoot * (e.scaleMult || 1);
}

const depthCompare = (a: Entity, b: Entity) => getEntityFootY(a) - getEntityFootY(b);



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
  currentDpr = Math.min(window.devicePixelRatio || 1, dprCap);
  
  canvas.width = globals.width * currentDpr;
  canvas.height = globals.height * currentDpr;
  ctx.setTransform(currentDpr, 0, 0, currentDpr, 0, 0);

  const targetVW = 1650;
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
  {
    // 1. Permanent Radiant Daylight Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, globals.height * 0.72);
    skyGrad.addColorStop(0, '#38bdf8'); // Clear brilliant azure sky
    skyGrad.addColorStop(0.55, '#7dd3fc'); // Gentle sunlit sky blue
    skyGrad.addColorStop(1, '#bae6fd'); // Warm horizon haze
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, globals.width, globals.height);

    // 2. Sunlit Day Sun with Soft Halo
    const sunX = (globals.width * 0.82) | 0;
    const sunY = (globals.height * 0.18) | 0;
    const sunRadius = 40;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.4, sunX, sunY, sunRadius * 2.6);
    sunGlow.addColorStop(0, 'rgba(255, 255, 240, 0.95)');
    sunGlow.addColorStop(0.35, 'rgba(254, 240, 138, 0.4)');
    sunGlow.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius * 2.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fffbeb';
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fill();

    // 3. Guaranteed Lush Green Ground Fallback (prevents black screen voids if assets take time to render)
    const groundTop = (globals.height * 0.56) | 0;
    const groundGrad = ctx.createLinearGradient(0, groundTop, 0, globals.height);
    groundGrad.addColorStop(0, '#5a8f29');
    groundGrad.addColorStop(1, '#365314');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundTop, globals.width, globals.height - groundTop);
  }
  ctx.imageSmoothingEnabled = false;

  const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  bgLayers.forEach(layer => {
    // Skip dark night sky layer in permanent bright day mode
    if (layer.name === 'sky') {
      return;
    }
    const isGroundLayer = layer.name === 'stones&grass' || layer.name === 'stones_grass';
    const isTreesLayer = layer.name === 'hills&trees' || layer.name === 'hills_trees';

    if (globals.graphicsSettings === 'low' && !isGroundLayer) {
      return;
    }
    if (isTouch && !isTreesLayer && !isGroundLayer) {
      return;
    }

    const img = bgImages[layer.name] || ((layer as any).fallbackName && bgImages[(layer as any).fallbackName]);
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save();
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
      
      if (isGroundLayer) {
        // Ground layer tiles infinitely across entire lower screen
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
      }
      ctx.restore();
    }
  });
}

export function resetCanvasVisuals() {
  if (!canvas || !ctx) return;
  ctx.save();
  ctx.setTransform(currentDpr, 0, 0, currentDpr, 0, 0);
  ctx.fillStyle = '#090a0f';
  ctx.fillRect(0, 0, globals.width, globals.height);
  ctx.restore();
}

export function draw() {
  if (!canvas || !ctx) return;
  
  if (canvas.style.filter !== 'none' && canvas.style.filter !== '') {
    canvas.style.filter = 'none';
  }

  // Always reset to current DPR transform so canvas buffer is never desynced or scaled down
  ctx.setTransform(currentDpr, 0, 0, currentDpr, 0, 0);

  if (globals.gameState === 'mainmenu') {
    ctx.fillStyle = '#090a0f';
    ctx.fillRect(0, 0, globals.width, globals.height);
    return;
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

  // Boss locator: keep the player oriented during boss stages without darkening the scene.
  const boss = globals.enemies.find(e => e.state !== 'dead' && ['oni_boss','shogun_boss','agis_colossus','skeleton_warlord'].includes(e.subType));
  const locator = document.getElementById('boss-location-indicator');
  if (locator) {
    if (boss && globals.gameState === 'playing') {
      const dx = boss.x - globals.player.x, dy = boss.y - globals.player.y;
      const dist = Math.round(Math.hypot(dx, dy));
      const visible = Math.abs(dx) < globals.vw * .45 && Math.abs(dy) < globals.vh * .45;
      locator.hidden = visible;
      if (!visible) {
        const angle = Math.atan2(dy, dx);
        locator.textContent = `BOSS  ${dist}m  ${angle > -Math.PI/2 && angle < Math.PI/2 ? '▶' : '◀'}`;
        locator.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
      }
    } else locator.hidden = true;
  }

  // Lift the atmospheric high-quality background before gameplay is drawn.
  if (globals.graphicsSettings !== 'low') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.fillRect(0, 0, globals.width, globals.height);
  }

  ctx.save();
  ctx.scale(globals.gameZoom, globals.gameZoom);
  drawCombatHazards(ctx);
  
  const vignette = document.getElementById('vignette-overlay');
  if (vignette) {
    if (globals.lives === 1 && globals.gameState === 'playing' && globals.player && globals.player.state !== 'dead') {
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
  if (globals.player) {
    visibleEntities.push(globals.player);
  }
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
    globals.groundScars.forEach(s => {
      if (s && typeof s.draw === 'function') {
        s.draw(ctx, globals.camera.x, globals.camera.y);
      }
    });
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
    const gx = (globals.gravityWellX - globals.camera.x + globals.vw / 2) | 0;
    const gy = (globals.gravityWellY - globals.camera.y + globals.vh / 2) | 0;
    const baseRadius = (420 * (1 + 0.25 * (globals.playerStats.gravityRadiusLevel || 0))) | 0;
    const timer = performance.now() / 1000;
    const isSingularity = globals.activeFusions.has('singularity_cleave');

    // 1. High-Visibility Event Horizon Area Glow
    const pulse = 1.0 + Math.sin(timer * 10) * 0.04;
    const currentRadius = (baseRadius * pulse) | 0;
    const glowGrad = ctx.createRadialGradient(gx, gy, 20, gx, gy, currentRadius);
    glowGrad.addColorStop(0, 'rgba(15, 2, 28, 0.92)');
    glowGrad.addColorStop(0.35, isSingularity ? 'rgba(88, 28, 135, 0.45)' : 'rgba(107, 33, 168, 0.35)');
    glowGrad.addColorStop(0.75, isSingularity ? 'rgba(147, 51, 234, 0.25)' : 'rgba(126, 34, 206, 0.2)');
    glowGrad.addColorStop(1, 'rgba(192, 132, 252, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(gx, gy, currentRadius, 0, Math.PI * 2);
    ctx.fill();

    // 2. High-Contrast Event Horizon Perimeter Ring with Orbiting Runic Notches
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.85)';
    ctx.beginPath();
    ctx.arc(gx, gy, currentRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Secondary pulsing inner barrier ring
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.6)';
    ctx.beginPath();
    ctx.arc(gx, gy, (currentRadius * 0.75) | 0, 0, Math.PI * 2);
    ctx.stroke();

    // Orbiting perimeter notches showing active gravitational pull
    const notchCount = 12;
    for (let n = 0; n < notchCount; n++) {
      const nAngle = timer * 1.5 + (n * Math.PI * 2 / notchCount);
      const nx1 = gx + Math.cos(nAngle) * (currentRadius - 10);
      const ny1 = gy + Math.sin(nAngle) * (currentRadius - 10);
      const nx2 = gx + Math.cos(nAngle) * (currentRadius + 6);
      const ny2 = gy + Math.sin(nAngle) * (currentRadius + 6);
      ctx.beginPath();
      ctx.moveTo(nx1 | 0, ny1 | 0);
      ctx.lineTo(nx2 | 0, ny2 | 0);
      ctx.strokeStyle = n % 2 === 0 ? '#c084fc' : '#f472b6';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // 3. Inward-Spiraling Gravitational Suction Vectors
    const streamCount = 8;
    ctx.lineWidth = 2.0;
    for (let s = 0; s < streamCount; s++) {
      const startAngle = (timer * 3.5) + (s * Math.PI * 2 / streamCount);
      ctx.strokeStyle = s % 2 === 0 ? 'rgba(192, 132, 252, 0.75)' : 'rgba(244, 114, 182, 0.65)';
      ctx.beginPath();
      for (let step = 0; step <= 10; step++) {
        const ratio = step / 10;
        const r = currentRadius * (1 - ratio * 0.85);
        const theta = startAngle + ratio * 2.2;
        const px = gx + Math.cos(theta) * r;
        const py = gy + Math.sin(theta) * r;
        if (step === 0) ctx.moveTo(px | 0, py | 0);
        else ctx.lineTo(px | 0, py | 0);
      }
      ctx.stroke();
    }

    // 4. Animated 32-Frame Cosmic Singularity Core Sprite
    const singularityFrames = (vfxAnims as any).skills?.gravitySingularity?.length > 0
      ? (vfxAnims as any).skills.gravitySingularity
      : ((vfxAnims as any).skills?.voidWarp || vfxAnims.custom.vortex);
    if (singularityFrames && singularityFrames.length > 0) {
      const sfFrameIdx = Math.floor((performance.now() / 45) % singularityFrames.length);
      const sImg = singularityFrames[sfFrameIdx];
      if (sImg && sImg.complete && sImg.naturalWidth > 0) {
        const sfScale = 2.4 * (1 + 0.25 * (globals.playerStats.gravityRadiusLevel || 0));
        const drawW = (sImg.width * sfScale) | 0;
        const drawH = (sImg.height * sfScale) | 0;
        ctx.drawImage(sImg, (gx - drawW / 2) | 0, (gy - drawH / 2) | 0, drawW, drawH);
      }
    }

    // 5. Central Opaque Void Sphere & Relativistic Glow
    ctx.fillStyle = '#020005';
    ctx.beginPath();
    ctx.arc(gx, gy, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e879f9';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.restore();
  }

  visibleEntities.forEach(e => {
    if (!e) return;
    if (e === globals.player && globals.player && globals.player.state !== 'dead') {
      if (globals.playerStats?.shadowClonesLevel && globals.playerStats.shadowClonesLevel > 0) {
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
      let offsetX = 0;
      let offsetY = 17;
      if (globals.player.state === 'idle' || globals.player.state === 'charge') {
        offsetX = -15 * globals.player.dir;
        offsetY = 22;
      } else if (globals.player.state === 'attack') {
        offsetX = -5 * globals.player.dir;
        offsetY = 20;
      }

      const px = (globals.player.x - globals.camera.x + globals.vw/2 + offsetX) | 0;
      const py = (globals.player.y - globals.camera.y + globals.vh/2 + (globals.player.yOffset || 0) + offsetY - 17) | 0;
      const auraTime = performance.now() / 1000;

      if (riposteVisualScale > 0.01) {
        ctx.save();
        ctx.strokeStyle = `rgba(255, 0, 85, ${0.7 * riposteVisualScale})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        const r = (32 + Math.sin(auraTime * 20) * 4) * (0.6 + 0.4 * riposteVisualScale);
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (frostStanceVisualScale > 0.01) {
        ctx.save();
        ctx.strokeStyle = `rgba(0, 229, 255, ${0.4 * frostStanceVisualScale})`;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        const r = (28 + Math.sin(auraTime * 6) * 2) * (0.6 + 0.4 * frostStanceVisualScale);
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (voidStanceVisualScale > 0.01) {
        ctx.save();
        ctx.strokeStyle = `rgba(192, 132, 252, ${0.4 * voidStanceVisualScale})`;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.setLineDash([4, 6]);
        const r = 24 * (0.6 + 0.4 * voidStanceVisualScale);
        ctx.arc(px, py, r, -auraTime * 2, -auraTime * 2 + Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (petalArmorVisualScale > 0.01) {
        ctx.save();
        ctx.strokeStyle = `rgba(255, 183, 197, ${0.65 * petalArmorVisualScale})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.setLineDash([6, 8]);
        const r = 32 * (0.6 + 0.4 * petalArmorVisualScale);
        ctx.arc(px, py, r, auraTime, auraTime + Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (globals.gameMode === 'zen' && globals.timeSlowDuration > 0) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.75)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.arc(px, py, 42 + Math.sin(auraTime * 8) * 4, -auraTime * 1.2, -auraTime * 1.2 + Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Dragon's Fury Active Animation Loop (programmatic energy aura and rotating blades)
      const isDragonFuryActive = globals.selectedSkill === 'enhance' && globals.enhanceActiveTimer > 0;
      if (isDragonFuryActive) {
        ctx.save();
        const pulse = 1.0 + Math.sin(auraTime * 15) * 0.08;
        
        // 1. Draw glowing background aura
        ctx.fillStyle = 'rgba(192, 132, 252, 0.22)';
        ctx.beginPath();
        ctx.arc(px, py, 45 * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // 2. Draw rotating runic ring
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 12]);
        ctx.beginPath();
        ctx.arc(px, py, 38, auraTime * 3, auraTime * 3 + Math.PI * 2);
        ctx.stroke();
        
        // 3. Draw rotating glowing dragon fury crescent blades (representing extra slash strikes)
        const bladeCount = 3;
        ctx.lineWidth = 3.5;
        for (let i = 0; i < bladeCount; i++) {
          const angle = (auraTime * 5) + (i * Math.PI * 2 / bladeCount);
          ctx.strokeStyle = i % 2 === 0 ? 'rgba(192, 132, 252, 0.95)' : 'rgba(236, 72, 153, 0.95)';
          
          ctx.beginPath();
          ctx.arc(px, py, 30 + Math.sin(auraTime * 10 + i) * 3, angle, angle + 0.6);
          ctx.stroke();
        }
        
        ctx.restore();
      }

      // Invincibility Duration Animation Loop (shield/spells around player)
      if (globals.invulnTimer > 0) {
        ctx.save();
        ctx.globalAlpha = 0.65;
        const invFrames = vfxAnims.custom.invincible;
        const invFrameIdx = Math.floor((performance.now() / 50) % invFrames.length);
        const img = invFrames[invFrameIdx];
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, (px - img.width * 1.4 / 2) | 0, (py - img.height * 1.4 / 2) | 0, (img.width * 1.4) | 0, (img.height * 1.4) | 0);
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
      alpha = Math.max(0, 1 - ((e as any).deadTimer / 3.0));
    } else if (e === globals.player && globals.decoyInvisibilityTimer > 0) {
      alpha = 0.35; // Translucent invisibility
    }
    
    const baseTint = (e as any).colorTint || 'none';
    const tint = ((e as any).hitFlash > 0) ? '#ffffff' : baseTint;
    if (typeof e.draw === 'function') {
      e.draw(ctx, globals.camera.x, globals.camera.y, alpha, tint);
    }
  });
  
  if (globals.sakuraPetals && globals.weatherEffectsEnabled === 'on' && globals.sakuraPetals.length > 0) {
    ctx.fillStyle = '#ffb7c5';
    globals.sakuraPetals.forEach(petal => {
      const px = (petal.x - globals.camera.x + globals.vw/2) | 0;
      const py = (petal.y - globals.camera.y + globals.vh/2) | 0;
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
      const dx = (dome.x - globals.camera.x + globals.vw/2) | 0;
      const dy = (dome.y - globals.camera.y + globals.vh/2) | 0;
      const radius = 180;
      
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.35)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(dx, dy, radius, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.fillStyle = 'rgba(0, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.arc(dx, dy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  globals.projectiles.forEach(p => p.draw(ctx, globals.camera.x, globals.camera.y));
  if (globals.pvpShockwaves) {
    globals.pvpShockwaves.forEach(w => w.draw(ctx, globals.camera.x, globals.camera.y));
  }
  globals.slashes.forEach(s => s.draw(ctx, globals.camera.x, globals.camera.y));
  ctx.save();
  globals.particles.forEach(p => p.draw(ctx, globals.camera.x, globals.camera.y));
  ctx.restore();

  if (globals.animatedEffects && globals.animatedEffects.length > 0) {
    for (let i = 0; i < globals.animatedEffects.length; i++) {
      globals.animatedEffects[i].draw(ctx, globals.camera.x, globals.camera.y);
    }
  }

  // Draw lightning beams with additive composition for glow aesthetics
  if (globals.lightningBeams && globals.lightningBeams.length > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    globals.lightningBeams.forEach(lb => lb.draw(ctx, globals.camera.x, globals.camera.y));
    ctx.restore();
  }

  // Draw shockwaves smoothly without breaking canvas batching
  if (globals.shockwaves && globals.shockwaves.length > 0) {
    globals.shockwaves.forEach(s => s.draw(ctx, globals.camera.x, globals.camera.y));
  }
  globals.floatingTexts.forEach(f => f.draw(ctx, globals.camera.x, globals.camera.y));

  // Draw PvP Storm Mode lightning warning indicators
  if (globals.gameState === 'game' && globals.gameMode === 'pvp' && globals.pvpStormWarningTarget) {
    const targetX = globals.pvpStormWarningTarget === 'left' ? 300 : 1100;
    const rx = (targetX - globals.camera.x + globals.vw / 2) | 0;
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

  if (!reducedMotion() && globals.invulnTimer > 1.5 && globals.graphicsSettings !== 'low' && globals.speedLinesEnabled === 'on') {
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

  if (!reducedMotion() && globals.graphicsSettings === 'low' && globals.invertScreenTimer > 0) {
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

  // Mechanic 3: Screen-Top Boss Health & Sekiro Posture / Stagger Bar HUD
  if (globals.gameState === 'playing') {
    const activeBoss = globals.enemies.find(e => e.state !== 'dead' && (
      e.subType === 'oni_boss' || 
      e.subType === 'agis_colossus' || 
      e.subType === 'skeleton_warlord' || 
      e.subType === 'shogun_boss' || 
      (e as any).isBoss
    ));

    if (activeBoss) {
      ctx.save();
      const barW = Math.min(420, (globals.width * 0.72) | 0);
      const barX = ((globals.width - barW) / 2) | 0;
      const barY = 52;
      const hpH = 12;
      const postureH = 6;
      const isJa = globals.currentLang === 'ja';

      let bossName = isJa ? '強敵 (BOSS)' : 'BOSS ENCOUNTER';
      if (activeBoss.subType === 'oni_boss') {
        bossName = isJa ? '👹 鬼の頭領 (ONI OVERLORD)' : '👹 ONI OVERLORD';
      } else if (activeBoss.subType === 'agis_colossus') {
        bossName = isJa ? '🗿 巨神アギス (AGIS COLOSSUS)' : '🗿 AGIS COLOSSUS';
      } else if (activeBoss.subType === 'skeleton_warlord') {
        bossName = isJa ? '💀 骸骨軍団長 (SKELETON WARLORD)' : '💀 SKELETON WARLORD';
      } else if (activeBoss.subType === 'shogun_boss') {
        bossName = isJa ? '⚔️ 征夷大将軍 (SUPREME SHOGUN)' : '⚔️ SUPREME SHOGUN';
      }

      // Boss Name & Title Banner
      ctx.textAlign = 'center';
      ctx.font = "bold 13px 'Shojumaru', 'Noto Sans JP', sans-serif";
      ctx.fillStyle = '#ffd700';
      ctx.fillText(bossName, (globals.width / 2) | 0, barY - 8);

      // Outer Container Box
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(barX - 4, barY - 4, barW + 8, hpH + postureH + 12, 6);
      ctx.fill();
      ctx.stroke();

      // 1. Boss HP Bar Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(barX, barY, barW, hpH);

      // Delayed catch-up orange bar
      const delayRatio = Math.max(0, Math.min(1, (activeBoss.hpDelayed || activeBoss.hp) / activeBoss.maxHp));
      ctx.fillStyle = '#f97316';
      ctx.fillRect(barX, barY, (barW * delayRatio) | 0, hpH);

      // Main Crimson HP Fill
      const hpRatio = Math.max(0, Math.min(1, activeBoss.hp / activeBoss.maxHp));
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(barX, barY, (barW * hpRatio) | 0, hpH);

      // HP numerical text
      ctx.font = "bold 9px 'Orbitron', monospace";
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${activeBoss.hp} / ${activeBoss.maxHp}`, (globals.width / 2) | 0, barY + 9);

      // 2. Sekiro-Style Orange Posture / Stagger Bar (directly under HP)
      const postY = barY + hpH + 3;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(barX, postY, barW, postureH);

      if (activeBoss.postureBrokenTimer > 0) {
        // Flashing Stagger Break!
        const isFlash = (Math.floor(Date.now() / 120) % 2 === 0);
        ctx.fillStyle = isFlash ? '#ff003c' : '#fbbf24';
        ctx.fillRect(barX, postY, barW, postureH);

        ctx.font = "900 11px 'Outfit', sans-serif";
        ctx.fillStyle = isFlash ? '#ffffff' : '#fbbf24';
        ctx.fillText(isJa ? '💥 体幹崩壊！ 処刑可能 [EXECUTE]!' : '💥 STAGGER BREAK! EXECUTE READY!', (globals.width / 2) | 0, postY + 18);
      } else {
        const postMax = activeBoss.maxPosture || 100;
        const postRatio = Math.max(0, Math.min(1, (activeBoss.posture || 0) / postMax));
        
        // Symmetrical center-outward fill (classic Sekiro stagger gauge)
        const fillW = ((barW / 2) * postRatio) | 0;
        const midX = (barX + barW / 2) | 0;
        
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(midX - fillW, postY, fillW * 2, postureH);
        
        // Posture bar subtle border
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, postY, barW, postureH);

        // Center line
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillRect(midX - 1, postY - 1, 2, postureH + 2);
      }

      ctx.restore();
    }
  }
}
