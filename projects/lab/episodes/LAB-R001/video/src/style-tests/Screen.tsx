import React from 'react';
import {AbsoluteFill,useVideoConfig} from 'remotion';
import {Video} from '@remotion/media';
import {asset,Label,Sound} from './Common';
export const Screen=()=>{const {fps}=useVideoConfig();return <AbsoluteFill style={{background:'#14191f'}}><Video src={asset('screen-capture.mp4')} muted objectFit="cover" premountFor={fps} style={{width:'100%',height:'100%'}}/><div style={{position:'absolute',top:0,left:0,right:0,height:90,background:'#14191f'}}/><Label n={10}/><div style={{position:"absolute",bottom:80,left:28,color:"#899f91",font:"13px Arial"}}>Запись реальной операции · ускорено ×2,08</div><Sound n={10}/></AbsoluteFill>;};
