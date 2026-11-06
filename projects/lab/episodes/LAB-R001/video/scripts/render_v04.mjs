import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {openBrowser,getCompositions,renderMedia} from '@remotion/renderer';
import {bundle} from '@remotion/bundler';

const fps=2997/125;
const shots=[['LightingV04',94,1],['TabletopV04',60,2],['BlueprintV04',15,2],['PagesV04',31,2],['FlipbookV04',31,2],['FoldingV04',38,2],['PourV04',61,2],['SweepV04',14,2],['PencilHandV04',9,2],['PencilMacroV04',13,2],['ClockV04',26,2],['ReturnV04',31,2]];
const only=process.argv.find(s=>s.startsWith('--only='))?.slice(7).split(','),force=process.argv.includes('--force');
fs.mkdirSync('out/v04-raw',{recursive:true});fs.mkdirSync('public/v04-clips',{recursive:true});
const run=(cmd,args)=>new Promise((resolve,reject)=>{const p=spawn(cmd,args,{stdio:['ignore','pipe','pipe']});let out='',err='';p.stdout.on('data',b=>out+=b);p.stderr.on('data',b=>err+=b);p.on('close',code=>code===0?resolve(out):reject(new Error(`${cmd}: ${err.slice(-2500)}`)));});
const sourceHash=createHash('sha256');for(const f of fs.readdirSync('src/v04').sort())sourceHash.update(fs.readFileSync(path.join('src/v04',f)));const sourceSha=sourceHash.digest('hex');
console.log('Bundling V04',sourceSha.slice(0,12));
const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts'),outDir:path.resolve('build-v04')});
const browser=await openBrowser('chrome',{browserExecutable:'/usr/bin/chromium',chromiumOptions:{gl:'swangle'}});
const compositions=await getCompositions(serveUrl,{puppeteerInstance:browser});
const resultsPath='out/v04-clip-report.json',report=fs.existsSync(resultsPath)?JSON.parse(fs.readFileSync(resultsPath,'utf8')):{};
const verify=async(file,n)=>{const j=JSON.parse(await run('ffprobe',['-v','error','-count_frames','-select_streams','v:0','-show_streams','-of','json',file]));const s=j.streams[0];if(Number(s.nb_read_frames)!==n||s.width!==720||s.height!==1280)throw new Error('Clip metadata mismatch '+file);return s;};
let next=0;
async function worker(){
 while(next<shots.length){
  const[id,n,samples]=shots[next++];if(only&&!only.includes(id))continue;
  const output=`public/v04-clips/${id}.mp4`;
  if(!force&&fs.existsSync(output)&&report[id]?.sourceSha===sourceSha){try{await verify(output,n);if(createHash('sha256').update(fs.readFileSync(output)).digest('hex')!==report[id].sha256)throw new Error('Checksum mismatch');console.log('Cached',id);continue;}catch(e){console.warn('Rebuilding incomplete cache',id,e.message);}}
  const c=compositions.find(c=>c.id===id),raw=`out/v04-raw/${id}.mp4`;let last=-1;const started=Date.now();
  console.log('Rendering',id,n,'source frames,',samples,'shutter samples');
  await renderMedia({serveUrl,composition:{...c,fps:fps*samples,durationInFrames:n*samples},puppeteerInstance:browser,outputLocation:raw,codec:'h264',crf:14,scale:2/3,concurrency:1,timeoutInMilliseconds:300000,chromiumOptions:{gl:'swangle'},onProgress:p=>{const q=Math.floor(p.progress*10);if(q!==last){last=q;console.log(id,Math.round(p.progress*100)+'%',p.renderedFrames,'frames');}}});
  const args=['-y','-v','error','-i',raw];
  const range='scale=in_range=auto:out_range=tv:in_color_matrix=auto:out_color_matrix=bt709,format=yuv420p';
  args.push('-vf',samples===2?'tblend=all_mode=average,select=not(mod(n\\,2)),setpts=N/(23.976*TB),'+range:range,'-frames:v',String(n),'-r','2997/125','-c:v','libx264','-preset','medium','-crf','14','-pix_fmt','yuv420p','-color_range','tv','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709');
  args.push('-video_track_timescale','23976','-an','-movflags','+faststart',output);await run('ffmpeg',args);
  const stream=await verify(output,n);report[id]={sourceSha,sourceFrames:n,renderedFrames:n*samples,shutterSamples:samples,seconds:(Date.now()-started)/1000,sha256:createHash('sha256').update(fs.readFileSync(output)).digest('hex'),stream};fs.writeFileSync(resultsPath+'.tmp',JSON.stringify(report,null,2)+'\n');fs.renameSync(resultsPath+'.tmp',resultsPath);console.log('Ready',id);
 }
}
try{await worker();}catch(e){console.error('V04 render failed:',e.stack||e);throw e;}finally{await browser.close({silent:true});}
if(shots.every(([id])=>fs.existsSync(`public/v04-clips/${id}.mp4`))){
 const list=shots.map(([id])=>`file '${path.resolve('public/v04-clips/'+id+'.mp4')}'`).join('\n');fs.writeFileSync('out/v04-concat.txt',list+'\n');
 console.log('All twelve edit-ready clips available.');
}
