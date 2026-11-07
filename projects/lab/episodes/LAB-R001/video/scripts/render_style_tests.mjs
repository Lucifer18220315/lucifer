import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {bundle} from '@remotion/bundler';
import {openBrowser,getCompositions,renderMedia,renderStill} from '@remotion/renderer';
const controls=process.argv.includes('--controls');
const only=process.argv.find(x=>x.startsWith('--only='))?.slice(7).split(',');
const out='out/style-tests';fs.mkdirSync(out,{recursive:true});
const dest='/workspace/shared/downloads/style-tests-01';fs.mkdirSync(dest,{recursive:true});
const hash=createHash('sha256');for(const f of fs.readdirSync('src/style-tests').sort())hash.update(fs.readFileSync('src/style-tests/'+f));for(const f of fs.readdirSync('public/style-tests-assets').sort()){hash.update(f);hash.update(fs.readFileSync('public/style-tests-assets/'+f));}const sourceSha=hash.digest('hex');
const retainedPath=path.resolve('../../../style-tests-01/retained-2d.json');
const retained=fs.existsSync(retainedPath)?JSON.parse(fs.readFileSync(retainedPath,'utf8')):{};
const assetHash=createHash('sha256');for(const f of fs.readdirSync('public/style-tests-assets').sort()){assetHash.update(f);assetHash.update(fs.readFileSync('public/style-tests-assets/'+f));}const assetsSha=assetHash.digest('hex');
const common=fs.readFileSync('src/style-tests/Common.tsx','utf8');const commonBodySha=createHash('sha256').update(common.slice(common.indexOf('export const asset='))).digest('hex');
const namesLine=common.split('\n').find(x=>x.startsWith('export const names='));const labels=[...namesLine.matchAll(/'([^']*)'/g)].map(m=>m[1]);

const serveUrl=await bundle({entryPoint:path.resolve('src/style-tests/index.tsx'),outDir:path.resolve('build-style-tests')});
const browser=await openBrowser('chrome',{browserExecutable:'/usr/bin/chromium',chromiumOptions:{gl:'swangle'}});
const comps=await getCompositions(serveUrl,{puppeteerInstance:browser});
const reportPath=out+'/render-report.json',report=fs.existsSync(reportPath)?JSON.parse(fs.readFileSync(reportPath,'utf8')):{};
try{
 for(const c of comps){
  if(only&&!only.includes(c.id))continue;
  if(controls){for(const frame of [12,72,122]){console.log('Still',c.id,frame);await renderStill({serveUrl,composition:c,frame,output:path.resolve(out+'/'+c.id+'-'+frame+'.png'),puppeteerInstance:browser,chromiumOptions:{gl:'swangle'},timeoutInMilliseconds:120000});}continue;}
  const output=dest+'/'+c.id+'.mp4';
  const keep=retained[c.id];const same2D=keep&&keep.common_body_sha256===commonBodySha&&keep.assets_sha256===assetsSha&&keep.label===labels[Number(c.id.slice(5))-1]&&createHash('sha256').update(fs.readFileSync(keep.component_file)).digest('hex')===keep.component_sha256&&keep.sha256===report[c.id]?.sha256;
  if((report[c.id]?.sourceSha===sourceSha||same2D)&&fs.existsSync(output)&&createHash('sha256').update(fs.readFileSync(output)).digest('hex')===report[c.id].sha256){console.log('Cached',c.id);continue;}
  console.log('Rendering',c.id);let last=-1;const began=Date.now();
  await renderMedia({serveUrl,composition:c,outputLocation:output,codec:'h264',audioCodec:'aac',crf:17,concurrency:4,puppeteerInstance:browser,chromiumOptions:{gl:'swangle'},timeoutInMilliseconds:120000,onProgress:p=>{const q=Math.floor(p.progress*4);if(q!==last){last=q;console.log(c.id,Math.round(p.progress*100)+'%');}}});
  report[c.id]={sourceSha,path:output,sha256:createHash('sha256').update(fs.readFileSync(output)).digest('hex'),bytes:fs.statSync(output).size,seconds:(Date.now()-began)/1000,width:c.width,height:c.height,fps:c.fps,frames:c.durationInFrames};fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log('Ready',c.id);
 }
}finally{await browser.close({silent:true});}
