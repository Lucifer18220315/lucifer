"""Assemble V05 control and evidence-based hook; preserve mixed AAC unchanged."""
from pathlib import Path
import subprocess,json,hashlib,struct,os,shutil
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'out';DOC=ROOT.parent/'v05'
DEST=Path('/workspace/shared/downloads');BASE=DEST/'LAB-R001-v04-1-text-clean.mp4'
BODY=['TabletopV05','BlueprintV05','PagesV05','FlipbookV05C','FoldingV05','PourV05','SweepV05','PencilHandV05','PencilMacroV05','ClockV05','ReturnV05']
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
clip_report=json.loads((OUT/'v05-clip-report.json').read_text())
source_shas={r['sourceSha'] for r in clip_report.values()}
assert len(source_shas)==1, 'Clips must use the same source revision'
bts=json.loads((OUT/'v05b-report.json').read_text());assert bts['baseSourceSha']==next(iter(source_shas)), 'BTS/base source mismatch'
source_check=hashlib.sha256()
for relative in bts['sourceFiles']: source_check.update((ROOT/relative).read_bytes())
assert source_check.hexdigest()==bts['sourceSha'],'BTS source files changed after render'
book=json.loads((OUT/'v05c-report.json').read_text());assert book['baseSourceSha']==next(iter(source_shas)), 'Book/base mismatch'
book_check=hashlib.sha256()
for relative in book['sourceFiles']: book_check.update((ROOT/relative).read_bytes())
assert book_check.hexdigest()==book['sourceSha'],'Book source files changed after render'
files={};decoded_variants={};decoded_clips={}
for variant,opening in [('control',['LightingV05']),('hook',['HookSetupV05B','HookDetailV05','HookResultV05'])]:
 paths=[ROOT/f'public/v05-clips/{id}.mp4' for id in opening+BODY]
 for p in paths:
  expected=bts if p.stem=='HookSetupV05B' else book if p.stem=='FlipbookV05C' else clip_report[p.stem]
  assert p.exists() and sha(p)==expected['sha256'], 'Changed/missing clip: '+str(p)
 concat=OUT/f'v05-{variant}-concat.txt';concat.write_text(''.join(f"file '{p}'\n" for p in paths))
 picture=OUT/f'v05-{variant}-picture.mp4'
 run(['ffmpeg','-y','-v','error','-f','concat','-safe','0','-i',concat,'-c:v','copy','-an','-video_track_timescale','23976',picture])
 movie=DEST/f'LAB-R001-v05-{variant}.mp4'
 run(['ffmpeg','-y','-v','error','-fflags','+bitexact','-i',picture,'-i',BASE,'-map','0:v:0','-map','1:a:0','-map_metadata','-1','-map_chapters','-1','-c','copy','-bsf:v','filter_units=remove_types=6','-metadata','encoder=','-metadata:s:v:0','encoder=','-metadata:s:v:0','handler_name=','-metadata:s:a:0','handler_name=','-write_btrt','0','-movflags','+faststart',movie])
 erased=erase_optional_boxes(movie)
 run(['ffmpeg','-v','error','-i',movie,'-f','null','-'])
 info=probe(movie);v=next(s for s in info['streams'] if s['codec_type']=='video')
 assert (v['width'],v['height'],int(v['nb_read_frames']),v['r_frame_rate'])==(720,1280,423,'2997/125')
 expected_frames=[]
 for p in paths:
  if str(p) not in decoded_clips: decoded_clips[str(p)]=frame_hashes(p)
  expected_frames.extend(decoded_clips[str(p)])
 decoded_variants[variant]=frame_hashes(movie)
 assert expected_frames==decoded_variants[variant], 'Final decoded frames differ from reviewed clips'
 assert not info['format'].get('tags',{}).get('encoder')
 for stream in info['streams']:
  assert not stream.get('tags',{}).get('encoder')
  assert not any(d['side_data_type']=='ICC Profile' for d in stream.get('side_data_list',[]))
 assert audio_hashes(BASE)==audio_hashes(movie)
 files[variant]={'clip_ids':opening+BODY,'path':str(movie),'sha256':sha(movie),'bytes':movie.stat().st_size,'streams':info['streams'],'format':info['format'],'removed_boxes':erased,'decode':'passed','decoded_frames_equal_used_clips':True}
 run(['ffmpeg','-y','-v','error','-i',movie,'-vf','select=eq(n\\,85)','-frames:v','1','-q:v','2',DEST/f'LAB-R001-v05-{variant}.jpg'])
 linked=ROOT/'public'/movie.name
 if linked.exists(): linked.unlink()
 try: os.link(movie,linked)
 except OSError: shutil.copyfile(movie,linked)
 print('Assembled',variant,flush=True)
a,b=[decoded_variants[k] for k in ['control','hook']]
assert len(a)==len(b)==423 and a[94:]==b[94:]
report={'date':'2026-11-07','files':files,'width':720,'height':1280,'fps':'2997/125','native_video_frames':423,'source_sha256':next(iter(source_shas)),'bts_override':bts,'book_override':book,'hook':{'competitor':'Austen Paul / Caldera / DfPymYGhhtQ','cuts_native':[36,66],'segments_frames':[36,30,28],'adaptation':'setup -> detail -> own result; third segment replaces author demonstration with finished own result','question_overlay':False,'effectiveness':'unproven until publication; source views do not prove retention cause'},'body_after_hook':{'frames':329,'all_decoded_hashes_equal_control':True},'audio':{'modified':False,'encoded_packets':len(audio_hashes(BASE)),'all_payload_hashes_equal_base':True,'requested_sfx_gain':.85,'selective_sfx_status':'pending separate effects/music stems; mixed track not attenuated','subjective_listening':False},'metadata':{'optional_tags_removed':True,'h264_sei_removed':True,'technical_codec_fields_retained':True},'capcut_local':{'completed':False,'reason':'No connected control of user Mac or CapCut'}}
(DOC/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
(DOC/'bts-report.json').write_text(json.dumps(bts,ensure_ascii=False,indent=2)+'\n')
(DOC/'book-report.json').write_text(json.dumps(book,ensure_ascii=False,indent=2)+'\n')
(DOC/'clip-report.json').write_text(json.dumps(clip_report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:{x:v[x] for x in ['path','bytes','sha256']} for k,v in files.items()},indent=2))
