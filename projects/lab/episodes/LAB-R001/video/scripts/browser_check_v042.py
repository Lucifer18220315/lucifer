import asyncio,json
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
async def main():
 errors=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
  page=await browser.new_page(viewport={'width':1000,'height':900})
  response=await page.goto('http://localhost:3030/HookV042',wait_until='domcontentloaded',timeout=30000)
  await page.wait_for_function("document.title.includes('HookV042')",timeout=30000)
  studio={'http':response.status,'title':await page.title()}
  page.on('pageerror',lambda e:errors.append(str(e)))
  response=await page.goto('http://localhost:3030/static-18561dfb6a23/watch-v042.html',wait_until='domcontentloaded',timeout=30000);assert response.status==200
  await page.wait_for_function("document.querySelector('video').readyState>=2")
  info=await page.eval_on_selector('video','v=>({width:v.videoWidth,height:v.videoHeight,duration:v.duration})');assert (info['width'],info['height'])==(720,1280)
  seeks=[]
  for f in [0,24,34,46,58,70,82,94,392,422]:
   t=f/(2997/125);await page.eval_on_selector('video','(v,t)=>v.currentTime=t',t)
   await page.wait_for_function('(t)=>!document.querySelector("video").seeking&&Math.abs(document.querySelector("video").currentTime-t)<.01',arg=t)
   seeks.append(f)
  await page.eval_on_selector('video','async v=>{v.muted=true;v.currentTime=0;await v.play()}')
  await page.wait_for_function("document.querySelector('video').ended",timeout=40000)
  playback=await page.eval_on_selector('video','v=>({ended:v.ended,time:v.currentTime,error:v.error?.message||null})');assert playback['ended'] and not playback['error'] and not errors
  result={'studio':studio,'dimensions':info,'seek_frames':seeks,'playback':playback,'muted':True,'page_errors':errors,'subjective_listening':False}
  (ROOT.parent/'v04-2/browser.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2));await browser.close()
asyncio.run(main())
