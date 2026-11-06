import React,{useMemo} from 'react';
import * as T from 'three';
import {canvasMap} from '../v03/materials';

export function PencilV04({tip,direction=[.025,.09,-.025],wood}:{tip:[number,number,number],direction?:[number,number,number],wood:T.Texture[]}){
  const rotation=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(...direction).normalize());
  const graphite=useMemo(()=>new T.LatheGeometry([new T.Vector2(0,0),new T.Vector2(.00023,.00012),new T.Vector2(.0006,.0007),new T.Vector2(.00093,.0037),new T.Vector2(.0011,.0045)],48),[]);
  const paint=canvasMap('v04-pencil-paint',2048,256,c=>{c.fillStyle='#d58b20';c.fillRect(0,0,2048,256);c.fillStyle='#251f16';c.font='27px Arial';c.fillText('PLAYBOY  /  GRAPHITE  /  HB',300,150);c.strokeStyle='#edb643';c.lineWidth=7;for(let i=0;i<6;i++){c.beginPath();c.moveTo(i*341,0);c.lineTo(i*341,256);c.stroke();}});
  return <group position={tip} quaternion={rotation}>
    <mesh geometry={graphite} castShadow><meshPhysicalMaterial color="#242728" roughness={.47} metalness={.12}/></mesh>
    <mesh position={[0,.01,0]} castShadow><cylinderGeometry args={[.003,.00105,.012,24,4]}/><meshStandardMaterial map={wood[0]} normalMap={wood[1]} normalScale={[.18,.18]} roughness={.9} color="#d8ba86"/></mesh>
    <mesh position={[0,.073,0]} castShadow><cylinderGeometry args={[.003,.003,.114,6]}/><meshStandardMaterial map={paint} roughness={.53}/></mesh>
    <mesh position={[0,.133,0]} castShadow><cylinderGeometry args={[.00315,.00315,.007,24]}/><meshStandardMaterial color="#bdaa77" roughness={.3} metalness={.86}/></mesh>
    <mesh position={[0,.140,0]} castShadow><cylinderGeometry args={[.003,.003,.008,24]}/><meshStandardMaterial color="#a56351" roughness={.96}/></mesh>
  </group>;
}
