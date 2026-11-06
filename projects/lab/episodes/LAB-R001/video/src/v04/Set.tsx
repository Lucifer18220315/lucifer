import React,{useMemo} from 'react';
import * as T from 'three';
import {useSurfaces,canvasMap} from '../v03/materials';
import {bevelBox} from './geometry';
import {Page,Crumple} from './Paper';
import {PencilV04} from './Pencil';
import {FlipClock} from './Clock';
import {cuttingMat} from './textures';

export function TriangleRuler({position,angle=0}:{position:[number,number,number],angle?:number}){
  const g=useMemo(()=>{const s=new T.Shape();s.moveTo(0,0);s.lineTo(.075,0);s.lineTo(0,.105);s.closePath();const h=new T.Path();h.moveTo(.009,.014);h.lineTo(.009,.078);h.lineTo(.055,.014);h.closePath();s.holes.push(h);const g=new T.ExtrudeGeometry(s,{depth:.001,bevelEnabled:true,bevelSize:.0003,bevelThickness:.0003,bevelSegments:2,steps:1});g.rotateX(-Math.PI/2);return g;},[]);
  return <group position={position} rotation={[0,angle,0]}>
    <mesh geometry={g} castShadow receiveShadow><meshPhysicalMaterial color="#273236" roughness={.35} metalness={.13} transmission={.15} thickness={.001}/></mesh>
    {Array.from({length:20},(_,i)=><mesh key={i} position={[.005+i*.0034,.0016,-.0025]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.0003,i%5===0?.004:.002]}/><meshBasicMaterial color="#a6b3b0"/></mesh>)}
  </group>;
}

export function ScissorsV04(){return <group position={[.115,.003,.07]} rotation={[0,-.35,0]}>
  {[-1,1].map(s=><group key={s} rotation={[0,s*.10,0]}>
    <mesh position={[s*.002,0,-.033]} castShadow><boxGeometry args={[.006,.0013,.07]}/><meshStandardMaterial color="#9ba3a0" roughness={.27} metalness={.95}/></mesh>
    <mesh position={[s*.008,0,.022]} rotation={[-Math.PI/2,0,0]} castShadow><torusGeometry args={[.009,.0025,10,48]}/><meshStandardMaterial color="#424743" roughness={.6}/></mesh>
  </group>)}
  <mesh rotation={[Math.PI/2,0,0]} castShadow><cylinderGeometry args={[.0024,.0024,.0025,24]}/><meshStandardMaterial color="#9ca199" roughness={.2} metalness={1}/></mesh>
</group>;}

function Bar({a,b}:{a:[number,number,number],b:[number,number,number]}){const x=new T.Vector3(...a),y=new T.Vector3(...b),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),y.clone().sub(x).normalize());return <mesh position={x.clone().add(y).multiplyScalar(.5)} quaternion={q}><cylinderGeometry args={[.0035,.0035,x.distanceTo(y),16]}/><meshStandardMaterial color="#6d7774" roughness={.28} metalness={.92}/></mesh>;}

