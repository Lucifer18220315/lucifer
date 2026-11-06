import React,{useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {DepthOfField,EffectComposer} from '@react-three/postprocessing';
import {AbsoluteFill,Freeze,interpolate,useCurrentFrame,useVideoConfig} from 'remotion';
import * as T from 'three';
import {RectAreaLightUniformsLib} from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import {useSurfaces} from './materials';
import {Equipment,WorkSet} from './Set';
import {LightSketch} from './LightSketch';
import {bakeAreaShadow,LIGHT_POS,LIGHT_TARGET,SHADOW_D,SHADOW_W,SOURCE_LARGE,SOURCE_SMALL} from './shadows';

const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
export const V03_FRAMES=336;
export type V03Props={control?:'small'|'large'|'setup'|'macro',noText?:boolean};

function Scene({t,control}:{t:number,control?:V03Props['control']}){
  const {camera,scene,gl,advance}=useThree(),surfaces=useSurfaces(),set=useRef<T.Group>(null);
  const [shadows,setShadows]=useState<ReturnType<typeof bakeAreaShadow>[]>([]);
  const initialTime=useRef(t).current;
  const setup=control==='setup'||(!control&&t>=3&&t<6),macro=control==='macro'||(!control&&t>=11);
  const large=control?control!=='small':t<3||(t>=4.4&&t<6)||t>=8.5;
  const focus=new T.Vector3(0,.055,0);
  const area=useMemo(()=>{RectAreaLightUniformsLib.init();const a=new T.RectAreaLight('#fff1de');a.position.copy(LIGHT_POS);a.lookAt(LIGHT_TARGET);return a;},[]);
  useLayoutEffect(()=>{
    scene.environment=surfaces.hdr;scene.environmentIntensity=.23;
    if(set.current&&shadows.length===0){
      const result=[bakeAreaShadow(gl,[set.current],SOURCE_SMALL),bakeAreaShadow(gl,[set.current],SOURCE_LARGE)];
      setShadows(result);
      (window as unknown as {__v03ShadowStats:unknown}).__v03ShadowStats=result.map(r=>r.stats);
    }
  },[gl,surfaces.hdr,scene,shadows.length]);
  useLayoutEffect(()=>{
    const size=large?SOURCE_LARGE:SOURCE_SMALL;area.width=size[0];area.height=size[1];area.power=2;
    if(setup){
      const k=interpolate(t,[3,6],[0,1],clamp);camera.position.set(.95-.025*k,.78,.30);camera.lookAt(-.12,.15,.10);
      (camera as T.PerspectiveCamera).fov=60;
    }else if(macro){
      const k=control?0:interpolate(t,[11,14],[0,1],clamp);camera.position.set(.13-.025*k,.168,.24);camera.lookAt(0,.087,0);(camera as T.PerspectiveCamera).fov=34;
    }else{
      // EXACTLY the same camera for the A/B interval, no reframing between sizes.
      const drift=t<3&&!control?interpolate(t,[0,3],[-.035,0],clamp):0;
      camera.position.set(drift,.215,.485);camera.lookAt(0,.056,0);(camera as T.PerspectiveCamera).fov=36;
    }
    camera.updateProjectionMatrix();camera.updateMatrixWorld();
  },[camera,t,large,setup,macro,area,control]);
  // Async textures can resolve after Remotion's first manual advance. Render the
  // fully mounted scene once more; all animation still comes exclusively from t.
  useEffect(()=>{if(shadows.length)advance(initialTime*1000);},[advance,initialTime,shadows.length]);
  return <>
    <color attach="background" args={['#292821']}/>
    <primitive object={area}/>
    <hemisphereLight args={['#f6ebd2','#322b1e',.18]}/>
    <group ref={set}><WorkSet surfaces={surfaces} large={large}/></group>
    {shadows.length>0&&<mesh position={[0,.00048,0]} rotation={[-Math.PI/2,0,0]} renderOrder={3}>
      <planeGeometry args={[SHADOW_W,SHADOW_D]}/><meshBasicMaterial map={shadows[large?1:0].texture} transparent opacity={.58} depthWrite={false} toneMapped={false}/>
    </mesh>}
    <Equipment large={large} visible={setup}/>
    <EffectComposer multisampling={0}>
      <DepthOfField target={setup?[-.03,.08,.07]:macro?[0,.09,0]:[0,.055,0]} focusRange={setup?.85:macro?.065:.09} bokehScale={setup?.4:3} resolutionScale={.5}/>
    </EffectComposer>
  </>;
}

export const FilmV03:React.FC<V03Props>=({control,noText=false})=>{
  const frame=useCurrentFrame(),{width,height,fps}=useVideoConfig(),t=frame/fps;
  // These are deliberate locked-off A/B holds: their 3D image is identical on
  // every frame. Keep the actual canvas rather than rerendering the same pixels.
  const sceneFrame=t>=6&&t<8.5?144:t>=8.5&&t<11?204:frame;
  const setup=control==='setup'||(!control&&t>=3&&t<6),macro=control==='macro'||(!control&&t>=11),large=control?control!=='small':t<3||(t>=4.4&&t<6)||t>=8.5;
  return <AbsoluteFill style={{background:'#292821',fontFamily:'Arial,sans-serif'}}>
    <Freeze frame={sceneFrame}><ThreeCanvas width={width} height={height} dpr={1} camera={{near:.005,far:8,fov:36}} gl={{antialias:true,alpha:false,powerPreference:'high-performance'}}
      onCreated={({gl})=>{gl.toneMapping=T.ACESFilmicToneMapping;gl.toneMappingExposure=1.12;gl.outputColorSpace=T.SRGBColorSpace;}}>
      <Scene t={sceneFrame/fps} control={control}/>
    </ThreeCanvas></Freeze>
    {!noText&&<>
      <AbsoluteFill style={{pointerEvents:'none',background:'linear-gradient(180deg,rgba(21,23,19,.68),transparent 29%,transparent 73%,rgba(21,23,19,.85))'}}/>
      <div style={{position:'absolute',left:72,top:105,color:'#d4b88f',fontSize:25,letterSpacing:4}}>FOLD / 03 · СВЕТ НА ПРАКТИКЕ</div>
      <div style={{position:'absolute',left:70,right:70,top:173,fontSize:68,fontWeight:500,letterSpacing:-2,color:'#f6efdf',lineHeight:1.08}}>
        {setup?<>Вот где стоит свет</>:macro?<>Схема для повторения</>:t<3&&!control?<>Мягкая тень —<br/>от большого источника</>:<>{large?'28 × 38 см':'4 × 4 см'}<br/><span style={{fontSize:38,color:'#d4b88f',letterSpacing:0}}>Одна позиция · одна мощность</span></>}
      </div>
      {macro?<div style={{position:'absolute',left:72,bottom:230}}><LightSketch/></div>:setup?<div style={{position:'absolute',left:72,right:72,bottom:240,color:'#f6efdf',fontSize:35,lineHeight:1.55,borderLeft:'3px solid #d4b88f',paddingLeft:26}}>Слева под 45° · до предмета 45 см<br/>Размер: {large?'28 × 38 см':'4 × 4 см'} · справа отражатель<br/>Камера — перед предметом</div>:
        <div style={{position:'absolute',left:72,right:72,bottom:238,color:'#f6efdf',fontSize:37,lineHeight:1.4}}>
          {t<3&&!control?'Сейчас покажу постановку и сравнение':<>Меняется только размер ключевого света<br/><span style={{color:'#d4b88f',fontSize:30}}>{large?'Широкая полутень':'Узкая полутень'}</span></>}
        </div>}
      <div style={{position:'absolute',left:72,bottom:146,color:'#b9b3a3',fontSize:23,letterSpacing:2}}>АВТОРСКАЯ 3D-СЦЕНА · СХЕМА К РОЛИКУ</div>
    </>}
  </AbsoluteFill>;
};
