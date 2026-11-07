import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {getCompositions,openBrowser,renderStill,renderMedia} from '@remotion/renderer';

fs.mkdirSync('out/v042-controls',{recursive:true});
const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts'),outDir:path.resolve('build-v042')});
const browser=await openBrowser('chrome',{browserExecutable:'/usr/bin/chromium',chromiumOptions:{gl:'swangle'}});
try{
 const comps=await getCompositions(serveUrl,{puppeteerInstance:browser});
 const c=comps.find(c=>c.id==='HookV042');
 for(const frame of [0,12,23,24,33,34,45,46,57,58,69,70,81,82,93]){
  await renderStill({serveUrl,composition:c,puppeteerInstance:browser,frame,
   output:`out/v042-controls/${frame}.png`,overwrite:true,timeoutInMilliseconds:120000});
  console.log('Hook control',frame);
 }
 await renderMedia({serveUrl,composition:c,puppeteerInstance:browser,
  outputLocation:'out/v042-lighting.mp4',codec:'h264',crf:14,concurrency:1,
  timeoutInMilliseconds:120000,onProgress:p=>{if(p.renderedFrames%20===0)console.log('Hook frames',p.renderedFrames);}});
 console.log('Hook render ready');
}finally{await browser.close({silent:true});}
