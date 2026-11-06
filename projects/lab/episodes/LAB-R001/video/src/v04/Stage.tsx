import React,{useCallback,useContext,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useLoader,useThree} from '@react-three/fiber';
import {DepthOfField,EffectComposer} from '@react-three/postprocessing';
import {AbsoluteFill,Freeze,getInputProps,interpolate,staticFile,useCurrentFrame,useDelayRender,useVideoConfig} from 'remotion';
import * as T from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {useSurfaces} from '../v03/materials';
import {DeskSet} from './Set';
import {CupV04} from './Cup';
import {Page,Crumple} from './Paper';
import {Hand} from './Hand';
import {PencilV04} from './Pencil';
import {KettlePour} from './Water';
import {graphiteMap,graphitePoint} from './textures';
import {RenderQualityV04} from './quality';
import {pageSurfacePoint} from './geometry';

export const SOURCE_FPS=2997/125;
const DRAWING_SCALE=1.5;
export type ShotV04='lighting'|'tabletop'|'blueprint'|'pages'|'flipbook'|'folding'|'pour'|'sweep'|'pencil-hand'|'pencil-macro'|'clock'|'return';
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
const mix=(f:number,a:number,b:number,x:number,y:number)=>interpolate(f,[a,b],[x,y],clamp);
const lengths:Record<ShotV04,number>={lighting:94,tabletop:60,blueprint:15,pages:31,flipbook:31,folding:38,pour:61,sweep:14,'pencil-hand':9,'pencil-macro':13,clock:26,return:31};

