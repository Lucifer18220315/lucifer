"""Deterministic original sound design: switches, paper, pencil and water.
No sampled music or reference audio. Writes a temporary WAV and an AAC asset.
"""
from pathlib import Path
import subprocess
import wave
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
RATE = 44100
DURATION = 18
rng = np.random.default_rng(1871)
mix = np.zeros((RATE * DURATION, 2), dtype=np.float64)

def add(at, duration, kind, level=.12, pan=0):
    n = int(duration * RATE)
    t = np.arange(n) / RATE
    noise = rng.standard_normal(n)
    smooth = np.convolve(noise, np.ones(12) / 12, mode='same')
    if kind == 'switch':
        envelope = np.exp(-t * 80)
        signal = (.5 * noise + np.sin(2*np.pi*950*t)) * envelope
    elif kind == 'paper':
        envelope = np.sin(np.pi*np.arange(n)/n)**1.8
        signal = (noise-smooth) * envelope * (.65+.35*np.sin(2*np.pi*35*t))
    elif kind == 'water':
        envelope = np.minimum(1,t/.15)*np.minimum(1,(duration-t)/.25)
        signal = (smooth*.65 + np.sin(2*np.pi*(650*t+.9*np.sin(t*19)))*.12) * envelope
    elif kind == 'pencil':
        envelope = np.sin(np.pi*np.arange(n)/n)**.5
        signal = (noise-smooth)*envelope*(.6+.4*np.sin(t*150))
    else:
        signal = np.sin(2*np.pi*145*t)*np.exp(-t*18)
    stereo=np.column_stack([signal*np.sqrt((1-pan)/2),signal*np.sqrt((1+pan)/2)])
    start=int(at*RATE);end=min(start+n,len(mix))
    mix[start:end]+=stereo[:end-start]*level

for at in [.32,1.05,1.72,2.4,3.06]: add(at,.08,'switch',.13)
for at in [6.42,7.05,8.35]: add(at,.55,'paper',.07,pan=-.2)
add(9.63,.25,'tap',.1)
add(11.22,2.5,'water',.19)
add(14.37,.8,'pencil',.055)
add(15.3,.08,'switch',.08)
add(16.9,.2,'tap',.13)
# Quiet original warm tone underneath, without a borrowed musical track.
t=np.arange(len(mix))/RATE
bed=(np.sin(2*np.pi*110*t)+.45*np.sin(2*np.pi*165*t)+.2*np.sin(2*np.pi*220*t))*.007
fade=np.minimum(1,t/.8)*np.minimum(1,(DURATION-t)/.5)
mix+=bed[:,None]*fade[:,None]
peak=np.max(np.abs(mix));mix*=min(1,.75/max(peak,1e-9))
out=ROOT/'public';out.mkdir(exist_ok=True)
wav=out/'sound-design.wav'
with wave.open(str(wav),'wb') as f:
    f.setnchannels(2);f.setsampwidth(2);f.setframerate(RATE)
    f.writeframes((mix*32767).astype('<i2').tobytes())
subprocess.run(['ffmpeg','-v','error','-i',str(wav),'-c:a','aac','-b:a','128k','-y',str(out/'sound-design.m4a')],check=True)
wav.unlink()
print('Original sound asset:',out/'sound-design.m4a')
