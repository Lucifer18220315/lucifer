import React,{useLayoutEffect,useMemo} from 'react';
import * as T from 'three';
import {CUP_SCALE,cupFlap,cupShell,bevelBox} from './geometry';
import {blueprint,canvasMap,clockMap,cupMaterial,rulerMap,useSurfaces} from './materials';
import {LIGHT_POS,LIGHT_TARGET} from './shadows';
import occlusion from '../../assets/v03-cup-occlusion.json';

const caster={shadowCaster:true};
const metal=<meshStandardMaterial color="#9eada8" roughness={.26} metalness={.92}/>;
const black=<meshStandardMaterial color="#172020" roughness={.55} metalness={.3}/>;

function withOcclusion(g:T.BufferGeometry,name:'shell'|'front'|'back'){
  const entry=occlusion.meshes[name];if(g.getAttribute('position').count!==entry.vertices)throw new Error('Lighting bake does not match geometry');
  const bytes=Uint8Array.from(atob(entry.data),c=>c.charCodeAt(0));
  g.setAttribute('geometricOcclusion',new T.Float32BufferAttribute(Array.from(bytes,b=>b/255),3));return g;
}
export function Cup({paper,large}:{paper:T.Texture[],large:boolean}){
  const shell=useMemo(()=>withOcclusion(cupShell(),'shell'),[]),front=useMemo(()=>withOcclusion(cupFlap(false),'front'),[]),back=useMemo(()=>withOcclusion(cupFlap(true),'back'),[]);
  const outside=useMemo(()=>cupMaterial(paper),[paper[0]]),inside=useMemo(()=>cupMaterial(paper,true),[paper[0]]);
  const base=useMemo(()=>new T.MeshStandardMaterial({map:paper[0],normalMap:paper[1],normalScale:new T.Vector2(.12,.12),color:'#e5dcc8',roughness:.95,side:T.DoubleSide}),[paper[0]]);
  useLayoutEffect(()=>{outside.userData.sourceLarge.value=inside.userData.sourceLarge.value=large?1:0;},[large,outside,inside]);
  return <group position={[0,-.00046,0]} scale={CUP_SCALE}>
    <mesh geometry={shell} material={outside} userData={caster}/>
    <mesh geometry={front} material={inside} userData={caster}/>
    <mesh geometry={back} material={inside} userData={caster}/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,.022,0]} userData={caster}><circleGeometry args={[.614,96]}/><primitive object={base} attach="material"/></mesh>
    <mesh position={[0,.026,0]} rotation={[Math.PI/2,0,0]} userData={caster}><torusGeometry args={[.615,.006,8,128]}/><primitive object={base} attach="material"/></mesh>
  </group>;
}

function Pencil(){
  const paint=canvasMap('v03-pencil',1024,128,c=>{c.fillStyle='#b57132';c.fillRect(0,0,1024,128);c.fillStyle='#dac391';c.font='26px Arial';c.fillText('FOLD STUDIO     •     GRAPHITE / HB',110,79);});
  return <group position={[.083,.004,.064]} rotation={[Math.PI/2,0,-.55]}>
    <mesh position={[0,.005,0]} userData={caster}><cylinderGeometry args={[.003,.003,.117,6]}/><meshStandardMaterial map={paint} roughness={.66}/></mesh>
    <mesh position={[0,-.059,0]} rotation={[Math.PI,0,0]} userData={caster}><coneGeometry args={[.003,.011,12]}/><meshStandardMaterial color="#cfb18a" roughness={.9}/></mesh>
    <mesh position={[0,-.066,0]} rotation={[Math.PI,0,0]} userData={caster}><coneGeometry args={[.001,.004,12]}/><meshStandardMaterial color="#343431" roughness={.7}/></mesh>
    <mesh position={[0,.067,0]} userData={caster}><cylinderGeometry args={[.0032,.0032,.008,16]}/>{metal}</mesh>
    <mesh position={[0,.074,0]} userData={caster}><cylinderGeometry args={[.003,.003,.007,16]}/><meshStandardMaterial color="#a56c58" roughness={.96}/></mesh>
  </group>;
}

function Ruler(){
  const shape=useMemo(()=>bevelBox(.027,.001,.18,.0003),[]);
  return <group position={[-.098,.002,.045]} rotation={[0,-.18,0]}>
    <mesh geometry={shape} userData={caster}>{metal}</mesh>
    <mesh rotation={[-Math.PI/2,0,Math.PI/2]} position={[0,.0006,0]}><planeGeometry args={[.174,.024]}/><meshStandardMaterial map={rulerMap()} transparent roughness={.5} metalness={.5} depthWrite={false}/></mesh>
    <mesh position={[0,.001,.079]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.002,.0025,24]}/><meshStandardMaterial color="#29332e"/></mesh>
  </group>;
}

