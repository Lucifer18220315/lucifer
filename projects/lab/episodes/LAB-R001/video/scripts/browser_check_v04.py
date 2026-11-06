"""Check the actual review player, all scene links, and one muted playback."""
import asyncio,json,os
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
URL=os.environ.get('V04_PLAYER_URL','http://localhost:3030/static-18561dfb6a23/watch-v04.html')

async def main():
    errors=[];seeks=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,
            args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
        page=await browser.new_page(viewport={'width':1100,'height':1000})
        page.on('pageerror',lambda e:errors.append(str(e)))
        response=await page.goto(URL,wait_until='domcontentloaded')
        assert response.status==200
        await page.wait_for_function("document.querySelector('video').readyState>=2")
        dimensions=await page.eval_on_selector('video','v=>({width:v.videoWidth,height:v.videoHeight,duration:v.duration})')
        assert dimensions['width']==720 and dimensions['height']==1280
        for button in await page.locator('#cuts button').all():
            frame=int(await button.get_attribute('data-frame'))
            await button.click()
            await page.wait_for_function('(t)=>Math.abs(document.querySelector("video").currentTime-t)<.01 && !document.querySelector("video").seeking',arg=frame/(2997/125))
            seeks.append({'frame':frame,'time':await page.eval_on_selector('video','v=>v.currentTime')})
        await page.eval_on_selector('video','async v=>{v.muted=true;v.currentTime=0;await v.play();}')
        await page.wait_for_function('document.querySelector("video").ended',timeout=40000)
        playback=await page.eval_on_selector('video','v=>({ended:v.ended,time:v.currentTime,error:v.error?.message||null,quality:v.getVideoPlaybackQuality().toJSON?.()||{totalVideoFrames:v.getVideoPlaybackQuality().totalVideoFrames,droppedVideoFrames:v.getVideoPlaybackQuality().droppedVideoFrames}})')
        assert playback['ended'] and not playback['error'] and not errors
        await page.screenshot(path=str(ROOT/'out/v04-player.png'),full_page=True)
        comparison=await page.request.get(URL.rsplit('/',1)[0]+'/LAB-R001-v04-comparison.mp4',headers={'Range':'bytes=0-255'})
        assert comparison.status in (200,206)
        report={'url':URL,'dimensions':dimensions,'seeks':seeks,'playback':playback,
                'page_errors':errors,'comparison_http':comparison.status,'muted':True,'subjective_listening':False}
        (ROOT/'out/v04-browser.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
        print(json.dumps(report,ensure_ascii=False,indent=2))
        await browser.close()

asyncio.run(main())