function Scene({shot,f,onReady,shadowSize}:{shot:ShotV04,f:number,onReady:()=>void,shadowSize:number}){
  const {camera,scene,advance,gl}=useThree(),surfaces=useSurfaces(),first=useRef(f).current;
  useLoader(GLTFLoader,staticFile('v04-assets/right-hand-smooth.glb'));
  const p=Math.min(1,f/lengths[shot]),t=f/SOURCE_FPS;
  const isWriting=shot==='pencil-hand'||shot==='pencil-macro';
  const writing=shot==='pencil-hand'?mix(f,5,9,0,.08):mix(f,0,13,.08,1);
  const mark=graphitePoint(writing);
  const nib:[number,number,number]=[(mark.x/1536-.5)*.14,.00092+(shot==='pencil-hand'?mix(f,0,5,.016,0):0),.045+(mark.y/2048-.5)*.19];
  const returnLift=shot==='return'?interpolate(f,[0,2,5,9,12,31],[.24,.140,.060,.014,0,0],clamp):0;
  const front=shot==='folding'?interpolate(f,[0,10,17,23,28,38],[.30,.35,.55,.90,1,1],clamp):1,back=shot==='folding'?interpolate(f,[0,10,17,23,28,38],[0,.03,.15,.62,1,1],clamp):1;
  const cupAngle=shot==='folding'?mix(f,0,37,-.03,.02):shot==='return'?mix(f,0,13,.13,0):0;
  const cupVisible=['lighting','tabletop','folding','pour','return','clock'].includes(shot);
  const noLoose=shot==='sweep';
  const full=shot!=='lighting';
  const on=(at:number)=>full||f>=at?1:0;
  const bgTarget=useMemo(()=>{const o=new T.Object3D();o.position.set(.045,.14,-.18);return o;},[]);
  const keyTarget=useMemo(()=>{const o=new T.Object3D();o.position.set(0,.055,0);return o;},[]);
  useLayoutEffect(()=>{scene.environment=surfaces.hdr;scene.environmentIntensity=.06;},[scene,surfaces.hdr]);
  // These shots move only the camera (or non-shadow-casting water). The light
  // and every shadow caster stay fixed, so retain the identical shadow map.
  // All articulated shots still update shadows on every animation sample.
  const shadowPhase=shot==='lighting'?f:0;
  useLayoutEffect(()=>{
    gl.shadowMap.autoUpdate=!['lighting','tabletop','blueprint','pour'].includes(shot);
    gl.shadowMap.needsUpdate=true;
  },[gl,shot,shadowPhase]);
  useLayoutEffect(()=>{
    let pos:[number,number,number]=[.018,.180,.80],target:[number,number,number]=[-.005,.040,0],fov=31,roll=0;
    if(shot==='tabletop'){const a=mix(f,0,60,.66,.12);pos=[Math.sin(a)*.31,.255,Math.cos(a)*.31];target=[0,.045,.008];fov=44;roll=mix(f,0,60,-.012,.012);}
    if(shot==='blueprint'){pos=[.025,mix(f,0,15,.42,.205),.13];target=[0,.001,.045];fov=42;roll=mix(f,0,15,-.12,-.03);}
    if(shot==='pages'){pos=[.018,.22,.105];target=[0,.012,.04];fov=39;roll=-.08;}
    if(shot==='flipbook'){pos=[.008,.145,.288];target=[0,.105,0];fov=46;roll=-.015;}
    if(shot==='folding'){pos=[.025,.150,mix(f,0,37,.597178,.456902)];target=[mix(f,0,37,-.003475,-.005800),mix(f,0,37,.074165,.076693),0];fov=32;}
    if(shot==='pour'){const y=mix(f,0,61,.132,.039);pos=[.024,y+.015,.15];target=[.001,y,0];fov=40;}
    if(shot==='sweep'){pos=[.025,.255,.115];target=[0,.003,.045];fov=37;roll=-.14;}
    if(shot==='pencil-hand'){pos=[.035,.145,.235];target=[-.005,.046,.055];fov=37;}
    if(shot==='pencil-macro'){pos=[nib[0]+.018,.035,nib[2]+.026];target=[nib[0]+.004,.006,nib[2]];fov=31;}
    if(shot==='clock'){pos=[.060,.036,.180];target=[.120,.014,-.020];fov=32;}
    if(shot==='return'){const q=Math.min(1,f/30),push=q**1.5;pos=[mix(push,0,1,.018,.008),mix(push,0,1,.180,.170),mix(push,0,1,.82,.585)];target=[mix(q,0,1,-.005,0),mix(q**.8,0,1,.050,.090),0];}
    if(['tabletop','blueprint','pages','pour'].includes(shot)){pos[0]+=.00035*Math.sin(f*.71)+.00015*Math.sin(f*1.13);pos[1]+=.0002*Math.sin(f*.52);roll+=.002*Math.sin(f*.30);}
    if(shot==='pages'||shot==='blueprint'){pos=pos.map(v=>v*DRAWING_SCALE) as [number,number,number];target=target.map(v=>v*DRAWING_SCALE) as [number,number,number];}
    camera.position.set(...pos);camera.up.set(Math.sin(roll),Math.cos(roll),0);camera.lookAt(...target);(camera as T.PerspectiveCamera).fov=fov;camera.updateProjectionMatrix();camera.updateMatrixWorld();
  },[camera,shot,f,nib[0],nib[2]]);
  // Remotion must render once more when asynchronous asset loading finishes.
  useEffect(()=>{const timer=setTimeout(()=>{advance(first/SOURCE_FPS*1000);gl.getContext().finish();onReady();},0);return()=>clearTimeout(timer);},[advance,first,gl,onReady]);
  // All 31 reference frames reveal four drawings, including the brief back
  // view at local frames 15–16; it must not disappear into a generic flip.
  const paperStack=[{kind:9,x:0,z:.045,yaw:.12,start:-1,end:0},{kind:6,x:.003,z:.041,yaw:.055,start:1,end:13},{kind:7,x:-.003,z:.047,yaw:.10,start:14.5,end:15},{kind:8,x:-.002,z:.049,yaw:.17,start:16,end:20}];
  const leaves=paperStack.map((pose,i)=>{const phase=i===0?1:mix(f,pose.start,pose.end,0,1),progress=1-(1-phase)**2,remaining=1-progress;return{...pose,phase,curl:.04*Math.sin(progress*Math.PI),position:new T.Vector3(pose.x-.14*remaining,.001+i*.0002+.006*Math.sin(progress*Math.PI),pose.z+.10*remaining).multiplyScalar(DRAWING_SCALE),rotation:new T.Euler(0,pose.yaw+.30*remaining,.025*Math.sin(progress*Math.PI))};});
  const activeLeaf=f<15?leaves[1]:leaves[3];
  const pageCurl=activeLeaf.curl,pagePosition=activeLeaf.position,pageRotation=activeLeaf.rotation,gripU=f<15?.90:.85;
  const surface=(u:number,v:number)=>pageSurfacePoint(.14*DRAWING_SCALE,.19*DRAWING_SCALE,pageCurl,u,v);
  const pageGrip=surface(gripU,.80).applyEuler(pageRotation).add(pagePosition);
  const tangentU=surface(gripU+.0001,.80).sub(surface(gripU-.0001,.80)).normalize();
  const tangentV=surface(gripU,.8001).sub(surface(gripU,.7999)).normalize();
  const pageNormal=tangentV.clone().cross(tangentU).normalize().applyEuler(pageRotation);
  const pageForward=tangentV.clone().applyEuler(pageRotation),pageRight=pageNormal.clone().cross(pageForward).normalize();
  const pageHandPosition=pageGrip.clone().addScaledVector(pageRight,.030).addScaledVector(pageForward,.070).addScaledVector(pageNormal,-.020);
  const pageHandRotation=new T.Euler().setFromRotationMatrix(new T.Matrix4().makeBasis(pageNormal,pageForward,pageRight));
  const flipPhase=(f%6)/6,flipStage=Math.min(5,Math.floor(f/6));
  const focus:T.Vector3Tuple=shot==='pour'?[.001,mix(f,0,61,.122,.039),0]:shot==='pencil-macro'?nib:shot==='clock'?[.105,.024,-.018]:shot==='pages'||shot==='blueprint'?[0,.015,.0675]:shot==='sweep'?[0,.01,.045]:shot==='flipbook'?[0,.10,0]:[0,.06,0];
  const pencilDir=new T.Vector3(.025,.09,-.025).normalize(),gripPoint=new T.Vector3(...nib).addScaledVector(pencilDir,.067);
  return <>
    <color attach="background" args={['#121412']}/>
    <hemisphereLight args={['#a8c6cf','#332818',.06+.08*on(38)]}/>
    <primitive object={keyTarget}/>
    <spotLight position={[-.24,.36,.24]} target={keyTarget} color="#fff0d8" intensity={.40*on(7)} angle={.38} penumbra={.38} decay={2} distance={1.5} castShadow shadow-mapSize-width={shadowSize} shadow-mapSize-height={shadowSize} shadow-camera-near={.01} shadow-camera-far={1.6} shadow-normalBias={.00013} shadow-bias={-.00002} shadow-radius={2.5}/>
    <spotLight position={[.15,.18,-.08]} target={keyTarget} intensity={.14*on(22)} angle={.42} penumbra={.65} distance={.8} decay={2} color="#fff2d9"/>
    <pointLight position={[-.16,.12,.25]} intensity={.024*on(38)} distance={.7} decay={2} color="#d2e5eb"/>
    {shot==='pour'&&<pointLight position={[-.10,.11,.19]} intensity={.045} distance={.7} decay={2} color="#fff6ef"/>}
    <primitive object={bgTarget}/>
    <spotLight position={[.20,.20,.09]} target={bgTarget} intensity={1.4*on(54)} color="#f29a43" angle={.36} penumbra={.20} decay={2} distance={1}/>
    <pointLight position={[.01,.025,.25]} intensity={.023*on(74)} distance={.6} decay={2} color="#fff9e9"/>
    <DeskSet surfaces={surfaces} clockProgress={shot==='clock'?Math.min(1,f/25):undefined} showLoose={!noLoose} detailed={shot!=='lighting'&&shot!=='return'} showStaticPencil={!isWriting} cleanDrawingArea={shot==='pages'||shot==='blueprint'} showTools={shot!=='clock'}/>
    {cupVisible&&<CupV04 paper={surfaces.paper} front={front} back={back} angle={cupAngle} lift={returnLift} water={shot==='pour'?.08+p*.7:0} detailed={shot==='folding'||shot==='pour'} guides={shot==='folding'} squeezeTop={shot==='folding'?1-.02*back:1}/>}
    {shot==='blueprint'&&<Page paper={surfaces.paper} position={[0,.001*DRAWING_SCALE,.045*DRAWING_SCALE]} width={.14*DRAWING_SCALE} height={.19*DRAWING_SCALE} kind={9} rotation={[0,.12,0]}/>}
    {shot==='pages'&&<>
      {leaves.filter(leaf=>f>=leaf.start).map((leaf,i)=><Page key={i} paper={surfaces.paper} kind={leaf.kind} width={.14*DRAWING_SCALE} height={.19*DRAWING_SCALE} turn={leaf.curl} position={leaf.position.toArray()} rotation={[leaf.rotation.x,leaf.rotation.y,leaf.rotation.z]}/>)}
      {((f>=12&&f<14.5)||(f>=18&&f<20))&&<Hand pose="paper" scale={.80} position={pageHandPosition.toArray()} rotation={[pageHandRotation.x,pageHandRotation.y,pageHandRotation.z]} grip={.65} target={pageGrip.toArray()} targetNormal={pageNormal.toArray()} opposedThumb debug={Boolean(getInputProps().debugContact)}/>}
    </>}
    {shot==='flipbook'&&<>
      <group position={[0,.105,-.003]} rotation={[Math.PI/2,0,0]}>
        <Page paper={surfaces.paper} kind={5} stage={Math.min(1,(flipStage+1)/5)} width={.18} height={.22}/>
        <Page paper={surfaces.paper} kind={5} stage={flipStage/5} width={.18} height={.22} turn={flipPhase*Math.PI} position={[0,.0005,0]}/>
      </group>
      <Hand pose="pinch" position={[.112,.20,0]} rotation={[0,0,-Math.PI/2]} scale={.58} grip={.55} target={[.077,.208,.004]}/>
    </>}
    {shot==='pour'&&<KettlePour time={t} level={p}/>}
    {shot==='sweep'&&<>
      <Page paper={surfaces.paper} kind={4} width={.145} height={.19} position={[0,.001,.045]} rotation={[0,.16,0]}/>
      {[0,1,2].map((i)=><Crumple key={i} paper={surfaces.paper} seed={i+4} scale={.82} position={[[-.035,.013,.035][i]+mix(f,3,11,0,.21),.003+mix(f,7,14,0,-.01),.03+i*.024]} rotation={[p*4,p*6,i*.6+p*3]}/>)}
      <Hand pose="sweep" scale={.75} position={[mix(f,0,12,-.20,.24),.04,.025]} rotation={[-Math.PI/2,0,Math.PI*.4]} grip={.25} forearm/>
    </>}
    {isWriting&&<>
      <Page paper={surfaces.paper} position={[0,.0009,.045]} map={graphiteMap(writing)}/>
      <PencilV04 wood={surfaces.wood} tip={nib}/>
      <Hand pose="pencil" position={[gripPoint.x+.095,gripPoint.y+.060,gripPoint.z+.040]} rotation={[.30,0,-.70]} grip={.72} scale={.78} target={gripPoint.toArray()} forearm/>
    </>}
    {shot==='return'&&f<26&&<Hand pose="cup" position={[.100+mix(f,18,26,0,.20),.057+returnLift,-.008+mix(f,18,26,0,.06)]} rotation={[Math.PI/2,0,-1.10]} grip={mix(f,17,24,1,0)} scale={.85} contacts={f<18?{'thumb':[-.004,.061+returnLift,.028],'index-finger':[-.012,.078+returnLift,-.024],'middle-finger':[-.010,.064+returnLift,-.025],'ring-finger':[-.006,.050+returnLift,-.025],'pinky-finger':[.002,.036+returnLift,-.024]}:undefined} forearm opposedThumb debug={Boolean(getInputProps().debugContact)}/>}
    <EffectComposer multisampling={0}>
      <DepthOfField target={focus} focusRange={shot==='pencil-macro'?.008:shot==='pour'?.028:shot==='clock'?.012:shot==='flipbook'?.09:shot==='blueprint'||shot==='pages'?.165:.12} bokehScale={shot==='clock'?3.5:shot==='pencil-macro'?2.8:2.4} resolutionScale={.5}/>
    </EffectComposer>
  </>;
}

