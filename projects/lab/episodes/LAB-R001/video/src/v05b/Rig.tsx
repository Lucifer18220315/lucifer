import React,{useMemo} from 'react';
import * as T from 'three';
import {useLoader} from '@react-three/fiber';
import {staticFile} from 'remotion';
import {bevelBox} from '../v05/geometry';
import {CAMERA_FITS} from '../v05/camera-fits';
import {canvasMap,useSurfaces} from '../v05/materials';
import {skinBump} from '../v05/textures';
function Bar({a,b,r=.003}:{a:T.Vector3,b:T.Vector3,r?:number}){return <mesh position={a.clone().add(b).multiplyScalar(.5)} quaternion={new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize())} castShadow><cylinderGeometry args={[r,r,a.distanceTo(b),20]}/><meshStandardMaterial color="#59616a" roughness={.34} metalness={.86}/></mesh>;}
function Knurl({radius,height,n=72,color='#2a3035'}:{radius:number,height:number,n?:number,color?:string}){
 const teeth=useMemo(()=>{const m=new T.InstancedMesh(new T.BoxGeometry(.0007,height,.0006),new T.MeshStandardMaterial({color,roughness:.67,metalness:.35}),n),o=new T.Object3D();for(let i=0;i<n;i++){const a=i/n*Math.PI*2;o.position.set(radius*Math.cos(a),0,radius*Math.sin(a));o.rotation.set(0,-a,0);o.updateMatrix();m.setMatrixAt(i,o.matrix);}return m;},[radius,height,n,color]);
 return <><mesh><cylinderGeometry args={[radius-.0002,radius-.0002,height,72]}/><meshStandardMaterial color={color} roughness={.62} metalness={.28}/></mesh><primitive object={teeth}/></>;
}
function CameraHardware(){
 const screen=useLoader(T.TextureLoader,staticFile('v05-assets/camera-screen.jpg'));screen.colorSpace=T.SRGBColorSpace;
 const eye=new T.Vector3(...CAMERA_FITS.opening.slice(0,3) as [number,number,number]),aim=new T.Vector3(CAMERA_FITS.opening[3],CAMERA_FITS.opening[4],0),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,-1),aim.sub(eye).normalize());
 const geo=useMemo(()=>({body:bevelBox(.095,.066,.052,.007),grip:bevelBox(.031,.077,.048,.010),display:bevelBox(.061,.043,.006,.002),finder:bevelBox(.031,.014,.032,.003),head:bevelBox(.042,.024,.044,.004)}),[]);
 const metal=new T.MeshStandardMaterial({color:'#292f36',roughness:.43,metalness:.38});
 const rubber=new T.MeshStandardMaterial({color:'#20272c',roughness:.9,bumpMap:skinBump(),bumpScale:.00012});
 const labels=canvasMap('v05b-camera-labels',1024,256,c=>{c.clearRect(0,0,1024,256);c.fillStyle='#c3c8cc';c.font='45px Arial';c.fillText('MENU     AF-ON     DISP',25,72);c.font='32px Arial';c.fillText('ISO   WB      PLAYBOY / C1',25,190);});
 return <>
 <group position={eye} quaternion={q}>
  <mesh geometry={geo.body} position={[0,0,.026]} material={metal} castShadow/><mesh geometry={geo.grip} position={[.037,0,.026]} material={rubber} castShadow/>
  <mesh geometry={geo.finder} position={[-.008,.039,.023]} material={metal} castShadow/>
  {[-.008,.008].map(x=><mesh key={x} position={[x-.008,.048,.024]}><boxGeometry args={[.003,.003,.024]}/><meshStandardMaterial color="#828a90" roughness={.26} metalness={.92}/></mesh>)}
  <group position={[.032,.040,.019]}><Knurl radius={.009} height={.007} n={32}/><mesh position={[0,.004,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.005,24]}/><meshStandardMaterial color="#303840" roughness={.6}/></mesh></group>
  <mesh geometry={geo.display} position={[-.011,-.002,.055]} material={rubber}/><mesh position={[-.011,-.002,.0582]}><planeGeometry args={[.054,.036]}/><meshBasicMaterial map={screen}/></mesh>
  <mesh position={[-.011,.030,.0532]}><planeGeometry args={[.059,.014]}/><meshBasicMaterial transparent map={labels}/></mesh>
  {[[.030,.021],[.042,.022],[.018,-.027],[.040,-.029]].map(([x,y],i)=><mesh key={i} position={[x,y,.054]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.0029,.0031,.002,24]}/><meshStandardMaterial color={i===0?'#993c36':'#46505b'} roughness={.55} metalness={.2}/></mesh>)}
  <group position={[.033,-.006,.055]} rotation={[Math.PI/2,0,0]}><Knurl radius={.008} height={.0028} n={36}/><mesh position={[0,-.0018,0]}><cylinderGeometry args={[.0047,.0047,.001,24]}/><meshStandardMaterial color="#647079" roughness={.6}/></mesh></group>
  {[-.051,.054].map(x=><group key={x}><mesh position={[x,0,.023]} material={metal}><boxGeometry args={[.005,.078,.015]}/></mesh>{[-.031,.031].map(y=><mesh key={y} position={[x,y,.031]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.0026,.0026,.0015,6]}/><meshStandardMaterial color="#8b9196" metalness={.96} roughness={.27}/></mesh>)}</group>)}
  <group rotation={[Math.PI/2,0,0]}>
   <mesh position={[0,-.024,0]} material={metal} castShadow><cylinderGeometry args={[.026,.026,.056,72]}/></mesh>
   {[-.008,-.027,-.046].map((y,i)=><group key={i} position={[0,y,0]}><Knurl radius={i===1?.028:.0274} height={i===1?.012:.005}/></group>)}
   <mesh position={[0,-.054,0]}><cylinderGeometry args={[.026,.026,.002,72]}/><meshStandardMaterial color="#7c858b" metalness={.95} roughness={.2}/></mesh>
   <mesh position={[0,-.0554,0]} rotation={[Math.PI/2,0,0]}><circleGeometry args={[.0235,72]}/><meshPhysicalMaterial color="#274a61" roughness={.05} metalness={.25} clearcoat={1}/></mesh>
  </group>
  <mesh geometry={geo.head} position={[0,-.052,.018]} material={metal} castShadow/>
  <group position={[.030,-.052,.018]} rotation={[0,0,Math.PI/2]}><Knurl radius={.011} height={.012} n={36} color="#a32d28"/></group>
  <Bar a={new T.Vector3(.015,-.060,.036)} b={new T.Vector3(.13,-.025,.14)} r={.003}/>
 </group>
 {[0,1,2].map(i=>{const a=i*Math.PI*2/3,top=eye.clone().add(new T.Vector3(0,-.07,0)),bottom=eye.clone().add(new T.Vector3(Math.cos(a)*.13,-.45,Math.sin(a)*.13)),middle=top.clone().lerp(bottom,.52);return <React.Fragment key={i}><Bar a={top} b={middle} r={.0055}/><Bar a={middle} b={bottom} r={.004}/><mesh position={middle}><sphereGeometry args={[.007,16,12]}/><meshStandardMaterial color="#20262a" roughness={.8}/></mesh></React.Fragment>;})}
 </>;
}
function Panel({position,width,height}:{position:[number,number,number],width:number,height:number}){
 const s=useSurfaces(),p=new T.Vector3(...position),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(0,.055,0).sub(p).normalize());
 return <group position={position} quaternion={q}>
 <mesh geometry={bevelBox(width,height,.018,.003)} castShadow><meshStandardMaterial color="#242b32" roughness={.72} metalness={.3}/></mesh>
 <mesh position={[0,0,.0095]}><planeGeometry args={[width*.89,height*.90]}/><meshBasicMaterial color="#e9e5df" map={s.paper[0]}/></mesh>
 {Array.from({length:12},(_,i)=><mesh key={i} position={[-width*.42+i*width*.076,0,-.011]}><boxGeometry args={[.0016,height*.82,.005]}/><meshStandardMaterial color="#545e68" roughness={.48} metalness={.7}/></mesh>)}
 <mesh position={[width*.5+.005,0,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.006,.006,.009,24]}/><meshStandardMaterial color="#a63829" metalness={.5} roughness={.4}/></mesh>
 </group>;
}
export function StudioRig(){return <>
 <CameraHardware/><Panel position={[-.24,.36,.24]} width={.095} height={.12}/><Panel position={[.15,.18,-.08]} width={.065} height={.13}/>
 <Bar a={new T.Vector3(-.24,-.39,.24)} b={new T.Vector3(-.24,.42,.24)}/><Bar a={new T.Vector3(.15,-.39,-.08)} b={new T.Vector3(.15,.42,-.08)}/><Bar a={new T.Vector3(-.24,.42,.24)} b={new T.Vector3(.15,.42,-.08)} r={.0028}/>
 {[-1,1].map(s=><mesh key={s} position={[s<0?-.24:.15,.41,s<0?.24:-.08]}><boxGeometry args={[.020,.025,.020]}/><meshStandardMaterial color="#242c31" roughness={.65} metalness={.4}/></mesh>)}
 </>;}
