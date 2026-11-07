import React,{useCallback,useContext,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useLoader,useThree} from '@react-three/fiber';
import {DepthOfField,EffectComposer} from '@react-three/postprocessing';
import {AbsoluteFill,Freeze,getInputProps,interpolate,staticFile,useCurrentFrame,useDelayRender,useVideoConfig} from 'remotion';
import * as T from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {useSurfaces} from './materials';
import {DeskSet} from './Set';
import {CupV05} from './Cup';
import {Page,Crumple} from './Paper';
import {Hand} from './Hand';
import {PencilV05} from './Pencil';
import {KettlePour} from './Water';
import {graphiteMap,graphitePoint,notebookHalf,landscapePlan} from './textures';
import {RenderQualityV05} from './quality';
import {pageSurfacePoint} from './geometry';
import {LIGHT_CURVES} from './light-curves';
import {CAMERA_FITS} from './camera-fits';
import {BLUEPRINT_FITS} from './blueprint-camera';
import {PENCIL_CAMERA} from './pencil-camera';
import {Protractor,LightRig} from './props';

export const SOURCE_FPS=2997/125;
const DRAWING_SCALE=1.5;
export type ShotV05='lighting'|'tabletop'|'blueprint'|'pages'|'flipbook'|'folding'|'pour'|'sweep'|'pencil-hand'|'pencil-macro'|'clock'|'return'|'hook-setup'|'hook-detail'|'hook-result';
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
const mix=(f:number,a:number,b:number,x:number,y:number)=>interpolate(f,[a,b],[x,y],clamp);
const lengths:Record<ShotV05,number>={lighting:94,tabletop:60,blueprint:15,pages:31,flipbook:31,folding:38,pour:61,sweep:14,'pencil-hand':9,'pencil-macro':13,clock:26,return:31,'hook-setup':36,'hook-detail':30,'hook-result':28};

