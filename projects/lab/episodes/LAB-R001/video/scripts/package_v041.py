"""Readable text + optional metadata removal. Audio is copied unchanged.

Selective SFX gain is deliberately pending: the reference is a single mixed
track. Never apply volume=.85 to that mix when only effects were requested.
"""
from pathlib import Path
import subprocess,json,hashlib,struct
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'out';DOC=ROOT.parent/'v04-1'
DEST=Path('/workspace/shared/downloads');BASE=DEST/'LAB-R001-v04.mp4'
SHOTS=['TabletopV04','BlueprintV04','PagesV04','FlipbookV04','FoldingV04','PourV04','SweepV04','PencilHandV04','PencilMacroV04','ClockV04','ReturnV04']
def run(args):return subprocess.run([str(a) for a in args],check=True,capture_output=True,text=True).stdout
def probe(p):return json.loads(run(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',p]))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()

def erase_optional_boxes(p):
 data=bytearray(p.read_bytes());erased=[]
 def walk(start,end,parent=''):
  at=start
  while at+8<=end:
   size,typ=struct.unpack_from('>I4s',data,at);header=8
   if size==1:
    size=struct.unpack_from('>Q',data,at+8)[0];header=16
   if size==0:size=end-at
   if size<header or at+size>end:raise ValueError(('Invalid MP4 atom',at,size,typ,parent))
   name=typ.decode('latin1');location=parent+'/'+name
   optional=typ in (b'udta',b'meta') or (typ==b'colr' and bytes(data[at+header:at+header+4]) in (b'prof',b'rICC'))
   if optional:
    data[at+4:at+8]=b'free';data[at+header:at+size]=b'\0'*(size-header);erased.append(location)
   elif typ in (b'moov',b'trak',b'mdia',b'minf',b'stbl',b'dinf',b'edts',b'mvex',b'moof',b'traf'):walk(at+header,at+size,location)
   elif typ==b'stsd':walk(at+header+8,at+size,location)
   elif typ in (b'avc1',b'avc3',b'hvc1',b'hev1'):walk(at+header+78,at+size,location)
   elif typ==b'mp4a':walk(at+header+28,at+size,location)
   at+=size
 walk(0,len(data));p.write_bytes(data);return erased

def frame_hashes(p):
 s=run(['ffmpeg','-v','error','-i',p,'-map','0:v:0','-f','framemd5','-'])
 return [line.split(',')[-1].strip() for line in s.splitlines() if not line.startswith('#')]
def audio_hashes(p):
 j=json.loads(run(['ffprobe','-v','error','-select_streams','a:0','-show_packets','-show_data_hash','sha256','-show_entries','packet=data_hash','-of','json',p]))
 return [x['data_hash'] for x in j['packets']]

DOC.mkdir(exist_ok=True)
opening=OUT/'v041-lighting-normalized.mp4'
run(['ffmpeg','-y','-v','error','-i',OUT/'v041-lighting.mp4','-vf','scale=in_range=auto:out_range=tv:in_color_matrix=auto:out_color_matrix=bt709,format=yuv420p',
 '-frames:v','94','-r','2997/125','-c:v','libx264','-preset','medium','-crf','14','-pix_fmt','yuv420p','-color_range','tv','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-video_track_timescale','23976','-an',opening])
paths=[opening]+[ROOT/f'public/v04-clips/{id}.mp4' for id in SHOTS]
concat=OUT/'v041-concat.txt';concat.write_text(''.join(f"file '{p}'\n" for p in paths))
picture=OUT/'v041-picture.mp4'
run(['ffmpeg','-y','-v','error','-f','concat','-safe','0','-i',concat,'-c:v','copy','-an','-video_track_timescale','23976',picture])
movie=DEST/'LAB-R001-v04-1-text-clean.mp4'
run(['ffmpeg','-y','-v','error','-fflags','+bitexact','-i',picture,'-i',BASE,'-map','0:v:0','-map','1:a:0','-map_metadata','-1','-map_chapters','-1',
 '-c','copy','-bsf:v','filter_units=remove_types=6','-metadata','encoder=','-metadata:s:v:0','encoder=','-metadata:s:v:0','handler_name=','-metadata:s:a:0','handler_name=',
 '-write_btrt','0','-movflags','+faststart',movie])
erased=erase_optional_boxes(movie)
run(['ffmpeg','-v','error','-i',movie,'-f','null','-'])
info=probe(movie);stream=next(s for s in info['streams'] if s['codec_type']=='video')
assert (stream['width'],stream['height'],int(stream['nb_read_frames']),stream['r_frame_rate'])==(720,1280,423,'2997/125')
a0,a1=audio_hashes(BASE),audio_hashes(movie);assert a0==a1
f0,f1=frame_hashes(BASE),frame_hashes(movie);assert len(f0)==len(f1)==423 and f0[94:]==f1[94:]
assert not info['format'].get('tags',{}).get('encoder')
for s in info['streams']:
 assert not s.get('tags',{}).get('encoder')
 assert not any(x['side_data_type']=='ICC Profile' for x in s.get('side_data_list',[]))
poster=DEST/'LAB-R001-v04-1-text.jpg'
run(['ffmpeg','-y','-v','error','-i',movie,'-vf','select=eq(n\\,82)','-frames:v','1','-q:v','2',poster])
report={'date':'2026-11-07','file':str(movie),'bytes':movie.stat().st_size,'sha256':sha(movie),'base_sha256':sha(BASE),'decode':'passed',
 'width':720,'height':1280,'video_frames':423,'fps':'2997/125','font_native_px':{'before':18,'after':24},'captions':5,'text_style':{'background':False,'font_weight':500,'thin_outline':False,'soft_shadow':True,'single_line':True},
 'audio':{'modified':False,'encoded_packet_count':len(a0),'all_payload_hashes_equal':True,'requested_sfx_gain':.85,'status':'pending separate effects track; mixed track not attenuated'},
 'frames_after_opening':{'count':329,'all_decoded_frame_hashes_equal':True},'removed_boxes':erased,'metadata':{'encoder_tags_removed':True,'h264_sei_removed':True,'icc_profile_removed':True,'technical_mp4_fields_retained':True},
 'capcut_local':{'completed':False,'reason':'No connected control of user PC or local CapCut'},'streams':info['streams'],'format':info['format']}
(DOC/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:report[k] for k in ('file','bytes','sha256','audio','frames_after_opening','removed_boxes')},ensure_ascii=False,indent=2))
