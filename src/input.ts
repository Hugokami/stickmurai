import { globals } from './globals';
import { resumeAudioContext } from './audio';
import { callbacks } from './callbacks';
import { safeStorage } from './storage';

/* FIXME: Gamepad events occasionally fail to register on reload in Safari, fallback to empty array */
export function initInput() {
  // Desktop Input Setup
  window.addEventListener('keydown', e => {
    if ((window as any).activeRebindAction) {
      const action = (window as any).activeRebindAction;
      globals.keyMaps[action] = e.code;
      safeStorage.setItem('keyMaps', JSON.stringify(globals.keyMaps));
      
      const btn = (window as any).activeRebindButton;
      if (btn) {
        btn.textContent = e.code.replace('Key', '').replace('Digit', '');
        btn.classList.remove('waiting-rebind');
      }
      
      (window as any).activeRebindAction = null;
      (window as any).activeRebindButton = null;
      e.preventDefault();
      return;
    }
    
    if (globals.gameMode === 'pvp') {
      if (e.code === 'Digit1' || e.code === 'Digit2' || e.code === 'Digit3' || e.code === 'Digit4') {
        const id = parseInt(e.code.replace('Digit', ''), 10);
        callbacks.triggerPvPEmote(id);
      }
    }
    
    globals.keys[e.code] = true;
  });
  window.addEventListener('keyup', e => globals.keys[e.code] = false);
  window.addEventListener('mousemove', e => {
    globals.mouse.x = e.clientX;
    globals.mouse.y = e.clientY;
  });
  window.addEventListener('mousedown', () => { 
    globals.mouse.down = true; 
    globals.mouse.justPressed = true; 
  });
  window.addEventListener('mouseup', () => { 
    globals.mouse.down = false; 
    globals.mouse.justReleased = true; 
  });

  // Mobile Controls Bindings
  const leftTouchZone = document.getElementById('left-touch-zone')!;
  const joystickBase = document.getElementById('joystick-base')!;
  const joystickKnob = document.getElementById('joystick-knob')!;
  const btnAttack = document.getElementById('btn-attack')!;
  const btnDash = document.getElementById('btn-dash')!;
  const btnEnhance = document.getElementById('btn-enhance')!;
  const btnUlt = document.getElementById('btn-ult')!;

  let joystickActive = false;
  let joystickOriginX = 0;
  let joystickOriginY = 0;

  leftTouchZone.addEventListener('touchstart', handleJoystickStart, {passive: false});
  leftTouchZone.addEventListener('touchmove', handleJoystickMove, {passive: false});
  leftTouchZone.addEventListener('touchend', handleJoystickEnd);
  leftTouchZone.addEventListener('touchcancel', handleJoystickEnd);

  // Attack/Iaijutsu Aim Joystick Logic
  let attackTouchId: number | null = null;
  let attackTouchStartX = 0;
  let attackTouchStartY = 0;
  let attackHasDragged = false;

  btnAttack.addEventListener('touchstart', (e: TouchEvent) => { 
    e.preventDefault(); 
    const touch = e.changedTouches[0];
    attackTouchId = touch.identifier;
    attackTouchStartX = touch.clientX;
    attackTouchStartY = touch.clientY;
    attackHasDragged = false;

    globals.mobileAttackDown = true; 
    globals.mobileAttackJustPressed = true; 
    globals.mobileIaijutsuAimActive = false;
    globals.mobileIaijutsuAimAngle = globals.player?.dir === -1 ? Math.PI : 0;
  }, { passive: false });

  btnAttack.addEventListener('touchmove', (e: TouchEvent) => {
    e.preventDefault();
    if (attackTouchId === null) return;
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      if (touch.identifier === attackTouchId) {
        const dx = touch.clientX - attackTouchStartX;
        const dy = touch.clientY - attackTouchStartY;
        const dist = Math.hypot(dx, dy);
        if (dist > 15) {
          globals.mobileIaijutsuAimAngle = Math.atan2(dy, dx);
          globals.mobileIaijutsuAimActive = true;
          attackHasDragged = true;
        } else {
          globals.mobileIaijutsuAimActive = false;
        }
        break;
      }
    }
  }, { passive: false });

  btnAttack.addEventListener('touchend', (e: TouchEvent) => { 
    e.preventDefault(); 
    if (attackTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === attackTouchId) {
        if (attackHasDragged) {
          globals.useMobileIaijutsuAimAngle = true;
        }
        break;
      }
    }
    globals.mobileAttackDown = false; 
    globals.mobileAttackReleased = true; 
    globals.mobileIaijutsuAimActive = false;
    attackTouchId = null;
  }, { passive: false });

  btnAttack.addEventListener('touchcancel', (e: TouchEvent) => { 
    e.preventDefault(); 
    globals.mobileAttackDown = false; 
    globals.mobileAttackReleased = true; 
    globals.mobileIaijutsuAimActive = false;
    attackTouchId = null;
  }, { passive: false });

  // Dash Aim Joystick Logic
  let dashTouchId: number | null = null;
  let dashTouchStartX = 0;
  let dashTouchStartY = 0;
  let dashHasDragged = false;

  btnDash.addEventListener('touchstart', (e: TouchEvent) => {
    e.preventDefault();
    globals.mobileDashDown = true;
    if (globals.player && globals.player.dashCooldown > 0) {
      return;
    }
    const touch = e.changedTouches[0];
    dashTouchId = touch.identifier;
    dashTouchStartX = touch.clientX;
    dashTouchStartY = touch.clientY;
    dashHasDragged = false;
    globals.mobileDashAimActive = false;
    globals.mobileDashAimAngle = globals.player?.dir === -1 ? Math.PI : 0;
  }, { passive: false });

  btnDash.addEventListener('touchmove', (e: TouchEvent) => {
    e.preventDefault();
    if (dashTouchId === null) return;
    if (globals.player && globals.player.dashCooldown > 0) {
      globals.mobileDashAimActive = false;
      dashTouchId = null;
      return;
    }
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      if (touch.identifier === dashTouchId) {
        const dx = touch.clientX - dashTouchStartX;
        const dy = touch.clientY - dashTouchStartY;
        const dist = Math.hypot(dx, dy);
        if (dist > 15) {
          globals.mobileDashAimAngle = Math.atan2(dy, dx);
          globals.mobileDashAimActive = true;
          dashHasDragged = true;
        } else {
          globals.mobileDashAimActive = false;
        }
        break;
      }
    }
  }, { passive: false });

  btnDash.addEventListener('touchend', (e: TouchEvent) => {
    e.preventDefault();
    globals.mobileDashDown = false;
    if (dashTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === dashTouchId) {
        if (dashHasDragged) {
          globals.useMobileDashAimAngle = true;
        }
        break;
      }
    }
    globals.mobileDashAimActive = false;
    globals.mobileDashJustPressed = true;
    dashTouchId = null;
  }, { passive: false });

  btnDash.addEventListener('touchcancel', (e: TouchEvent) => {
    e.preventDefault();
    globals.mobileDashDown = false;
    dashTouchId = null;
    globals.mobileDashAimActive = false;
    globals.useMobileDashAimAngle = false;
  }, { passive: false });

  // Raijin Step Aim Joystick Logic
  let raijinTouchId: number | null = null;
  let raijinTouchStartX = 0;
  let raijinTouchStartY = 0;
  let raijinHasDragged = false;

  btnEnhance.addEventListener('touchstart', (e: TouchEvent) => {
    if ((globals.gameMode as string) === 'pvp') {
      e.preventDefault();
      globals.mobileParryJustPressed = true;
      return;
    }
    
    if (globals.selectedSkill !== 'dash' || globals.enhanceCooldown > 0 || globals.gameMode === 'zen') {
      e.preventDefault();
      globals.mobileEnhanceJustPressed = true;
      return;
    }
    
    e.preventDefault();
    const touch = e.changedTouches[0];
    raijinTouchId = touch.identifier;
    raijinTouchStartX = touch.clientX;
    raijinTouchStartY = touch.clientY;
    raijinHasDragged = false;
    globals.mobileRaijinAimActive = false;
    globals.mobileRaijinAimAngle = globals.player?.dir === -1 ? Math.PI : 0;
  }, { passive: false });

  btnEnhance.addEventListener('touchmove', (e: TouchEvent) => {
    e.preventDefault();
    if (raijinTouchId === null) return;
    if (globals.enhanceCooldown > 0) {
      globals.mobileRaijinAimActive = false;
      raijinTouchId = null;
      return;
    }
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      if (touch.identifier === raijinTouchId) {
        const dx = touch.clientX - raijinTouchStartX;
        const dy = touch.clientY - raijinTouchStartY;
        const dist = Math.hypot(dx, dy);
        if (dist > 15) {
          globals.mobileRaijinAimAngle = Math.atan2(dy, dx);
          globals.mobileRaijinAimActive = true;
          raijinHasDragged = true;
        } else {
          globals.mobileRaijinAimActive = false;
        }
        break;
      }
    }
  }, { passive: false });

  btnEnhance.addEventListener('touchend', (e: TouchEvent) => {
    e.preventDefault();
    if (raijinTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === raijinTouchId) {
        if (raijinHasDragged) {
          globals.useMobileRaijinAimAngle = true;
        }
        break;
      }
    }
    globals.mobileRaijinAimActive = false;
    globals.mobileEnhanceJustPressed = true;
    raijinTouchId = null;
  }, { passive: false });

  btnEnhance.addEventListener('touchcancel', (e: TouchEvent) => {
    e.preventDefault();
    raijinTouchId = null;
    globals.mobileRaijinAimActive = false;
    globals.useMobileRaijinAimAngle = false;
  }, { passive: false });

  btnUlt.addEventListener('touchstart', (e) => { 
    e.preventDefault(); 
    if (globals.ultCooldown > 0) return;
    globals.mobileUltJustPressed = true; 
  }, { passive: false });

  btnUlt.addEventListener('click', (e) => {
    e.preventDefault();
    if (globals.ultCooldown > 0) return;
    globals.mobileUltJustPressed = true;
  });

  function handleJoystickStart(e: TouchEvent) {
    e.preventDefault(); 
    joystickActive = true;
    globals.joystickActive = true;
    const touch = e.changedTouches[0];
    joystickOriginX = touch.clientX;
    joystickOriginY = touch.clientY;
    joystickBase.style.left = `${joystickOriginX}px`;
    joystickBase.style.top = `${joystickOriginY}px`;
    joystickBase.classList.add('active');
    updateJoystick(touch);
  }

  function handleJoystickMove(e: TouchEvent) {
    e.preventDefault(); 
    if (joystickActive) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].clientX < window.innerWidth / 2) {
          updateJoystick(e.changedTouches[i]);
        }
      }
    }
  }

  function handleJoystickEnd() {
    joystickActive = false;
    globals.joystickActive = false;
    globals.joystickVector = { x: 0, y: 0 };
    joystickKnob.style.transform = `translate(0px, 0px)`;
    joystickBase.classList.remove('active');
  }

  function updateJoystick(touch: Touch) {
    let dx = touch.clientX - joystickOriginX;
    let dy = touch.clientY - joystickOriginY;
    const distance = Math.hypot(dx, dy);
    const maxDist = 70;
    if (distance > maxDist) { 
      dx = (dx / distance) * maxDist; 
      dy = (dy / distance) * maxDist; 
    }
    joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
    globals.joystickVector.x = dx / maxDist; 
    globals.joystickVector.y = dy / maxDist;
  }

  // Audio Context Resume bindings on interact
  window.addEventListener('click', resumeAudioContext);
  window.addEventListener('touchstart', resumeAudioContext);
  window.addEventListener('keydown', resumeAudioContext);
}

