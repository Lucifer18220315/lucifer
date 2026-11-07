"""Check seeking and complete muted playback of the diagnostic overlay."""
import asyncio
import json
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.async_api import async_playwright


async def main():
    movie = Path('/workspace/shared/downloads/LAB-R001-overlay-16p8ms.mp4').read_bytes()
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory='/workspace/shared/downloads', **kwargs)

        def log_message(self, *args):
            pass

        def do_GET(self):
            if self.path == '/':
                body = ('<!doctype html><meta charset="utf-8"><title>Overlay audit</title>'
                        '<video controls muted src="/LAB-R001-overlay-16p8ms.mp4" '
                        'style="width:100%;max-height:90vh"></video>').encode()
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Content-Length', str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            elif self.path == '/LAB-R001-overlay-16p8ms.mp4':
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
        assert (info['width'], info['height']) == (1440, 1328)
        seeks = [0, 3.9206, 6.4231, 11.2196, 16.3497]
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
                  'page_errors': errors, 'audio_stream': False,
                  'subjective_listening': False}
        doc = Path(__file__).resolve().parents[2] / 'overlay-audit/browser.json'
        doc.write_text(json.dumps(result, indent=2) + '\n')
        print(json.dumps(result))
        await browser.close()
    server.shutdown()
    server.server_close()


if __name__ == '__main__':
    asyncio.run(main())
