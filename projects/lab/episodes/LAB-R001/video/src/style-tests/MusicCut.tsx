import React from 'react';
import {AbsoluteFill,Sequence,useCurrentFrame,useVideoConfig} from 'remotion';
import {Footage,Grain,Label,Sound} from './Common';
export const MusicCut=()=>{const {fps}=useVideoConfig();const f=useCurrentFrame();return <AbsoluteFill style={{background:'#12191b'}}>
 <Sequence name="Turn" durationInFrames={41} premountFor={fps}><Footage id="8100345" trim={4.2} filter="saturate(.55) contrast(1.13)"/></Sequence>
 <Sequence name="Eye accent" from={41} durationInFrames={7} premountFor={fps}><Footage id="8100339" trim={4.8} zoom={1.7} x={62} y={42} filter="grayscale(1) contrast(1.15)"/></Sequence>
 <Sequence name="Timeline accent" from={48} durationInFrames={7} premountFor={fps}><Footage id="34845729" trim={3} zoom={1.2} filter="saturate(.7) contrast(1.12)"/></Sequence>
 <Sequence name="Hands" from={55} durationInFrames={27} premountFor={fps}><Footage id="15162384" trim={11} zoom={1.5} x={67} y={94} filter="saturate(.6) contrast(1.1)"/></Sequence>
 <Sequence name="Portrait rhythm" from={82} durationInFrames={31} premountFor={fps}><Footage id="8100339" trim={4.4} filter="grayscale(1) contrast(1.09)"/></Sequence>
 <Sequence name="Timeline response" from={113} durationInFrames={12} premountFor={fps}><Footage id="34845729" trim={5} zoom={1.1} filter="saturate(.6) contrast(1.1)"/></Sequence>
 <Sequence name="Final look" from={125} durationInFrames={19} premountFor={fps}><Footage id="8100345" trim={6} filter="saturate(.55) contrast(1.12)"/></Sequence>
 {f<41?<div style={{position:'absolute',left:42,bottom:190,font:'bold 68px Arial',lineHeight:.95,letterSpacing:-2,color:'#efeadd'}}>ВНУТРИ<br/>МОНТАЖА.</div>:null}
 <Grain strength={.12}/><Label n={8}/><Sound n={8}/>
 </AbsoluteFill>;};
