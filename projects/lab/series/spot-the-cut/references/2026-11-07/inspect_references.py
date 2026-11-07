"""Decode every native video frame; make labelled temporal sheets and audio metrics.

Local user uploads only. This is evidence preparation, not a claim of playback or
subjective audio listening. No generative API, network, or source audio reuse.
"""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.io import wavfile
from scipy.signal import find_peaks


def inspect(path, label, output):
    metadata = json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(path)
    ]))
    stream = next(s for s in metadata['streams'] if s['codec_type'] == 'video')
    n, d = map(int, stream['avg_frame_rate'].split('/'))
    fps = n / d
    w, h = 144, 256
    process = subprocess.Popen([
        'ffmpeg', '-v', 'error', '-i', str(path), '-an', '-vf', f'scale={w}:{h}',
        '-pix_fmt', 'rgb24', '-f', 'rawvideo', 'pipe:1'
    ], stdout=subprocess.PIPE)
    frames, differences = [], []
    previous = None
    while True:
        raw = process.stdout.read(w*h*3)
        if not raw:
            break
        if len(raw) != w*h*3:
            raise ValueError('Partial decoded frame')
        frame = np.frombuffer(raw, dtype=np.uint8).reshape(h, w, 3).copy()
        differences.append(0.0 if previous is None else float(np.abs(frame.astype(float)-previous).mean()))
        frames.append(frame)
        previous = frame.astype(float)
    if process.wait() != 0:
        raise RuntimeError('Video decoder failed')
    indices = sorted(set(round(t*fps) for t in np.arange(0, len(frames)/fps, 1/6)))
    indices = [i for i in indices if i < len(frames)]
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 13)

    def sheets(selected, prefix, cols=7, rows=6):
        paths = []
        for page, start in enumerate(range(0, len(selected), cols*rows)):
            chunk = selected[start:start+cols*rows]
            canvas = Image.new('RGB', (cols*(w+8), rows*(h+25)+35), '#15171a')
            draw = ImageDraw.Draw(canvas)
            draw.text((8, 8), f'{label} / {prefix} / chronological / frame index and seconds', font=font, fill='white')
            for cell, index in enumerate(chunk):
                x, y = (cell % cols)*(w+8)+4, (cell//cols)*(h+25)+35
                canvas.paste(Image.fromarray(frames[index]), (x, y))
                draw.text((x, y+h+3), f'{index:04}  {index/fps:06.3f}s', font=font, fill='white')
            target = output/f'{label}-{prefix}-{page+1:02}.jpg'
            canvas.save(target, quality=87)
            paths.append(str(target))
        return paths

    sheets_paths = sheets(indices, 'sequence-6fps')
    candidates, _ = find_peaks(np.array(differences), height=9, distance=round(fps*.20))
    dense = sorted({i for p in candidates for i in range(max(0,p-3), min(len(frames),p+4))})
    dense_paths = sheets(dense, 'change-neighbours')
    wav = output/f'{label}.wav'
    subprocess.run(['ffmpeg','-v','error','-i',str(path),'-vn','-ac','1','-ar','44100','-y',str(wav)],check=True)
    sr, audio = wavfile.read(wav)
    samples = audio.astype(float)/32768
    block = max(1, int(sr*.01))
    rms = np.sqrt(np.mean(samples[:len(samples)//block*block].reshape(-1,block)**2,axis=1))
    peaks, _ = find_peaks(rms, prominence=.035, distance=12)
    metrics = {
        'audio_subjectively_listened': False,
        'peak_dbfs': float(20*np.log10(max(abs(samples).max(),1e-12))),
        'rms_dbfs': float(20*np.log10(max(np.sqrt(np.mean(samples*samples)),1e-12))),
        'rms_peak_candidates_seconds': [round(float(p*.01),2) for p in peaks],
        'warning':'Amplitude peaks do not identify ASMR, speech, musical beats or effect types.'
    }
    result = {
        'id':label,'source_path':str(path),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
        'bytes':path.stat().st_size,'width':stream['width'],'height':stream['height'],
        'fps_rational':stream['avg_frame_rate'],'duration_seconds':float(stream['duration']),
        'decoded_native_frames':len(frames),'temporal_sheet_rate':6,'temporal_sheet_frames':indices,
        'sequence_sheets':sheets_paths,'change_neighbour_sheets':dense_paths,
        'visual_difference_candidates':[{'frame':int(i),'seconds':round(i/fps,4),'mean_rgb_difference':round(differences[i],3)} for i in candidates],
        'audio':metrics,
        'limitations':'Every frame decoded numerically; visual review uses chronological 6 fps sheets and seven-frame change windows. Not realtime video playback, not exhaustive subjective inspection of every native frame.'
    }
    (output/f'{label}-inspection.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
    print(json.dumps({'id':label,'decoded_frames':len(frames),'sequence_sheets':len(sheets_paths),'change_sheets':len(dense_paths),'change_candidates':len(candidates),'audio':metrics}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('source',type=Path)
    parser.add_argument('label')
    parser.add_argument('output',type=Path)
    args = parser.parse_args()
    args.output.mkdir(exist_ok=True,parents=True)
    inspect(args.source,args.label,args.output)
