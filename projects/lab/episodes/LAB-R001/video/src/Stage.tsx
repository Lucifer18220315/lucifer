import React, {useLayoutEffect, useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {Cup,Desk,Sheet,DeskClock,Pencil,PaperBall} from './Objects';

export type Shot='lighting'|'tabletop'|'drawing'|'hero'|'water'|'label'|'pencil'|'clock'|'return';
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;

const Camera:React.FC<{shot:Shot;progress:number}>=({shot,progress})=>{
  const {camera}=useThree();
  useLayoutEffect(()=>{
    let pos:[number,number,number]=[4.8,3.7,8.7],target:[number,number,number]=[0,1.2,0];
    let fov=34;
    if(shot==='lighting'||shot==='return'){pos=[4.1,3.25,8.6];target=[.15,1.15,0];fov=36;}
    if(shot==='tabletop'){pos=[2.6-progress*.55,3.4,6.1-progress*.7];target=[0,1.25,0];fov=34;}
    if(shot==='drawing'){pos=[.3,7.5,3.7-progress*.8];target=[-.6,.1,.65];fov=36;}
    if(shot==='hero'){pos=[2.2-progress*.45,3.6,7.3-progress*.15];target=[0,1.3,0];fov=34;}
    if(shot==='water'){pos=[2.0-progress*.25,4.2,3.6];target=[0,2.2,0];fov=30;}
    if(shot==='label'){pos=[.2,1.15,2.1];target=[0,.65,.4];fov=34;}
    if(shot==='pencil'){pos=[.8,2.0,2.7];target=[.2,.1,.8];fov=29;}
    if(shot==='clock'){pos=[1.3+progress*.08,.9,1.8];target=[1.75,.39,-.65];fov=30;}
    camera.position.set(...pos);camera.lookAt(...target);
    if(camera instanceof THREE.PerspectiveCamera){camera.fov=fov;camera.updateProjectionMatrix();}
  },[camera,shot,progress]);
  return null;
};

const Scene:React.FC<{shot:Shot;seconds:number}>=({shot,seconds})=>{
  const frame=useCurrentFrame();const {fps}=useVideoConfig();
  const t=frame/fps, p=Math.min(1,t/seconds);
  const lit=(on:number)=>shot==='lighting'?interpolate(t,[on,on+.14],[0,1],clamp):1;
  const returnLift=shot==='return'?interpolate(p,[0,.55,1],[.65,0,0],clamp):0;
  const blueprintOnly=shot==='drawing'||shot==='pencil';
  const pencilMotion=shot==='pencil'?Math.sin(p*Math.PI)*.38:0;
  const cupRot=shot==='hero'?-.13+p*.22:shot==='return'?.05*(1-p):0;
  const backgroundTarget=useMemo(()=>{const target=new THREE.Object3D();target.position.set(.7,2.8,-3);return target;},[]);
  const waterLevel=1.9+.32*(.1+p*.8);
  const jet=useMemo(()=>{
    const g=new THREE.CylinderGeometry(.014,.021,1,12,48);const pos=g.attributes.position;
    for(let i=0;i<pos.count;i++){
      const y=pos.getY(i);const r=1+.12*Math.sin(y*110-t*24);
      pos.setXYZ(i,pos.getX(i)*r+.003*Math.sin(y*55+t*19),y,pos.getZ(i)*r+.003*Math.cos(y*73-t*23));
    }
    g.computeVertexNormals();return g;
  },[t]);
  return <>
    <Camera shot={shot} progress={p}/>
    <color attach="background" args={['#38281d']}/>
    <ambientLight intensity={.12}/>
    <directionalLight position={[-3.5,6,4]} color="#fff2da" intensity={2.25*lit(.32)} castShadow
      shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-bias={-.0002}
      shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6}/>
    <pointLight position={[2.5,3.7,-1.6]} color="#ffe1ae" intensity={20*lit(1.05)} distance={12} decay={2}/>
    <pointLight position={[-2,2.1,4]} color="#c6dcf1" intensity={5.5*lit(1.72)} distance={10} decay={2}/>
    <primitive object={backgroundTarget}/>
    <spotLight position={[2.8,3.6,.3]} target={backgroundTarget} angle={.42} penumbra={.6} color="#ed9c4c" intensity={36*lit(2.4)} distance={12} decay={2}/>
    <pointLight position={[.2,.85,3]} color="#fff7e8" intensity={1.5*lit(3.06)} distance={5} decay={2}/>
    <Desk/>
    {!blueprintOnly && <Cup angle={cupRot} lift={returnLift} water={shot==='water'?.1+p*.8:0}/>}
    <DeskClock/>
    {blueprintOnly ? <>
      <Sheet position={[0,.025,.8]} size={1.2} rotation={-.1}/>
      {shot==='drawing'&&<group position={[-.6,.065,-.75]} rotation={[-Math.sin(p*Math.PI)*1.3,0,.15]}>
        <Sheet position={[0,0,1.4]} size={1.15} rotation={0}/>
      </group>}
    </> : <Sheet position={[-1.7,.012,.8]} rotation={-.27} size={.87}/>}
    <Pencil position={shot==='pencil'?[.25,1.13,.9]:[1.75,.07,1.35]} draw={pencilMotion} rotation={shot==='pencil'?[.24,0,-.22]:[0,.2,-Math.PI/2]}/>
    <PaperBall position={[-1.7,.2,-.1]} scale={.33}/>
    <PaperBall position={[-2.1,.15,.5]} scale={.22}/>
    {shot==='water'&&<group>
      <mesh geometry={jet} position={[.01,(4.7+waterLevel)/2,0]} scale={[1,4.7-waterLevel,1]}>
        <meshPhysicalMaterial color="#e9f4ee" transparent opacity={.46} roughness={.035} metalness={.05} clearcoat={1}/>
      </mesh>
    </group>}
  </>;
};

