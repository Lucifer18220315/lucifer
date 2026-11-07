import React,{useMemo} from 'react';
import * as T from 'three';
import {canvasMap} from '../v03/materials';
import {pencilWood} from './textures';

export function PencilV05({tip,direction=[.025,.09,-.025],wood,short=false}:{short?:boolean,tip:[number,number,number],direction?:[number,number,number],wood:T.Texture[]}){
  const rotation=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(...direction).normalize());
  const graphite=useMemo(()=>new T.LatheGeometry([new T.Vector2(0,0),new T.Vector2(.00055,.00006),new T.Vector2(.0008,.00022),new T.Vector2(.0011,.0012),new T.Vector2(.00125,.0023)],48),[]);
  const paint=canvasMap('v05-pencil-paint',2048,256,c=>{c.fillStyle='#e68d1c';c.fillRect(0,0,2048,256);c.fillStyle='#251f16';c.font='27px Arial';c.fillText('PLAYBOY  /  GRAPHITE  /  HB',300,150);c.strokeStyle='#edb643';c.lineWidth=7;for(let i=0;i<6;i++){c.beginPath();c.moveTo(i*341,0);c.lineTo(i*341,256);c.stroke();}c.strokeStyle='#805c39';c.lineWidth=1.2;for(let k=0;k<23;k++){c.beginPath();let x=50+k*87;c.moveTo(x,0);for(let y=0;y<256;y+=12)c.lineTo(x+Math.sin(k*3+y*.1)*4,y);c.stroke();}});
  return <group position={tip} quaternion={rotation}>
    <mesh geometry={graphite} castShadow><meshPhysicalMaterial color="#242728" roughness={.47} metalness={.12}/></mesh>
    <mesh position={[0,.00915,0]} castShadow><cylinderGeometry args={[.003,.00125,.0137,40,12]}/><meshStandardMaterial map={pencilWood()} normalMap={wood[1]} normalScale={[.46,.46]} roughness={.9} color="#fff8ef"/></mesh>
    <mesh position={[0,short?.058:.073,0]} castShadow><cylinderGeometry args={[.003,.003,short?.084:.114,6]}/><meshStandardMaterial map={paint} roughness={.53}/></mesh>
    {!short&&<mesh position={[0,.133,0]} castShadow><cylinderGeometry args={[.00315,.00315,.007,24]}/><meshStandardMaterial color="#bdaa77" roughness={.3} metalness={.86}/></mesh>}
    {!short&&<mesh position={[0,.140,0]} castShadow><cylinderGeometry args={[.003,.003,.008,24]}/><meshStandardMaterial color="#a56351" roughness={.96}/></mesh>}
  </group>;
}
