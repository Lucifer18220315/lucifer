"""Create the reviewable MP4, diagrams, contact sheets and reproducible source archive."""
from pathlib import Path
import hashlib,json,math,shutil,subprocess,wave,zipfile
import numpy as np
from PIL import Image,ImageDraw,ImageFont

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'out'
DEST=Path('/workspace/shared/downloads')
EPISODE=ROOT.parent/'v03'
DEST.mkdir(parents=True,exist_ok=True)
def run(args):
    return subprocess.run(args,check=True,capture_output=True,text=True).stdout

# Original deterministic audio; no sampled music or borrowed audio from the reel.
sr=48000;duration=14;n=duration*sr;t=np.arange(n)/sr
rng=np.random.default_rng(20261106)
bed=(np.sin(2*np.pi*110*t)*.5+np.sin(2*np.pi*165*t)*.18+np.sin(2*np.pi*220*t)*.08)
fade=np.minimum(t/.65,1)*np.minimum((duration-t)/.8,1)
sound=bed*.009*fade
for when in (3,4.4,6,8.5,11):
    count=int(.22*sr);v=np.arange(count)/sr
    noise=rng.normal(0,1,count);soft=np.convolve(noise,np.ones(15)/15,mode='same')
    event=soft*np.exp(-v*26)*.035+np.sin(2*np.pi*420*v)*np.exp(-v*85)*.035
    start=int(when*sr);sound[start:start+count]+=event
stereo=np.stack([sound,sound*.96],axis=1)
pcm=(np.clip(stereo,-1,1)*32767).astype('<i2')
wav=OUT/'v03-sound.wav'
with wave.open(str(wav),'wb') as f:f.setnchannels(2);f.setsampwidth(2);f.setframerate(sr);f.writeframes(pcm.tobytes())
picture=OUT/'LAB-R001-v03-picture.mp4';movie=DEST/'LAB-R001-v03.mp4'
run(['ffmpeg','-y','-v','error','-i',str(picture),'-i',str(wav),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','128k','-t','14','-movflags','+faststart',str(movie)])
run(['ffmpeg','-v','error','-i',str(movie),'-f','null','-'])
info=json.loads(run(['ffprobe','-v','error','-count_frames','-show_format','-show_streams','-of','json',str(movie)]))
video=next(x for x in info['streams'] if x['codec_type']=='video')
assert video['width']==1080 and video['height']==1920 and int(video['nb_read_frames'])==336
assert video['r_frame_rate']=='24/1'
poster=DEST/'LAB-R001-v03-poster.jpg'
run(['ffmpeg','-y','-v','error','-ss','1.5','-i',str(movie),'-frames:v','1','-q:v','2',str(poster)])
frames=OUT/'v03-review';frames.mkdir(exist_ok=True)
run(['ffmpeg','-y','-v','error','-i',str(movie),'-vf','fps=8,scale=162:288',str(frames/'%03d.jpg')])
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16)
paths=sorted(frames.glob('*.jpg'))
sheets=[]
for sheet,first in enumerate(range(0,len(paths),40),1):
    canvas=Image.new('RGB',(162*8,316*5),'#17201d');draw=ImageDraw.Draw(canvas)
    for k,path in enumerate(paths[first:first+40]):
        x=k%8*162;y=k//8*316;canvas.paste(Image.open(path),(x,y));draw.text((x+5,y+292),f'{(first+k)/8:.3f}s',fill='#efe3cc',font=font)
    target=DEST/f'LAB-R001-v03-frames-{sheet:02}.jpg';canvas.save(target,quality=90);sheets.append(target.name)

# The on-video sketch is exported from the same source, without a second hand-made layout.
sketch=(ROOT/'src/v03/LightSketch.tsx').read_text()
svg=sketch[sketch.index('<svg'):sketch.index('</svg>')+6]
svg=svg.replace('style={{display:\'block\'}}','xmlns="http://www.w3.org/2000/svg"').replace('fillOpacity=','fill-opacity=').replace('fontFamily=','font-family=').replace('fontSize=','font-size=').replace('letterSpacing=','letter-spacing=').replace('strokeWidth=','stroke-width=').replace('strokeDasharray=','stroke-dasharray=').replace('textAnchor=','text-anchor=').replace('markerEnd=','marker-end=')
svg_path=DEST/'LAB-R001-v03-lighting.svg';svg_path.write_text(svg)
(EPISODE/'lighting.svg').write_text(svg)
try:
    import cairosvg
    cairosvg.svg2png(bytestring=svg.encode(),write_to=str(DEST/'LAB-R001-v03-lighting.png'),scale=2)
except ImportError:
    if shutil.which('inkscape'):
        run(['inkscape',str(svg_path),'--export-type=png','--export-width=1872','--export-filename='+str(DEST/'LAB-R001-v03-lighting.png')])
report={'version':'v03','date':'2026-11-06','file':str(movie),'sha256':hashlib.sha256(movie.read_bytes()).hexdigest(),'bytes':movie.stat().st_size,'format':info['format'],'streams':info['streams'],'decode':'passed','visual_samples':len(paths),'sheets':sheets,'audio':{'original_synthesis':True,'peak_dbfs':float(20*np.log10(np.max(np.abs(stereo)))),'subjective_listening':False},'geometry':json.loads((OUT/'v03-geometry.json').read_text()),'geometric_lighting':{k:v for k,v in json.loads((ROOT/'assets/v03-cup-occlusion.json').read_text()).items() if k!='meshes'}}
if Path('/tmp/v03-shadow-stats.json').exists():report['shadow_masks']=json.loads(Path('/tmp/v03-shadow-stats.json').read_text())
(EPISODE/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
# Media are server artifacts; the Git repository stores the project and checks.
shutil.copy2(movie,ROOT/'public/LAB-R001-v03.mp4');shutil.copy2(poster,ROOT/'public/v03-poster.jpg')
shutil.copy2(svg_path,ROOT/'public/v03-lighting.svg')
archive=DEST/'LAB-R001-v03-source.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
    for folder in ('src','scripts','assets'):
        for p in sorted((ROOT/folder).rglob('*')):
            if p.is_file() and '__pycache__' not in p.parts:z.write(p,p.relative_to(ROOT))
    for name in ('package.json','package-lock.json','tsconfig.json','.gitignore'):z.write(ROOT/name,name)
    for name in ('watch-v03.html','v03-lighting.svg','v03-poster.jpg'):z.write(ROOT/'public'/name,Path('public')/name)
    for p in sorted((ROOT/'public/v03-assets').glob('*')):z.write(p,p.relative_to(ROOT))
    for p in EPISODE.glob('*'):
        if p.is_file():z.write(p,Path('documentation')/p.name)
print(json.dumps({k:report[k] for k in ('file','sha256','bytes','visual_samples','audio')},ensure_ascii=False,indent=2))