export const Stage:React.FC<{shot:Shot;seconds:number}>=({shot,seconds})=>{
  const {width,height,fps}=useVideoConfig();const frame=useCurrentFrame();const t=frame/fps;
  const labels=[['ОСНОВНОЙ',.32],['КОНТУР',1.05],['ЗАПОЛНЕНИЕ',1.72],['ФОН',2.4],['АКЦЕНТ',3.06]] as const;
  const label=labels.filter(([,start])=>t>=start).at(-1);
  return <AbsoluteFill style={{backgroundColor:'#38281d'}}>
    <ThreeCanvas width={width} height={height} dpr={2/3} shadows camera={{fov:36,near:.05,far:60}}
      gl={{antialias:true,alpha:false,powerPreference:'high-performance'}}
      onCreated={({gl})=>{gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.15;gl.shadowMap.type=THREE.PCFShadowMap;}}>
      <Scene shot={shot} seconds={seconds}/>
    </ThreeCanvas>
    <AbsoluteFill style={{background:'radial-gradient(ellipse at 50% 40%, transparent 45%, rgba(19,12,7,.32) 100%)',pointerEvents:'none'}}/>
    {shot==='lighting'&&label&&<div style={{position:'absolute',top:270,left:90,color:'#f4eddf',fontFamily:'Arial,sans-serif',fontWeight:500,fontSize:27,letterSpacing:3,opacity:interpolate(t,[label[1],label[1]+.1],[0,1],clamp)}}>
      <div style={{width:38,height:2,background:'#f4eddf',marginBottom:14}}/>{label[0]}
    </div>}
    {shot==='drawing'&&<div style={{position:'absolute',left:76,bottom:240,color:'#e4dfd0',fontFamily:'Arial,sans-serif',fontSize:23,letterSpacing:5}}>ОТ ЛИНИИ К ФОРМЕ</div>}
    <div style={{position:'absolute',left:64,bottom:115,color:'rgba(238,230,212,.65)',fontFamily:'Arial,sans-serif',fontSize:17,letterSpacing:3}}>FOLD / 01 <span style={{opacity:.6}}> · 3D STUDY</span></div>
  </AbsoluteFill>;
};