function Scene({shot,f,onReady,shadowSize}:{shot:ShotV05,f:number,onReady:()=>void,shadowSize:number}){
  const {camera,scene,advance,gl}=useThree(),surfaces=useSurfaces(),first=useRef(f).current;
  useLoader(GLTFLoader,staticFile('v04-assets/right-hand-smooth.glb'));
  const p=Math.min(1,f/lengths[shot]),t=f/SOURCE_FPS;
  const isWriting=shot==='pencil-hand'||shot==='pencil-macro';
  const writing=shot==='pencil-hand'?mix(f,8,9,0,.025):mix(f,0,13,.025,1);
  const mark=graphitePoint(writing);
  const nib:[number,number,number]=[(mark.x/1536-.5)*.14,.00092+(shot==='pencil-hand'?interpolate(f,[0,5,8],[.008,.003,0],clamp):0),.045+(mark.y/2048-.5)*.19];
  const returnLift=shot==='return'?interpolate(f,[0,2,5,9,12,31],[.24,.140,.060,.014,0,0],clamp):0;
  const front=shot==='folding'?interpolate(f,[0,15,19,23,28,38],[.55,.55,.65,1,1,1],clamp):shot==='pour'?-2:1,back=shot==='folding'?interpolate(f,[0,17,22,28,38],[0,0,.2,1,1],clamp):shot==='pour'?-2:1;
  const cupAngle=shot==='folding'?mix(f,0,37,-.03,.02):shot==='return'?mix(f,0,13,.13,0):shot==='pour'?-.55:0;
  const cupVisible=['lighting','tabletop','folding','pour','return','clock','hook-setup','hook-detail','hook-result'].includes(shot);
  const noLoose=shot==='sweep';
  const full=!['lighting','hook-setup','hook-detail','hook-result'].includes(shot);
  const lightFrame=shot==='hook-detail'?f+36:shot==='hook-result'?f+66:f;
  const on=(at:number)=>{if(full)return 1;const name=({7:'key',24:'edge',38:'fill',58:'background',74:'label'} as const)[at as 7|24|38|58|74];const curve=LIGHT_CURVES[name];return interpolate(lightFrame,curve.map(x=>x[0]),curve.map(x=>x[1]),clamp);};
  const bgTarget=useMemo(()=>{const o=new T.Object3D();o.position.set(.045,.14,-.18);return o;},[]);
  const roomTarget=useMemo(()=>{const o=new T.Object3D();o.position.set(0,-.10,-.80);return o;},[]);
  const keyTarget=useMemo(()=>{const o=new T.Object3D();o.position.set(0,.055,0);return o;},[]);
  useLayoutEffect(()=>{scene.environment=surfaces.hdr;scene.environmentIntensity=.035;},[scene,surfaces.hdr]);
  // These shots move only the camera (or non-shadow-casting water). The light
  // and every shadow caster stay fixed, so retain the identical shadow map.
  // All articulated shots still update shadows on every animation sample.
  const shadowPhase=shot==='lighting'?f:0;
  useLayoutEffect(()=>{
    gl.shadowMap.autoUpdate=!['lighting','tabletop','blueprint','pour'].includes(shot);
    gl.shadowMap.needsUpdate=true;
  },[gl,shot,shadowPhase]);
  useLayoutEffect(()=>{
    let pos:[number,number,number]=CAMERA_FITS.opening.slice(0,3) as [number,number,number],target:[number,number,number]=[CAMERA_FITS.opening[3],CAMERA_FITS.opening[4],0],fov=31,roll=0;
    if(shot==='hook-setup'){pos=[.45,.36,mix(f,0,35,1.30,1.24)];target=[0,.10,.22];fov=55;}
    if(shot==='hook-detail'){pos=[.015,.15,.44];target=[0,.08,0];fov=31;}
    if(shot==='tabletop'){const k=f/59,keys=[0,29/59,1];const values=(i:number)=>interpolate(k,keys,CAMERA_FITS.tabletop.map(p=>p[i]),clamp);pos=[values(0),values(1),values(2)];target=[values(3),values(4),values(5)];fov=values(6);roll=0;}
    if(shot==='blueprint'){const push=interpolate(f,[0,3,7,11,14],[0,.02,.50,1,1.03],clamp),a=BLUEPRINT_FITS.cameras[0],b=BLUEPRINT_FITS.cameras[1],v=(i:number)=>a[i]+(b[i]-a[i])*push;pos=[v(0),v(1),v(2)];target=[v(3),.0015,v(4)];fov=42;roll=v(5);}
    if(shot==='pages'){pos=[.018,.22,.105];target=[0,.012,.04];fov=39;roll=-.08;}
    if(shot==='flipbook'){pos=[.008,.145,.288];target=[0,0.07087970360499128,0];fov=46;roll=-.015;}
    if(shot==='folding'){const k=f/37;pos=[.025,mix(k,0,1,CAMERA_FITS.fold[0][3],CAMERA_FITS.fold[1][3]),mix(k,0,1,CAMERA_FITS.fold[0][0],CAMERA_FITS.fold[1][0])];target=[mix(k,0,1,CAMERA_FITS.fold[0][2],CAMERA_FITS.fold[1][2]),mix(k,0,1,CAMERA_FITS.fold[0][1],CAMERA_FITS.fold[1][1]),0];fov=32;}
    if(shot==='pour'){const y=mix(f,0,61,.132,.039);pos=[.024,y+.015,.15];target=[.001,y,0];fov=40;}
    if(shot==='sweep'){pos=[.025,.255,.115];target=[0,.003,.045];fov=37;roll=-.14;}
    if(shot==='pencil-hand'){pos=PENCIL_CAMERA.position as [number,number,number];target=PENCIL_CAMERA.target as [number,number,number];fov=37;}
    if(shot==='pencil-macro'){pos=[nib[0]+.018,.035,nib[2]+.026];target=[nib[0]+.004,.006,nib[2]];fov=31;}
    if(shot==='clock'){pos=CAMERA_FITS.clockCamera.slice(0,3) as [number,number,number];target=CAMERA_FITS.clockCamera.slice(3,6) as [number,number,number];fov=32;roll=.031;}
    if(shot==='return'){const q=Math.min(1,f/30),push=q**1.5,start=CAMERA_FITS.opening,end=CAMERA_FITS.returnEnd;pos=[mix(push,0,1,start[0],end[0]),mix(push,0,1,start[1],end[1]),mix(push,0,1,start[2],end[2])];target=[mix(q,0,1,start[3],end[3]),mix(q**.8,0,1,start[4],end[4]),0];}
    if(['tabletop','blueprint','pages','pour'].includes(shot)){pos[0]+=.00035*Math.sin(f*.71)+.00015*Math.sin(f*1.13);pos[1]+=.0002*Math.sin(f*.52);roll+=.002*Math.sin(f*.30);}
    if(shot==='pages'){pos=pos.map(v=>v*DRAWING_SCALE) as [number,number,number];target=target.map(v=>v*DRAWING_SCALE) as [number,number,number];}
    camera.position.set(...pos);if(shot==='blueprint')camera.up.set(Math.sin(roll),0,-Math.cos(roll));else camera.up.set(Math.sin(roll),Math.cos(roll),0);camera.lookAt(...target);(camera as T.PerspectiveCamera).fov=fov;camera.updateProjectionMatrix();camera.updateMatrixWorld();
  },[camera,shot,f,nib[0],nib[2]]);
  // Remotion must render once more when asynchronous asset loading finishes.
  useEffect(()=>{const timer=setTimeout(()=>{advance(first/SOURCE_FPS*1000);gl.getContext().finish();onReady();},0);return()=>clearTimeout(timer);},[advance,first,gl,onReady]);
  // All 31 reference frames reveal four drawings, including the brief back
  // view at local frames 15–16; it must not disappear into a generic flip.
  const paperStack=[{kind:9,x:0,z:.045,yaw:.12,start:-1,end:0},{kind:6,x:.003,z:.041,yaw:.055,start:0,end:9},{kind:7,x:-.003,z:.047,yaw:.10,start:13,end:15},{kind:8,x:-.002,z:.049,yaw:.17,start:16,end:20}];
  const leaves=paperStack.map((pose,i)=>{const phase=i===0?1:mix(f,pose.start,pose.end,0,1),progress=1-(1-phase)**2,remaining=1-progress;return{...pose,phase,curl:.29*Math.sin(progress*Math.PI),position:new T.Vector3(pose.x-.17*remaining,.001+i*.0002+.018*Math.sin(progress*Math.PI),pose.z+.13*remaining).multiplyScalar(DRAWING_SCALE),rotation:new T.Euler(0,pose.yaw+.65*remaining,.10*Math.sin(progress*Math.PI))};});
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
  const focus:T.Vector3Tuple=shot==='hook-setup'?[0,.10,.35]:shot==='pour'?[.001,mix(f,0,61,.122,.039),0]:shot==='pencil-macro'?nib:shot==='clock'?[.105,.024,-.018]:shot==='pages'||shot==='blueprint'?[0,.015,.0675]:shot==='sweep'?[0,.01,.045]:shot==='flipbook'?[0,.10,0]:[0,.06,0];
  const pencilDir=new T.Vector3(shot==='pencil-hand'?-.025:.025,.09,-.012).normalize(),gripPoint=new T.Vector3(...nib).addScaledVector(pencilDir,shot==='pencil-hand'?.05:.067);
  return <>
    <color attach="background" args={['#121412']}/>
    <hemisphereLight args={['#c5d4ef','#47362a',(shot==='hook-setup'?.17:.035)+.065*on(38)]}/>
    <primitive object={keyTarget}/>
    <spotLight position={[-.24,.36,.24]} target={keyTarget} color={shot==='folding'?'#ffd09d':shot==='flipbook'?'#e4edff':shot==='pour'?'#fff0e7':'#ffdfec'} intensity={(shot==='folding'?.33:shot==='pour'?.34:.25)*on(7)} angle={.38} penumbra={.38} decay={2} distance={1.5} castShadow shadow-mapSize-width={shadowSize} shadow-mapSize-height={shadowSize} shadow-camera-near={.01} shadow-camera-far={1.6} shadow-normalBias={.00013} shadow-bias={-.00002} shadow-radius={2.5}/>
    <spotLight position={[.15,.18,-.08]} target={keyTarget} intensity={.14*on(24)} angle={.42} penumbra={.65} distance={.8} decay={2} color="#f8f4f2"/>
    <pointLight position={[-.16,.12,.25]} intensity={.024*on(38)} distance={.7} decay={2} color="#d2e5eb"/>
    {shot==='pour'&&<pointLight position={[-.10,.11,.19]} intensity={.045} distance={.7} decay={2} color="#fff6ef"/>}
    <primitive object={bgTarget}/>
    {shot!=='tabletop'&&<spotLight position={[.20,.20,.09]} target={bgTarget} intensity={1.25*on(58)} color="#ffc17d" angle={.42} penumbra={.18} decay={2} distance={1} castShadow shadow-camera-near={.005} shadow-camera-far={1.2} shadow-mapSize-width={1024} shadow-mapSize-height={1024} map={surfaces.gobo}/>}
    {shot==='tabletop'&&<><primitive object={roomTarget}/><spotLight position={[.20,.15,-.25]} target={roomTarget} intensity={.55} color="#e6baa2" angle={.75} penumbra={.7} distance={2} decay={2}/></>}
    <pointLight position={[.01,.025,.25]} intensity={.023*on(74)} distance={.6} decay={2} color="#fff9e9"/>
    {shot==='hook-setup'&&<LightRig/>}
    <DeskSet surfaces={surfaces} clockProgress={shot==='clock'?Math.min(1,f/25):undefined} showLoose={!noLoose} detailed showStaticPencil={!isWriting} cleanDrawingArea={['pages','blueprint','pencil-hand','pencil-macro'].includes(shot)} showTools={shot!=='clock'} showBackdropProps={shot==='tabletop'} blueprintSet={shot==='blueprint'} staticTime={['lighting','tabletop','return','hook-setup','hook-detail','hook-result'].includes(shot)?11*60+43:14*60+34}/>
    {cupVisible&&<CupV05 paper={surfaces.paper} front={front} back={back} angle={cupAngle} lift={returnLift} water={shot==='pour'?.08+p*.7:0} detailed guides={shot==='folding'} squeezeTop={shot==='folding'?1-.02*back:1}/>}
    {shot==='blueprint'&&<Page paper={surfaces.paper} position={[0,.001*DRAWING_SCALE,.045*DRAWING_SCALE]} width={BLUEPRINT_FITS.width} height={BLUEPRINT_FITS.height} map={landscapePlan()} rotation={[0,.12,0]}/>}
    {shot==='pages'&&<>
      {leaves.filter(leaf=>f>=leaf.start).map((leaf,i)=><Page key={i} paper={surfaces.paper} kind={leaf.kind} width={.14*DRAWING_SCALE} height={.19*DRAWING_SCALE} turn={leaf.curl} position={leaf.position.toArray()} rotation={[leaf.rotation.x,leaf.rotation.y,leaf.rotation.z]}/>)}
      {((f>=12&&f<14.5)||(f>=18&&f<20))&&<Hand pose="paper" scale={.80} position={pageHandPosition.toArray()} rotation={[pageHandRotation.x,pageHandRotation.y,pageHandRotation.z]} grip={.65} target={pageGrip.toArray()} targetNormal={pageNormal.toArray()} opposedThumb debug={Boolean(getInputProps().debugContact)}/>}
    </>}
    {shot==='flipbook'&&<>
      <group position={[0,.018,.055]}>
        <Page paper={surfaces.paper} map={notebookHalf(false,Math.floor(f+.25)>=28?1:0)} bothSides width={.205} height={0.14435602578911075} turn={Math.PI/2} position={[0,0,0.07217801289455537]}/>
        <Page paper={surfaces.paper} map={notebookHalf(true,0)} bothSides width={.205} height={.13} position={[0,.0003,.065]}/>
        <Page paper={surfaces.paper} map={notebookHalf(false,Math.floor(f+.25)>=28?1:0)} bothSides width={.205} height={0.14435602578911075} turn={(1-flipPhase)*Math.PI/2} position={[0,.0008,0.07257801289455537]}/>
        <mesh position={[0,.001,0]}><boxGeometry args={[.205,.001,.001]}/><meshStandardMaterial color="#d7d7db"/></mesh>
      </group>
      <Hand pose="pinch" position={[.035,.20,-.05]} rotation={[0,0,-.35]} scale={.63} grip={.55} target={[0.012, 0.16235602578911074, 0.055]} targetNormal={[0,0,1]} opposedThumb debug={Boolean(getInputProps().debugContact)}/>

    </>}
    {shot==='pour'&&<KettlePour time={t} level={p}/>}
    {shot==='sweep'&&<>
      <Page paper={surfaces.paper} kind={f<8?11:4} width={.145} height={.19} position={[0,.001,.045]} rotation={[0,.16,0]}/>
      {[0,1,2].map((i)=><Crumple key={i} paper={surfaces.paper} seed={i+4} scale={.82} position={[[-.035,.013,.035][i]+mix(f,3,11,0,.21),.003+mix(f,7,14,0,-.01),.03+i*.024]} rotation={[p*4,p*6,i*.6+p*3]}/>)}
      <Hand pose="sweep" scale={.75} position={[mix(f,0,12,-.20,.24),.04,.025]} rotation={[-Math.PI/2,0,Math.PI*.4]} grip={.25} forearm/>
    </>}
    {isWriting&&<>
      <Page paper={surfaces.paper} position={[0,.0009,.045]} map={graphiteMap(writing)}/>
      <PencilV05 wood={surfaces.wood} tip={nib} direction={pencilDir.toArray()} short={shot==='pencil-hand'}/>
      <Hand pose="pencil" position={[gripPoint.x-.055,gripPoint.y+.020,gripPoint.z+.015]} rotation={[.30,1.20,1.10]} grip={.72} scale={.66} target={gripPoint.toArray()} targetNormal={[0,0,1]} opposedThumb/>
    </>}
    {shot==='return'&&f<26&&<Hand pose="cup" position={[.100+mix(f,18,26,0,.20),.057+returnLift,-.008+mix(f,18,26,0,.06)]} rotation={[Math.PI/2,0,-1.10]} grip={mix(f,17,24,1,0)} scale={.85} contacts={f<18?{'thumb':[-.0037,.061+returnLift,.0175],'index-finger':[-.0111,.078+returnLift,-.015],'middle-finger':[-.0093,.064+returnLift,-.0156],'ring-finger':[-.0056,.050+returnLift,-.0156],'pinky-finger':[.0019,.036+returnLift,-.015]}:undefined} forearm opposedThumb debug={Boolean(getInputProps().debugContact)}/>}
    <EffectComposer multisampling={0}>
      <DepthOfField target={focus} focusRange={shot==='hook-setup'?.70:shot==='tabletop'?.10:shot==='pencil-macro'?.008:shot==='pour'?.028:shot==='clock'?.012:shot==='flipbook'?.09:shot==='blueprint'||shot==='pages'?.165:.12} bokehScale={shot==='hook-setup'?.8:shot==='pour'?12:shot==='tabletop'?6:shot==='clock'?3.5:shot==='pencil-macro'?2.8:2.4} resolutionScale={.5}/>
    </EffectComposer>
  </>;
}

