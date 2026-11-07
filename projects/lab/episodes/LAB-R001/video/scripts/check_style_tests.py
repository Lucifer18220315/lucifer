"""Verify gallery selection, seeking and full playback of the comparison."""
import asyncio,json,threading
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.async_api import async_playwright
DEST=Path('/workspace/shared/downloads/style-tests-01');DOC=Path(__file__).resolve().parents[4]/'style-tests-01'
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**k):super().__init__(*a,directory=str(DEST),**k)
 def log_message(self,*a):pass
 def do_GET(self):
  path=DEST/self.path.lstrip('/')
  if path.suffix!='.mp4' or not path.is_file():return super().do_GET()
  data=path.read_bytes();start,end=0,len(data)-1;requested=self.headers.get('Range')
  if requested:
   first,last=requested.removeprefix('bytes=').split('-',1)
   if first:
    start=int(first)
    if last:end=min(end,int(last))
   else:start=max(0,len(data)-int(last))
  self.send_response(206 if requested else 200);self.send_header('Content-Type','video/mp4');self.send_header('Accept-Ranges','bytes');self.send_header('Content-Length',str(end-start+1))
  if requested:self.send_header('Content-Range',f'bytes {start}-{end}/{len(data)}')
  self.end_headers()
  try:self.wfile.write(data[start:end+1])
  except (BrokenPipeError,ConnectionResetError):pass
async def main():
 server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start();rows=[]
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--autoplay-policy=no-user-gesture-required']);page=await b.new_page(viewport={'width':1100,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  await page.goto(f'http://127.0.0.1:{server.server_port}/index.html');assert await page.locator('[data-id]').count()==10
  for i in range(1,11):
   await page.locator(f'[data-id="{i:02d}"]').click();await page.wait_for_function('(id)=>{const v=document.querySelector("video");return v.readyState>=2&&v.src.endsWith("Style"+id+".mp4")}',arg=f'{i:02d}')
   info=await page.locator('video').evaluate('v=>({w:v.videoWidth,h:v.videoHeight,duration:v.duration})');assert (info['w'],info['h'])==(720,1280)
   for t in [0.01,3,5.8]:
    await page.locator('video').evaluate('(v,t)=>v.currentTime=t',t);await page.wait_for_function('(t)=>{const v=document.querySelector("video");return !v.seeking&&Math.abs(v.currentTime-t)<.025}',arg=t)
   assert (await page.locator('#download').get_attribute('href'))==f'Style{i:02d}.mp4'
   rows.append({'style':i,'metadata':info,'seeks':[.01,3,5.8],'download':'passed'})
  await page.locator('[data-id="04"]').click();await page.wait_for_function('document.querySelector("video").readyState>=2');await page.screenshot(path=str(DEST/'gallery.jpg'))
  await page.locator('video').evaluate('v=>{v.src="Ten-styles-comparison.mp4";v.muted=true;v.load()}');await page.wait_for_function('document.querySelector("video").readyState>=2');await page.locator('video').evaluate('v=>v.play()');await page.wait_for_function('document.querySelector("video").ended',timeout=75000)
  playback=await page.locator('video').evaluate('v=>({ended:v.ended,error:v.error?.message||null,duration:v.duration})');assert playback['ended'] and not playback['error'] and not errors
  result={'gallery_buttons':10,'clips':rows,'comparison_complete_muted_playback':playback,'page_errors':errors,'subjective_audio_listening':False}
  DOC.mkdir(parents=True,exist_ok=True);(DOC/'browser-check.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result));await b.close()
 server.shutdown()
if __name__=='__main__':asyncio.run(main())
