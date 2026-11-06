import React,{useMemo} from 'react';
import * as T from 'three';
import {curledPage,crumpledPaper} from './geometry';
import {designPage} from './textures';

export function Page({paper,kind=0,stage=1,width=.14,height=.19,turn=0,position=[0,0,0],rotation=[0,0,0],map}:{paper:T.Texture[],kind?:number,stage?:number,width?:number,height?:number,turn?:number,position?:[number,number,number],rotation?:[number,number,number],map?:T.Texture}){
  const g=useMemo(()=>curledPage(width,height,turn),[width,height,turn]);
  return <group position={position} rotation={rotation}>
    <mesh geometry={g} castShadow receiveShadow><meshStandardMaterial map={map??designPage(kind,stage)} normalMap={paper[1]} normalScale={[.08,.08]} roughness={.96} side={T.FrontSide}/></mesh>
    <mesh geometry={g} castShadow receiveShadow><meshStandardMaterial map={paper[0]} normalMap={paper[1]} normalScale={[.08,.08]} color="#eee8d8" roughness={.97} side={T.BackSide}/></mesh>
  </group>;
}

export function Crumple({paper,seed=1,position,rotation=[0,0,0],scale=1}:{paper:T.Texture[],seed?:number,position:[number,number,number],rotation?:[number,number,number],scale?:number}){
  const g=useMemo(()=>crumpledPaper(seed),[seed]);
  return <mesh geometry={g} position={position} rotation={rotation} scale={scale} castShadow receiveShadow><meshStandardMaterial map={paper[0]} normalMap={paper[1]} normalScale={[.2,.2]} color={seed%2?'#68adc4':'#b6cbd0'} roughness={.94} side={T.DoubleSide}/></mesh>;
}
