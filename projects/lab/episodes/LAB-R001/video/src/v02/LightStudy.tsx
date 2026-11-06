import React,{useLayoutEffect,useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {AbsoluteFill,Easing,interpolate,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import * as THREE from 'three';
import {RectAreaLightUniformsLib} from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import {PaperCup,paperAsset} from './PaperCup';

const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
const phaseAt=(t:number)=>t<.65?'teaser':t<1.55?'model':t<2.55?'key':t<3.3?'rim':'final';

const StudioScene:React.FC=()=>{
  const frame=useCurrentFrame(),{fps}=useVideoConfig();const t=frame/fps;const phase=phaseAt(t);
  const {camera}=useThree();
  const draft=phase==='model';
  const full=phase==='teaser'||phase==='final';
  const key=full?1:interpolate(t,[1.55,1.78],[0,1],clamp);
  const rim=full?1:interpolate(t,[2.55,2.78],[0,1],clamp);
  const turn=phase==='final'?interpolate(t,[3.3,5],[0,1],{...clamp,easing:Easing.bezier(.22,.65,.25,1)}):phase==='teaser'?.8:0;
  useLayoutEffect(()=>{
    camera.position.set(3.1-turn*.38,3.1,10-turn*.2);camera.lookAt(0,1.65,0);
    if(camera instanceof THREE.PerspectiveCamera){camera.fov=36;camera.updateProjectionMatrix();}
  },[camera,turn]);
  const area=useMemo(()=>{
    RectAreaLightUniformsLib.init();
    const light=new THREE.RectAreaLight('#fff1db',4.5,4,5);light.position.set(-3.5,4.3,3.5);light.lookAt(0,1.3,0);return light;
  },[]);
  const contour=useMemo(()=>{
    const light=new THREE.RectAreaLight('#edb479',5.8,1.3,4);light.position.set(2.7,3.2,-1.5);light.lookAt(0,1.4,0);return light;
  },[]);
  const plinth=useMemo(()=>new THREE.LatheGeometry([
    new THREE.Vector2(0,0),new THREE.Vector2(1.49,0),new THREE.Vector2(1.54,.025),new THREE.Vector2(1.54,.06),new THREE.Vector2(1.51,.08),new THREE.Vector2(0,.08)
  ],96),[]);
  return <>
    <color attach="background" args={['#1b252e']}/>
    <fog attach="fog" args={['#1b252e',12,35]}/>
    <ambientLight intensity={draft?.55:.18}/>
    <hemisphereLight args={['#dde9f2','#171c22',draft?.45:.35]}/>
    <primitive object={area} intensity={4.5*key}/>
    <primitive object={contour} intensity={5.8*rim}/>
    <directionalLight position={[-3.5,4.3,3.5]} intensity={.7*key} color="#fff0dc" castShadow
      shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} shadow-normalBias={.025}/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.015,0]} receiveShadow><planeGeometry args={[200,200]}/><meshStandardMaterial color="#39434a" roughness={.94}/></mesh>
    <mesh geometry={plinth} receiveShadow castShadow><meshStandardMaterial color={draft?'#33424c':'#776c5e'} roughness={.87}/></mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,.082,0]}><planeGeometry args={[2.4,2.4]}/><meshBasicMaterial map={paperAsset('contact')} transparent depthWrite={false} opacity={draft?.35:.7}/></mesh>
    <PaperCup draft={draft}/>
  </>;
};

export const LightStudy:React.FC=()=>{
  const frame=useCurrentFrame(),{width,height,fps}=useVideoConfig();const t=frame/fps,phase=phaseAt(t);
  const caption=phase==='teaser'?'Сначала — результат':phase==='model'?'01   Базовая модель':phase==='key'?'02   Материал и свет':phase==='rim'?'03   Контур сзади':'04   Готовый кадр';
  return <AbsoluteFill style={{background:'#1b252e',fontFamily:'Arial,sans-serif'}}>
    <ThreeCanvas width={width} height={height} dpr={2/3} shadows camera={{fov:33,near:.05,far:220}}
      gl={{antialias:true,alpha:false,powerPreference:'high-performance'}}
      onCreated={({gl})=>{gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.16;gl.shadowMap.type=THREE.PCFShadowMap;}}>
      <StudioScene/>
    </ThreeCanvas>
    <AbsoluteFill style={{pointerEvents:'none',background:'linear-gradient(180deg,rgba(19,27,35,.62) 0%,transparent 27%,transparent 77%,rgba(19,27,35,.6) 100%)'}}/>
    <div style={{position:'absolute',left:88,top:115,color:'#d3b995',fontSize:26,letterSpacing:5}}>FOLD / 02 · СВЕТ</div>
    <div style={{position:'absolute',left:84,top:183,color:'#f4eee5',fontSize:84,lineHeight:1.04,letterSpacing:-3.4,fontWeight:500}}>Из модели —<br/>в предметный кадр</div>
    <div style={{position:'absolute',left:88,bottom:209,color:phase==='model'?'#c4dce9':'#f4eee5',fontSize:44,letterSpacing:-.5}}>{caption}</div>
    <div style={{position:'absolute',left:88,right:88,bottom:175,height:3,background:'rgba(240,231,216,.15)'}}>
      <div style={{height:3,width:`${interpolate(frame,[0,5*fps-1],[0,100],clamp)}%`,background:'#d3b995'}}/>
    </div>
    <div style={{position:'absolute',left:88,bottom:117,color:'#99a4ac',fontSize:23,letterSpacing:2.5}}>ОДИН ОБЪЕКТ · ПРОЦЕСС В 3D</div>
    <Audio src={staticFile('sound-v02.m4a')} premountFor={fps}/>
  </AbsoluteFill>;
};
