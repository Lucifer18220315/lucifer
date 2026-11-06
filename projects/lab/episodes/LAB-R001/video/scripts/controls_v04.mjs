import fs from 'node:fs';
import path from 'node:path';
import {getCompositions,openBrowser,renderStill} from '@remotion/renderer';
import {bundle} from '@remotion/bundler';
// Independent bundle: controls must not replace files served by an active render.
const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts'),outDir:path.resolve('build-v04-controls')});
const browser=await openBrowser('chrome',{browserExecutable:'/usr/bin/chromium',chromiumOptions:{gl:'swangle'}});
const compositions=await getCompositions(serveUrl,{puppeteerInstance:browser});
fs.mkdirSync('out/v04-controls',{recursive:true});
const list=process.argv.includes('--details')?[['FoldingV04',0],['FoldingV04',37],['PourV04',0],['PourV04',56],['ClockV04',15]]:process.argv.includes('--finish')?[['PagesV04',13],['PagesV04',18],['ReturnV04',13],['ReturnV04',30]]:process.argv.includes('--pages')?[['PagesV04',13],['PagesV04',18]]:process.argv.includes('--pour')?[['PourV04',0],['PourV04',56]]:[['ReturnV04',13],['PencilMacroV04',7],['LightingV04',80],['TabletopV04',30],['BlueprintV04',10],['PagesV04',8],['FlipbookV04',16],['FoldingV04',22],['PourV04',20],['SweepV04',8],['PencilHandV04',7],['ClockV04',15]];
try{
  for(let i=0;i<list.length;i+=2){
    const results=await Promise.allSettled(list.slice(i,i+2).map(async([id,frame])=>{
      const c=compositions.find(c=>c.id===id);if(!c)throw new Error('Missing '+id);
      await renderStill({serveUrl,composition:c,inputProps:{debugContact:true},puppeteerInstance:browser,output:`out/v04-controls/${id}-${frame}.png`,frame,scale:2/3,overwrite:true,timeoutInMilliseconds:120000,chromiumOptions:{gl:'swangle'},onBrowserLog:l=>{if(l.text.includes('V04_CONTACT'))console.log(l.text);}});
      console.log('Checked',id,frame);
    }));
    for(const r of results)if(r.status==='rejected')throw r.reason;
  }
}finally{await browser.close({silent:true});}