function Clock(){
  const g=useMemo(()=>bevelBox(.104,.051,.036,.003),[]);
  return <group position={[-.102,.027,-.141]} rotation={[0,.20,0]}>
    <mesh geometry={g} userData={caster}><meshStandardMaterial color="#464a40" roughness={.55} metalness={.26}/></mesh>
    <mesh position={[0,.001,.019]}><planeGeometry args={[.091,.041]}/><meshStandardMaterial map={clockMap()} roughness={.62}/></mesh>
    {[-.039,.039].map(x=><mesh key={x} position={[x,-.024,.005]} userData={caster}><boxGeometry args={[.014,.004,.028]}/>{black}</mesh>)}
  </group>;
}

function PaperScrap({paper}:{paper:T.Texture[]}){
  const g=useMemo(()=>{
    const p:number[]=[],uv:number[]=[],idx:number[]=[],nx=24,ny=96;
    // An actual curled sheet with open ends, rather than a faceted solid ball.
    for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
      const u=i/nx-.5,v=j/ny,a=v*Math.PI*1.72,r=.017+.006*v;
      p.push(u*.047,.023+r*Math.cos(a)+.0014*Math.sin(u*11)*Math.sin(a),r*Math.sin(a));uv.push(i/nx,v);
    }
    for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+nx+1;idx.push(a,b,a+1,a+1,b,b+1);}
    const shape=new T.BufferGeometry();shape.setAttribute('position',new T.Float32BufferAttribute(p,3));shape.setAttribute('uv',new T.Float32BufferAttribute(uv,2));shape.setIndex(idx);shape.computeVertexNormals();return shape;
  },[]);
  return <mesh geometry={g} position={[.107,0,-.112]} rotation={[0,.6,0]} userData={caster}><meshStandardMaterial map={paper[0]} normalMap={paper[1]} normalScale={[.12,.12]} roughness={.94} side={T.DoubleSide} color="#dfd7c4"/></mesh>;
}

function Scissors(){
  return <group position={[.155,.006,.006]} rotation={[0,-.35,0]}>
    {[-1,1].map(s=><group key={s} rotation={[0,s*.11,0]}>
      <mesh position={[s*.004,0,-.028]} rotation={[-Math.PI/2,0,s*.025]} userData={caster}><boxGeometry args={[.007,.068,.0013]}/>{metal}</mesh>
      <mesh position={[s*.009,0,.024]} rotation={[-Math.PI/2,0,0]} userData={caster}><torusGeometry args={[.009,.0028,8,36]}/><meshStandardMaterial color="#414f46" roughness={.48}/></mesh>
    </group>)}
    <mesh rotation={[Math.PI/2,0,0]} userData={caster}><cylinderGeometry args={[.0025,.0025,.003,16]}/>{metal}</mesh>
  </group>;
}

export function WorkSet({surfaces,large}:{surfaces:ReturnType<typeof useSurfaces>,large:boolean}){
  const wood=useMemo(()=>surfaces.wood.map(t=>{const q=t.clone();q.repeat.set(1.5,1.1);q.needsUpdate=true;return q;}),[surfaces.wood[0]]);
  const rib=useMemo(()=>bevelBox(.022,.56,.018,.003),[]);
  return <>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.0002,0]}><planeGeometry args={[1.2,.88]}/><meshStandardMaterial map={wood[0]} normalMap={wood[1]} normalScale={[.38,.38]} roughnessMap={wood[2]} roughness={.88} color="#b7a58c"/></mesh>
    <mesh position={[0,-.026,0]}><boxGeometry args={[1.2,.05,.88]}/><meshStandardMaterial color="#4b3926" roughness={.85}/></mesh>
    <mesh position={[0,.23,-.30]}><boxGeometry args={[1.5,.66,.025]}/><meshStandardMaterial color="#342b22" roughness={.9}/></mesh>
    {Array.from({length:43},(_,i)=><mesh key={i} geometry={rib} position={[(i-21)*.029,.265,-.278]}><meshStandardMaterial map={surfaces.wood[0]} normalMap={surfaces.wood[1]} normalScale={[.25,.25]} color={i%3===0?'#64503b':'#715a41'} roughness={.82}/></mesh>)}
    <group position={[-.012,.0004,.025]} rotation={[0,-.13,0]}>
      <mesh rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.18,.24]}/><meshStandardMaterial map={blueprint()} roughness={.95} normalMap={surfaces.paper[1]} normalScale={[.12,.12]} side={T.DoubleSide}/></mesh>
      <mesh position={[0,-.0003,0]}><boxGeometry args={[.18,.0004,.24]}/><meshStandardMaterial color="#d3cbb6" roughness={1}/></mesh>
    </group>
    <Cup paper={surfaces.paper} large={large}/><Pencil/><Ruler/><Clock/><PaperScrap paper={surfaces.paper}/><Scissors/>
    <mesh position={[-.17,.003,.15]} rotation={[0,.3,0]} userData={caster}><boxGeometry args={[.045,.005,.025]}/><meshStandardMaterial color="#b8b49e" roughness={.98}/></mesh>
    <mesh position={[.17,.019,-.19]} userData={caster}><cylinderGeometry args={[.018,.018,.036,32]}/><meshStandardMaterial color="#736047" roughness={.55}/></mesh>
  </>;
}

