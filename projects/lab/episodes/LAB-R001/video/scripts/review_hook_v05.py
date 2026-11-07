"""Contact sheets of all 94 native hook frames; not a fidelity overlay."""
from pathlib import Path
import subprocess
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'out/v05-hook-review';OUT.mkdir(exist_ok=True)
frames=[]
for id,n in [('HookSetupV05B',36),('HookDetailV05',30),('HookResultV05',28)]:
 p=subprocess.Popen(['ffmpeg','-v','error','-i',str(ROOT/f'public/v05-clips/{id}.mp4'),'-fps_mode','passthrough','-pix_fmt','rgb24','-f','rawvideo','-'],stdout=subprocess.PIPE)
 for i in range(n):
  size=720*1280*3;data=bytearray()
  while len(data)<size:
   part=p.stdout.read(size-len(data));assert part;data.extend(part)
  im=Image.frombytes('RGB',(720,1280),bytes(data));im.thumbnail((144,256));frames.append((id,i,im))
 assert not p.stdout.read(1) and p.wait()==0
assert len(frames)==94
for k in range(0,94,24):
 c=Image.new('RGB',(864,1120),'#14181b');d=ImageDraw.Draw(c)
 for j,(id,f,im) in enumerate(frames[k:k+24]):
  x=j%6*144;y=j//6*280;c.paste(im,(x,y));d.text((x+2,y+258),f'f{k+j:03} / {id[4:7]} {f}')
 dest=OUT/f'{k//24+1:02}.jpg';c.save(dest,quality=85);print(dest)
