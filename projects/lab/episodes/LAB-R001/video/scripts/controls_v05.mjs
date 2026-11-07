import fs from 'node:fs';
import path from 'node:path';
import {getCompositions,openBrowser,renderStill} from '@remotion/renderer';
import {bundle} from '@remotion/bundler';
// Independent bundle: controls must not replace files served by an active render.
const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts'),outDir:path.resolve('build-v05-controls')});
const browser=await openBrowser('chrome',{browserExecutable:'/usr/bin/chromium',chromiumOptions:{gl:'swangle'}});
const compositions=await getCompositions(serveUrl,{puppeteerInstance:browser});
fs.mkdirSync('out/v05-controls',{recursive:true});
const list=process.argv.find(x=>x.startsWith('--frames='))?.slice(9).split(',').map(x=>{const[id,f]=x.split(':');return[id,Number(f)];})??[['LightingV05',85],['TabletopV05',0],['TabletopV05',29],['TabletopV05',59],['FoldingV05',0],['FoldingV05',37],['PourV05',0],['FlipbookV05',15],['SweepV05',0],['SweepV05',8],['PencilHandV05',5],['ClockV05',15]];
try{
  for(let i=0;i<list.length;i+=2){
    const results=await Promise.allSettled(list.slice(i,i+2).map(async([id,frame])=>{
      const c=compositions.find(c=>c.id===id);if(!c)throw new Error('Missing '+id);
      await renderStill({serveUrl,composition:c,inputProps:{debugContact:process.argv.includes('--contacts'),previewQuality:true},puppeteerInstance:browser,output:`out/v05-controls/${id}-${frame}.png`,frame,scale:1,overwrite:true,timeoutInMilliseconds:120000,chromiumOptions:{gl:'swangle'},onBrowserLog:l=>{if(l.text.includes('V05_CONTACT'))console.log(l.text);}});
      console.log('Checked',id,frame);
    }));
    for(const r of results)if(r.status==='rejected')throw r.reason;
  }
}finally{await browser.close({silent:true});}
