import React,{useMemo} from 'react';
import * as T from 'three';
import {bevelBox} from './geometry';
import {canvasMap,useSurfaces} from './materials';

// Background landmarks fitted across three reference viewpoints. Distances
// are reconstruction coordinates, not a claim about the author's room.
function RoomBackdropScene({surfaces}:{surfaces:ReturnType<typeof useSurfaces>}){
  const ribs=useMemo(()=>{const g=bevelBox(.008,1.2,.011,.0012),m=new T.MeshStandardMaterial({map:surfaces.wood[0],normalMap:surfaces.wood[1],normalScale:new T.Vector2(.12,.12),roughness:.88});const mesh=new T.InstancedMesh(g,m,161),o=new T.Object3D();for(let i=0;i<161;i++){o.position.set((i-80)*.0105,0,-.80);o.updateMatrix();mesh.setMatrixAt(i,o.matrix);mesh.setColorAt(i,new T.Color(i%3?'#67482f':'#4b3528'));}mesh.receiveShadow=true;return mesh;},[surfaces.wood[0]]);
  const vinyl=canvasMap('v05-vinyl',1024,1024,c=>{c.fillStyle='#6a281e';c.fillRect(0,0,1024,1024);for(let i=70;i<505;i+=5){c.strokeStyle=i%3?'#51231d':'#80382a';c.lineWidth=2;c.beginPath();c.arc(512,512,i,0,Math.PI*2);c.stroke();}c.fillStyle='#bd9975';c.beginPath();c.arc(512,512,100,0,Math.PI*2);c.fill();c.fillStyle='#392d28';c.beginPath();c.arc(512,512,12,0,Math.PI*2);c.fill();});
  const wood=new T.MeshStandardMaterial({map:surfaces.wood[0],normalMap:surfaces.wood[1],normalScale:new T.Vector2(.15,.15),color:'#8c7656',roughness:.74});
  const shelfMaterial=new T.MeshStandardMaterial({color:'#282927',roughness:.54,metalness:.55});
  const line=(a:T.Vector3,b:T.Vector3,r:number,color:string)=>{const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize());return <mesh position={a.clone().add(b).multiplyScalar(.5)} quaternion={q} castShadow><cylinderGeometry args={[r,r,a.distanceTo(b),16]}/><meshStandardMaterial color={color} roughness={.4} metalness={.6}/></mesh>;};
  const strap=(x:number)=>new T.CatmullRomCurve3([new T.Vector3(x,-.075,.005),new T.Vector3(x,.07,.01),new T.Vector3(x,.10,.055),new T.Vector3(x,-.06,.064)]);
  return <>
    <mesh position={[0,0,-.82]} receiveShadow><boxGeometry args={[2,1.2,.025]}/><meshStandardMaterial color="#30241e" roughness={.95}/></mesh><primitive object={ribs}/>
    <group position={[.038,-.050,-.50]}>
      <mesh geometry={bevelBox(.17,.022,.115,.004)} material={wood} castShadow receiveShadow/>
      <group position={[0,.012,-.057]} rotation={[-1.15,0,0]}>
        <mesh position={[0,0,.057]} geometry={bevelBox(.17,.007,.114,.003)} material={wood} castShadow receiveShadow/>
        <mesh position={[0,.004,.057]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.15,.095]}/><meshStandardMaterial map={surfaces.wood[0]} color="#a98250" roughness={.9}/></mesh>
      </group>
      <mesh position={[-.014,.012,0]}><cylinderGeometry args={[.047,.047,.002,64]}/><meshStandardMaterial color="#323234" metalness={.7} roughness={.3}/></mesh>
      <mesh position={[-.014,.0132,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.045,96]}/><meshStandardMaterial map={vinyl} roughness={.43}/></mesh>
      {line(new T.Vector3(.060,.020,-.040),new T.Vector3(.048,.020,.023),.0018,'#a2a4a0')}
      <mesh position={[.047,.019,.027]}><boxGeometry args={[.008,.005,.014]}/><meshStandardMaterial color="#232524" roughness={.7}/></mesh>
      <mesh position={[0,-.001,.059]}><boxGeometry args={[.032,.006,.003]}/><meshStandardMaterial color="#4b3b27" metalness={.6} roughness={.4}/></mesh>
      {[-.068,.068].map(x=><mesh key={x} position={[x,-.115,0]} material={shelfMaterial}><boxGeometry args={[.009,.20,.10]}/></mesh>)}
      <mesh position={[0,-.018,0]} material={shelfMaterial}><boxGeometry args={[.19,.009,.13]}/></mesh>
      {['#2d3543','#673c38','#b0a090','#4a5040','#39465e','#9b8b76','#3e414b','#713e30'].map((color,i)=><group key={i} position={[-.054+i*.014,-.073,.025]} rotation={[0,0,(i-4)*.01]}><mesh><boxGeometry args={[.010,.095,.075]}/><meshStandardMaterial color={color} roughness={.93}/></mesh><mesh position={[0,0,.038]}><planeGeometry args={[.002,.075]}/><meshStandardMaterial color="#b5aa8f" roughness={.9}/></mesh></group>)}
    </group>
    <group position={[-.25,-.20,-.60]} rotation={[0,.12,-.03]}>
      <mesh geometry={bevelBox(.15,.18,.09,.023)} castShadow receiveShadow><meshStandardMaterial color="#677047" roughness={.95} normalMap={surfaces.paper[1]} normalScale={[.3,.3]}/></mesh>
      <mesh geometry={bevelBox(.13,.10,.018,.012)} position={[0,-.025,.052]} castShadow><meshStandardMaterial color="#555e3c" roughness={.95} normalMap={surfaces.paper[1]} normalScale={[.3,.3]}/></mesh>
      {[-.053,.053].map(x=><mesh key={x}><tubeGeometry args={[strap(x),40,.0048,8,false]}/><meshStandardMaterial color="#3f4930" roughness={.97}/></mesh>)}
      <mesh position={[0,.087,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.018,.018,.13,24]}/><meshStandardMaterial color="#73794a" roughness={.97}/></mesh>
      {[-.05,.05].map(x=><mesh key={x} position={[x,-.035,.065]}><boxGeometry args={[.012,.015,.003]}/><meshStandardMaterial color="#33392c" roughness={.6}/></mesh>)}
    </group>
    <group position={[.35,.025,-.67]}>
      <mesh><boxGeometry args={[.15,.55,.004]}/><meshStandardMaterial color="#b9c0bd" emissive="#9fa7a5" emissiveIntensity={.1} metalness={.35} roughness={.4}/></mesh>
      {[-.080,.080].map(x=><mesh key={x} position={[x,0,.005]}><boxGeometry args={[.011,.58,.015]}/><meshStandardMaterial color="#3c4243" roughness={.4} metalness={.6}/></mesh>)}
      <mesh position={[0,-.09,.007]}><boxGeometry args={[.16,.012,.016]}/><meshStandardMaterial color="#3c4243" roughness={.4} metalness={.6}/></mesh>
    </group>
  </>;
}

export const RoomBackdrop=React.memo(RoomBackdropScene,(a,b)=>a.surfaces.wood[0]===b.surfaces.wood[0]&&a.surfaces.paper[1]===b.surfaces.paper[1]);
