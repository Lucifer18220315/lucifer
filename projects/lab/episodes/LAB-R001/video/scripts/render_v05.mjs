import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {openBrowser,getCompositions,renderMedia} from '@remotion/renderer';
import {bundle} from '@remotion/bundler';

const fps=2997/125;
const shots=[['LightingV05',94,1],['TabletopV05',60,2],['BlueprintV05',15,4],['PagesV05',31,4],['FlipbookV05',31,4],['FoldingV05',38,2],['PourV05',61,2],['SweepV05',14,4],['PencilHandV05',9,2],['PencilMacroV05',13,2],['ClockV05',26,2],['ReturnV05',31,2],['HookSetupV05',36,2],['HookDetailV05',30,1],['HookResultV05',28,1]];
const only=process.argv.find(s=>s.startsWith('--only='))?.slice(7).split(','),force=process.argv.includes('--force');
fs.mkdirSync('out/v05-raw',{recursive:true});fs.mkdirSync('public/v05-clips',{recursive:true});
const run=(cmd,args)=>new Promise((resolve,reject)=>{const p=spawn(cmd,args,{stdio:['ignore','pipe','pipe']});let out='',err='';p.stdout.on('data',b=>out+=b);p.stderr.on('data',b=>err+=b);p.on('close',code=>code===0?resolve(out):reject(new Error(`${cmd}: ${err.slice(-2500)}`)));});
const sourceHash=createHash('sha256');for(const f of fs.readdirSync('src/v05').sort())sourceHash.update(fs.readFileSync(path.join('src/v05',f)));for(const f of ['src/v03/geometry.ts','src/v03/materials.ts','scripts/render_v05.mjs','public/v05-assets/camera-screen.jpg'])sourceHash.update(fs.readFileSync(f));const sourceSha=sourceHash.digest('hex');
console.log('Bundling V05',sourceSha.slice(0,12));
const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts'),outDir:path.resolve('build-v05-render')});
const browser=await openBrowser('chrome',{browserExecutable:'/usr/bin/chromium',chromiumOptions:{gl:'swangle'}});
const compositions=await getCompositions(serveUrl,{puppeteerInstance:browser});
const resultsPath='out/v05-clip-report.json',report=fs.existsSync(resultsPath)?JSON.parse(fs.readFileSync(resultsPath,'utf8')):{};
const verify=async(file,n)=>{const j=JSON.parse(await run('ffprobe',['-v','error','-count_frames','-select_streams','v:0','-show_streams','-of','json',file]));const s=j.streams[0];if(Number(s.nb_read_frames)!==n||s.width!==720||s.height!==1280)throw new Error('Clip metadata mismatch '+file);return s;};
const jobs=[shots[0],...shots.slice(12),...shots.slice(1,12)];
let next=0;
async function worker(){
 while(next<jobs.length){
  const[id,n,samples]=jobs[next++];if(only&&!only.includes(id))continue;
  const output=`public/v05-clips/${id}.mp4`;
  if(!force&&fs.existsSync(output)&&report[id]?.sourceSha===sourceSha){try{await verify(output,n);if(createHash('sha256').update(fs.readFileSync(output)).digest('hex')!==report[id].sha256)throw new Error('Checksum mismatch');console.log('Cached',id);continue;}catch(e){console.warn('Rebuilding incomplete cache',id,e.message);}}
  const c=compositions.find(c=>c.id===id),raw=`out/v05-raw/${id}.mp4`;let last=-1;const started=Date.now();
  console.log('Rendering',id,n,'source frames,',samples,'shutter samples');
  await renderMedia({serveUrl,composition:{...c,fps:fps*samples,durationInFrames:n*samples},puppeteerInstance:browser,outputLocation:raw,codec:'h264',crf:14,scale:1,concurrency:2,inputProps:{shutterSamples:samples},timeoutInMilliseconds:300000,chromiumOptions:{gl:'swangle'},onProgress:p=>{const q=Math.floor(p.progress*10);if(q!==last){last=q;console.log(id,Math.round(p.progress*100)+'%',p.renderedFrames,'frames');}}});
  const args=['-y','-v','error','-i',raw];
  const range='scale=in_range=auto:out_range=tv:in_color_matrix=auto:out_color_matrix=bt709,format=yuv420p';
  const blur=samples>1?`tmix=frames=${samples}:weights='${Array(samples).fill(1).join(' ')}',select=eq(mod(n\\,${samples})\\,${samples-1}),setpts=N/(23.976*TB),`:'';
  args.push('-vf',blur+range,'-frames:v',String(n),'-r','2997/125','-c:v','libx264','-preset','medium','-crf','14','-pix_fmt','yuv420p','-color_range','tv','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709');
  args.push('-video_track_timescale','23976','-an','-movflags','+faststart',output);await run('ffmpeg',args);
  const stream=await verify(output,n);report[id]={sourceSha,sourceFrames:n,renderedFrames:n*samples,shutterSamples:samples,seconds:(Date.now()-started)/1000,sha256:createHash('sha256').update(fs.readFileSync(output)).digest('hex'),stream};fs.writeFileSync(resultsPath+'.tmp',JSON.stringify(report,null,2)+'\n');fs.renameSync(resultsPath+'.tmp',resultsPath);console.log('Ready',id);
 }
}
try{await worker();}catch(e){console.error('V05 render failed:',e.stack||e);throw e;}finally{await browser.close({silent:true});}
if(shots.every(([id])=>fs.existsSync(`public/v05-clips/${id}.mp4`))){
 const list=shots.slice(0,12).map(([id])=>`file '${path.resolve('public/v05-clips/'+id+'.mp4')}'`).join('\n');fs.writeFileSync('out/v05-concat.txt',list+'\n');
 console.log('All base shots and three hook plans available.');
}