const lightPhases=[0,5,6,7,8,9,10,21,22,23,24,25,26,27,28,29,30,37,38,39,40,56,57,58,59,60,61,62,63,64,65,66,67,73,74,75,76,77,78,79,80,81,82,83];
export function StageV05({shot}:{shot:ShotV05}){
  const frame=useCurrentFrame(),{width,height,fps}=useVideoConfig(),rawFrame=frame*SOURCE_FPS/fps;
  const samples=Number(getInputProps().shutterSamples??1),whole=Math.floor(rawFrame+1e-7);
  const sourceFrame=samples>1?Math.max(0,whole+(rawFrame-whole-.5+.5/samples)*.5):rawFrame;
  const quality=useContext(RenderQualityV05);
  const canvasWidth=Math.round(width*quality.dpr),canvasHeight=Math.round(height*quality.dpr);
  const {delayRender,continueRender}=useDelayRender();
  const [readyHandle]=useState(()=>delayRender('V05 scene, hand and textures ready'));
  const onReady=useCallback(()=>continueRender(readyHandle),[continueRender,readyHandle]);
  const frozenSource=shot==='hook-result'?Math.min(sourceFrame,17):shot==='lighting'?lightPhases.filter(x=>x<=sourceFrame).at(-1)!:sourceFrame;
  const label=sourceFrame<7?'':sourceFrame<24?'ОСНОВНОЙ СВЕТ':sourceFrame<38?'КОНТУРНЫЙ СВЕТ':sourceFrame<58?'ЗАПОЛНЕНИЕ':sourceFrame<74?'СВЕТ ФОНА':'СВЕТ МАРКИРОВКИ';
  return <AbsoluteFill style={{background:'#121412'}}>
    <Freeze frame={Math.round(frozenSource*fps/SOURCE_FPS)}><div style={{position:'absolute',left:0,top:0,width:canvasWidth,height:canvasHeight,scale:width/canvasWidth,transformOrigin:'0 0'}}><ThreeCanvas width={canvasWidth} height={canvasHeight} dpr={1} shadows camera={{near:.002,far:3,fov:31}} gl={{antialias:true,alpha:false,powerPreference:'high-performance'}} onCreated={({gl})=>{gl.transmissionResolutionScale=.5;gl.toneMapping=T.ACESFilmicToneMapping;gl.toneMappingExposure=.84;gl.shadowMap.type=T.PCFShadowMap;}}>
      <Scene shot={shot} f={frozenSource} onReady={onReady} shadowSize={getInputProps().previewQuality?1024:quality.shadow}/>
    </ThreeCanvas></div></Freeze>
    {shot==='lighting'&&label&&!getInputProps().hideLightingLabel&&<div style={{position:'absolute',left:sourceFrame<24?487:sourceFrame<38?490:sourceFrame<58?65:sourceFrame<74?280:380,top:sourceFrame<24?435:sourceFrame<38?427:sourceFrame<58?420:sourceFrame<74?302:785,color:'#f3eee2',fontFamily:'Arial,sans-serif',fontSize:24,fontWeight:500,letterSpacing:.45,textShadow:'0 1px 2px rgba(0,0,0,.45)',whiteSpace:'nowrap'}}>{label}</div>}
  </AbsoluteFill>;
}
