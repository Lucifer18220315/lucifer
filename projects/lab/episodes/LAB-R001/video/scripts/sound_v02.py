"""Five seconds of deterministic original sound design; no sampled music."""
from pathlib import Path
import subprocess,wave
import numpy as np

root=Path(__file__).resolve().parents[1]
rate=44100;duration=5;rng=np.random.default_rng(902)
mix=np.zeros((rate*duration,2),dtype=np.float64)
t=np.arange(len(mix))/rate
bed=(np.sin(2*np.pi*146.83*t)+.35*np.sin(2*np.pi*220*t)+.15*np.sin(2*np.pi*293.66*t))*.009
mix+=bed[:,None]*(np.minimum(1,t/.12)*np.minimum(1,(duration-t)/.24))[:,None]
for at,length,level in [(.65,.22,.16),(1.55,.35,.2),(2.55,.28,.16),(3.3,.5,.12)]:
 n=int(length*rate);x=np.arange(n)/rate;noise=rng.standard_normal(n)
 filtered=np.convolve(noise,np.ones(20)/20,mode='same')
 signal=(filtered*.8+np.sin(2*np.pi*(180*x+24*x*x))*.16)*np.sin(np.pi*np.arange(n)/n)**2*level
 start=int(at*rate);mix[start:start+n]+=np.column_stack([signal*.92,signal])
mix*=.63/max(np.max(np.abs(mix)),1e-9)
out=root/'public';wav=out/'sound-v02.wav'
with wave.open(str(wav),'wb') as f:
 f.setnchannels(2);f.setsampwidth(2);f.setframerate(rate);f.writeframes((mix*32767).astype('<i2').tobytes())
subprocess.run(['ffmpeg','-v','error','-i',str(wav),'-c:a','aac','-b:a','128k','-y',str(out/'sound-v02.m4a')],check=True)
wav.unlink()
print('Created original five-second sound asset')
