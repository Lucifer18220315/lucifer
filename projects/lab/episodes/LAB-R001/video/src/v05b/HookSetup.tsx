import React,{useCallback,useEffect,useLayoutEffect,useMemo,useState} from 'react';
import * as T from 'three';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {DepthOfField,EffectComposer} from '@react-three/postprocessing';
import {AbsoluteFill,getInputProps,interpolate,useCurrentFrame,useDelayRender,useVideoConfig} from 'remotion';
import {DeskSet} from '../v05/Set';
import {CupV05} from '../v05/Cup';
import {StudioRig} from './Rig';
import {useSurfaces} from '../v05/materials';
import {LIGHT_CURVES} from '../v05/light-curves';
import {CAMERA_FITS} from '../v05/camera-fits';
const FPS=2997/125;
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
const pose=[-.1369357313194568,.217227706320923,1.25,.01962373367248748,.08896030510425075,.23516293356908383,50];
function Bar({a,b,r=.004}:{a:[number,number,number],b:[number,number,number],r?:number}){const x=new T.Vector3(...a),y=new T.Vector3(...b),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),y.clone().sub(x).normalize());return <mesh position={x.clone().add(y).multiplyScalar(.5)} quaternion={q} castShadow><cylinderGeometry args={[r,r,x.distanceTo(y),16]}/><meshStandardMaterial color="#484f56" roughness={.43} metalness={.8}/></mesh>;}
function StudioRoom(){
  const s=useSurfaces();
  const floor=useMemo(()=>s.wood.map(t=>{const x=t.clone();x.repeat.set(2.5,2.5);x.needsUpdate=true;return x;}),[s.wood[0]]);
  const cables=useMemo(()=>[-.24,.04].map((x,i)=>new T.CatmullRomCurve3([new T.Vector3(x,-.393,i?.77:.24),new T.Vector3(x+.13,-.393,.45),new T.Vector3(-.15,-.393,.6),new T.Vector3(-.48,-.393,.28),new T.Vector3(-.51,-.39,-.22),new T.Vector3(-.51,-.25,-.26)])),[]);
  return <>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.4,.5]} receiveShadow><planeGeometry args={[2.4,2.5]}/><meshStandardMaterial map={floor[0]} normalMap={floor[1]} normalScale={[.10,.10]} roughness={.74} color="#7b8184"/></mesh>
    <mesh position={[0,.20,-.27]} receiveShadow><boxGeometry args={[2.4,1.2,.03]}/><meshStandardMaterial color="#a7acac" normalMap={s.paper[1]} normalScale={[.025,.025]} roughness={.97}/></mesh>
    <mesh position={[0,-.37,-.245]}><boxGeometry args={[2.4,.06,.015]}/><meshStandardMaterial color="#696e70" roughness={.85}/></mesh>
    {[-.85,.85].map(x=><mesh key={x} position={[x,.2,.3]} receiveShadow><boxGeometry args={[.025,1.2,1.15]}/><meshStandardMaterial color="#71777b" roughness={.96}/></mesh>)}
    {[-1,1].map(x=><React.Fragment key={x}><Bar a={[x*.29,-.02,-.14]} b={[x*-.19,-.39,.14]} r={.007}/><Bar a={[x*.29,-.02,.14]} b={[x*-.19,-.39,-.14]} r={.007}/></React.Fragment>)}
    {[0,1,2].map(i=>{const a=i*Math.PI*2/3;return <React.Fragment key={i}><Bar a={[-.24,-.36,.24]} b={[-.24+.13*Math.cos(a),-.395,.24+.13*Math.sin(a)]} r={.003}/><mesh position={[CAMERA_FITS.opening[0]+Math.cos(a)*.13,-.392,CAMERA_FITS.opening[2]+Math.sin(a)*.13]}><cylinderGeometry args={[.009,.012,.016,16]}/><meshStandardMaterial color="#292e30" roughness={.88}/></mesh></React.Fragment>;})}
    <Bar a={[.15,-.02,-.08]} b={[.15,-.395,-.08]} r={.003}/>
    {cables.map((curve,i)=><mesh key={i}><tubeGeometry args={[curve,90,.0018,8,false]}/><meshStandardMaterial color="#262b30" roughness={.83}/></mesh>)}
    <mesh position={[-.51,-.25,-.248]}><boxGeometry args={[.040,.055,.008]}/><meshStandardMaterial color="#b8bcbb" roughness={.84}/></mesh>
    {[-.006,.006].map(x=><mesh key={x} position={[-.51+x,-.25,-.243]}><circleGeometry args={[.0025,12]}/><meshStandardMaterial color="#24292c" roughness={.8}/></mesh>)}
  </>;
}
function Scene({f,ready}:{f:number,ready:()=>void}){
  const {camera,scene,gl,advance}=useThree(),s=useSurfaces();
  const keyTarget=useMemo(()=>{const o=new T.Object3D();o.position.set(0,.055,0);return o;},[]);
  const light=(k:'key'|'edge')=>interpolate(f,LIGHT_CURVES[k].map(v=>v[0]),LIGHT_CURVES[k].map(v=>v[1]),clamp);
  useLayoutEffect(()=>{const p=Math.max(0,Math.min(1,f/35));camera.position.set(pose[0]+.04*(1-2*p),pose[1],pose[2]-.05*p);camera.up.set(0,1,0);camera.lookAt(pose[3],pose[4],pose[5]);(camera as T.PerspectiveCamera).fov=pose[6];camera.updateProjectionMatrix();camera.updateMatrixWorld();scene.environment=s.hdr;scene.environmentIntensity=.22;},[camera,scene,s.hdr,f]);
  useLayoutEffect(()=>{gl.shadowMap.autoUpdate=false;gl.shadowMap.needsUpdate=true;},[gl]);
  useEffect(()=>{const t=setTimeout(()=>{advance(f/FPS*1000);gl.getContext().finish();ready();},0);return()=>clearTimeout(t);},[advance,gl,ready]);
  return <>
    <color attach="background" args={['#909697']}/><hemisphereLight args={['#e3e8ed','#6b6260',.60]}/>
    <directionalLight position={[-.6,1,.9]} intensity={.35} color="#e8e9e8" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-1.2} shadow-camera-right={1.2} shadow-camera-top={1.2} shadow-camera-bottom={-1.2} shadow-camera-near={.05} shadow-camera-far={3} shadow-normalBias={.0003} shadow-radius={3}/>
    <primitive object={keyTarget}/><spotLight position={[-.24,.36,.24]} target={keyTarget} color="#ffdfec" intensity={.25*light('key')} angle={.38} penumbra={.38} decay={2} distance={1.5} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-near={.01} shadow-camera-far={1.6} shadow-normalBias={.00013} shadow-bias={-.00002} shadow-radius={2.5}/>
    <spotLight position={[.15,.18,-.08]} target={keyTarget} intensity={.14*light('edge')} angle={.42} penumbra={.65} distance={.8} decay={2} color="#f8f4f2"/>
    <StudioRoom/><StudioRig/><DeskSet surfaces={s} detailed showBackdropProps={false}/><CupV05 paper={s.paper} detailed/>
    <EffectComposer multisampling={0}><DepthOfField target={[0,.06,.35]} focusRange={1} bokehScale={.6} resolutionScale={.5}/></EffectComposer>
  </>;
}
export function HookSetupV05B(){
  const frame=useCurrentFrame(),{fps}=useVideoConfig(),samples=Number(getInputProps().shutterSamples??1),raw=frame*FPS/fps,whole=Math.floor(raw+1e-7),f=samples>1?Math.max(0,whole+(raw-whole-.5+.5/samples)*.5):raw;
  const {delayRender,continueRender}=useDelayRender();const[handle]=useState(()=>delayRender('BTS room assets'));const ready=useCallback(()=>continueRender(handle),[continueRender,handle]);
  return <AbsoluteFill><ThreeCanvas width={720} height={1280} dpr={1} shadows camera={{near:.002,far:4}} gl={{antialias:true,alpha:false}} onCreated={({gl})=>{gl.transmissionResolutionScale=.5;gl.toneMapping=T.ACESFilmicToneMapping;gl.toneMappingExposure=.84;gl.shadowMap.type=T.PCFShadowMap;}}><Scene f={f} ready={ready}/></ThreeCanvas></AbsoluteFill>;
}
