import React from 'react';
import {AbsoluteFill,Sequence,useCurrentFrame,useVideoConfig} from 'remotion';
import {Footage,Grain,Label,Sound} from './Common';
export const FilmLook=()=>{const f=useCurrentFrame();const {fps}=useVideoConfig();const leak=Math.max(Math.exp(-Math.pow((f-55)/5,2)),Math.exp(-Math.pow((f-96)/5,2)))*.43;return <AbsoluteFill style={{background:'#111211'}}>
 <div style={{position:'absolute',left:35,right:35,top:132,bottom:165,overflow:'hidden',borderRadius:13,translate:`${Math.sin(f*1.8)*.65}px ${Math.sin(f*.9)*.9}px`}}>
  <Sequence name="Warm room" durationInFrames={54} premountFor={fps}><Footage id="3736793" trim={2} filter="saturate(.66) sepia(.32) contrast(.94) brightness(1.05)"/></Sequence>
  <Sequence name="Hand detail" from={54} durationInFrames={42} premountFor={fps}><Footage id="15162384" trim={12} zoom={1.65} x={67} y={94} filter="saturate(.62) sepia(.35) contrast(.92) brightness(1.05)"/></Sequence>
  <Sequence name="Portrait memory" from={96} durationInFrames={48} premountFor={fps}><Footage id="8100345" trim={4.3} filter="saturate(.55) sepia(.35) contrast(.94) brightness(1.08)"/></Sequence>
  <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 35% 40%,#d9b77a00 30%,#30200d44)'}}/><div style={{position:'absolute',inset:0,background:'linear-gradient(110deg,#ef5425,#f7c85e 30%,transparent 70%)',opacity:leak}}/><Grain strength={.26}/>
 </div>
 {[13,697].map(x=><div key={x} style={{position:'absolute',left:x,top:140,bottom:170,width:10,background:'repeating-linear-gradient(180deg,#d4c9ac 0px,#d4c9ac 17px,transparent 17px,transparent 42px)',opacity:.7}}/>)}
 <div style={{position:'absolute',left:40,bottom:109,font:'14px monospace',letterSpacing:2,color:'#d6bd8b'}}>FILM LOOK / DIGITAL FOOTAGE</div><div style={{position:'absolute',right:44,bottom:109,font:'14px monospace',color:'#d6bd8b'}}>001 — {String(f).padStart(3,'0')}</div>
 <Label n={9}/><Sound n={9}/>
 </AbsoluteFill>;};
