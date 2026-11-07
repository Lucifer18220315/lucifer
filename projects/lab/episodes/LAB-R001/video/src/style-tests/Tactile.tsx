import React from 'react';
import {AbsoluteFill,Sequence,useCurrentFrame,useVideoConfig} from 'remotion';
import {Footage,Grain,Label,Sound} from './Common';
function Hand(){const f=useCurrentFrame();return <AbsoluteFill><Footage id="15162384" trim={10} zoom={1.7+f*.0003} x={67} y={94} filter="saturate(.65) sepia(.12) contrast(1.05)"/></AbsoluteFill>;}
function Screen(){return <AbsoluteFill><Footage id="34845729" trim={3} zoom={1.12} x={64} filter="saturate(.65) sepia(.12)"/></AbsoluteFill>;}
function Room(){return <AbsoluteFill><Footage id="3736793" trim={3} filter="saturate(.72) sepia(.14)"/><div style={{position:'absolute',bottom:190,left:44,color:'#f4eee2',font:'italic 38px Georgia'}}>Довести до последнего кадра.</div></AbsoluteFill>;}
export const Tactile=()=>{const {fps}=useVideoConfig();return <AbsoluteFill style={{background:'#28251f'}}><Sequence name="Hand and keyboard" durationInFrames={60} premountFor={fps}><Hand/></Sequence><Sequence name="Cutting detail" from={60} durationInFrames={36} premountFor={fps}><Screen/></Sequence><Sequence name="Room and pause" from={96} durationInFrames={48} premountFor={fps}><Room/></Sequence><Grain strength={.13}/><Label n={2}/><Sound n={2}/></AbsoluteFill>;};