export function DeskSet({surfaces,clockProgress,showLoose=true,detailed=true,showStaticPencil=true,cleanDrawingArea=false,showTools=true}:{surfaces:ReturnType<typeof useSurfaces>,clockProgress?:number,showLoose?:boolean,detailed?:boolean,showStaticPencil?:boolean,cleanDrawingArea?:boolean,showTools?:boolean}){
  const wood=useMemo(()=>surfaces.wood.map(t=>{const q=t.clone();q.repeat.set(.88,.4);q.needsUpdate=true;return q;}),[surfaces.wood[0]]);
  const edge=useMemo(()=>bevelBox(.75,.019,.40,.0025),[]);
  const ribs=useMemo(()=>{const g=bevelBox(.005,.44,.007,.0009),m=new T.MeshStandardMaterial({map:surfaces.wood[0],normalMap:surfaces.wood[1],normalScale:new T.Vector2(.15,.15),roughness:.84});const mesh=new T.InstancedMesh(g,m,129),o=new T.Object3D();for(let i=0;i<129;i++){o.position.set((i-64)*.0065,.22,-.176);o.updateMatrix();mesh.setMatrixAt(i,o.matrix);mesh.setColorAt(i,new T.Color(i%3===0?'#4e3727':'#62432e'));}mesh.castShadow=true;mesh.receiveShadow=true;return mesh;},[surfaces.wood[0]]);
  const bag=useMemo(()=>{const g=bevelBox(.23,.115,.105,.025),a=g.getAttribute('position');for(let i=0;i<a.count;i++)a.setY(i,a.getY(i)+.002*Math.sin(a.getX(i)*90+a.getZ(i)*55));g.computeVertexNormals();return g;},[]);
  const book=canvasMap('v04-book-cover',512,768,c=>{c.fillStyle='#8f7a3c';c.fillRect(0,0,512,768);c.fillStyle='#b4a065';c.fillRect(40,190,432,330);c.fillStyle='#786942';c.beginPath();c.moveTo(40,450);c.lineTo(250,280);c.lineTo(472,480);c.fill();c.fillStyle='#b8995c';c.beginPath();c.arc(355,285,50,0,Math.PI*2);c.fill();c.fillStyle='#343b29';c.font='700 65px Georgia';c.fillText('PAPER',44,98);c.fillText('FORMS',44,166);c.font='22px Arial';c.fillText('OBJECTS / FIELD NOTES',44,710);});
  return <>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.0003,0]} receiveShadow><planeGeometry args={[.75,.40]}/><meshStandardMaterial map={wood[0]} normalMap={wood[1]} roughnessMap={wood[2]} normalScale={[.27,.27]} roughness={.77} color="#9e8161"/></mesh>
    <mesh geometry={edge} position={[0,-.010,0]} castShadow receiveShadow><meshStandardMaterial map={wood[0]} normalMap={wood[1]} normalScale={[.23,.23]} color="#7d5e3d" roughness={.8}/></mesh>
    <mesh position={[0,.22,-.194]} receiveShadow><boxGeometry args={[1,.48,.025]}/><meshStandardMaterial color="#30251e" roughness={.93}/></mesh>
    <primitive object={ribs}/>
    {!cleanDrawingArea&&<mesh position={[-.04,.0002,.035]} rotation={[-Math.PI/2,0,-.17]} receiveShadow><planeGeometry args={[.21,.17]}/><meshStandardMaterial map={cuttingMat()} roughness={.91} normalMap={surfaces.paper[1]} normalScale={[.04,.04]}/></mesh>}
    <FlipClock progress={clockProgress}/>
    {!cleanDrawingArea&&<><Page paper={surfaces.paper} kind={1} width={.12} height={.14} position={[.105,.0008,.036]} rotation={[0,.04,0]}/><Page paper={surfaces.paper} kind={2} width={.13} height={.16} position={[-.085,.0007,.14]} rotation={[0,-.22,0]}/>{showTools&&<><TriangleRuler position={[.045,.0017,.116]} angle={-.44}/>{detailed&&<><TriangleRuler position={[.11,.0018,.125]} angle={-.2}/><ScissorsV04/></>}</>}</>}
    {!cleanDrawingArea&&showTools&&detailed&&showStaticPencil&&<PencilV04 wood={surfaces.wood} tip={[.075,.0032,.049]} direction={[1,.015,-.03]}/>}
    <mesh position={[-.075,-.018,.139]}><boxGeometry args={[.006,.014,.006]}/><meshStandardMaterial color="#302f29" roughness={.36} metalness={.7}/></mesh>
    {showLoose&&!cleanDrawingArea&&<><Crumple paper={surfaces.paper} position={[-.075,.0005,-.005]} seed={1} scale={.72}/><Crumple paper={surfaces.paper} position={[-.128,.0005,.033]} seed={2} rotation={[.1,.3,.2]} scale={1.05}/><Crumple paper={surfaces.paper} position={[.15,.0005,-.012]} seed={3} scale={.68}/></>}
    <mesh position={[.19,-.08,-.03]}><boxGeometry args={[.035,.14,.17]}/><meshStandardMaterial color="#252822" roughness={.7} metalness={.4}/></mesh>
    {detailed&&<><mesh position={[-.16,.11,-.163]}><planeGeometry args={[.09,.075]}/><meshStandardMaterial map={book} roughness={.8}/></mesh><mesh position={[.23,.06,-.13]}><boxGeometry args={[.08,.12,.025]}/><meshStandardMaterial color="#46433a" roughness={.94}/></mesh></>}
    <mesh geometry={bag} position={[.04,-.13,.035]}><meshStandardMaterial color="#101715" normalMap={surfaces.paper[1]} normalScale={[.3,.3]} roughness={.96}/></mesh>
    <Bar a={[-.19,-.11,.11]} b={[.23,-.14,.05]}/><Bar a={[.18,-.04,.04]} b={[.10,-.21,.13]}/>
    <mesh position={[.17,-.08,.12]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.011,.011,.018,24]}/><meshStandardMaterial color="#262e2a" metalness={.4} roughness={.36}/></mesh>
  </>;
}