const lightPhases=[0,7,22,38,54,74];
export function StageV04({shot}:{shot:ShotV04}){
  const frame=useCurrentFrame(),{width,height,fps}=useVideoConfig(),sourceFrame=frame*SOURCE_FPS/fps;
  const quality=useContext(RenderQualityV04);
  const canvasWidth=Math.round(width*quality.dpr),canvasHeight=Math.round(height*quality.dpr);
  const {delayRender,continueRender}=useDelayRender();
  const [readyHandle]=useState(()=>delayRender('V04 scene, hand and textures ready'));
  const onReady=useCallback(()=>continueRender(readyHandle),[continueRender,readyHandle]);
  const frozenSource=shot==='lighting'?lightPhases.filter(x=>x<=sourceFrame).at(-1)!:sourceFrame;
  const label=sourceFrame<7?'':sourceFrame<22?'ОСНОВНОЙ СВЕТ':sourceFrame<38?'КОНТУРНЫЙ СВЕТ':sourceFrame<54?'ЗАПОЛНЕНИЕ':sourceFrame<74?'СВЕТ ФОНА':'СВЕТ МАРКИРОВКИ';
  return <AbsoluteFill style={{background:'#121412'}}>
    <Freeze frame={Math.round(frozenSource*fps/SOURCE_FPS)}><div style={{position:'absolute',left:0,top:0,width:canvasWidth,height:canvasHeight,scale:width/canvasWidth,transformOrigin:'0 0'}}><ThreeCanvas width={canvasWidth} height={canvasHeight} dpr={1} shadows camera={{near:.002,far:3,fov:31}} gl={{antialias:true,alpha:false,powerPreference:'high-performance'}} onCreated={({gl})=>{gl.transmissionResolutionScale=.5;gl.toneMapping=T.ACESFilmicToneMapping;gl.toneMappingExposure=.84;gl.shadowMap.type=T.PCFShadowMap;}}>
      <Scene shot={shot} f={frozenSource} onReady={onReady} shadowSize={quality.shadow}/>
    </ThreeCanvas></div></Freeze>
    {shot==='lighting'&&label&&<div style={{position:'absolute',left:sourceFrame>=54&&sourceFrame<74?640:sourceFrame>=74?570:655,top:sourceFrame>=54&&sourceFrame<74?370:sourceFrame>=74?1210:480,color:'#f3eee2',fontFamily:'Arial,sans-serif',fontSize:27,fontWeight:500,letterSpacing:.7}}>{label}</div>}
  </AbsoluteFill>;
}
