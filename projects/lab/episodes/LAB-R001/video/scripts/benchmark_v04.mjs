import fs from 'node:fs';
import path from 'node:path';
import {openBrowser,getCompositions,renderMedia} from '@remotion/renderer';
import {bundle} from '@remotion/bundler';
const baseline=await bundle({entryPoint:path.resolve('src/index.ts'),outDir:'/tmp/v04-baseline-bundle',webpackOverride:config=>({...config,module:{...config.module,rules:[{test:/\/src\/v04\/Stage\.tsx$/,enforce:'pre',use:[{loader:path.resolve('scripts/transmission_scale_loader.cjs'),options:{value:1}}]},...config.module.rules]}})});
const optimized=await bundle({entryPoint:path.resolve('src/index.ts'),outDir:'/tmp/v04-opt-bundle'});
const browser=await openBrowser('chrome',{browserExecutable:'/usr/bin/chromium',chromiumOptions:{gl:'swangle'}});
const results=[];
try{
 // Reverse order on a second run to distinguish startup/cache effects.
 const cases=process.argv.includes('--reverse')?[['optimized',optimized],['baseline',baseline]]:[['baseline',baseline],['optimized',optimized]];
 for(const [name,url]of cases){
  const cs=await getCompositions(url,{puppeteerInstance:browser}),c=cs.find(c=>c.id==='TabletopV04');
  const start=Date.now();console.log('Benchmark',name);
  await renderMedia({serveUrl:url,composition:{...c,fps:47.952,durationInFrames:120},frameRange:[56,63],puppeteerInstance:browser,outputLocation:`out/v04-bench-${name}.mp4`,codec:'h264',crf:14,scale:2/3,concurrency:1,timeoutInMilliseconds:300000});
  results.push({name,frames:8,seconds:(Date.now()-start)/1000});console.log(results.at(-1));
 }
}finally{await browser.close({silent:true});}
fs.writeFileSync('out/v04-benchmark.json',JSON.stringify(results,null,2)+'\n');
