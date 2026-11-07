"""Native unregistered per-clip overlays for incremental visual review."""
from pathlib import Path
import sys,subprocess,json
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1]
shots=[('LightingV05',0,94),('TabletopV05',94,60),('BlueprintV05',154,15),('PagesV05',169,31),('FlipbookV05',200,31),('FlipbookV05C',200,31),('FoldingV05',231,38),('PourV05',269,61),('SweepV05',330,14),('PencilHandV05',344,9),('PencilMacroV05',353,13),('ClockV05',366,26),('ReturnV05',392,31)]
id=sys.argv[1];name,start,n=next(x for x in shots if x[0]==id)
out=ROOT/'out/v05-review';out.mkdir(exist_ok=True)
p=subprocess.Popen(['ffmpeg','-v','error','-i',str(ROOT/f'public/v05-clips/{id}.mp4'),'-fps_mode','passthrough','-pix_fmt','rgb24','-f','rawvideo','-'],stdout=subprocess.PIPE)
frames=[]
for f in range(n):
 size=720*1280*3;data=bytearray()
 while len(data)<size:
  b=p.stdout.read(size-len(data));assert b;data.extend(b)
 ours=Image.frombytes('RGB',(720,1280),bytes(data))
 source=Image.open(ROOT/f'out/v04-audit/reference-native/{start+f:04d}.jpg').convert('RGB')
 alpha=Image.blend(source,ours,.5);alpha.thumbnail((144,256));frames.append((start+f,alpha.copy()))
 if f in [0,n//2,n-1]:
  c=Image.new('RGB',(2160,1320),'#14181b');d=ImageDraw.Draw(c)
  for i,(im,label) in enumerate([(source,'REFERENCE'),(ours,'V05'),(Image.blend(source,ours,.5),'50/50')]):c.paste(im,(720*i,40));d.text((720*i+5,5),f'{label} f{start+f}')
  c.save(out/f'{id}-key-{start+f}.jpg',quality=91)
assert not p.stdout.read(1) and p.wait()==0
for k in range(0,n,24):
 c=Image.new('RGB',(864,1120),'#14181b');d=ImageDraw.Draw(c)
 for j,(f,im) in enumerate(frames[k:k+24]):x=j%6*144;y=j//6*280;c.paste(im,(x,y));d.text((x+2,y+259),f'f{f:03}')
 dest=out/f'{id}-{k//24+1}.jpg';c.save(dest,quality=85);print(dest)
