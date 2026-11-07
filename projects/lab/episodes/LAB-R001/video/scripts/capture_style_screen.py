"""Record a real local grading/export operation, rather than animated fake UI."""
import asyncio,json,subprocess,threading,time,os,shutil
import playwright
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]; ASSETS=ROOT/'public/style-tests-assets';OUT=ROOT/'out/style-screen';OUT.mkdir(parents=True,exist_ok=True)
registry=json.loads((Path(playwright.__file__).parent/'driver/package/browsers.json').read_text())
revision=next(x['revision'] for x in registry['browsers'] if x['name']=='ffmpeg')
cache=OUT/'pw-browsers';binary=cache/('ffmpeg-'+revision)/'ffmpeg-linux';binary.parent.mkdir(parents=True,exist_ok=True)
if not binary.exists():binary.symlink_to(shutil.which('ffmpeg'))
os.environ['PLAYWRIGHT_BROWSERS_PATH']=str(cache)
HTML='''<!doctype html><html><meta charset="utf-8"><style>
*{box-sizing:border-box}body{margin:0;background:#14191f;color:#e3e7df;font-family:Arial}header{padding:30px 28px 22px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #30383d}header b{font-size:23px;letter-spacing:2px}header span{font:12px monospace;color:#859a8e}main{padding:28px}.top{display:flex;justify-content:space-between;font:12px monospace;color:#99a99e;letter-spacing:2px;margin-bottom:16px}.preview{height:540px;position:relative;overflow:hidden;background:#080b0e;border-radius:7px}video{width:100%;height:100%;object-fit:cover;object-position:50% 45%}.badge{position:absolute;left:16px;bottom:16px;background:#151b20c0;padding:7px 10px;font:12px monospace}.ruler{display:flex;justify-content:space-between;margin-top:22px;color:#72877b;font:12px monospace}.track{height:68px;margin-top:10px;position:relative;background:repeating-linear-gradient(90deg,#547965 0px,#547965 70px,#203a30 71px,#203a30 73px);border:1px solid #82bba0;border-radius:4px}#playhead{position:absolute;height:80px;top:-8px;width:2px;background:#e6b36c;left:0}.panel{border-top:1px solid #30383d;margin-top:28px;padding-top:23px}h2{font-size:20px;margin:0 0 21px}.control{display:flex;justify-content:space-between;font-size:15px;color:#b4c1b6}input{width:100%;margin:18px 0 25px;accent-color:#c2e2c6}button{width:100%;padding:18px;background:#c3dfc4;color:#192c21;border:0;border-radius:5px;font-size:16px;font-weight:bold;cursor:pointer}#status{font:13px monospace;color:#a4b5a7;padding:18px 0;min-height:51px}a{color:#bfe0c4;font-size:14px}.caption{position:absolute;bottom:78px;width:100%;text-align:center;font:32px Georgia;text-shadow:0 2px 8px #000;color:#f1eee1}.note{font:12px Arial;color:#718276;margin-top:15px}
</style><header><b>CUT / WORKSPACE</b><span>LOCAL EDITING STUDY</span></header><main><div class="top"><span>01 / COLOR & EXPORT</span><span id="time">00:00</span></div><div class="preview"><video id="v" src="/15162384.mp4" autoplay muted loop playsinline></video><span class="badge" id="mode">ORIGINAL</span><div class="caption">Внимание к деталям.</div></div><div class="ruler"><span>00:00</span><span>00:02</span><span>00:04</span><span>00:06</span></div><div class="track"><div id="playhead"></div></div><div class="panel"><h2>Цвет и настроение</h2><div class="control"><span>Насыщенность</span><span id="value">100%</span></div><input id="grade" type="range" min="20" max="130" value="100"><button id="render">Экспортировать фрагмент</button><div id="status">Исходник загружен · 6 секунд</div><a id="result" hidden href="/screen-export.mp4" download>Скачать готовый MP4 ↓</a><div class="note">Демонстрация на лицензированном стоковом материале.</div></div></main><script>
const v=document.querySelector('#v'),slider=document.querySelector('#grade');v.currentTime=7;
slider.oninput=()=>{v.style.filter=`saturate(${slider.value/100}) contrast(1.08) sepia(.12)`;document.querySelector('#value').textContent=slider.value+'%';document.querySelector('#mode').textContent='GRADE / LIVE'};
v.ontimeupdate=()=>{document.querySelector('#time').textContent='00:'+String(Math.floor(v.currentTime)).padStart(2,'0');document.querySelector('#playhead').style.left=((v.currentTime%6)/6*100)+'%'};
document.querySelector('#render').onclick=async()=>{const b=document.querySelector('#render');b.disabled=true;document.querySelector('#status').textContent='Идёт экспорт…';const r=await fetch('/export',{method:'POST',body:JSON.stringify({saturation:Number(slider.value)/100})});const j=await r.json();document.querySelector('#status').textContent=j.ok?'MP4 готов · '+j.frames+' кадра':'Ошибка экспорта';document.querySelector('#result').hidden=!j.ok;b.disabled=false};
</script></html>'''
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**k):super().__init__(*a,directory=str(ASSETS),**k)
 def log_message(self,*a):pass
 def do_GET(self):
  if self.path=='/':
   b=HTML.encode();self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Content-Length',str(len(b)));self.end_headers();self.wfile.write(b)
  else:
   try:super().do_GET()
   except (BrokenPipeError,ConnectionResetError):pass
 def do_POST(self):
  if self.path!='/export':self.send_error(404);return
  data=json.loads(self.rfile.read(int(self.headers['Content-Length'])));sat=min(1.3,max(.2,float(data['saturation'])))
  begin=time.monotonic()
  cmd=['ffmpeg','-y','-v','error','-ss','7','-i',str(ASSETS/'15162384.mp4'),'-t','6','-vf',f'scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,eq=saturation={sat}:contrast=1.08','-r','24','-an','-c:v','libx264','-threads','2','-preset','fast','-crf','19','-movflags','+faststart',str(ASSETS/'screen-export.mp4')]
  subprocess.run(cmd,check=True);result={'ok':True,'frames':144,'saturation':sat,'seconds':time.monotonic()-begin,'actual_command':cmd};(OUT/'operation.json').write_text(json.dumps(result,indent=2)+'\n')
  b=json.dumps(result).encode();self.send_response(200);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(b)));self.end_headers();self.wfile.write(b)
async def main():
 server=ThreadingHTTPServer(('127.0.0.1',0),Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
  context=await browser.new_context(viewport={'width':720,'height':1280},record_video_dir=str(OUT),record_video_size={'width':720,'height':1280})
  page=await context.new_page();await page.goto(f'http://127.0.0.1:{server.server_port}/');await page.wait_for_function('document.querySelector("video").readyState>=2');await page.wait_for_timeout(1000)
  await page.locator('#grade').fill('62');await page.locator('#grade').dispatch_event('input');await page.wait_for_timeout(800)
  await page.locator('#render').click();await page.wait_for_function('!document.querySelector("#result").hidden',timeout=30000);await page.wait_for_timeout(1500)
  await page.screenshot(path=str(OUT/'screen.png'));video=page.video;await context.close();path=await video.path();await browser.close()
  (OUT/'capture-path.txt').write_text(str(path));print(path)
 server.shutdown()
if __name__=='__main__':asyncio.run(main())
