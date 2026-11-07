import fs from 'node:fs';import path from 'node:path';import {spawn} from 'node:child_process';import {createHash} from 'node:crypto';
import {bundle} from '@remotion/bundler';import {openBrowser,getCompositions,renderMedia} from '@remotion/renderer';
const hashFiles=(files)=>{const h=createHash('sha256');for(const f of files)h.update(fs.readFileSync(f));return h.digest('hex');};
const baseFiles=[...fs.readdirSync('src/v05').sort().map(f=>'src/v05/'+f),'src/v03/geometry.ts','src/v03/materials.ts','scripts/render_v05.mjs','public/v05-assets/camera-screen.jpg'];
const baseSourceSha=hashFiles(baseFiles),baseReport=JSON.parse(fs.readFileSync('out/v05-clip-report.json','utf8'));
if(baseReport.LightingV05.sourceSha!==baseSourceSha)throw new Error('Base source revision changed; do not mix clips');
const sourceSha=hashFiles([...baseFiles,...fs.readdirSync('src/v05b').sort().map(f=>'src/v05b/'+f),'src/Root.tsx','scripts/render_hook_v05b.mjs']);
const run=(cmd,args)=>new Promise((resolve,reject)=>{const p=spawn(cmd,args,{stdio:['ignore','pipe','pipe']});let o='',e='';p.stdout.on('data',b=>o+=b);p.stderr.on('data',b=>e+=b);p.on('close',c=>c?reject(new Error(e.slice(-2500))):resolve(o));});
const out='public/v05-clips/HookSetupV05B.mp4',raw='out/v05-raw/HookSetupV05B.mp4';
const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts'),outDir:path.resolve('build-v05b-render')});
const browser=await openBrowser('chrome',{browserExecutable:'/usr/bin/chromium',chromiumOptions:{gl:'swangle'}});let last=-1;const started=Date.now();
try{
 const c=(await getCompositions(serveUrl,{puppeteerInstance:browser})).find(c=>c.id==='HookSetupV05B');
 await renderMedia({serveUrl,composition:{...c,fps:2997/125*2,durationInFrames:72},inputProps:{shutterSamples:2},puppeteerInstance:browser,outputLocation:raw,codec:'h264',crf:14,scale:1,concurrency:2,timeoutInMilliseconds:300000,chromiumOptions:{gl:'swangle'},onProgress:p=>{const n=Math.floor(p.progress*10);if(n!==last){last=n;console.log('HookSetupV05B',Math.round(p.progress*100)+'%',p.renderedFrames,'frames');}}});
 await run('ffmpeg',['-y','-v','error','-i',raw,'-vf',"tmix=frames=2:weights='1 1',select=eq(mod(n\\,2)\\,1),setpts=N/(23.976*TB),scale=in_range=auto:out_range=tv:in_color_matrix=auto:out_color_matrix=bt709,format=yuv420p",'-frames:v','36','-r','2997/125','-c:v','libx264','-preset','medium','-crf','14','-pix_fmt','yuv420p','-color_range','tv','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-video_track_timescale','23976','-an','-movflags','+faststart',out]);
 const stream=JSON.parse(await run('ffprobe',['-v','error','-count_frames','-select_streams','v:0','-show_streams','-of','json',out])).streams[0];if(stream.width!==720||stream.height!==1280||Number(stream.nb_read_frames)!==36)throw new Error('BTS metadata mismatch');
 const report={sourceSha,baseSourceSha,sourceFiles:[...baseFiles,...fs.readdirSync('src/v05b').sort().map(f=>'src/v05b/'+f),'src/Root.tsx','scripts/render_hook_v05b.mjs'],id:'HookSetupV05B',sourceFrames:36,renderedFrames:72,shutterSamples:2,sha256:createHash('sha256').update(fs.readFileSync(out)).digest('hex'),seconds:(Date.now()-started)/1000,stream};fs.writeFileSync('out/v05b-report.json',JSON.stringify(report,null,2)+'\n');console.log('Ready',out);
}finally{await browser.close({silent:true});}
