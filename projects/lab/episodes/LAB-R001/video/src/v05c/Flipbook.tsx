import React,{useCallback,useEffect,useLayoutEffect,useMemo,useState} from 'react';
import * as T from 'three';
import {ThreeCanvas} from '@remotion/three';
import {useLoader,useThree} from '@react-three/fiber';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {DepthOfField,EffectComposer} from '@react-three/postprocessing';
import {AbsoluteFill,getInputProps,interpolate,staticFile,useCurrentFrame,useDelayRender,useVideoConfig} from 'remotion';
import {useSurfaces} from '../v05/materials';
import {curledPage} from '../v05/geometry';
import {DeskSet} from '../v05/Set';
import {Hand} from '../v05/Hand';
import {BOOK_POSES} from './poses';
const FPS=2997/125,H=.14435602578911075;
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
function InkPage({height,turn=0,position,material}:{height:number,turn?:number,position:[number,number,number],material:T.Material}){
 const geometry=useMemo(()=>curledPage(.205,height,turn),[height,turn]);return <mesh geometry={geometry} position={position} material={material} castShadow receiveShadow/>;
}
function Scene({f,n,shadeSample,ready}:{f:number,n:number,shadeSample:number,ready:()=>void}){
 const {camera,scene,gl,advance}=useThree(),s=useSurfaces();
 useLoader(GLTFLoader,staticFile('v04-assets/right-hand-smooth.glb'));
 const inks=useLoader(T.TextureLoader,Array.from({length:31},(_,i)=>staticFile(`v05c-assets/ink-${String(i).padStart(2,'0')}.png`)));
 useMemo(()=>{for(const t of inks){t.colorSpace=T.SRGBColorSpace;t.generateMipmaps=false;t.minFilter=T.LinearFilter;t.magFilter=T.LinearFilter;t.wrapS=t.wrapT=T.ClampToEdgeWrapping;}},[inks]);
 const uniform=useMemo(()=>({value:inks[0]}),[inks]);uniform.value=inks[Math.max(0,Math.min(30,n))];
 const material=useMemo(()=>{const m=new T.MeshStandardMaterial({color:'#f7f8fc',normalMap:s.paper[1],normalScale:new T.Vector2(.035,.035),roughness:.96,side:T.DoubleSide});
  // Reference-derived colored strokes are projected onto our paper surfaces.
  // This is explicit ink compositing, not photographic footage or a claim of
  // independent recovery of the drawn room's 3D geometry.
  m.onBeforeCompile=shader=>{shader.uniforms.referenceInk=uniform;shader.fragmentShader='uniform sampler2D referenceInk;\n'+shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nvec4 ink=texture2D(referenceInk,gl_FragCoord.xy/vec2(720.,1280.));\ndiffuseColor.rgb=mix(diffuseColor.rgb,ink.rgb,ink.a);');};m.customProgramCacheKey=()=> 'v05c-ink-projection-v1';return m;
 },[s.paper[1],uniform]);
 const value=(i:number)=>interpolate(f,BOOK_POSES.map((_,k)=>k),BOOK_POSES.map(v=>v[i]),clamp),grip=value(3),phase=(Math.max(0,f)%6)/6;
 const keyPosition=useMemo(()=>{const p=new T.Vector3(-.24,.36,.24);if(shadeSample>=0){const d=new T.Vector3(0,.055,0).sub(p).normalize(),right=new T.Vector3(0,1,0).cross(d).normalize(),up=d.clone().cross(right).normalize();p.addScaledVector(right,(shadeSample%2?1:-1)*.02375).addScaledVector(up,(shadeSample<2?-1:1)*.03);}return p;},[shadeSample]);
 const key=useMemo(()=>{const o=new T.Object3D();o.position.set(0,.055,0);return o;},[]),bg=useMemo(()=>{const o=new T.Object3D();o.position.set(0,.25,-.18);return o;},[]);
 useLayoutEffect(()=>{camera.position.set(.008,.145,value(0));camera.up.set(Math.sin(value(2)),Math.cos(value(2)),0);camera.lookAt(0,value(1),0);(camera as T.PerspectiveCamera).fov=46;camera.updateProjectionMatrix();camera.updateMatrixWorld();scene.environment=s.hdr;scene.environmentIntensity=.035;},[camera,scene,s.hdr,f]);
 useEffect(()=>{const id=setTimeout(()=>{advance(f/FPS*1000);gl.getContext().finish();ready();},0);return()=>clearTimeout(id);},[advance,gl,ready]);
 return <>
  <color attach="background" args={['#121412']}/><hemisphereLight args={['#c5d4ef','#47362a',.16]}/><primitive object={key}/>
  <spotLight position={keyPosition} target={key} color="#e4edff" intensity={.25} angle={.38} penumbra={.38} decay={2} distance={1.5} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-near={.01} shadow-camera-far={1.6} shadow-normalBias={.00013} shadow-bias={-.00002} shadow-radius={2.5}/>
  <spotLight position={[.15,.18,-.08]} target={key} intensity={.14} angle={.42} penumbra={.65} distance={.8} decay={2} color="#f8f4f2"/>
  <pointLight position={[-.16,.12,.25]} intensity={.024} distance={.7} decay={2} color="#d2e5eb"/>
  <pointLight position={[.01,.025,.25]} intensity={.023} distance={.6} decay={2} color="#fff9e9"/>
  <primitive object={bg}/><spotLight position={[0,.3,.15]} target={bg} intensity={.10} angle={.5} penumbra={1} distance={.7} decay={2} color="#f2ebe3"/>
  <DeskSet surfaces={s} detailed staticTime={14*60+34}/>
  <group position={[0,.018,.055]}>
   <InkPage material={material} height={H} turn={Math.PI/2} position={[0,0,H/2]}/>
   <InkPage material={material} height={.13} position={[0,.0003,.065]}/>
   <InkPage material={material} height={H} turn={(1-phase)*Math.PI/2} position={[0,.0008,H/2+.0004]}/>
   <mesh position={[0,.001,0]}><boxGeometry args={[.205,.001,.001]}/><meshStandardMaterial color="#d7d7db"/></mesh>
  </group>
  <Hand pose="pinch" position={[grip+.023,.20,-.05]} rotation={[0,0,-.35]} scale={.63} grip={.55} target={[grip,.018+H,.055]} targetNormal={[0,0,1]} opposedThumb/>
  <EffectComposer multisampling={0}><DepthOfField target={[0,.10,0]} focusRange={.25} bokehScale={.7} resolutionScale={.5}/></EffectComposer>
 </>;
}
export function FlipbookV05C(){
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),samples=Number(getInputProps().shutterSamples??1),raw=frame*FPS/fps,whole=Math.floor(raw+1e-7),f=samples>1?Math.max(0,whole+(raw-whole-.5+.5/samples)*.5):raw;
 const {delayRender,continueRender}=useDelayRender();const [handle]=useState(()=>delayRender('Paper pose, source-derived ink masks and hand ready'));const ready=useCallback(()=>continueRender(handle),[continueRender,handle]);
 return <AbsoluteFill><ThreeCanvas width={720} height={1280} dpr={1} shadows camera={{near:.002,far:3}} gl={{antialias:true,alpha:false}} onCreated={({gl})=>{gl.transmissionResolutionScale=.5;gl.toneMapping=T.ACESFilmicToneMapping;gl.toneMappingExposure=.84;gl.shadowMap.type=T.PCFShadowMap;}}><Scene f={f} n={whole} shadeSample={samples>1?frame%samples:-1} ready={ready}/></ThreeCanvas></AbsoluteFill>;
}
