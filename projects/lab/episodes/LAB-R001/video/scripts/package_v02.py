"""Package and inspect the short v02 separately from the original 18-second v01."""
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import hashlib,json,re,shutil,subprocess

project=Path(__file__).resolve().parents[1]
episode=project.parent
out=Path('/workspace/shared/downloads');out.mkdir(parents=True,exist_ok=True)
dest=out/'LAB-R001-v02-light.mp4'
subprocess.run(['ffmpeg','-v','error','-i',str(project/'out/LAB-R001-v02-light.mp4'),'-map','0','-c','copy','-movflags','+faststart','-y',str(dest)],check=True)
meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(dest)]))
video=next(s for s in meta['streams'] if s['codec_type']=='video')
audio=next(s for s in meta['streams'] if s['codec_type']=='audio')
assert (video['width'],video['height'],video['r_frame_rate'],int(video['nb_read_frames']))==(720,1280,'24/1',120)
assert abs(float(meta['format']['duration'])-5)<.1
subprocess.run(['ffmpeg','-v','error','-i',str(dest),'-f','null','-'],check=True)
levels=subprocess.run(['ffmpeg','-hide_banner','-i',str(dest),'-af','volumedetect','-vn','-f','null','-'],capture_output=True,text=True,check=True)
db=dict(re.findall(r'(mean_volume|max_volume): ([\-\d.]+) dB',levels.stderr));assert float(db['max_volume'])<0
poster=out/'LAB-R001-v02-poster.jpg'
subprocess.run(['ffmpeg','-v','error','-ss','4.3','-i',str(dest),'-frames:v','1','-q:v','2','-y',str(poster)],check=True)
vf="fps=8,scale=180:-2,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='%{pts\\:hms}':fontsize=13:fontcolor=white:box=1:boxcolor=black@0.7:x=3:y=3,tile=5x8"
sheet=out/'LAB-R001-v02-frames.jpg'
subprocess.run(['ffmpeg','-v','error','-i',str(dest),'-an','-vf',vf,'-frames:v','1','-q:v','3','-y',str(sheet)],check=True)
shutil.copy2(dest,project/'public/LAB-R001-v02.mp4')
shutil.copy2(poster,project/'public/poster-v02.jpg')
report={
 'episode_id':'LAB-R001','version':'02','scope':'Short light/material study; not a full remake of v01',
 'date':datetime.now(ZoneInfo('Europe/Moscow')).date().isoformat(),
 'render_completed':True,'published_to_social_media':False,
 'artifact_server_path':str(dest),'artifact_bytes':dest.stat().st_size,
 'artifact_sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),
 'width':720,'height':1280,'fps':24,'decoded_frames':120,
 'duration_seconds':float(meta['format']['duration']),
 'video_codec':video['codec_name'],'audio_codec':audio['codec_name'],
 'audio_mean_db':float(db['mean_volume']),'audio_max_db':float(db['max_volume']),
 'audio_subjectively_reviewed':False,'full_decode_passed':True,
 'visual_check':'40 samples at 8 fps, review pending',
 'source_media_reused':False,'external_style_used':False,
 'v01_sha256_unchanged':hashlib.sha256(Path('/workspace/shared/downloads/LAB-R001-fold-v01.mp4').read_bytes()).hexdigest()=='00f21c828da5e12cad349a40fbb200994bfa4563614aa864aa962bcbd5f93ddc',
 'limitations':['Stylized procedural 3D, not photographic footage','Material and lights change together; not a single-variable lighting experiment','Subjective audio review not performed'],
}
(episode/'v02').mkdir(exist_ok=True)
(episode/'v02/report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
