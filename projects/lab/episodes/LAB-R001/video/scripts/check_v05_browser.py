"""Check seeking and complete muted playback of the diagnostic overlay."""
import asyncio
import argparse
import json
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.async_api import async_playwright


async def check_movie(name, dimensions):
    movie = Path('/workspace/shared/downloads', name).read_bytes()
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory='/workspace/shared/downloads', **kwargs)

        def log_message(self, *args):
            pass

        def do_GET(self):
            if self.path == '/':
                body = ('<!doctype html><meta charset="utf-8"><title>Overlay audit</title>'
                        '<video controls muted src="/MOVIE_NAME" '
                        'style="width:100%;max-height:90vh"></video>').replace('MOVIE_NAME',name).encode()
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Content-Length', str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            elif self.path == '/'+name:
                start, end = 0, len(movie) - 1
                requested = self.headers.get('Range')
                if requested:
                    first, last = requested.removeprefix('bytes=').split('-', 1)
                    if first:
                        start = int(first)
                        if last:
                            end = min(end, int(last))
                    else:
                        start = max(0, len(movie) - int(last))
                self.send_response(206 if requested else 200)
                self.send_header('Content-Type', 'video/mp4')
                self.send_header('Accept-Ranges', 'bytes')
                self.send_header('Content-Length', str(end - start + 1))
                if requested:
                    self.send_header('Content-Range', f'bytes {start}-{end}/{len(movie)}')
                self.end_headers()
                try:
                    self.wfile.write(movie[start:end + 1])
                except (BrokenPipeError, ConnectionResetError):
                    pass  # The browser can cancel a range during seeking.
            else:
                super().do_GET()

    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path='/usr/bin/chromium', headless=True,
                    args=['--no-sandbox',
                          '--autoplay-policy=no-user-gesture-required'])
        page = await browser.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        await page.goto(f'http://127.0.0.1:{server.server_port}/')
        await page.wait_for_function("document.querySelector('video').readyState>=2", timeout=30000)
        info = await page.eval_on_selector('video',
                    'v=>({width:v.videoWidth,height:v.videoHeight,duration:v.duration})')
        assert (info['width'], info['height']) == dimensions
        seeks = [0, 36/(2997/125), 66/(2997/125), 94/(2997/125), 154/(2997/125), 269/(2997/125), 392/(2997/125)]
        for t in seeks:
            await page.eval_on_selector('video', '(v,t)=>v.currentTime=t', t)
            await page.wait_for_function('(t)=>!document.querySelector("video").seeking&&'
                    'Math.abs(document.querySelector("video").currentTime-t)<.02', arg=t)
        await page.eval_on_selector('video', 'async v=>{v.currentTime=0;await v.play()}')
        await page.wait_for_function("document.querySelector('video').ended", timeout=30000)
        ended = await page.eval_on_selector('video',
                    'v=>({ended:v.ended,error:v.error?.message||null})')
        assert ended['ended'] and not ended['error'] and not errors
        result = {'dimensions': info, 'seeks_seconds': seeks, 'playback': ended,
                  'page_errors': errors, 'audio_stream': dimensions == (720,1280),
                  'subjective_listening': False}
        doc = Path(__file__).resolve().parents[2] / 'v05' / ('browser-'+name.removesuffix('.mp4')+'.json')
        doc.write_text(json.dumps(result, indent=2) + '\n')
        print(json.dumps(result))
        await browser.close()
    server.shutdown()
    server.server_close()


async def check_player():
    root=Path(__file__).resolve().parents[1]
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self,*args,**kwargs): super().__init__(*args,directory=str(root/'public'),**kwargs)
        def log_message(self,*args): pass
        def do_GET(self):
            path=root/'public'/self.path.lstrip('/')
            if not self.path.endswith('.mp4') or not path.is_file():
                return super().do_GET()
            data=path.read_bytes();start,end=0,len(data)-1
            requested=self.headers.get('Range')
            if requested:
                first,last=requested.removeprefix('bytes=').split('-',1)
                if first:
                    start=int(first)
                    if last:end=min(end,int(last))
                else:start=max(0,len(data)-int(last))
            self.send_response(206 if requested else 200)
            self.send_header('Content-Type','video/mp4')
            self.send_header('Accept-Ranges','bytes')
            self.send_header('Content-Length',str(end-start+1))
            if requested:self.send_header('Content-Range',f'bytes {start}-{end}/{len(data)}')
            self.end_headers()
            try:self.wfile.write(data[start:end+1])
            except (BrokenPipeError,ConnectionResetError):pass
    server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
        page=await browser.new_page(viewport={'width':1000,'height':900})
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        response=await page.goto(f'http://127.0.0.1:{server.server_port}/watch-v05.html')
        assert response.status==200
        await page.wait_for_function("document.querySelector('video').readyState>=2")
        assert await page.title()=='LAB-R001 · v05'
        chapters=[]
        for b in await page.locator('#cuts button').all():
            frame=int(await b.get_attribute('data-frame'));await b.click()
            await page.wait_for_function('(t)=>!document.querySelector("video").seeking&&Math.abs(document.querySelector("video").currentTime-t)<.02',arg=frame/(2997/125))
            chapters.append(frame)
        assert len(chapters)==14
        await page.locator('[data-variant="control"]').click()
        await page.wait_for_function("document.querySelector('video').readyState>=2&&document.querySelector('video').src.endsWith('-control.mp4')")
        assert await page.locator('#cuts button').count()==12
        assert (await page.locator('#download').get_attribute('href')).endswith('-control.mp4')
        await page.locator('[data-variant="hook"]').click()
        await page.wait_for_function("document.querySelector('video').readyState>=2&&document.querySelector('video').src.endsWith('-hook.mp4')")
        assert await page.locator('#cuts button').count()==14 and not errors
        await page.screenshot(path=str(root/'out/v05-player.png'))
        report={'http':response.status,'hook_chapters_frames':chapters,'control_chapters':12,'version_toggle':'passed','download_link':'passed','page_errors':errors}
        (root.parent/'v05/browser-player.json').write_text(json.dumps(report,indent=2)+'\n')
        print(json.dumps(report));await browser.close()
    server.shutdown();server.server_close()

async def main():
    for name,dims in [('LAB-R001-v05-hook.mp4',(720,1280)),('LAB-R001-v05-control.mp4',(720,1280)),('LAB-R001-v05-overlay-16p8ms.mp4',(1440,1328))]:
        await check_movie(name,dims)
    await check_player()

if __name__ == '__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--player-only',action='store_true')
    asyncio.run(check_player() if parser.parse_args().player_only else main())
