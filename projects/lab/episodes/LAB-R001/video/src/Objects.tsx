import React, {useMemo} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {texture} from './textures';

export const Cup: React.FC<{angle?: number; lift?: number; water?: number}> = ({angle=0,lift=0,water=0}) => {
  const body = useMemo(() => {
    const vertices:number[]=[], uv:number[]=[], indices:number[]=[];
    const n=96, rows=28;
    for(let j=0;j<=rows;j++) {
      const v=j/rows;
      for(let i=0;i<=n;i++) {
        const a=i/n*Math.PI*2;
        const r=.63+.28*v;
        const y=.05+v*2.5+Math.pow(v,9)*(-.14*Math.cos(2*a)+.035*Math.sin(a));
        vertices.push(Math.sin(a)*r,y,Math.cos(a)*r);uv.push(i/n,v);
      }
    }
    for(let j=0;j<rows;j++)for(let i=0;i<n;i++) {
      const a=j*(n+1)+i,b=a+n+1;
      indices.push(a,b,a+1,b,b+1,a+1);
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
    return geo;
  },[]);
  const flap = useMemo(() => {
    const verts:number[]=[],uv:number[]=[],indices:number[]=[];const nu=48,nv=12;
    for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++) {
      const u=-1+2*i/nu,v=j/nv;
      const edge=Math.sqrt(Math.max(0,1-u*u))*.88;
      const z=edge*(.3+.7*v);
      const y=2.55+.14*(2*u*u-1)+.035*u+.16*(1-v)*(1-u*u);
      verts.push(u*.9,y,z);uv.push(i/nu,j/nv);
    }
    for(let j=0;j<nv;j++)for(let i=0;i<nu;i++) {const a=j*(nu+1)+i,b=a+nu+1;indices.push(a,b,a+1,b,b+1,a+1);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
  },[]);
  const paper=texture('paper');
  return <group rotation={[0,angle,0]} position={[0,lift,0]}>
    <mesh geometry={body} castShadow receiveShadow>
      <meshStandardMaterial color="#eee9db" map={paper} roughness={.88} side={THREE.DoubleSide} />
    </mesh>
    <mesh geometry={flap} castShadow receiveShadow><meshStandardMaterial color="#ebe6d9" map={paper} roughness={.95} side={THREE.DoubleSide} /></mesh>
    <mesh geometry={flap} rotation={[0,Math.PI,0]} position={[0,.025,0]} castShadow receiveShadow><meshStandardMaterial color="#eee9dd" map={paper} roughness={.95} side={THREE.DoubleSide}/></mesh>
    <mesh position={[0,.035,0]} rotation={[-Math.PI/2,0,0]} receiveShadow><circleGeometry args={[.63,64]}/><meshStandardMaterial color="#ded7c7" roughness={1} side={THREE.DoubleSide}/></mesh>
    <mesh position={[0,.53,0]}>
      <cylinderGeometry args={[.759,.697,.6,64,1,true,-.72,1.44]}/>
      <meshStandardMaterial map={texture('label')} transparent roughness={1} polygonOffset polygonOffsetFactor={-2}/>
    </mesh>
    {water>0 && <group position={[0,1.9+.32*water,0]}>
      <mesh rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.815,64]}/><meshPhysicalMaterial color="#d5d4bb" metalness={.15} roughness={.08} transparent opacity={.9}/></mesh>
      <mesh rotation={[-Math.PI/2,0,0]} scale={1+Math.sin(water*40)*.08}><ringGeometry args={[.2+water*.14,.215+water*.14,64]}/><meshBasicMaterial color="#f3edda" transparent opacity={.38} side={THREE.DoubleSide}/></mesh>
    </group>}
  </group>;
};

export const Desk:React.FC=()=>{
  const wall=useMemo(()=>new RoundedBoxGeometry(16,8,.18,2,.02),[]);
  const ribs=useMemo(()=>{
    const material=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.95});
    const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(.075,8,.09),material,75);
    const transform=new THREE.Object3D();
    for(let i=0;i<75;i++){
      transform.position.set(-7.4+i*.2,3.8,-2.98);transform.updateMatrix();
      mesh.setMatrixAt(i,transform.matrix);mesh.setColorAt(i,new THREE.Color(i%3===0?'#543a28':'#62422e'));
    }
    mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
  },[]);
  return <>
    <mesh receiveShadow position={[0,-.14,0]}><boxGeometry args={[20,.25,16]}/><meshStandardMaterial map={texture('wood')} roughness={.72} /></mesh>
    <mesh position={[0,3.8,-3.1]} geometry={wall} receiveShadow><meshStandardMaterial color="#493021" roughness={.91}/></mesh>
    <primitive object={ribs}/>
    <mesh position={[.13,.003,.08]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[3.4,3.4]}/><meshBasicMaterial map={texture('shadow')} transparent depthWrite={false}/></mesh>
  </>;
};

export const Sheet:React.FC<{position?:[number,number,number];rotation?:number;size?:number}> = ({position=[-1.45,.01,.85],rotation=.2,size=1}) => <mesh position={position} rotation={[-Math.PI/2,0,rotation]} receiveShadow>
  <planeGeometry args={[2.55*size,3.15*size]}/><meshStandardMaterial map={texture('drawing')} roughness={1} side={THREE.DoubleSide}/>
</mesh>;

export const DeskClock:React.FC = ()=>{
  const rounded=useMemo(()=>new RoundedBoxGeometry(1.65,.79,.43,4,.075),[]);
  return <group position={[1.75,.41,-.62]} rotation={[0,-.1,0]}>
    <mesh geometry={rounded} castShadow receiveShadow><meshStandardMaterial color="#d5c7ab" roughness={.77}/></mesh>
    <mesh position={[0,0,.222]}><planeGeometry args={[1.43,.59]}/><meshStandardMaterial map={texture('clock')} roughness={1}/></mesh>
  </group>;
};

export const Pencil:React.FC<{position?:[number,number,number];draw?:number;rotation?:[number,number,number]}> = ({position=[1.45,.09,1.5],draw=0,rotation=[0,0,-Math.PI/2]}) => <group position={[position[0]+draw,position[1],position[2]]} rotation={rotation}>
  <mesh castShadow><cylinderGeometry args={[.046,.046,1.65,6]}/><meshStandardMaterial color="#d39d32" roughness={.64}/></mesh>
  <mesh position={[0,-.94,0]} rotation={[Math.PI,0,0]}><coneGeometry args={[.046,.23,6]}/><meshStandardMaterial color="#ad8358" roughness={1}/></mesh>
  <mesh position={[0,-1.066,0]} rotation={[Math.PI,0,0]}><coneGeometry args={[.018,.06,8]}/><meshStandardMaterial color="#26282a" roughness={.7}/></mesh>
  <mesh position={[0,.85,0]}><cylinderGeometry args={[.047,.047,.06,6]}/><meshStandardMaterial color="#dacb9a" metalness={.5} roughness={.4}/></mesh>
</group>;

export const PaperBall:React.FC<{position:[number,number,number];scale?:number}>=({position,scale=.3})=>{
  const g=useMemo(()=>{const geo=new THREE.IcosahedronGeometry(1,1);const a=geo.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i),z=a.getZ(i);const k=.87+.13*Math.sin(x*13.1+y*19.3+z*17.7);a.setXYZ(i,x*k,y*k,z*k);}geo.computeVertexNormals();return geo;},[]);
  return <mesh position={position} scale={[scale,scale*.7,scale]} geometry={g} castShadow receiveShadow><meshStandardMaterial color="#b6c8c5" map={texture('paper')} roughness={1} flatShading/></mesh>;
};
