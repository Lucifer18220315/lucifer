"""D022: all native frame pairs and an explicit 16.8 ms zero-order-hold grid.

No optical interpolation: the 23.976 fps reference has no new observations
between its real frames. Every native frame is represented in the CSV/video.
"""
from pathlib import Path
from fractions import Fraction
import csv,hashlib,json,math,subprocess
from PIL import Image,ImageDraw,ImageFont

ROOT=Path(__file__).resolve().parents[1]
DEST=Path('/workspace/shared/downloads')
DOC=ROOT.parent/'v04-2'
OUT=ROOT/'out/v042-audit'
SOURCE=DEST/'LAB-R001-v04-1-text-clean.mp4'
OWN=DEST/'LAB-R001-v04-2-hook.mp4'
FPS=Fraction(2997,125)
STEP=Fraction(21,1250) # exactly .0168 seconds
N=423

def run(args):
    return subprocess.run([str(a) for a in args],check=True,capture_output=True,text=True).stdout

def extract(movie,directory):
    directory.mkdir(parents=True,exist_ok=True)
    run(['ffmpeg','-y','-v','error','-i',movie,'-vsync','0','-q:v','2',
         '-start_number','0',directory/'%04d.jpg'])
    assert len(list(directory.glob('*.jpg')))==N

for movie in (SOURCE,OWN):
    info=json.loads(run(['ffprobe','-v','error','-count_frames','-select_streams','v:0',
                         '-show_streams','-of','json',movie]))['streams'][0]
    assert int(info['nb_read_frames'])==N and Fraction(info['r_frame_rate'])==FPS

reference=OUT/'reference-native';own=OUT/'own-native';pairs=OUT/'pairs-native';slots=OUT/'slots-16p8ms'
extract(SOURCE,reference);extract(OWN,own)
pairs.mkdir(parents=True,exist_ok=True);slots.mkdir(parents=True,exist_ok=True)
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',26)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',15)
for f in range(N):
    canvas=Image.new('RGB',(1440,1328),'#151b20');draw=ImageDraw.Draw(canvas)
    with Image.open(reference/f'{f:04}.jpg') as a,Image.open(own/f'{f:04}.jpg') as b:
        canvas.paste(a,(0,48));canvas.paste(b,(720,48))
    draw.text((12,8),f'Control v04.1 / f{f:03} / {float(f/FPS)*1000:.3f} ms',font=font,fill='white')
    draw.text((732,8),f'Hook v04.2 / f{f:03}',font=font,fill='white')
    canvas.save(pairs/f'{f:04}.jpg',quality=92)

shots=json.loads((ROOT.parent/'v04/reference-edit.json').read_text())['shots']
grid=[];k=0
while k*STEP < N/FPS:
    t=k*STEP;f=min(N-1,math.floor(t*FPS));shot=next(s['id'] for s in shots if s['from']<=f<s['to'])
    name=f'{k:06}.jpg';target=slots/name
    if target.exists() or target.is_symlink():target.unlink()
    target.symlink_to(pairs/f'{f:04}.jpg')
    grid.append({'sample':k,'time_ms':f'{float(t*1000):.1f}','reference_frame':f,
                 'our_frame':f,'shot':'hook' if f<94 else shot,'native_frame_time_ms':f'{float(f/FPS)*1000:.3f}',
                 'pair':f'{f:04}.jpg'})
    k+=1
assert len(grid)==1051 and {r['reference_frame'] for r in grid}==set(range(N))
csv_path=DOC/'grid-16p8ms.csv'
with csv_path.open('w',newline='') as file:
    writer=csv.DictWriter(file,fieldnames=list(grid[0]),lineterminator='\n');writer.writeheader();writer.writerows(grid)

sheets=[]
for sheet,start in enumerate(range(0,N,24),1):
    canvas=Image.new('RGB',(2160,1424),'#182027');draw=ImageDraw.Draw(canvas)
    for i,f in enumerate(range(start,min(start+24,N))):
        x=i%6*360;y=i//6*356
        with Image.open(pairs/f'{f:04}.jpg') as pair:canvas.paste(pair.resize((360,332),Image.Resampling.LANCZOS),(x,y))
        draw.text((x+5,y+335),f'f{f:03}  /  {float(f/FPS):.3f}s',font=small,fill='white')
    name=f'LAB-R001-v04-2-audit-{sheet:02}.jpg';canvas.save(DEST/name,quality=94);sheets.append(name)

video=DEST/'LAB-R001-v04-2-compare-16p8ms.mp4'
run(['ffmpeg','-y','-v','error','-framerate','1250/21','-i',slots/'%06d.jpg',
     '-i',ROOT/'public/v04-reference-audio.m4a','-map','0:v:0','-map','1:a:0',
     '-frames:v',str(len(grid)),'-c:v','libx264','-preset','fast','-crf','18',
     '-pix_fmt','yuv420p','-c:a','copy','-video_track_timescale','125000',
     '-movflags','+faststart',video])
run(['ffmpeg','-v','error','-i',video,'-f','null','-'])
report={'native_frame_pairs':N,'sample_step_ms':16.8,'sample_grid_count':len(grid),
        'source_fps':'2997/125','sample_grid_fps':'1250/21',
        'all_native_frames_covered':True,'interpolation':'none; hold existing frames',
        'comparison':str(video),'native_pairs':str(pairs),'contact_sheets':sheets,
        'own_sha256':hashlib.sha256(OWN.read_bytes()).hexdigest(),
        'reference_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
        'manual_review':'Inspect changed pairs f0-93; identical decoded frames f94-422 inherit the prior review. Record actual checks separately.', 'comparison_baseline':'v04.1 control, not the Austen Paul reference'}
(DOC/'audit-data.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
