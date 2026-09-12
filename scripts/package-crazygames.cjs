const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const releaseDir = path.join(rootDir, 'release');
const html5Zip = path.join(releaseDir, 'stickmurai-html5.zip');
const crazyZip = path.join(releaseDir, 'stickmurai-crazygames.zip');

if (!fs.existsSync(html5Zip)) {
  console.log('Building base HTML5 release first...');
  execSync('npm run package:html5', { cwd: rootDir, stdio: 'inherit' });
}

console.log('\n--- Creating CrazyGames specialized release ---');

const pythonScript = `
import zipfile, os, re, sys

src_zip = sys.argv[1]
target_zip = sys.argv[2]

bridge_script = """
<!-- CrazyGames SDK v3 -->
<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>
<script>
(function() {
  var sdk = null;
  var isCrazyMuted = false;

  // 1. Data Module Storage Bridge (syncs safeStorage & localStorage to CrazyGames cloud)
  var origSetItem = Storage.prototype.setItem;
  var origGetItem = Storage.prototype.getItem;
  var origRemoveItem = Storage.prototype.removeItem;

  Storage.prototype.setItem = function(key, value) {
    origSetItem.call(this, key, value);
    try {
      if (this === window.localStorage && sdk && sdk.data && typeof sdk.data.setItem === 'function') {
        sdk.data.setItem(key, String(value));
      }
    } catch(e) {}
  };

  Storage.prototype.getItem = function(key) {
    try {
      if (this === window.localStorage && sdk && sdk.data && typeof sdk.data.getItem === 'function') {
        var cloudVal = sdk.data.getItem(key);
        if (cloudVal !== null && cloudVal !== undefined) {
          return cloudVal;
        }
      }
    } catch(e) {}
    return origGetItem.call(this, key);
  };

  Storage.prototype.removeItem = function(key) {
    origRemoveItem.call(this, key);
    try {
      if (this === window.localStorage && sdk && sdk.data && typeof sdk.data.removeItem === 'function') {
        sdk.data.removeItem(key);
      }
    } catch(e) {}
  };

  // 2. Audio Muting Bridge (honors CrazyGames muteAudio setting)
  function applyCrazyMute(muted) {
    isCrazyMuted = !!muted;
    try {
      var audios = document.querySelectorAll('audio');
      audios.forEach(function(a) { a.muted = isCrazyMuted; });
    } catch(e) {}
  }

  var origAudioPlay = HTMLAudioElement.prototype.play;
  HTMLAudioElement.prototype.play = function() {
    if (isCrazyMuted) {
      this.muted = true;
    }
    return origAudioPlay.apply(this, arguments);
  };

  // 3. Prevent spacebar / arrow keys page scrolling inside iframe
  window.addEventListener('keydown', function(e) {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      e.preventDefault();
    }
  }, { passive: false });

  // 4. Initialize CrazyGames SDK v3
  function initCrazySDK() {
    if (window.CrazyGames && window.CrazyGames.SDK) {
      sdk = window.CrazyGames.SDK;
      sdk.init().then(function() {
        console.log('[CrazyGames] SDK initialized successfully.');

        if (sdk.game && sdk.game.sdkGameLoadingStart) {
          sdk.game.sdkGameLoadingStart();
        }

        if (sdk.game && sdk.game.onSettingsChanged) {
          sdk.game.onSettingsChanged(function(settings) {
            if (settings && typeof settings.muteAudio === 'boolean') {
              applyCrazyMute(settings.muteAudio);
            }
          });
        }
        if (sdk.game && sdk.game.settings && typeof sdk.game.settings.muteAudio === 'boolean') {
          applyCrazyMute(sdk.game.settings.muteAudio);
        }

        var loader = document.getElementById('loader-screen');
        if (loader) {
          var loaderObserver = new MutationObserver(function() {
            if (loader.style.display === 'none' || loader.classList.contains('hidden')) {
              if (sdk.game && sdk.game.sdkGameLoadingStop) {
                sdk.game.sdkGameLoadingStop();
              }
              loaderObserver.disconnect();
            }
          });
          loaderObserver.observe(loader, { attributes: true, attributeFilter: ['style', 'class'] });
        }

        var startBtn = document.getElementById('start-btn');
        if (startBtn) {
          startBtn.addEventListener('click', function() {
            if (sdk.game && sdk.game.gameplayStart) sdk.game.gameplayStart();
          });
        }

        var pauseModal = document.getElementById('pause-modal');
        if (pauseModal) {
          new MutationObserver(function() {
            if (pauseModal.style.display !== 'none') {
              if (sdk.game && sdk.game.gameplayStop) sdk.game.gameplayStop();
            } else {
              if (sdk.game && sdk.game.gameplayStart) sdk.game.gameplayStart();
            }
          }).observe(pauseModal, { attributes: true, attributeFilter: ['style'] });
        }

        var deathModal = document.getElementById('death-screen');
        if (deathModal) {
          new MutationObserver(function() {
            if (deathModal.style.display !== 'none') {
              if (sdk.game && sdk.game.gameplayStop) sdk.game.gameplayStop();
            }
          }).observe(deathModal, { attributes: true, attributeFilter: ['style'] });
        }

        var stageClearModal = document.getElementById('stage-clear-modal');
        if (stageClearModal) {
          new MutationObserver(function() {
            if (stageClearModal.style.display !== 'none') {
              if (sdk.game && sdk.game.happytime) sdk.game.happytime();
            }
          }).observe(stageClearModal, { attributes: true, attributeFilter: ['style'] });
        }

      }).catch(function(err) {
        console.warn('[CrazyGames] SDK init warning:', err);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCrazySDK);
  } else {
    initCrazySDK();
  }
})();
</script>
"""

with zipfile.ZipFile(src_zip, 'r') as zin, zipfile.ZipFile(target_zip, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as zout:
    for item in zin.infolist():
        data = zin.read(item.filename)
        
        if item.filename == 'index.html':
            html_str = data.decode('utf-8')
            html_str = re.sub(r'<title>.*?</title>', '<title>Stickmurai</title>', html_str, flags=re.IGNORECASE)
            html_str = re.sub(
                r'<h1 class="game-title" data-i18n="title">.*?</h1>',
                '<h1 class="game-title" data-i18n="title">STICKMURAI</h1>',
                html_str,
                flags=re.IGNORECASE | re.DOTALL
            )
            if '</head>' in html_str:
                html_str = html_str.replace('</head>', bridge_script + '\\n</head>')
            else:
                html_str = bridge_script + html_str
            data = html_str.encode('utf-8')

        elif item.filename.startswith('assets/index-') and item.filename.endswith('.js'):
            js_str = data.decode('utf-8')
            js_str = js_str.replace('SUPER<br>SAMURAI<br>STICKY', 'STICKMURAI')
            js_str = js_str.replace('スーパー<br>サムライ<br>スティッキー', 'スティックムライ')
            data = js_str.encode('utf-8')

        zout.writestr(item, data)

print(f"CrazyGames archive created: {target_zip}")
count = len(zout.namelist())
print(f"File count: {count} files (<= 1000 limit)")
`;

const tempPy = path.join(releaseDir, '_cg_zip.py');
fs.writeFileSync(tempPy, pythonScript, 'utf8');
try {
  execSync(`python "${tempPy}" "${html5Zip}" "${crazyZip}"`, { cwd: rootDir, stdio: 'inherit' });
} finally {
  if (fs.existsSync(tempPy)) fs.unlinkSync(tempPy);
}
