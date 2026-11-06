"""Server-browser verification. Muted playback is a decode test, not listening."""
import asyncio,json
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
URL='http://localhost:3030/static-18561dfb6a23/watch-v03.html'

async def main():
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
        page=await browser.new_page(viewport={'width':1500,'height':1150})
        errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
        response=await page.goto(URL,wait_until='networkidle')
        assert response and response.status==200
        await page.wait_for_function('document.querySelector("video").readyState>=2',timeout=30000)
        info=await page.evaluate('''()=>{const v=document.querySelector('video');v.muted=true;return {width:v.videoWidth,height:v.videoHeight,duration:v.duration}}''')
        assert info['width']==1080 and info['height']==1920 and abs(info['duration']-14)<.1
        await page.evaluate("document.querySelector('video').play()")
        await page.wait_for_function('document.querySelector("video").currentTime>13.4',timeout=30000)
        await page.wait_for_function('document.querySelector("video").currentTime<1.2',timeout=5000)
        info['full_muted_playback_and_loop']=True
        await page.get_by_role('button',name='28 × 38 см',exact=True).click()
        await page.wait_for_function('document.querySelector("video").currentTime>=8.5 && document.querySelector("video").currentTime<9.2')
        await page.evaluate("document.querySelector('video').pause()")
        info['scene_navigation']=True
        scheme=await page.request.get('http://localhost:3030/static-18561dfb6a23/v03-lighting.svg')
        assert scheme.status==200 and '<svg' in await scheme.text()
        info['scheme_served']=True
        await page.screenshot(path='/workspace/shared/downloads/LAB-R001-v03-player.png')
        assert not errors,errors
        info['javascript_errors']=errors
        (ROOT/'out/v03-player.json').write_text(json.dumps(info,indent=2)+'\n')
        print(json.dumps(info,ensure_ascii=False,indent=2))
        await browser.close()

asyncio.run(main())
