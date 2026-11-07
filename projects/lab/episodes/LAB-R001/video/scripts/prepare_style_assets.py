"""Free licensed video sources, own textures and separately synthesized audio stems."""
from pathlib import Path
import concurrent.futures,hashlib,json,subprocess,urllib.request,wave
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1];ASSETS=ROOT/'public/style-tests-assets';DOC=ROOT.parents[2]/'style-tests-01'
ASSETS.mkdir(parents=True,exist_ok=True)
rows=json.loads((DOC/'assets.json').read_text())
def fetch(row):
 p=ASSETS/(str(row['id'])+'.mp4')
 if not p.exists():
  with urllib.request.urlopen(urllib.request.Request(row['asset_url'],headers={'User-Agent':'Mozilla/5.0'}),timeout=60) as response:p.write_bytes(response.read())
 assert hashlib.sha256(p.read_bytes()).hexdigest()==row['sha256'],p
 return row['id']
with concurrent.futures.ThreadPoolExecutor(4) as pool:
 for id in pool.map(fetch,rows):print('Source ready',id)
for id in ['34845729','3736793','8100339','5092427','15162384']:
 subprocess.run(['ffmpeg','-v','error','-y','-ss','2','-i',str(ASSETS/(id+'.mp4')),'-frames:v','1','-q:v','2',str(ASSETS/(id+'.jpg'))],check=True)
rng=np.random.default_rng(731);Image.fromarray(rng.normal(126,22,(640,360)).clip(0,255).astype('uint8')).save(ASSETS/'grain.png')
im=Image.new('RGB',(1200,1600),'#e7dfcd');draw=ImageDraw.Draw(im)
for y in range(0,1600,8):draw.line((0,y,1200,y),fill=(224+(y%3),216+(y%3),198+(y%3)))
im.save(ASSETS/'paper.jpg',quality=90)
rate=44100;N=rate*6;t=np.arange(N)/rate;report={}
for s in range(1,11):
 music=np.zeros(N);fx=np.zeros(N);rng=np.random.default_rng(122+s)
 def note(at,duration,freq,amp=.08):
  i=int(at*rate);n=min(int(duration*rate),N-i)
  if n<=0:return
  u=np.arange(n)/rate;env=(1-np.exp(-u*60))*np.exp(-u*3/max(duration,.2));music[i:i+n]+=amp*env*(np.sin(2*np.pi*freq*u)+.22*np.sin(2*np.pi*freq*2*u))
 def tick(at,amp=.12,kind='soft'):
  i=int(at*rate);n=min(int(.14*rate),N-i)
  if n<=0:return
  u=np.arange(n)/rate;decay=np.exp(-u*(85 if kind=='soft' else 30));fx[i:i+n]+=amp*decay*(rng.normal(size=n)*.45+np.sin(2*np.pi*(1800 if kind=='soft' else 120)*u))
 if s in [1,4,6,7,10]:
  for i,a in enumerate(np.arange(0,6,.5)):
   note(a,.42,[110,138.59,164.81,123.47][i%4],.055);tick(a,.07)
   if i%2:note(a+.25,.2,440*(2**((i%5)/12)),.024)
 elif s==2:
  for a in [.15,1.15,2.45,3.7,4.5,5.1]:tick(a,.08)
  fx+=rng.normal(size=N)*.002
 elif s==3:
  for i,a in enumerate(np.arange(.08,6,.25)):note(a,.18,[261.63,329.63,392,493.88][i%4],.055);tick(a,.05)
 elif s==5:
  music+=.025*np.sin(2*np.pi*55*t)*(np.sin(t*.5)**2)
  for a in [0,1.5,2.5,3.5,4,5]:tick(a,.09,'deep')
 elif s==8:
  for a in [0,1.7,2,2.3,3.4,4.7,5.2]:tick(a,.16,'deep')
  for a in [0,2,4]:note(a,1.8,82.4,.03)
 else:
  for i,a in enumerate(np.arange(0,6,.375)):note(a,.6,[220,277.18,329.63,440][i%4],.04);tick(a,.04)
 fade=np.minimum(1,np.minimum(t/.05,(6-t)/.12)).clip(0,1);music*=fade;fx*=fade;mix=music+.85*fx
 for name,array in [('music',music),('sfx',fx),('audio',mix)]:
  pcm=(array.clip(-.85,.85)*32767).astype('<i2')
  with wave.open(str(ASSETS/f'{name}-{s:02d}.wav'),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate);w.writeframes(pcm.tobytes())
 report[str(s)]={'sfx_gain':.85,'music_gain':1,'peak_dbfs':float(20*np.log10(max(np.max(np.abs(mix)),1e-9))),'rms_dbfs':float(20*np.log10(max(np.sqrt(np.mean(mix**2)),1e-9))),'clipped_samples':int(np.count_nonzero(np.abs(mix)>=1))}
(DOC/'audio.json').write_text(json.dumps(report,indent=2)+'\n')
print('Own textures and10separate music/effects stems ready')
