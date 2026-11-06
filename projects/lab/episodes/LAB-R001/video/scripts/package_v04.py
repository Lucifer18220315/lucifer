"""Assemble the twelve source-timed shots and produce review artifacts, on server.

The reference audio is deliberately attributed and kept outside Git. No social
publication is performed. Run only after render_v04.mjs has verified all clips.
"""
from pathlib import Path
import hashlib, json, shutil, subprocess, zipfile, sys
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'out'
DEST = Path('/workspace/shared/downloads')
DOC = ROOT.parent / 'v04'
REFERENCE = Path('/tmp/playboy-editing-series/DcjNPkZB_KF.mp4')
FPS = 2997 / 125
SHOTS = [('LightingV04',94),('TabletopV04',60),('BlueprintV04',15),
         ('PagesV04',31),('FlipbookV04',31),('FoldingV04',38),('PourV04',61),
         ('SweepV04',14),('PencilHandV04',9),('PencilMacroV04',13),
         ('ClockV04',26),('ReturnV04',31)]

def run(args):
    return subprocess.run([str(a) for a in args], check=True,
                          capture_output=True, text=True).stdout

def probe(path):
    return json.loads(run(['ffprobe','-v','error','-count_frames',
                          '-show_format','-show_streams','-of','json',path]))

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def make_archive():
    archive=DEST/'LAB-R001-v04-source.zip'
    with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
        for folder in ('src','scripts','assets'):
            for p in sorted((ROOT/folder).rglob('*')):
                if p.is_file() and '__pycache__' not in p.parts:z.write(p,p.relative_to(ROOT))
        for name in ('package.json','package-lock.json','tsconfig.json','.gitignore'):
            z.write(ROOT/name,name)
        for folder in ('public/v03-assets','public/v04-assets'):
            for p in sorted((ROOT/folder).glob('*')):
                if p.is_file():z.write(p,p.relative_to(ROOT))
        for name in ('watch-v04.html','v04-poster.jpg','v04-reference-audio.m4a'):
            if (ROOT/'public'/name).exists():z.write(ROOT/'public'/name,Path('public')/name)
        for p in DOC.rglob('*'):
            if p.is_file():z.write(p,Path('documentation')/p.relative_to(DOC))

if '--archive-only' in sys.argv:
    make_archive()
    sys.exit(0)

DEST.mkdir(parents=True, exist_ok=True)
clips = json.loads((OUT / 'v04-clip-report.json').read_text())
assert sum(n for _,n in SHOTS) == 423
# Each clip keeps the SHA of its actual render. Targeted fixes may preserve
# unaffected clips; do not silently relabel them as a newer source revision.
for id, n in SHOTS:
    p = ROOT / f'public/v04-clips/{id}.mp4'
    assert p.exists() and sha(p) == clips[id]['sha256']
    assert int(probe(p)['streams'][0]['nb_read_frames']) == n

picture = OUT / 'v04-picture.mp4'
run(['ffmpeg','-y','-v','error','-f','concat','-safe','0','-i',OUT/'v04-concat.txt',
     '-c:v','copy','-an','-video_track_timescale','23976',picture])
movie = DEST / 'LAB-R001-v04.mp4'
run(['ffmpeg','-y','-v','error','-i',picture,'-i',ROOT/'public/v04-reference-audio.m4a',
     '-map','0:v:0','-map','1:a:0','-c','copy','-movflags','+faststart',movie])
run(['ffmpeg','-v','error','-i',movie,'-f','null','-'])
info = probe(movie)
v = next(s for s in info['streams'] if s['codec_type']=='video')
assert (v['width'],v['height'],int(v['nb_read_frames'])) == (720,1280,423)
assert v['r_frame_rate'] == '2997/125'

poster = DEST / 'LAB-R001-v04-poster.jpg'
run(['ffmpeg','-y','-v','error','-ss','3.5','-i',movie,'-frames:v','1','-q:v','2',poster])
review = OUT / 'v04-review'
review.mkdir(exist_ok=True)
run(['ffmpeg','-y','-v','error','-i',movie,'-vf','fps=8,scale=180:320',review/'%03d.jpg'])
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',15)
paths = sorted(review.glob('*.jpg'))
sheets=[]
for k, start in enumerate(range(0,len(paths),40),1):
    canvas=Image.new('RGB',(1440,1740),'#171b20'); draw=ImageDraw.Draw(canvas)
    for i,p in enumerate(paths[start:start+40]):
        x=i%8*180; y=i//8*348
        canvas.paste(Image.open(p),(x,y))
        draw.text((x+4,y+324),f'{(start+i)/8:.3f}s',font=font,fill='white')
    name=f'LAB-R001-v04-frames-{k:02}.jpg'
    canvas.save(DEST/name,quality=91); sheets.append(name)

comparison=DEST/'LAB-R001-v04-comparison.mp4'
if REFERENCE.exists():
    # Identical frame rate and no retiming: both timelines share all 12 cuts.
    filtergraph=("[0:v]scale=540:960,pad=540:1000:0:40:color=0x11151a,"
                 "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:"
                 "text='Austen Paul - reference':fontsize=22:fontcolor=white:x=12:y=9[a];"
                 "[1:v]scale=540:960,pad=540:1000:0:40:color=0x11151a,"
                 "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:"
                 "text='Playboy - v04':fontsize=22:fontcolor=white:x=12:y=9[b];"
                 "[a][b]hstack=inputs=2[v]")
    run(['ffmpeg','-y','-v','error','-i',REFERENCE,'-i',movie,
         '-filter_complex',filtergraph,'-map','[v]','-map','0:a:0',
         '-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p',
         '-c:a','copy','-movflags','+faststart',comparison])
    run(['ffmpeg','-v','error','-i',comparison,'-f','null','-'])

shutil.copy2(movie,ROOT/'public/LAB-R001-v04.mp4')
shutil.copy2(poster,ROOT/'public/v04-poster.jpg')
if comparison.exists():shutil.copy2(comparison,ROOT/'public/LAB-R001-v04-comparison.mp4')
report={'version':'v04','date':'2026-11-06','file':str(movie),
        'bytes':movie.stat().st_size,'sha256':sha(movie),'decode':'passed',
        'clip_source_revisions':sorted({clips[id]['sourceSha'] for id,_ in SHOTS}),
        'format':info['format'],'streams':info['streams'],
        'visual_samples':len(paths),'sheets':sheets,'clips':clips,
        'geometry':json.loads((OUT/'v04-geometry.json').read_text()),
        'browser':json.loads((OUT/'v04-browser.json').read_text()) if (OUT/'v04-browser.json').exists() else None,
        'source':{'author':'Austen Paul','url':'https://www.instagram.com/austen_paul/reel/DcjNPkZB_KF/',
                  'reference_video_in_git':False,'audio':'Reference AAC copied, not original work',
                  'subjective_listening':False},
        'comparison':str(comparison) if comparison.exists() else None}
(DOC/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:report[k] for k in ('file','bytes','sha256','visual_samples','comparison')},indent=2))

make_archive()
