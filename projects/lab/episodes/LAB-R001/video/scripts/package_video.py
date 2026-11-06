from pathlib import Path
import hashlib,json,shutil,subprocess,re
from datetime import datetime
from zoneinfo import ZoneInfo
import numpy as np

ROOT=Path(__file__).resolve().parents[2]
PROJECT=ROOT/'video'
SHARED=Path('/workspace/shared/downloads')
SHARED.mkdir(parents=True,exist_ok=True)
source=PROJECT/'out/LAB-R001.mp4'
dest=SHARED/'LAB-R001-fold-v01.mp4'
subprocess.run(['ffmpeg','-v','error','-i',str(source),'-map','0','-c','copy','-movflags','+faststart','-y',str(dest)],check=True)
meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(dest)]))
video=next(s for s in meta['streams'] if s['codec_type']=='video')
audio=next(s for s in meta['streams'] if s['codec_type']=='audio')
assert (video['width'],video['height'])==(720,1280)
assert video['r_frame_rate']=='24/1'
assert int(video['nb_read_frames'])==432
assert abs(float(meta['format']['duration'])-18)<.1
subprocess.run(['ffmpeg','-v','error','-i',str(dest),'-f','null','-'],check=True)
volume=subprocess.run(['ffmpeg','-hide_banner','-i',str(dest),'-af','volumedetect','-vn','-f','null','-'],capture_output=True,text=True,check=True)
levels=dict(re.findall(r'(mean_volume|max_volume): ([\-\d.]+) dB',volume.stderr))
assert float(levels['max_volume'])<0
gray=subprocess.check_output(['ffmpeg','-v','error','-i',str(dest),'-an','-vf','scale=64:114,format=gray','-f','rawvideo','-'])
frames=np.frombuffer(gray,dtype=np.uint8).reshape(-1,114,64)
assert len(frames)==432
means=frames.mean(axis=(1,2))
poster=SHARED/'LAB-R001-poster.jpg'
subprocess.run(['ffmpeg','-v','error','-ss','10.2','-i',str(dest),'-frames:v','1','-q:v','2','-y',str(poster)],check=True)
sheet=SHARED/'LAB-R001-frames.jpg'
vf="fps=2,scale=180:-2,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='%{pts\\:hms}':fontsize=13:fontcolor=white:box=1:boxcolor=black@0.7:x=3:y=3,tile=6x6"
subprocess.run(['ffmpeg','-v','error','-i',str(dest),'-an','-vf',vf,'-frames:v','1','-q:v','3','-y',str(sheet)],check=True)
shutil.copy2(dest,PROJECT/'public/LAB-R001.mp4')
shutil.copy2(poster,PROJECT/'public/poster.jpg')
report={
 'episode_id':'LAB-R001','version':'01','date':datetime.now(ZoneInfo('Europe/Moscow')).date().isoformat(),
 'render_completed':True,'published_to_social_media':False,
 'artifact_server_path':str(dest),'artifact_bytes':dest.stat().st_size,
 'artifact_sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),
 'width':video['width'],'height':video['height'],'fps':24,'decoded_frames':432,
 'duration_seconds':float(meta['format']['duration']),
 'video_codec':video['codec_name'],'audio_codec':audio['codec_name'],
 'audio_mean_db':float(levels['mean_volume']),'audio_max_db':float(levels['max_volume']),
 'full_decode_passed':True,'frame_mean_luma_min':round(float(means.min()),2),
 'frame_mean_luma_max':round(float(means.max()),2),
 'visual_contact_sheet':'36 frame samples, 0.5s apart across the full duration; review pending',
 'audio_subjectively_reviewed':False,
 'production':'Three.js + React Three Fiber + Remotion; FFmpeg faststart remux and verification',
 'source_media_reused':False,
 'cleanup':json.loads(Path('/tmp/playboy-cleanup-report.json').read_text()) if Path('/tmp/playboy-cleanup-report.json').exists() else None,
}
(ROOT/'render-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
