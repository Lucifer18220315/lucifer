import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {getCompositions, openBrowser, renderStill, renderMedia} from '@remotion/renderer';

const states=[0,7,22,38,54,74];
fs.mkdirSync('public/v041-plates',{recursive:true});
fs.mkdirSync('out/v041-controls',{recursive:true});
const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts'),outDir:path.resolve('build-v041')});
const browser=await openBrowser('chrome',{browserExecutable:'/usr/bin/chromium',chromiumOptions:{gl:'swangle'}});
try {
  const compositions=await getCompositions(serveUrl,{puppeteerInstance:browser});
  const scene=compositions.find(c=>c.id==='LightingV04');
  for(const frame of states){
    if(process.argv.includes('--reuse-plates')&&fs.existsSync(`public/v041-plates/light-${frame}.png`))continue;
    await renderStill({serveUrl,composition:scene,inputProps:{hideLightingLabel:true},
      puppeteerInstance:browser,frame,scale:2/3,output:`public/v041-plates/light-${frame}.png`,
      overwrite:true,timeoutInMilliseconds:300000,chromiumOptions:{gl:'swangle'}});
    console.log('Clean plate',frame);
  }
  // Bundling copies public assets. Copy the newly rendered plates explicitly.
  fs.cpSync('public/v041-plates','build-v041/public/v041-plates',{recursive:true});
  const readable=compositions.find(c=>c.id==='LightingReadableV041');
  for(const frame of [12,28,44,62,82]){
    await renderStill({serveUrl,composition:readable,puppeteerInstance:browser,
      frame,output:`out/v041-controls/label-${frame}.png`,overwrite:true,
      timeoutInMilliseconds:120000,chromiumOptions:{gl:'swangle'}});
    console.log('Typography control',frame);
  }
  if(process.argv.includes('--controls-only'))process.exitCode=0;
  else {
    await renderMedia({serveUrl,composition:readable,puppeteerInstance:browser,
      outputLocation:'out/v041-lighting.mp4',codec:'h264',crf:14,concurrency:1,
      timeoutInMilliseconds:120000,chromiumOptions:{gl:'swangle'},
      onProgress:p=>{if(p.renderedFrames%20===0)console.log('Typography frames',p.renderedFrames);}});
    console.log('Readable lighting ready');
  }
} finally {await browser.close({silent:true});}
