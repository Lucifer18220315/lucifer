"""Unregistered reference/control overlays. Generates evidence, not a new edit.

Uses native decoded pixels; no registration, crop, optical flow or interpolation.
The 16.8 ms grid holds native frames. Manual review is recorded separately.
"""
from pathlib import Path
from fractions import Fraction
import csv
import hashlib
import json
import math
import os
import shutil
import subprocess

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT.parent / 'v05' / 'overlay-audit'
OUT = ROOT / 'out/v05-overlay'
DOWNLOADS = Path('/workspace/shared/downloads')
SOURCE = Path('/tmp/playboy-editing-series/DcjNPkZB_KF.mp4')
CONTROL = DOWNLOADS / 'LAB-R001-v05-control.mp4'
LATEST = DOWNLOADS / 'LAB-R001-v05-hook.mp4'
FPS = Fraction(2997, 125)
STEP = Fraction(21, 1250)
N = 423
W, H = 720, 1280
KEYS = [0, 24, 58, 85, 94, 123, 153, 154, 165, 184, 215,
        228, 231, 250, 268, 269, 300, 329, 330, 338, 349, 352,
        353, 365, 381, 391, 405, 422]


def run(args):
    return subprocess.check_output([str(x) for x in args], text=True)


def stream(path):
    return subprocess.Popen([
        'ffmpeg', '-v', 'error', '-i', str(path), '-map', '0:v:0',
        '-fps_mode', 'passthrough', '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-'
    ], stdout=subprocess.PIPE)


def read_frame(proc):
    size = W * H * 3
    data = bytearray()
    while len(data) < size:
        part = proc.stdout.read(size - len(data))
        if not part:
            raise RuntimeError('Unexpected end of decoded stream')
        data.extend(part)
    return Image.frombytes('RGB', (W, H), bytes(data))


