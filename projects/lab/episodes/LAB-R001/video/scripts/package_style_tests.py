"""Validate ten samples, create an exact-duration comparison and local gallery."""
from pathlib import Path
import hashlib,json,subprocess,zipfile,shutil
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1];DOC=ROOT.parents[2]/'style-tests-01';DEST=Path('/workspace/shared/downloads/style-tests-01');OUT=ROOT/'out/style-tests'
NAMES=['Съёмка + 2D-графика','Тактильный процесс','Кинетическая типографика','Журнальный коллаж','Технологический триллер','Редакционный портрет','Сюрреализм','Клиповый монтаж','Аналоговая плёнка','Экранная режиссура']
def run(args):return subprocess.check_output([str(x) for x in args])
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def probe(p):return json.loads(run(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',p]))
report=json.loads((OUT/'render-report.json').read_text());assert len(report)==10
clips=[]
for i,name in enumerate(NAMES,1):
 p=DEST/f'Style{i:02d}.mp4';assert sha(p)==report[f'Style{i:02d}']['sha256']
 info=probe(p);v=next(s for s in info['streams'] if s['codec_type']=='video');a=next(s for s in info['streams'] if s['codec_type']=='audio')
 assert (v['width'],v['height'],v['nb_read_frames'],v['r_frame_rate'])==(720,1280,'144','24/1')
 run(['ffmpeg','-v','error','-i',p,'-f','null','-'])
 frame_dir=OUT/f'review-{i:02d}';frame_dir.mkdir(exist_ok=True)
 cuts={1:[48,88],2:[60,96],3:[36,72,108],4:[43,94],5:[40,102],6:[53,87],7:[],8:[41,48,55,82,113,125],9:[54,96],10:[]}[i]
 indices=sorted(set([0,12,24,36,60,72,108,132,143]+[n for c in cuts for n in [c-1,c]]))
 select='select='+ '+'.join(f'eq(n\\,{n})' for n in indices)
 run(['ffmpeg','-y','-v','error','-i',p,'-vf',select+',scale=180:320','-fps_mode','vfr',frame_dir/'%02d.jpg'])
 imgs=sorted(frame_dir.glob('*.jpg'));canvas=Image.new('RGB',(720,((len(indices)+3)//4)*344),'#101519');draw=ImageDraw.Draw(canvas)
 for k,(image,f) in enumerate(zip(imgs,indices)):
  x=(k%4)*180;y=(k//4)*344;canvas.paste(Image.open(image),(x,y));draw.text((x+6,y+322),f'f{f:03d} / {f/24:.2f}s',fill='white')
 canvas.save(OUT/f'review-{i:02d}.jpg',quality=90)
 poster_frame={1:24,2:12,6:12}.get(i,72)
 run(['ffmpeg','-v','error','-y','-i',p,'-vf',f'select=eq(n\\,{poster_frame}),scale=360:640','-frames:v','1','-q:v','2',DEST/f'poster-{i:02d}.jpg'])
 clips.append({'id':i,'name':name,'file':p.name,'bytes':p.stat().st_size,'sha256':sha(p),'frames':144,'fps':24,'dimensions':[720,1280],'full_decode':'passed','audio':a['codec_name'],'duration':float(info['format']['duration'])})
 print('Verified',i,flush=True)
combined=DEST/'Ten-styles-comparison.mp4';cmd=['ffmpeg','-y','-v','error']
for i in range(1,11):cmd+=['-threads','1','-i',str(DEST/f'Style{i:02d}.mp4')]
filters=[]
for i in range(10):filters+=[f'[{i}:v]setpts=PTS-STARTPTS[v{i}]',f'[{i}:a]atrim=duration=6,asetpts=PTS-STARTPTS[a{i}]']
filters.append(''.join(f'[v{i}][a{i}]' for i in range(10))+'concat=n=10:v=1:a=1[v][a]')
cmd+=['-filter_complex',';'.join(filters),'-map','[v]','-map','[a]','-frames:v','1440','-r','24','-t','60','-c:v','libx264','-threads','2','-preset','fast','-crf','19','-c:a','aac','-b:a','160k','-map_metadata','-1','-movflags','+faststart',str(combined)];run(cmd)
info=probe(combined);v=next(s for s in info['streams'] if s['codec_type']=='video');assert v['nb_read_frames']=='1440';run(['ffmpeg','-v','error','-i',combined,'-f','null','-'])
cards=''.join(f'<button data-id="{i:02d}"><img src="poster-{i:02d}.jpg" loading="lazy" style="object-position:50% { {3:18,4:15,5:20}.get(i,40) }%"><span><b>{i:02d}</b> {name}</span></button>' for i,name in enumerate(NAMES,1))
html='''<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>10 видеостилей · STYLE STUDIES</title><style>*{box-sizing:border-box}body{margin:0;background:#111718;color:#e9ece1;font:16px Arial;padding:28px}main{max-width:1100px;margin:auto}h1{font:44px Georgia;margin:8px 0 12px}p{color:#a9b8aa;line-height:1.6}a{color:#c9dec3}section{display:grid;grid-template-columns:minmax(250px,430px) 1fr;gap:26px;margin-top:25px}video{max-height:82vh;width:100%;background:#070a09}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}button{padding:0;border:1px solid #38483d;background:#1c2820;color:#e0e6d9;cursor:pointer;text-align:left;border-radius:7px;overflow:hidden}button[aria-pressed=true]{border-color:#e3b470}button img{width:100%;height:100px;object-fit:cover;object-position:50% 40%;display:block}button span{display:block;padding:12px;font:14px Arial;line-height:1.4}button b{color:#dcb67c}#download{display:block;padding:14px 0}footer{font-size:13px;border-top:1px solid #344238;padding-top:17px;margin-top:24px;color:#9da994;line-height:1.6}@media(max-width:650px){body{padding:16px}h1{font-size:34px}section{grid-template-columns:1fr}video{max-height:72vh}}</style><main><p>STYLE STUDIES / 01</p><h1>Десять способов рассказать.</h1><p>По 6 секунд на направление. Только съёмка и 2D-графика. <a href="Ten-styles-comparison.mp4">Смотреть все подряд — 60 секунд</a></p><section><div><video id="player" controls playsinline preload="metadata" src="Style01.mp4" poster="poster-01.jpg"></video><a id="download" href="Style01.mp4" download>Скачать выбранную пробу</a><p id="caption">01 · Съёмка + 2D-графика</p></div><div class="grid">CARDS</div></section><footer>Демонстрационные пробы. Живые сцены собраны из лицензированных видео Pexels; актёры не изображают автора проекта. 2D-графика и синтезированный звук сделаны для этой подборки. Экранная операция записана в локальном приложении; ожидание сокращено. Авторы и лицензии — в CREDITS.md.</footer></main><script>const v=document.querySelector('#player');for(const b of document.querySelectorAll('[data-id]')){b.setAttribute('aria-pressed',b.dataset.id==='01');b.onclick=()=>{v.pause();v.src='Style'+b.dataset.id+'.mp4';v.poster='poster-'+b.dataset.id+'.jpg';v.load();document.querySelector('#download').href=v.getAttribute('src');document.querySelector('#caption').textContent=b.textContent;for(const x of document.querySelectorAll('[data-id]'))x.setAttribute('aria-pressed',String(x===b))}}</script></html>'''.replace('CARDS',cards)
(DEST/'index.html').write_text(html)
assets=json.loads((DOC/'assets.json').read_text());credits='# Источники и условия\n\nЛицензия Pexels: https://www.pexels.com/license/ — бесплатное использование и переработка.\n\n'+'\n'.join(f"- {a['author']}: [{a['title']}]({a['url']})" for a in assets)+'\n\nСобственные 2D-графика/композитинг и синтезированные музыка/эффекты. Клип05 — постановочный сюжет, не фактический сбой клиента. Клип10 — запись реальной локальной операции, ускорение×2,08. Canva/Adobe не использовались: их вызовы агенту не предоставлены.\n'
(DEST/'CREDITS.md').write_text(credits);(DOC/'credits.md').write_text(credits)
zip_path=DEST.parent/'Ten-video-styles.zip'
with zipfile.ZipFile(zip_path,'w',compression=zipfile.ZIP_STORED) as z:
 for p in sorted(DEST.iterdir()):
  if p.name!='gallery.jpg':z.write(p,p.name)
result={'date':'2026-11-07','clips':clips,'comparison':{'file':str(combined),'bytes':combined.stat().st_size,'sha256':sha(combined),'frames':1440,'duration_seconds':60,'full_decode':'passed'},'archive':{'file':str(zip_path),'bytes':zip_path.stat().st_size,'sha256':sha(zip_path)},'source_shas':sorted({x['sourceSha'] for x in report.values()}),'retained_unchanged_2d':['Style02','Style04','Style05','Style06'],'three_dimensional_scenes':False,'visual_review':'pending; contact sheets generated, not proof of inspection','subjective_audio_review':False,'canva_used':False,'adobe_used':False,'paid_services_used':False}
(DOC/'render-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');(DOC/'report.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print('Comparison and gallery ready',flush=True)