// Gamepad state trackers
let prevGamepadAttack = false;
let prevGamepadDash = false;
let prevGamepadEnhance = false;
let prevGamepadUlt = false;
let prevGamepadSelect = false;
let prevGamepadPauseToggle = false;

let selectedMenuIndex = 0;
let menuMoveCooldown = 0;
let lastVisibleOverlayId = '';

const overlays = [
  'main-menu',
  'settings-screen',
  'skill-select-screen',
  'level-up-screen',
  'ult-screen',
  'pause-screen',
  'game-over'
];

export function pollGamepad() {
  const gamepads = (navigator.getGamepads ? navigator.getGamepads() : null) || [];
  // Find first active gamepad
  const gp = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3];
  if (!gp) {
    if (lastVisibleOverlayId) {
      const lastOverlay = document.getElementById(lastVisibleOverlayId);
      if (lastOverlay) {
        const items = Array.from(lastOverlay.querySelectorAll('button, .power-card, .skill-card')) as HTMLElement[];
        items.forEach(el => {
          el.style.outline = 'none';
          el.style.transform = 'none';
          el.classList.remove('gamepad-focused');
        });
      }
      lastVisibleOverlayId = '';
    }
    return;
  }

  // Get axes with deadzone
  let gpx = gp.axes[0];
  let gpy = gp.axes[1];
  if (Math.abs(gpx) < 0.15) gpx = 0;
  if (Math.abs(gpy) < 0.15) gpy = 0;

  // D-pad support for movement
  if (gp.buttons[12]?.pressed) gpy = -1; // D-pad Up
  if (gp.buttons[13]?.pressed) gpy = 1;  // D-pad Down
  if (gp.buttons[14]?.pressed) gpx = -1; // D-pad Left
  if (gp.buttons[15]?.pressed) gpx = 1;  // D-pad Right

  // Update menu navigation if overlay is open
  const visibleOverlay = overlays
    .map(id => document.getElementById(id))
    .find(el => el && (el.style.display === 'flex' || el.style.display === 'block' || (el.style.display !== 'none' && el.offsetParent !== null)));

  if (visibleOverlay) {
    if (visibleOverlay.id !== lastVisibleOverlayId) {
      if (lastVisibleOverlayId) {
        const oldOverlay = document.getElementById(lastVisibleOverlayId);
        if (oldOverlay) {
          const items = Array.from(oldOverlay.querySelectorAll('button, .power-card, .skill-card')) as HTMLElement[];
          items.forEach(el => {
            el.style.outline = 'none';
            el.style.transform = 'none';
            el.classList.remove('gamepad-focused');
          });
        }
      }
      lastVisibleOverlayId = visibleOverlay.id;
      selectedMenuIndex = 0;
      menuMoveCooldown = 0;
    }

    if (menuMoveCooldown > 0) {
      menuMoveCooldown -= 0.016;
    }

    const items = Array.from(visibleOverlay.querySelectorAll('button, .power-card, .skill-card')) as HTMLElement[];
    const visibleItems = items.filter(el => el.offsetWidth > 0 && el.offsetHeight > 0);

    if (visibleItems.length > 0) {
      if (selectedMenuIndex >= visibleItems.length) {
        selectedMenuIndex = 0;
      }

      let moveDir = 0;
      if (gpy < -0.5) moveDir = -1;
      if (gpy > 0.5) moveDir = 1;
      if (gpx < -0.5) moveDir = -1;
      if (gpx > 0.5) moveDir = 1;

      if (moveDir !== 0 && menuMoveCooldown <= 0) {
        visibleItems[selectedMenuIndex].classList.remove('gamepad-focused');
        visibleItems[selectedMenuIndex].style.outline = 'none';
        visibleItems[selectedMenuIndex].style.transform = 'none';

        selectedMenuIndex = (selectedMenuIndex + moveDir + visibleItems.length) % visibleItems.length;
        menuMoveCooldown = 0.25; // 250ms delay
      }

      // Render highlights
      visibleItems.forEach((el, idx) => {
        if (idx === selectedMenuIndex) {
          el.classList.add('gamepad-focused');
          el.style.outline = '3px solid #00ffff';
          el.style.outlineOffset = '2px';
          el.style.transform = 'scale(1.05)';
        } else {
          el.classList.remove('gamepad-focused');
          el.style.outline = 'none';
          el.style.transform = 'none';
        }
      });

      const isSelectPressed = gp.buttons[0]?.pressed; // A button / Cross
      if (isSelectPressed && !prevGamepadSelect) {
        visibleItems[selectedMenuIndex].click();
      }
      prevGamepadSelect = isSelectPressed;
      return; // Skip standard game inputs while menu is open
    }
  } else {
    if (lastVisibleOverlayId) {
      const oldOverlay = document.getElementById(lastVisibleOverlayId);
      if (oldOverlay) {
        const items = Array.from(oldOverlay.querySelectorAll('button, .power-card, .skill-card')) as HTMLElement[];
        items.forEach(el => {
          el.style.outline = 'none';
          el.style.transform = 'none';
          el.classList.remove('gamepad-focused');
        });
      }
      lastVisibleOverlayId = '';
    }
  }

  // Start/Options Button pause toggle
  const isPauseToggle = gp.buttons[9]?.pressed; // Start / Options Button
  if (isPauseToggle && !prevGamepadPauseToggle) {
    if (globals.gameState === 'playing') {
      document.getElementById('pause-btn')?.click();
    } else if (globals.gameState === 'paused') {
      document.getElementById('resume-btn')?.click();
    }
  }
  prevGamepadPauseToggle = isPauseToggle;

  
  // Left stick movement
  if (gpx !== 0 || gpy !== 0) {
    globals.joystickActive = true;
    globals.joystickVector = { x: gpx, y: gpy };
  } else {
    const hasKbdMove = globals.keys[globals.keyMaps.moveUp] || globals.keys[globals.keyMaps.moveDown] || globals.keys[globals.keyMaps.moveLeft] || globals.keys[globals.keyMaps.moveRight];
    if (!hasKbdMove) {
      globals.joystickActive = false;
    }
  }

  // Right stick aiming
  let rx = gp.axes[2];
  let ry = gp.axes[3];
  if (Math.abs(rx) > 0.25 || Math.abs(ry) > 0.25) {
    const angle = Math.atan2(ry, rx);
    // Simulate mouse position relative to player
    const dist = 200;
    globals.mouse.x = globals.vw / 2 + Math.cos(angle) * dist;
    globals.mouse.y = globals.vh / 2 + Math.sin(angle) * dist;

    globals.mobileDashAimActive = true;
    globals.mobileDashAimAngle = angle;
    globals.mobileRaijinAimActive = true;
    globals.mobileRaijinAimAngle = angle;
  } else {
    globals.mobileDashAimActive = false;
    globals.mobileRaijinAimActive = false;
  }

  // Buttons mappings
  const isAttack = gp.buttons[2]?.pressed || gp.buttons[7]?.pressed; // X / Square or RT
  const isDash = gp.buttons[0]?.pressed || gp.buttons[6]?.pressed;   // A / Cross or LT
  const isEnhance = gp.buttons[3]?.pressed || gp.buttons[5]?.pressed; // Y / Triangle or RB
  const isUlt = gp.buttons[1]?.pressed || gp.buttons[4]?.pressed;     // B / Circle or LB

  // Slash/Attack
  if (isAttack) {
    globals.mouse.down = true;
    if (!prevGamepadAttack) {
      globals.mouse.justPressed = true;
    }
  } else {
    if (prevGamepadAttack) {
      globals.mouse.down = false;
      globals.mouse.justReleased = true;
    }
  }

  // Dash
  if (isDash && !prevGamepadDash) {
    globals.keys[globals.keyMaps.dash] = true;
  } else if (!isDash && prevGamepadDash) {
    globals.keys[globals.keyMaps.dash] = false;
  }

  // Active Skill (Enhance)
  if (isEnhance && !prevGamepadEnhance) {
    globals.keys[globals.keyMaps.skill] = true;
  } else if (!isEnhance && prevGamepadEnhance) {
    globals.keys[globals.keyMaps.skill] = false;
  }

  // Ultimate (Awakening)
  if (isUlt && !prevGamepadUlt) {
    globals.keys[globals.keyMaps.ult] = true;
  } else if (!isUlt && prevGamepadUlt) {
    globals.keys[globals.keyMaps.ult] = false;
  }

  prevGamepadAttack = isAttack;
  prevGamepadDash = isDash;
  prevGamepadEnhance = isEnhance;
  prevGamepadUlt = isUlt;
}