def edge_overlay(a, b):
    # Red reference / cyan control; coincidence is white. This is a visual
    # diagnostic, not a physical-geometry or percentage-accuracy metric.
    ea = ImageOps.autocontrast(a.convert('L').filter(ImageFilter.FIND_EDGES))
    eb = ImageOps.autocontrast(b.convert('L').filter(ImageFilter.FIND_EDGES))
    return Image.merge('RGB', (ea, eb, eb))


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    DOC.mkdir(parents=True,exist_ok=True)
    for folder in ['pairs', 'keys', 'contacts', 'grid']:
        (OUT / folder).mkdir(parents=True, exist_ok=True)
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 24)
    tiny = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 14)
    metadata = {}
    for label, path in [('reference', SOURCE), ('control', CONTROL), ('v05_hook', LATEST)]:
        v = json.loads(run(['ffprobe', '-v', 'error', '-select_streams', 'v:0',
                            '-show_streams', '-of', 'json', path]))['streams'][0]
        assert (int(v['width']), int(v['height'])) == (W, H)
        assert int(v['nb_frames']) == N and Fraction(v['r_frame_rate']) == FPS
        metadata[label] = {'path': str(path), 'bytes': path.stat().st_size,
                           'sha256': digest(path)}
    shots = json.loads((ROOT.parent / 'v04/reference-edit.json').read_text())['shots']
    processes = [stream(x) for x in [SOURCE, CONTROL, LATEST]]
    unchanged, contacts, thumbnail_batch = [], [], []
    for f in range(N):
        a, b, latest = [read_frame(p) for p in processes]
        if f >= 94:
            unchanged.append(hashlib.sha256(b.tobytes()).digest() ==
                             hashlib.sha256(latest.tobytes()).digest())
        alpha = Image.blend(a, b, .5)
        edges = edge_overlay(a, b)
        canvas = Image.new('RGB', (W * 2, H + 48), '#14181b')
        canvas.paste(alpha, (0, 48)); canvas.paste(edges, (W, 48))
        d = ImageDraw.Draw(canvas)
        d.text((8, 9), f'50/50  f{f:03}  {float(f / FPS):.4f}s', font=font, fill='white')
        d.text((W + 8, 9), 'RED: reference / CYAN: v05 control', font=font, fill='white')
        canvas.save(OUT / 'pairs' / f'{f:04}.jpg', quality=90)
        if f in KEYS:
            triptych = Image.new('RGB', (W * 3, H + 48), '#14181b')
            td = ImageDraw.Draw(triptych)
            for col, (im, label) in enumerate([(a, 'REFERENCE'), (b, 'v05 control'),
                                              (alpha, '50/50 UNREGISTERED')]):
                triptych.paste(im, (col * W, 48))
                td.text((col * W + 8, 9), f'{label} / f{f:03}', font=font, fill='white')
            triptych.save(OUT / 'keys' / f'{f:04}.jpg', quality=95)
        thumbnail_batch.append((f, alpha.resize((144, 256), Image.Resampling.LANCZOS)))
        if len(thumbnail_batch) == 24 or f == N - 1:
            sheet = Image.new('RGB', (144 * 6, 280 * 4), '#14181b')
            sd = ImageDraw.Draw(sheet)
            for j, (idx, thumb) in enumerate(thumbnail_batch):
                x, y = j % 6 * 144, j // 6 * 280
                sheet.paste(thumb, (x, y))
                sd.text((x + 2, y + 259), f'f{idx:03} {float(idx / FPS):.3f}',
                        font=tiny, fill='white')
            sheet_no = len(contacts) + 1
            path = OUT / 'contacts' / f'{sheet_no:02}.jpg'
            sheet.save(path, quality=83)
            contacts.append({'sheet': sheet_no, 'from_frame': thumbnail_batch[0][0],
                             'to_frame_inclusive': f, 'path': str(path)})
            thumbnail_batch = []
        if f % 100 == 0:
            print(f'overlay frames {f + 1}/{N}', flush=True)
    for p in processes:
        assert not p.stdout.read(1), 'Unexpected extra frame'
        assert p.wait() == 0
    assert len(unchanged) == 329 and all(unchanged)
    grid = []
    k = 0
    while k * STEP < N / FPS:
        t = k * STEP
        f = min(N - 1, math.floor(t * FPS))
        shot = next(s['id'] for s in shots if s['from'] <= f < s['to'])
        target = OUT / 'grid' / f'{k:06}.jpg'
        if target.exists() or target.is_symlink():
            target.unlink()
        target.symlink_to(OUT / 'pairs' / f'{f:04}.jpg')
        grid.append({'sample': k, 'time_ms': str(float(t * 1000)),
                     'reference_frame': f, 'control_frame': f, 'shot': shot})
        k += 1
    assert len(grid) == 1051 and {r['reference_frame'] for r in grid} == set(range(N))
    with (DOC / 'grid-16p8ms.csv').open('w', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=list(grid[0]), lineterminator='\n')
        writer.writeheader(); writer.writerows(grid)
    movie = DOWNLOADS / 'LAB-R001-v05-overlay-16p8ms.mp4'
    run(['ffmpeg', '-y', '-v', 'error', '-framerate', '1250/21', '-i',
         OUT / 'grid/%06d.jpg', '-frames:v', len(grid), '-c:v', 'libx264',
         '-threads', 2, '-preset', 'fast', '-crf', 22, '-pix_fmt', 'yuv420p',
         '-an', '-video_track_timescale', 125000, '-movflags', '+faststart', movie])
    run(['ffmpeg', '-v', 'error', '-i', movie, '-f', 'null', '-'])
    linked = ROOT / 'public' / movie.name
    if linked.exists(): linked.unlink()
    try: os.link(movie, linked)
    except OSError: shutil.copyfile(movie, linked)
    report = {'inputs': metadata, 'native_frames': N, 'fps': str(FPS),
              'sample_step_ms': 16.8, 'grid_samples': len(grid),
              'native_duration_seconds': float(N / FPS),
              'grid_duration_seconds': float(len(grid) * STEP),
              'last_slot_padding_ms': float((len(grid) * STEP - N / FPS) * 1000),
              'all_native_frames_covered': True, 'interpolation': 'none; native hold',
              'registration': 'none; identical native 720x1280 pixel coordinates',
              'methods': ['50 percent RGB blend', 'reference red / control cyan edges'],
              'geometry_accuracy_percentage': None,
              'v05_hook_frames_94_422_equal_control': all(unchanged),
              'v05_hook_opening': 'Intentionally adapted from Caldera setup/detail/result; do not label timeline mismatch as geometry error',
              'contact_sheets': contacts, 'key_frames': KEYS,
              'comparison': {'path': str(movie), 'bytes': movie.stat().st_size,
                             'sha256': digest(movie), 'audio': False, 'decode': 'passed'},
              'manual_review': 'Generation alone does not establish visual review. See review.md.'}
    (DOC / 'data.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'frames': N, 'grid': len(grid), 'video': str(movie),
                      'bytes': movie.stat().st_size}, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    main()
