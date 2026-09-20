const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

test('Mobile Audio Startup Invariants: Web Audio Hardware Wake, Touch/Pointer Listeners & Android Settings', async (t) => {
  const audioTs = fs.readFileSync(path.join(__dirname, '../src/audio.ts'), 'utf8');
  const inputTs = fs.readFileSync(path.join(__dirname, '../src/input.ts'), 'utf8');
  const uiTs = fs.readFileSync(path.join(__dirname, '../src/ui.ts'), 'utf8');
  const mainTs = fs.readFileSync(path.join(__dirname, '../src/main.ts'), 'utf8');
  const mainScreenKt = fs.readFileSync(
    path.join(__dirname, '../android/app/src/main/java/com/lyan/stickmurai/ui/main/MainScreen.kt'),
    'utf8'
  );

  await t.test('audio.ts executes silent buffer poke to awaken iOS Safari hardware clock', () => {
    assert.match(
      audioTs,
      /ctx\.createBuffer\(1,\s*1,\s*22050\)/,
      'resumeAudioContext must create a 1-sample silent buffer for iOS Safari audio hardware unlock'
    );
    assert.match(
      audioTs,
      /source\.connect\(ctx\.destination\)/,
      'silent buffer source must connect to ctx.destination to open hardware audio pipeline'
    );
    assert.match(
      audioTs,
      /source\.start\(0\)/,
      'silent buffer source must start(0) to activate Web Audio clock'
    );
  });

  await t.test('audio.ts playSound connects buffer source without discarding when context is resuming', () => {
    assert.doesNotMatch(
      audioTs,
      /if\s*\(\s*ctx\.state\s*===\s*'running'\s*\)\s*\{\s*const source = ctx\.createBufferSource\(\)/,
      'playSound must not abandon Web Audio buffer playback when ctx is still transitioning/suspended'
    );
    assert.match(
      audioTs,
      /const source = ctx\.createBufferSource\(\);[\s\S]*?source\.buffer = buffer;[\s\S]*?source\.start\(0\);/,
      'playSound must queue buffer on Web Audio graph directly'
    );
  });

  await t.test('audio.ts triggerBgmGestureUnlock ensures BGM unmuted and started', () => {
    assert.match(
      audioTs,
      /export function triggerBgmGestureUnlock\(\)/,
      'triggerBgmGestureUnlock must be exported'
    );
    assert.match(
      audioTs,
      /bgmAudio\.muted\s*=\s*false/,
      'triggerBgmGestureUnlock must ensure bgmAudio.muted is false'
    );
  });

  await t.test('input.ts hooks audio unlock into combat gestures and window capture listeners', () => {
    assert.match(
      inputTs,
      /import\s*\{[^}]*triggerBgmGestureUnlock[^}]*\}\s*from\s*'\.\/audio'/,
      'input.ts must import triggerBgmGestureUnlock'
    );
    assert.match(
      inputTs,
      /handleJoystickStart[\s\S]*?wakeAudio\(\)/,
      'joystick start must trigger audio wake'
    );
    assert.match(
      inputTs,
      /btnAttack\.addEventListener\('touchstart'[\s\S]*?wakeAudio\(\)/,
      'attack touchstart must trigger audio wake'
    );
    assert.match(
      inputTs,
      /btnAttack\.addEventListener\('touchend'[\s\S]*?wakeAudio\(\)/,
      'attack touchend must trigger audio wake'
    );
    assert.match(
      inputTs,
      /btnDash\.addEventListener\('touchstart'[\s\S]*?wakeAudio\(\)/,
      'dash touchstart must trigger audio wake'
    );
    assert.match(
      inputTs,
      /btnDash\.addEventListener\('touchend'[\s\S]*?wakeAudio\(\)/,
      'dash touchend must trigger audio wake'
    );
    assert.match(
      inputTs,
      /btnEnhance\.addEventListener\('touchstart'[\s\S]*?wakeAudio\(\)/,
      'enhance touchstart must trigger audio wake'
    );
    assert.match(
      inputTs,
      /btnEnhance\.addEventListener\('touchend'[\s\S]*?wakeAudio\(\)/,
      'enhance touchend must trigger audio wake'
    );
    assert.match(
      inputTs,
      /window\.addEventListener\('touchend',\s*wakeAudio,\s*\{\s*capture:\s*true/,
      'window must capture touchend to wake audio'
    );
    assert.match(
      inputTs,
      /window\.addEventListener\('pointerup',\s*wakeAudio,\s*\{\s*capture:\s*true/,
      'window must capture pointerup to wake audio'
    );
  });

  await t.test('ui.ts bindDualListener captures pointerup and touchend for WebKit user activation', () => {
    assert.match(
      uiTs,
      /el\.addEventListener\('touchend',/,
      'bindDualListener must attach touchend listener to guarantee audio unlock in WebKit'
    );
    assert.match(
      uiTs,
      /el\.addEventListener\('pointerup',/,
      'bindDualListener must attach pointerup listener to guarantee audio unlock in WebKit'
    );
    assert.match(
      uiTs,
      /handleDismiss\s*=\s*\(\)\s*=>\s*\{[\s\S]*?triggerBgmGestureUnlock\(\);/,
      'tutorial modal dismissal must trigger audio unlock'
    );
  });

  await t.test('main.ts loader screen and rotate prompt trigger audio unlock across touch events', () => {
    assert.match(
      mainTs,
      /loaderScreen\.addEventListener\('touchend',\s*onContinue\)/,
      'loaderScreen must listen to touchend for mobile audio unlock'
    );
    assert.match(
      mainTs,
      /loaderScreen\.addEventListener\('pointerup',\s*onContinue\)/,
      'loaderScreen must listen to pointerup for mobile audio unlock'
    );
    assert.match(
      mainTs,
      /dismissRotate[\s\S]*?triggerBgmGestureUnlock\(\);/,
      'dismissRotate must trigger audio unlock'
    );
  });

  await t.test('MainScreen.kt disables mediaPlaybackRequiresUserGesture in Android WebView settings', () => {
    assert.match(
      mainScreenKt,
      /mediaPlaybackRequiresUserGesture\s*=\s*false/,
      'Android WebView WebSettings must disable mediaPlaybackRequiresUserGesture'
    );
  });
});
