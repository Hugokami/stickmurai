import os
import time
import json
from playwright.sync_api import sync_playwright

os.makedirs('tests/evidence', exist_ok=True)

def run_regression():
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('console', lambda msg: print(f"[CONSOLE {msg.type}] {msg.text}") if msg.type == 'error' else None)

        print("=== TEST 1: APP BOOT & ASSET LOAD ===")
        page.goto('http://127.0.0.1:5174', wait_until='networkidle')

        # Wait for and dismiss loader screen
        for _ in range(50):
            t = page.inner_text('body')
            if 'DRAW THE BLADE' in t or 'START' in t or 'PLAY' in t:
                break
            time.sleep(0.1)

        for sel in ['#loader-continue-btn', '#early-start-btn', '#play-btn', '#btn-play', '#loader-screen']:
            try:
                if page.is_visible(sel):
                    page.click(sel)
                    break
            except Exception:
                pass
        page.wait_for_timeout(600)

        print("=== TEST 2: START TUTORIAL & VERIFY HUD SUPPRESSION ===")
        page.evaluate("""async () => {
            if (!window.g) window.g = (await import('/src/globals.ts')).globals;
            if (!window.q) window.q = await import('/src/runtimeQol.ts');
            window.q.startTutorial('default', false);
        }""")
        page.wait_for_timeout(800)

        state = page.evaluate("""() => {
            const banner = document.getElementById('muramasa-tutorial-banner');
            const tracker = document.getElementById('hud-mission-tracker');
            const obj = document.getElementById('objective-display');
            const dummy = (window.g?.enemies || []).find(e => e.isTrainingDummy);
            const style = banner ? window.getComputedStyle(banner) : null;
            return {
                bannerExists: !!banner,
                bannerPos: style?.position,
                bannerTop: style?.top,
                bannerZ: style?.zIndex,
                bannerText: banner?.innerText,
                trackerDisplay: tracker ? window.getComputedStyle(tracker).display : null,
                objDisplay: obj ? window.getComputedStyle(obj).display : null,
                playerX: window.g?.player?.x,
                playerY: window.g?.player?.y,
                dummyX: dummy?.x,
                dummyY: dummy?.y,
                dummyStartX: dummy?.startX,
                dummyStartY: dummy?.startY,
                dummyHp: dummy?.hp,
                lesson: window.q?.getTutorialSession ? window.q.getTutorialSession()?.currentLesson : null,
            };
        }""")
        print("TUTORIAL INIT STATE:", json.dumps(state, indent=2))
        page.screenshot(path='tests/evidence/01_tutorial_init.png')

        assert state['bannerExists'], "Tutorial banner must exist"
        assert state['bannerPos'] == 'fixed', "Tutorial banner must be position: fixed"
        assert state['bannerTop'] == '20px', "Tutorial banner must have top: 20px"
        assert state['bannerZ'] == '10000', "Tutorial banner must have z-index: 10000"
        assert state['trackerDisplay'] == 'none', "Mission tracker must be hidden in tutorial"
        assert state['objDisplay'] == 'none', "Objective display must be hidden in tutorial"
        assert state['dummyStartX'] == 180, f"Dummy must spawn at x=180, got {state['dummyStartX']}"
        assert state['dummyStartY'] == 0, f"Dummy must spawn at y=0, got {state['dummyStartY']}"
        assert state['lesson'] == 'move', f"Initial lesson must be 'move', got {state['lesson']}"

        print("=== TEST 3: REAL INPUT MOVEMENT & DUMMY STATIONARY IN WORLD ===")
        page.keyboard.down('KeyD')
        for i in range(12):
            page.wait_for_timeout(50)
            check = page.evaluate("""() => {
                const dummy = (window.g?.enemies || []).find(e => e.isTrainingDummy);
                return {
                    px: window.g?.player?.x,
                    dx: dummy?.x,
                    dy: dummy?.y,
                    lesson: window.q?.getTutorialSession ? window.q.getTutorialSession()?.currentLesson : null,
                };
            }""")
            # Dummy must stay completely stationary
            assert abs(check['dx'] - 180) < 0.01, f"Dummy x moved! Expected 180, got {check['dx']}"
            assert abs(check['dy'] - 0) < 0.01, f"Dummy y moved! Expected 0, got {check['dy']}"
            if check['lesson'] != 'move':
                break

        page.keyboard.up('KeyD')
        page.wait_for_timeout(300)

        post_move = page.evaluate("""() => {
            const banner = document.getElementById('muramasa-tutorial-banner');
            const dummy = (window.g?.enemies || []).find(e => e.isTrainingDummy);
            return {
                playerX: window.g?.player?.x,
                dummyX: dummy?.x,
                dummyY: dummy?.y,
                lesson: window.q?.getTutorialSession ? window.q.getTutorialSession()?.currentLesson : null,
                bannerText: banner?.innerText,
            };
        }""")
        print("POST MOVE STATE:", json.dumps(post_move, indent=2))
        page.screenshot(path='tests/evidence/02_movement_complete.png')

        assert post_move['lesson'] == 'slash', f"Must advance to 'slash' lesson, got {post_move['lesson']}"
        assert abs(post_move['dummyX'] - 180) < 0.01, "Dummy must remain stationary during movement"

        print("=== TEST 4: REAL COMBAT ATTACK ON DUMMY & METRICS UPDATE ===")
        canvas_box = page.locator('#gameCanvas').bounding_box()
        # Click on the dummy position in front of player
        click_x = canvas_box['x'] + canvas_box['width'] / 2 + 80
        click_y = canvas_box['y'] + canvas_box['height'] / 2

        metrics_before = page.evaluate("() => window.q?.getTrainingMetrics()?.comboDamage || 0")
        print(f"Metrics combo damage before attacks: {metrics_before}")

        # Land 3 slash attacks
        for i in range(5):
            page.mouse.click(click_x, click_y)
            page.wait_for_timeout(120)
            cur_lesson = page.evaluate("() => window.q?.getTutorialSession ? window.q.getTutorialSession()?.currentLesson : null")
            if cur_lesson != 'slash':
                break

        post_attack = page.evaluate("""() => {
            const banner = document.getElementById('muramasa-tutorial-banner');
            const metrics = window.q?.getTrainingMetrics();
            return {
                lesson: window.q?.getTutorialSession ? window.q.getTutorialSession()?.currentLesson : null,
                bannerText: banner?.innerText,
                comboDamage: metrics?.comboDamage,
                bestComboDamage: metrics?.bestComboDamage,
                lastHit: metrics?.lastHit,
            };
        }""")
        print("POST ATTACK STATE:", json.dumps(post_attack, indent=2))
        page.screenshot(path='tests/evidence/03_slash_complete.png')

        assert post_attack['lesson'] == 'skill', f"Must advance to 'skill' lesson, got {post_attack['lesson']}"
        assert (post_attack['bestComboDamage'] or 0) > 0, "Metrics best combo damage must be > 0"
        assert (post_attack['lastHit'] or 0) > 0, "Metrics lastHit damage must be > 0"

        print("=== TEST 5: PARRY & DODGE MECHANICS ON DUMMY SPARRING ATTACK ===")
        parry_dodge_check = page.evaluate("""() => {
            const dummy = (window.g?.enemies || []).find(e => e.isTrainingDummy);
            if (!dummy) return { ok: false, error: 'No dummy' };
            dummy.setMode('sparring');
            return {
                ok: true,
                mode: dummy.mode,
                state: dummy.state,
                chargeTimeMax: dummy.chargeTimeMax,
            };
        }""")
        print("SPARRING SETUP:", parry_dodge_check)
        assert parry_dodge_check['ok'] and parry_dodge_check['mode'] == 'sparring', "Dummy must support sparring mode"

        # Verify parry and dodge triggers callbacks and metrics
        callbacks_test = page.evaluate("""() => {
            const metrics = window.q?.getTrainingMetrics();
            const parriesBefore = metrics?.parries || 0;
            const dodgesBefore = metrics?.dodges || 0;

            // Trigger simulated perfect dodge callback
            window.callbacks?.onTrainingDummyAttack?.({ dodged: true, fromDummy: true });
            // Trigger simulated parry callback
            window.callbacks?.onTrainingDummyAttack?.({ parried: true, fromDummy: true });

            return {
                parriesAfter: metrics?.parries,
                dodgesAfter: metrics?.dodges,
                parriesBefore,
                dodgesBefore,
            };
        }""")
        print("PARRY/DODGE CALLBACKS TEST:", callbacks_test)
        assert callbacks_test['parriesAfter'] == callbacks_test['parriesBefore'] + 1, "Parry metric must increment"
        assert callbacks_test['dodgesAfter'] == callbacks_test['dodgesBefore'] + 1, "Dodge metric must increment"

        print("=== TEST 6: EXIT PRACTICE / TUTORIAL & CAMPAIGN RESTORATION ===")
        page.click('#muramasa-tut-skip')
        page.wait_for_timeout(600)

        post_exit = page.evaluate("""() => {
            const banner = document.getElementById('muramasa-tutorial-banner');
            const tracker = document.getElementById('hud-mission-tracker');
            const obj = document.getElementById('objective-display');
            return {
                bannerExists: !!banner,
                localTutCompleted: window.localStorage.getItem('stickmurai_tutorial_completed'),
                muramasaCompleted: window.localStorage.getItem('muramasa_tutorial_v2'),
                isPractice: window.q?.isPractice ? window.q.isPractice() : false,
                trackerDisplay: tracker ? window.getComputedStyle(tracker).display : null,
            };
        }""")
        print("POST EXIT STATE:", json.dumps(post_exit, indent=2))
        page.screenshot(path='tests/evidence/04_campaign_restored.png')

        assert not post_exit['bannerExists'], "Tutorial banner must be removed upon exit"
        assert not post_exit['isPractice'], "isPractice() must be false after exit"
        assert post_exit['localTutCompleted'] == 'true', "stickmurai_tutorial_completed must be persisted in localStorage"
        assert post_exit['muramasaCompleted'] in ['completed', 'skipped'], "muramasa_tutorial_v2 must be persisted"

        print("=== TEST 7: CAMPAIGN GAMEPLAY RESTORES MISSION TRACKER ===")
        # Start regular game and verify mission tracker is visible
        page.evaluate("""() => {
            window.g.gameState = 'playing';
            window.g.gameMode = 'classic';
            window.g.currentWave = 1;
            window.g.totalWaves = 3;
            window.g.currentStage = 1;
            if (window.updateUI) window.updateUI(true);
        }""")
        page.wait_for_timeout(300)

        campaign_state = page.evaluate("""() => {
            const tracker = document.getElementById('hud-mission-tracker');
            const obj = document.getElementById('objective-display');
            return {
                trackerDisplay: tracker ? window.getComputedStyle(tracker).display : null,
                objDisplay: obj ? window.getComputedStyle(obj).display : null,
                objText: obj?.innerText,
            };
        }""")
        print("CAMPAIGN STATE:", json.dumps(campaign_state, indent=2))
        page.screenshot(path='tests/evidence/05_campaign_gameplay.png')

        assert campaign_state['trackerDisplay'] != 'none', "Mission tracker must be visible in campaign mode"

        print("ALL 7 END-TO-END REGRESSION TESTS PASSED PERFECTLY!")
        assert len(errors) == 0, f"Errors encountered: {errors}"
        browser.close()

if __name__ == '__main__':
    run_regression()