function Rod({from,to,r=.003}:{from:T.Vector3,to:T.Vector3,r?:number}){
  const mid=from.clone().add(to).multiplyScalar(.5),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),to.clone().sub(from).normalize());
  return <mesh position={mid} quaternion={q}><cylinderGeometry args={[r,r,from.distanceTo(to),12]}/>{black}</mesh>;
}

export function Equipment({large,visible=true}:{large:boolean,visible?:boolean}){
  const size=large?[.28,.38]:[.04,.04],quat=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().lookAt(LIGHT_POS,LIGHT_TARGET,new T.Vector3(0,1,0)));
  const cameraBody=useMemo(()=>bevelBox(.065,.045,.035,.004),[]);
  return <group visible={visible}>
    <group position={LIGHT_POS} quaternion={quat}>
      <mesh position={[0,0,.008]}><boxGeometry args={[size[0]+.012,size[1]+.012,.016]}/>{black}</mesh>
      <mesh position={[0,0,-.001]} rotation={[0,Math.PI,0]}><planeGeometry args={[size[0],size[1]]}/><meshBasicMaterial color="#fff1d8" toneMapped={false}/></mesh>
      <mesh position={[0,0,.036]}><boxGeometry args={[.05,.06,.05]}/>{black}</mesh>
    </group>
    <Rod from={new T.Vector3(-.26,-.11,.26)} to={LIGHT_POS.clone().add(new T.Vector3(0,-.04,0))}/>
    {[0,2.094,4.189].map(a=><Rod key={a} from={new T.Vector3(-.26,-.1,.26)} to={new T.Vector3(-.26+Math.sin(a)*.10,-.13,.26+Math.cos(a)*.10)} r={.002}/>)}
    <group position={[.19,.10,-.09]} rotation={[0,-.5,-.13]}>
      <mesh><boxGeometry args={[.004,.18,.12]}/><meshStandardMaterial color="#e0decc" roughness={.95}/></mesh>
      <Rod from={new T.Vector3(0,-.12,0)} to={new T.Vector3(0,-.22,0)} r={.003}/>
    </group>
    <group position={[0,.14,.36]}>
      <mesh geometry={cameraBody}>{black}</mesh>
      <mesh position={[.025,0,-.008]}><cylinderGeometry args={[.012,.012,.038,16]}/>{black}</mesh>
      <mesh position={[0,.026,.004]}><boxGeometry args={[.024,.01,.016]}/>{black}</mesh>
      <mesh position={[.019,.025,0]}><cylinderGeometry args={[.007,.007,.006,24]}/>{black}</mesh>
      <mesh position={[-.012,0,.0181]}><planeGeometry args={[.035,.026]}/><meshStandardMaterial color="#344344" roughness={.22}/></mesh>
      {[-.012,0,.012].map(z=><mesh key={z} position={[0,0,-.038+z]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.0225,.0225,.002,48]}/><meshStandardMaterial color="#333b38" roughness={.6} metalness={.3}/></mesh>)}
      <mesh position={[0,0,-.038]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.022,.022,.05,32]}/>{black}</mesh>
      <mesh position={[0,0,-.064]}><circleGeometry args={[.018,32]}/><meshPhysicalMaterial color="#162b2d" roughness={.07} metalness={.5} clearcoat={1}/></mesh>
      <Rod from={new T.Vector3(0,-.025,0)} to={new T.Vector3(0,-.21,0)} r={.004}/>
      {[0,2.094,4.189].map(a=><Rod key={a} from={new T.Vector3(0,-.12,0)} to={new T.Vector3(Math.sin(a)*.10,-.25,Math.cos(a)*.10)} r={.003}/>)}
    </group>
  </group>;
}
