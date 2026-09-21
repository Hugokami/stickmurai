"""Real input regression. Run: python3 tests/dojo-browser.py [--probe]."""
import json
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

out = Path('artifacts/dojo-runtime')
out.mkdir(parents=True, exist_ok=True)
with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto('http://127.0.0.1:5174', wait_until='domcontentloaded')
    page.wait_for_timeout(8000)
    print('BOOT', page.locator('body').inner_text()[:4000].encode('ascii','replace').decode(), errors)
    page.evaluate("""async () => {
      window.g = (await import('/src/globals.ts')).globals;
      window.q = await import('/src/runtimeQol.ts');
    }""")
    print('MENU', page.locator('body').inner_text()[-12000:])
    page.evaluate("window.dispatchEvent(new CustomEvent('qol-tutorial',{detail:{hero:'default'}}))")
    page.wait_for_timeout(500)
    state = page.evaluate("""() => ({state:g.gameState, practice:q.isPractice(), player:{x:g.player.x,y:g.player.y}, enemies:g.enemies.map(e=>({x:e.x,y:e.y,startX:e.startX,startY:e.startY,hp:e.hp,type:e.constructor.name})), banner:(()=>{let e=document.querySelector('#muramasa-tutorial-banner');let b=e.getBoundingClientRect();return {text:e.innerText,x:b.x,y:b.y,w:b.width,h:b.height,position:getComputedStyle(e).position}})()})""")
    print('REPRO', json.dumps(state))
    print('STAGE_HUD', page.evaluate("({hud:document.querySelector('#hud')?.style.display, stage:document.querySelector('#stage-display')?.innerText, wave:document.querySelector('#wave-display')?.innerText, practiceBar:document.querySelector('#qol-practice-bar')!==null, tutBanner:document.querySelector('#muramasa-tutorial-banner')!==null, bannerComputed:(()=>{let e=document.querySelector('#muramasa-tutorial-banner');let s=window.getComputedStyle(e);return {display:s.display,visibility:s.visibility,zIndex:s.zIndex,top:s.top,left:s.left,position:s.position}})()})"))
    page.screenshot(path=str(out/'tutorial-before.png'))
    page.keyboard.down('d'); page.wait_for_timeout(500); page.keyboard.up('d')
    print('MOVED', page.evaluate("({p:{x:g.player.x,y:g.player.y},d:g.enemies.map(e=>({x:e.x,y:e.y,startX:e.startX,startY:e.startY,hp:e.hp})), camera:g.camera})"))
    if '--probe' not in sys.argv:
        b = state['banner']
        assert b['position'] == 'fixed' and 0 <= b['y'] < 300, f'Tutorial task hidden: {b}'
    print('ERRORS', errors)
    browser.close()
