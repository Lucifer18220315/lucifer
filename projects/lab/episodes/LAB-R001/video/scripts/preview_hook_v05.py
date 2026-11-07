from pathlib import Path
import subprocess,json,hashlib,struct
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



ROOT=Path(__file__).resolve().parents[1];DEST=Path('/workspace/shared/downloads');BASE=DEST/'LAB-R001-v04-1-text-clean.mp4'
ids=['HookSetupV05B','HookDetailV05','HookResultV05'];paths=[ROOT/f'public/v05-clips/{id}.mp4' for id in ids]
manifest=ROOT/'out/v05-opening-concat.txt';manifest.write_text(''.join(f"file '{p}'\n" for p in paths))
movie=DEST/'LAB-R001-v05-opening-preview.mp4'
run(['ffmpeg','-y','-v','error','-fflags','+bitexact','-f','concat','-safe','0','-i',manifest,'-i',BASE,'-map','0:v:0','-map','1:a:0','-c','copy','-t','3.920588','-map_metadata','-1','-map_chapters','-1','-bsf:v','filter_units=remove_types=6','-metadata','encoder=','-metadata:s:v:0','encoder=','-metadata:s:v:0','handler_name=','-metadata:s:a:0','handler_name=','-write_btrt','0','-movflags','+faststart',movie])
erased=erase_optional_boxes(movie);run(['ffmpeg','-v','error','-i',movie,'-f','null','-'])
info=probe(movie);v=next(x for x in info['streams'] if x['codec_type']=='video');assert int(v['nb_read_frames'])==94 and (v['width'],v['height'])==(720,1280)
a=audio_hashes(movie);assert a==audio_hashes(BASE)[:len(a)]
report={'kind':'Opening only; full video still rendering','path':str(movie),'bytes':movie.stat().st_size,'sha256':sha(movie),'native_frames':94,'width':720,'height':1280,'fps':v['r_frame_rate'],'decode':'passed','audio_payloads_equal_base_prefix':True,'removed_boxes':erased}
(ROOT/'out/v05-opening-preview.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
