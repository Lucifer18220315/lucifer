"""Fetch reproducible CC0 material maps and environment, on the server only."""
from pathlib import Path
import concurrent.futures,hashlib,io,json,urllib.request,zipfile

ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'public/v03-assets';DEST.mkdir(parents=True,exist_ok=True)
SOURCES=[
 {'id':'Paper001','url':'https://ambientcg.com/get?file=Paper001_2K-JPG.zip','license':'CC0-1.0','source':'https://ambientcg.com/a/Paper001','maps':['Color.jpg','NormalGL.jpg','Roughness.jpg']},
 {'id':'Wood092','url':'https://ambientcg.com/get?file=Wood092_2K-JPG.zip','license':'CC0-1.0','source':'https://ambientcg.com/a/Wood092','maps':['Color.jpg','NormalGL.jpg','Roughness.jpg']},
 {'id':'studio_small_09','url':'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr','license':'CC0-1.0','source':'https://polyhaven.com/a/studio_small_09','author':'Sergej Majboroda'},
]
manifest_path=ROOT/'assets/v03-manifest.json'
previous=json.loads(manifest_path.read_text()) if manifest_path.exists() else None

def fetch(item):
 req=urllib.request.Request(item['url'],headers={'User-Agent':'Mozilla/5.0'})
 with urllib.request.urlopen(req,timeout=90) as r:data=r.read(40*1024*1024+1)
 if len(data)>40*1024*1024:raise ValueError('Asset exceeds 40 MiB download bound')
 result={**item,'download_sha256':hashlib.sha256(data).hexdigest(),'files':[]}
 if previous:
  old=next((x for x in previous['assets'] if x['id']==item['id']),None)
  if old and old['download_sha256']!=result['download_sha256']:raise ValueError(f"Asset changed since recorded manifest: {item['id']}")
 if item['url'].endswith('.hdr'):
  name='studio_small_09_1k.hdr';(DEST/name).write_bytes(data)
  result['files'].append({'name':name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
 else:
  with zipfile.ZipFile(io.BytesIO(data)) as z:
   for entry in z.infolist():
    name=Path(entry.filename).name
    if not any(name.endswith(m) for m in item['maps']):continue
    b=z.read(entry);(DEST/name).write_bytes(b)
    result['files'].append({'name':name,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
  if len(result['files'])!=3:raise ValueError('Missing required PBR maps')
 print(item['id'],[(f['name'],f['bytes']) for f in result['files']],flush=True)
 return result

with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex:assets=list(ex.map(fetch,SOURCES))
manifest={
 'license_sources':['https://docs.ambientcg.com/license/','https://polyhaven.com/license'],
 'assets':assets,
 'scale_notes':{'Wood092':'Provider metadata: 80 x 80 cm.','Paper001':'Provider metadata has no physical size; UV scale is a modeling parameter, not a measured fiber size.'},
}
manifest_path.parent.mkdir(exist_ok=True);manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('Server asset manifest saved')
