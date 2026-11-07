import React,{useLayoutEffect,useMemo} from 'react';
import * as T from 'three';
import {CUP_SCALE,CUP_BASE_Y,liquidSurfaceLocalY} from './geometry';

export const pourSurfaceY=(progress:number)=>CUP_BASE_Y+CUP_SCALE*liquidSurfaceLocalY(.08+progress*.7);

export function KettlePour({time,level}:{time:number,level:number}){
  const spout=useMemo(()=>new T.TubeGeometry(new T.CubicBezierCurve3(new T.Vector3(.085,.15,-.01),new T.Vector3(.045,.164,-.004),new T.Vector3(.018,.159,-.010),new T.Vector3(.008,.145,0)),96,.0029,24,false),[]);
  const body=useMemo(()=>new T.LatheGeometry([new T.Vector2(0,0),new T.Vector2(.032,0),new T.Vector2(.045,.007),new T.Vector2(.048,.035),new T.Vector2(.040,.067),new T.Vector2(.031,.074)],96),[]);
  const handle=useMemo(()=>new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(.151,.209,-.01),new T.Vector3(.185,.20,-.01),new T.Vector3(.193,.164,-.01),new T.Vector3(.151,.145,-.01)]),64,.006,16,false),[]);
  const mouth=useMemo(()=>new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(-.010,-.014,.010).normalize()),[]);
  const jet=useMemo(()=>new T.CylinderGeometry(.00085,.00072,1,18,90,true),[]);
  const highlights=useMemo(()=>{const g=new T.BufferGeometry(),p=new Float32Array(91*2*3),c=new Float32Array(91*2*4),idx:number[]=[];for(let i=0;i<90;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('color',new T.BufferAttribute(c,4));g.setIndex(idx);return g;},[]);
  useLayoutEffect(()=>{
    const a=jet.getAttribute('position'),uv=jet.getAttribute('uv'),end=pourSurfaceY(level);
    for(let i=0;i<a.count;i++){
      const u=1-uv.getY(i),angle=uv.getX(i)*Math.PI*2,r=.0017*(1-.13*u)*(1+.31*Math.sin(u*53-time*34)+.19*Math.sin(u*99-time*59));
      const x=.008*(1-u)+.003*u+.00048*Math.sin(u*27-time*21)*Math.sin(Math.PI*u),z=.00038*Math.sin(u*34-time*26)*Math.sin(Math.PI*u);
      a.setXYZ(i,x+Math.cos(angle)*r,.145+u*(end-.145),z+Math.sin(angle)*r);
    }a.needsUpdate=true;jet.computeVertexNormals();
    const hp=highlights.getAttribute('position'),hc=highlights.getAttribute('color');for(let i=0;i<=90;i++)for(let side=0;side<2;side++){
      const u=i/90,x=.008*(1-u)+.003*u+.00048*Math.sin(u*27-time*21)*Math.sin(Math.PI*u),z=.00038*Math.sin(u*34-time*26)*Math.sin(Math.PI*u)+.00148;
      hp.setXYZ(i*2+side,x+(side?1:-1)*.00022,.145+u*(end-.145),z);hc.setXYZW(i*2+side,1,.98,.91,.20+.70*Math.max(0,Math.sin(u*74-time*37)));
    }hp.needsUpdate=true;hc.needsUpdate=true;
  },[jet,highlights,time,level]);
  return <>
    <mesh geometry={spout} castShadow><meshPhysicalMaterial color="#e8ece2" metalness={.06} roughness={.22} clearcoat={.85}/></mesh>
    <mesh position={[.008,.145,0]} quaternion={mouth}><torusGeometry args={[.0024,.00035,12,48]}/><meshPhysicalMaterial color="#dce1d7" metalness={.9} roughness={.18}/></mesh>
    <mesh position={[.00795,.14493,.00005]} quaternion={mouth}><circleGeometry args={[.00195,48]}/><meshStandardMaterial color="#121c1c" roughness={.35}/></mesh>
    <mesh geometry={body} position={[.119,.125,-.01]} castShadow><meshPhysicalMaterial color="#e7e9df" roughness={.27} clearcoat={.8} clearcoatRoughness={.18}/></mesh>
    <mesh geometry={handle} castShadow><meshStandardMaterial color="#252e2c" roughness={.62}/></mesh>
    <mesh position={[.119,.201,-.01]} castShadow><cylinderGeometry args={[.032,.032,.003,72]}/><meshPhysicalMaterial color="#dbdfd5" roughness={.23} clearcoat={.8}/></mesh>
    <mesh position={[.119,.207,-.01]} castShadow><sphereGeometry args={[.006,24,16]}/><meshStandardMaterial color="#303a35" roughness={.6}/></mesh>
    <mesh geometry={jet}><meshPhysicalMaterial color="#f3f6ed" roughness={.015} metalness={0} transmission={.96} thickness={.0018} ior={1.333} transparent opacity={1} envMapIntensity={4}/></mesh>
    <mesh geometry={highlights}><meshBasicMaterial vertexColors transparent opacity={.65} depthWrite={false} side={T.DoubleSide} toneMapped={false}/></mesh>
    {[0,1,2,3,4].map(i=>{const phase=(time*4+i*.19)%1;return <mesh key={i} position={[Math.sin(i*2.4)*phase*.004,pourSurfaceY(level)+Math.sin(phase*Math.PI)*.003,Math.cos(i*2.4)*phase*.004]} scale={1-phase}><sphereGeometry args={[.0006,12,8]}/><meshPhysicalMaterial color="#edf0df" roughness={.05} transmission={.8} thickness={.001} ior={1.333}/></mesh>;})}
  </>;
}
