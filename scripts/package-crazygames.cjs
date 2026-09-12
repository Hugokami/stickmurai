const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const releaseDir = path.join(rootDir, 'release');
const html5Zip = path.join(releaseDir, 'stickmurai-html5.zip');
const crazyZip = path.join(releaseDir, 'stickmurai-crazygames.zip');

console.log('Building base HTML5 release first...');
execSync('npm run package:html5', { cwd: rootDir, stdio: 'inherit' });

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
  window.crazygames = window.CrazyGames = window.CrazyGames || {};
  var sdk = null;
  var isCrazyMuted = false;
  var registeredAudios = new Set();
  var registeredAudioContexts = new Set();

  // Parse early mute query params (?muteAudio=true or ?mute=true)
  try {
    var searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('muteAudio') === 'true' || searchParams.get('mute') === 'true') {
      isCrazyMuted = true;
    }
  } catch(e) {}

  // 1. Comprehensive Audio Muting Engine (HTML5 Audio + Web Audio API)
  var OrigAudio = window.Audio;
  if (OrigAudio) {
    window.Audio = new Proxy(OrigAudio, {
      construct: function(target, args) {
        var a = new target(...args);
        registeredAudios.add(a);
        if (isCrazyMuted) {
          a.muted = true;
          a._savedVol = a.volume;
          a.volume = 0;
        }
        return a;
      }
    });
  }

  if (window.HTMLAudioElement && HTMLAudioElement.prototype) {
    var origAudioPlay = HTMLAudioElement.prototype.play;
    HTMLAudioElement.prototype.play = function() {
      registeredAudios.add(this);
      if (isCrazyMuted) {
        this.muted = true;
        if (this._savedVol === undefined) this._savedVol = this.volume;
        this.volume = 0;
        return Promise.resolve();
      }
      return origAudioPlay.apply(this, arguments);
    };
  }

  var OrigAudioContext = window.AudioContext || window.webkitAudioContext;
  if (OrigAudioContext) {
    var PatchedAudioContext = new Proxy(OrigAudioContext, {
      construct: function(target, args) {
        var ctx = new target(...args);
        registeredAudioContexts.add(ctx);
        return ctx;
      }
    });
    window.AudioContext = PatchedAudioContext;
    if (window.webkitAudioContext) window.webkitAudioContext = PatchedAudioContext;
  }

  if (window.AudioNode && AudioNode.prototype && AudioNode.prototype.connect) {
    var origConnect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function(target) {
      var ctx = this.context;
      if (ctx && target && (target === ctx.destination || (window.AudioDestinationNode && target instanceof AudioDestinationNode))) {
        if (!ctx._cgMasterGain) {
          try {
            ctx._cgMasterGain = ctx.createGain();
            origConnect.call(ctx._cgMasterGain, ctx.destination);
            var initGain = isCrazyMuted ? 0 : 1;
            ctx._cgMasterGain.gain.setValueAtTime(initGain, ctx.currentTime);
            ctx._cgMasterGain.gain.value = initGain;
          } catch(e) {}
        }
        if (ctx._cgMasterGain) {
          return origConnect.call(this, ctx._cgMasterGain);
        }
      }
      return origConnect.apply(this, arguments);
    };
  }

  function applyCrazyMute(muted) {
    isCrazyMuted = !!muted;
    window._isCrazyMuted = isCrazyMuted;
    console.log('[CrazyGames] Audio mute state:', isCrazyMuted ? 'MUTED' : 'UNMUTED');

    if (typeof window.setPortalMuted === 'function') {
      try { window.setPortalMuted(isCrazyMuted); } catch(e) {}
    }

    registeredAudios.forEach(function(a) {
      try {
        a.muted = isCrazyMuted;
        if (isCrazyMuted) {
          if (a._savedVol === undefined) a._savedVol = a.volume;
          a.volume = 0;
          if (!a.paused) a.pause();
        } else if (a._savedVol !== undefined) {
          a.volume = a._savedVol;
          delete a._savedVol;
        }
      } catch(e) {}
    });

    try {
      document.querySelectorAll('audio').forEach(function(a) {
        a.muted = isCrazyMuted;
        if (isCrazyMuted) {
          if (a._savedVol === undefined) a._savedVol = a.volume;
          a.volume = 0;
          if (!a.paused) a.pause();
        } else if (a._savedVol !== undefined) {
          a.volume = a._savedVol;
          delete a._savedVol;
        }
      });
    } catch(e) {}

    registeredAudioContexts.forEach(function(ctx) {
      try {
        if (ctx._cgMasterGain) {
          var targetVal = isCrazyMuted ? 0 : 1;
          ctx._cgMasterGain.gain.setValueAtTime(targetVal, ctx.currentTime);
          ctx._cgMasterGain.gain.value = targetVal;
        }
        if (isCrazyMuted && ctx.state === 'running') {
          ctx.suspend().catch(function() {});
        } else if (!isCrazyMuted && ctx.state === 'suspended') {
          ctx.resume().catch(function() {});
        }
      } catch(e) {}
    });
  }

  window.getPortalMuted = function() { return isCrazyMuted; };

  // Direct postMessage listener for instant response from parent frame
  window.addEventListener('message', function(event) {
    var data = event.data;
    if (!data) return;
    if (data.type === 'audioChanged' || data.type === 'muteAudioChanged') {
      if (typeof data.muteAudio === 'boolean') {
        applyCrazyMute(data.muteAudio);
      }
    }
  });

  // 2. Data Module Storage Bridge (syncs safeStorage & localStorage to CrazyGames cloud)
  var origSetItem = Storage.prototype.setItem;
  var origGetItem = Storage.prototype.getItem;
  var origRemoveItem = Storage.prototype.removeItem;

  Storage.prototype.setItem = function(key, value) {
    origSetItem.call(this, key, value);
    try {
      var s = (window.CrazyGames && window.CrazyGames.SDK) || (window.crazygames && window.crazygames.SDK);
      var dataMod = null;
      try { dataMod = s && s.data; } catch(e) {}
      if (this === window.localStorage && dataMod && typeof dataMod.setItem === 'function') {
        dataMod.setItem(key, String(value));
      }
    } catch(e) {}
  };

  Storage.prototype.getItem = function(key) {
    try {
      var s = (window.CrazyGames && window.CrazyGames.SDK) || (window.crazygames && window.crazygames.SDK);
      var dataMod = null;
      try { dataMod = s && s.data; } catch(e) {}
      if (this === window.localStorage && dataMod && typeof dataMod.getItem === 'function') {
        var cloudVal = dataMod.getItem(key);
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
      var s = (window.CrazyGames && window.CrazyGames.SDK) || (window.crazygames && window.crazygames.SDK);
      var dataMod = null;
      try { dataMod = s && s.data; } catch(e) {}
      if (this === window.localStorage && dataMod && typeof dataMod.removeItem === 'function') {
        dataMod.removeItem(key);
      }
    } catch(e) {}
  };

  // 3. Prevent spacebar / arrow keys page scrolling inside iframe
  window.addEventListener('keydown', function(e) {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      e.preventDefault();
    }
  }, { passive: false });

  // 4. Tab Visibility Change (mute when tab hidden / blurred)
  document.addEventListener('visibilitychange', function() {
    var s = (window.CrazyGames && window.CrazyGames.SDK) || (window.crazygames && window.crazygames.SDK);
    if (document.hidden) {
      applyCrazyMute(true);
      try {
        if (s && s.game && s.game.gameplayStop) s.game.gameplayStop();
      } catch(e) {}
    } else {
      var portalMuted = false;
      try {
        portalMuted = s && s.game && s.game.settings && s.game.settings.muteAudio === true;
      } catch(e) {}
      if (!portalMuted) {
        applyCrazyMute(false);
      }
    }
  });

  // 5. Interstitial (Midgame) Ad Throttling
  var lastMidgameTime = 0;
  var MIN_MIDGAME_INTERVAL = 60000;

  function triggerMidgameAd(callback) {
    var now = Date.now();
    var s = (window.CrazyGames && window.CrazyGames.SDK) || (window.crazygames && window.crazygames.SDK);
    var adMod = null;
    try { adMod = s && s.ad; } catch(e) {}
    if (!s || !adMod || typeof adMod.requestAd !== 'function' || (now - lastMidgameTime < MIN_MIDGAME_INTERVAL)) {
      if (callback) callback();
      return;
    }
    lastMidgameTime = now;
    console.log('[CrazyGames] Requesting midgame ad...');
    applyCrazyMute(true);
    try { if (s.game && s.game.gameplayStop) s.game.gameplayStop(); } catch(e) {}

    adMod.requestAd('midgame', {
      adStarted: function() {
        console.log('[CrazyGames] Midgame ad started');
        applyCrazyMute(true);
      },
      adFinished: function() {
        console.log('[CrazyGames] Midgame ad finished');
        applyCrazyMute(false);
        try { if (s.game && s.game.gameplayStart) s.game.gameplayStart(); } catch(e) {}
        if (callback) callback();
      },
      adError: function(err) {
        console.warn('[CrazyGames] Midgame ad error:', err);
        applyCrazyMute(false);
        try { if (s.game && s.game.gameplayStart) s.game.gameplayStart(); } catch(e) {}
        if (callback) callback();
      }
    });
  }

  function syncSdkGlobal() {
    var rawSdk = window.CrazyGames && window.CrazyGames.SDK;
    if (rawSdk) {
      sdk = rawSdk;
      window.crazygames = window.CrazyGames;
      window.crazygames.SDK = rawSdk;
      return true;
    }
    return false;
  }

  // 6. Initialize CrazyGames SDK v3 and bind events
  function initCrazySDK() {
    if (syncSdkGlobal()) {
      sdk.init().then(function() {
        syncSdkGlobal();
        console.log('[CrazyGames] SDK v3 initialized successfully.');

        // Loading start
        try {
          if (sdk.game && sdk.game.loadingStart) {
            sdk.game.loadingStart();
          } else if (sdk.game && sdk.game.sdkGameLoadingStart) {
            sdk.game.sdkGameLoadingStart();
          }
        } catch(e) {}

        // Mute settings listener (SDK v3: addSettingsChangeListener)
        try {
          if (sdk.game && typeof sdk.game.addSettingsChangeListener === 'function') {
            sdk.game.addSettingsChangeListener(function(settings) {
              console.log('[CrazyGames] Settings updated via listener:', settings);
              if (settings && typeof settings.muteAudio === 'boolean') {
                applyCrazyMute(settings.muteAudio);
              }
            });
            if (sdk.game.settings && typeof sdk.game.settings.muteAudio === 'boolean') {
              applyCrazyMute(sdk.game.settings.muteAudio);
            }
          }
        } catch(e) {
          console.warn('[CrazyGames] Failed to register settings listener:', e);
        }

        // Loader screen observer -> loadingStop()
        var loader = document.getElementById('loader-screen');
        if (loader) {
          var loaderObserver = new MutationObserver(function() {
            if (loader.style.display === 'none' || loader.classList.contains('hidden')) {
              try {
                if (sdk.game && sdk.game.loadingStop) {
                  sdk.game.loadingStop();
                } else if (sdk.game && sdk.game.sdkGameLoadingStop) {
                  sdk.game.sdkGameLoadingStop();
                }
              } catch(e) {}
              loaderObserver.disconnect();
            }
          });
          loaderObserver.observe(loader, { attributes: true, attributeFilter: ['style', 'class'] });
        }

        // Gameplay start buttons
        ['start-btn', 'classic-btn', 'boss-rush-btn', 'resume-btn'].forEach(function(btnId) {
          var btn = document.getElementById(btnId);
          if (btn) {
            btn.addEventListener('click', function() {
              try { if (sdk.game && sdk.game.gameplayStart) sdk.game.gameplayStart(); } catch(e) {}
            });
          }
        });

        // Pause screen observer
        var pauseScreen = document.getElementById('pause-screen');
        if (pauseScreen) {
          new MutationObserver(function() {
            try {
              if (pauseScreen.style.display !== 'none') {
                if (sdk.game && sdk.game.gameplayStop) sdk.game.gameplayStop();
              } else {
                if (sdk.game && sdk.game.gameplayStart) sdk.game.gameplayStart();
              }
            } catch(e) {}
          }).observe(pauseScreen, { attributes: true, attributeFilter: ['style'] });
        }

        // Game Over (Death) screen observer
        var gameOverScreen = document.getElementById('game-over');
        if (gameOverScreen) {
          new MutationObserver(function() {
            try {
              if (gameOverScreen.style.display !== 'none') {
                if (sdk.game && sdk.game.gameplayStop) sdk.game.gameplayStop();
              }
            } catch(e) {}
          }).observe(gameOverScreen, { attributes: true, attributeFilter: ['style'] });
        }

        // Restart button -> midgame ad
        var restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
          restartBtn.addEventListener('click', function() {
            triggerMidgameAd();
          });
        }

        // Stage clear modal observer -> happytime() & midgame ad
        var stageClearModal = document.getElementById('stage-clear-modal');
        if (stageClearModal) {
          new MutationObserver(function() {
            try {
              if (stageClearModal.style.display !== 'none') {
                if (sdk.game && sdk.game.happytime) sdk.game.happytime();
                triggerMidgameAd();
              }
            } catch(e) {}
          }).observe(stageClearModal, { attributes: true, attributeFilter: ['style'] });
        }

      }).catch(function(err) {
        console.warn('[CrazyGames] SDK init warning:', err);
      });
    }
  }

  // Poll for SDK readiness in case script loads asynchronously
  var attempts = 0;
  function pollSdk() {
    if (syncSdkGlobal()) {
      initCrazySDK();
    } else if (attempts < 60) {
      attempts++;
      setTimeout(pollSdk, 100);
    }
  }

  pollSdk();
})();
</script>"""

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
            # Inject SDK script and early bridge at the VERY TOP of <head> before any game module scripts
            if '<head>' in html_str:
                html_str = html_str.replace('<head>', '<head>\\n' + bridge_script, 1)
            elif '<head ' in html_str:
                html_str = re.sub(r'(<head[^>]*>)', r'\\1\\n' + bridge_script, html_str, count=1)
            elif '</head>' in html_str:
                html_str = html_str.replace('</head>', bridge_script + '\\n</head>')
            else:
                html_str = bridge_script + html_str
            data = html_str.encode('utf-8')

        elif item.filename.startswith('assets/index-') and item.filename.endswith('.js'):
            js_str = data.decode('utf-8')
            js_str = js_str.replace('SUPER<br>SAMURAI<br>STICKY', 'STICKMURAI')
            js_str = js_str.replace('スーパー<br>サムライ<br>スティッキー', 'スティックムライ')
            # Ensure CrazyGames SDK references work regardless of case
            js_str = js_str.replace('window.crazygames?.SDK?.ad', '((window.CrazyGames?.SDK||window.crazygames?.SDK)?.ad)')
            js_str = js_str.replace('window.crazygames.SDK.ad.requestAd', '(window.CrazyGames?.SDK||window.crazygames?.SDK).ad.requestAd')
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

  // Also extract to a folder for CrazyGames (they accept folder upload, not just zip)
  const cgFolder = path.join(releaseDir, 'crazygames');
  if (fs.existsSync(cgFolder)) fs.rmSync(cgFolder, { recursive: true, force: true });
  fs.mkdirSync(cgFolder, { recursive: true });
  execSync(`python -c "import zipfile,sys; zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])" "${crazyZip}" "${cgFolder}"`, { cwd: rootDir, stdio: 'inherit' });
  console.log(`CrazyGames folder created: ${cgFolder}`);
} finally {
  if (fs.existsSync(tempPy)) fs.unlinkSync(tempPy);
}
