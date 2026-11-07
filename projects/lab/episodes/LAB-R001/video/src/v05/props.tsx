import React,{useMemo} from 'react';
import * as T from 'three';
import {canvasMap} from './materials';
import {CAMERA_FITS} from './camera-fits';
import {useLoader} from '@react-three/fiber';
import {staticFile} from 'remotion';

export function Protractor({position=[0,.002,.1],angle=0,scale=1}:{position?:[number,number,number],angle?:number,scale?:number}){
  const shape=useMemo(()=>{const s=new T.Shape();s.moveTo(-.045,0);s.absarc(0,0,.045,Math.PI,0,true);s.lineTo(-.045,0);const h=new T.Path();h.moveTo(-.031,.004);h.absarc(0,.004,.031,Math.PI,0,true);h.lineTo(-.031,.004);const g=new T.ExtrudeGeometry(s,{depth:.00035,bevelEnabled:false,curveSegments:64});g.rotateX(-Math.PI/2);return g;},[]);
  const marks=canvasMap('v05-protractor-marks',1024,512,c=>{c.clearRect(0,0,1024,512);c.strokeStyle='#d8dddf';c.fillStyle='#d8dddf';c.lineWidth=3;c.font='22px Arial';for(const radius of [475,400,325]){c.beginPath();c.ellipse(512,490,radius,radius,0,Math.PI,Math.PI*2);c.stroke();}for(let i=0;i<=180;i++){const a=i/180*Math.PI,r=i%10?440:415;c.beginPath();c.moveTo(512+475*Math.cos(a),490-475*Math.sin(a));c.lineTo(512+r*Math.cos(a),490-r*Math.sin(a));c.stroke();if(i%10===0){c.fillText(String(i),500+380*Math.cos(a),490-380*Math.sin(a));c.fillText(String(180-i),500+300*Math.cos(a),490-300*Math.sin(a));}}});
  return <group position={position} rotation={[0,angle,0]} scale={scale}><mesh geometry={shape} castShadow receiveShadow><meshPhysicalMaterial color="#354144" roughness={.30} transmission={.45} thickness={.00035}/></mesh><mesh position={[0,.00036,-.0225]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.09,.045]}/><meshBasicMaterial map={marks} transparent depthWrite={false}/></mesh></group>;
}

export function LightRig(){
  const screen=useLoader(T.TextureLoader,staticFile('v05-assets/camera-screen.jpg'));
  screen.colorSpace=T.SRGBColorSpace;
  const eye=new T.Vector3(...CAMERA_FITS.opening.slice(0,3) as [number,number,number]);
  const aim=new T.Vector3(CAMERA_FITS.opening[3],CAMERA_FITS.opening[4],0);
  const cameraRotation=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),aim.clone().sub(eye).normalize());
  return <>
  <group position={[-.24,.36,.24]} rotation={[.70,.55,-.18]}>
    <mesh><boxGeometry args={[.095,.12,.012]}/><meshStandardMaterial color="#171c1f" roughness={.8}/></mesh>
    <mesh position={[0,0,.0065]}><planeGeometry args={[.085,.11]}/><meshBasicMaterial color="#ffede1"/></mesh>
  </group>
  <group position={[.15,.18,-.08]} rotation={[0,-.7,0]}><mesh><boxGeometry args={[.065,.13,.012]}/><meshStandardMaterial color="#20252b" roughness={.7}/></mesh><mesh position={[-.033,0,0]} rotation={[0,-Math.PI/2,0]}><planeGeometry args={[.012,.12]}/><meshBasicMaterial color="#e7eef5"/></mesh><mesh position={[0,-.12,0]}><cylinderGeometry args={[.002,.002,.16,12]}/><meshStandardMaterial color="#727b80" metalness={.9} roughness={.3}/></mesh></group>
  <group position={eye} quaternion={cameraRotation}>
    <mesh position={[0,0,.026]} castShadow><boxGeometry args={[.095,.066,.052]}/><meshStandardMaterial color="#151b20" roughness={.54}/></mesh>
    <mesh position={[.036,0,.024]}><boxGeometry args={[.03,.075,.046]}/><meshStandardMaterial color="#252a30" roughness={.9}/></mesh>
    <group rotation={[Math.PI/2,0,0]}>
      <mesh position={[0,-.024,0]} castShadow><cylinderGeometry args={[.027,.027,.05,48]}/><meshStandardMaterial color="#1b222a" roughness={.4} metalness={.3}/></mesh>
      {[0,1,2,3,4].map(i=><mesh key={i} position={[0,-.007-i*.009,0]}><cylinderGeometry args={[.028,.028,.002,48]}/><meshStandardMaterial color="#4e555d" roughness={.6} metalness={.35}/></mesh>)}
      <mesh position={[0,-.05,0]} rotation={[Math.PI/2,0,0]}><circleGeometry args={[.023,48]}/><meshPhysicalMaterial color="#304351" roughness={.06} metalness={.25} clearcoat={1}/></mesh>
    </group>
    <mesh position={[-.008,0,.053]}><planeGeometry args={[.055,.038]}/><meshBasicMaterial map={screen}/></mesh>
    <mesh position={[0,-.047,.018]}><boxGeometry args={[.04,.025,.04]}/><meshStandardMaterial color="#31393d" roughness={.5} metalness={.6}/></mesh>
  </group>
  <mesh position={[-.24,-.02,.24]}><cylinderGeometry args={[.003,.003,.76,16]}/><meshStandardMaterial color="#424b54" metalness={.85} roughness={.3}/></mesh>
  {[0,1,2].map(i=>{const a=i*Math.PI*2/3,top=eye.clone().add(new T.Vector3(0,-.07,0)),bottom=eye.clone().add(new T.Vector3(Math.cos(a)*.13,-.45,Math.sin(a)*.13));const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),bottom.clone().sub(top).normalize());return <mesh key={i} position={top.clone().add(bottom).multiplyScalar(.5)} quaternion={q}><cylinderGeometry args={[.005,.003,top.distanceTo(bottom),16]}/><meshStandardMaterial color="#6b7277" roughness={.25} metalness={.9}/></mesh>;})}
</>;}
