import React,{useLayoutEffect,useMemo,useRef} from 'react';
import {useLoader,useThree} from '@react-three/fiber';
import {staticFile} from 'remotion';
import * as T from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import {skinBump} from './textures';

type Pose='cup'|'pencil'|'pinch'|'paper'|'sweep';
type ContactTargets=Partial<Record<'thumb'|'index-finger'|'middle-finger'|'ring-finger'|'pinky-finger',[number,number,number]>>;
const fingers=['thumb','index-finger','middle-finger','ring-finger','pinky-finger'];
const stages=['metacarpal','phalanx-proximal','phalanx-intermediate','phalanx-distal','tip'];

export function Hand({position,rotation=[0,0,0],pose='cup',grip=1,scale=1,target,targetNormal,contacts,forearm=false,opposedThumb=false,debug=false}:{position:[number,number,number],rotation?:[number,number,number],pose?:Pose,grip?:number,scale?:number,target?:[number,number,number],targetNormal?:[number,number,number],contacts?:ContactTargets,forearm?:boolean,opposedThumb?:boolean,debug?:boolean}){
  const {camera}=useThree();
  const gltf=useLoader(GLTFLoader,staticFile('v04-assets/right-hand-smooth.glb')),root=useRef<T.Group>(null);
  const rig=useMemo(()=>{
    const scene=clone(gltf.scene);scene.updateMatrixWorld(true);
    const wrist=scene.getObjectByName('wrist') as T.Bone;
    for(const finger of fingers){let parent:T.Object3D=wrist;for(const stage of stages){const bone=scene.getObjectByName(finger+'-'+stage);if(bone){parent.attach(bone);parent=bone;}}}
    const rest=new Map<T.Bone,T.Quaternion>();scene.traverse(o=>{if(o instanceof T.Bone)rest.set(o,o.quaternion.clone());if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;o.material=new T.MeshPhysicalMaterial({color:'#cc9a80',roughness:.64,metalness:0,bumpMap:skinBump(),bumpScale:.00007,sheen:.12,sheenColor:new T.Color('#e7a485')});}});
    for(const finger of fingers){const bone=scene.getObjectByName(finger+'-phalanx-distal');if(bone){const nail=new T.Mesh(new T.SphereGeometry(1,20,12),new T.MeshPhysicalMaterial({color:'#d4ac95',roughness:.38,clearcoat:.4}));nail.scale.set(.0033,.0005,.0045);nail.position.set(0,-.0048,-.004);bone.add(nail);}}
    const wristPosition=wrist.position.clone();return{scene,wristPosition,rest};
  },[gltf.scene]);
  useLayoutEffect(()=>{
    for(const [bone,q] of rig.rest){bone.quaternion.copy(q);let a=0;
      if(bone.name.includes('phalanx-proximal'))a=pose==='paper'?-.55:pose==='sweep'?.14:pose==='cup'?.50:pose==='pencil'?.72:.68;
      if(bone.name.includes('phalanx-intermediate'))a=pose==='paper'?-.85:pose==='sweep'?.12:pose==='cup'?.80:pose==='pencil'?1.05:1.12;
      if(bone.name.includes('phalanx-distal'))a=pose==='paper'?-.30:pose==='sweep'?.08:pose==='cup'?.35:.48;
      if(pose==='pencil'&&['middle-finger','ring-finger','pinky-finger'].some(f=>bone.name.startsWith(f)))a=bone.name.includes('proximal')?1.25:bone.name.includes('intermediate')?1.5:bone.name.includes('distal')?1.05:0;
      if(bone.name.startsWith('thumb-'))a*=.5;
      bone.quaternion.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),a*grip));
    }
    rig.scene.updateMatrixWorld(true);root.current?.updateWorldMatrix(true,true);
    if((pose==='pencil'||pose==='pinch')&&target&&root.current){
      const rootHand=root.current,thumbBone=rig.scene.getObjectByName('thumb-tip')!,indexBone=rig.scene.getObjectByName('index-finger-tip')!;
      const thumb=rootHand.worldToLocal(thumbBone.getWorldPosition(new T.Vector3())),index=rootHand.worldToLocal(indexBone.getWorldPosition(new T.Vector3())),middle=thumb.clone().add(index).multiplyScalar(.5);
      const axis=new T.Vector3(...(pose==='pencil'?[.85,-.40,.10]:[-.85,-.40,.05]) as [number,number,number]).normalize(),q=new T.Quaternion().setFromUnitVectors(middle.clone().normalize(),axis);
      const separation=thumb.clone().sub(index).applyQuaternion(q);separation.addScaledVector(axis,-separation.dot(axis)).normalize();
      const desired=new T.Vector3(0,0,1);desired.addScaledVector(axis,-desired.dot(axis)).normalize();
      const twist=Math.atan2(axis.dot(separation.clone().cross(desired)),separation.dot(desired));
      rootHand.quaternion.copy(new T.Quaternion().setFromAxisAngle(axis,twist).multiply(q));rootHand.updateWorldMatrix(true,true);
      const center=thumbBone.getWorldPosition(new T.Vector3()).add(indexBone.getWorldPosition(new T.Vector3())).multiplyScalar(.5);
      rootHand.position.add(new T.Vector3(...target).sub(center));rootHand.updateWorldMatrix(true,true);
    }

    const targets:ContactTargets={...contacts};if(target){const point=new T.Vector3(...target),axis=targetNormal?new T.Vector3(...targetNormal).multiplyScalar(pose==='pencil'||pose==='pinch'?.0055:.0025):new T.Vector3(-.002,0,0);targets.thumb=point.clone().add(axis).toArray();targets['index-finger']=point.clone().sub(axis).toArray();}
    if(Object.keys(targets).length){
      for(const [finger,contact] of Object.entries(targets)){
        const aim=new T.Vector3(...contact);
        const jointNames=['phalanx-distal','phalanx-intermediate','phalanx-proximal'];if(finger==='thumb'&&opposedThumb)jointNames.push('metacarpal');
        const tip=rig.scene.getObjectByName(finger+'-tip')!,chain=jointNames.map(s=>rig.scene.getObjectByName(finger+'-'+s)).filter(Boolean) as T.Bone[];
        for(let k=0;k<26;k++)for(const joint of chain){
          const jp=joint.getWorldPosition(new T.Vector3()),tp=tip.getWorldPosition(new T.Vector3()),a=tp.sub(jp).normalize(),b=aim.clone().sub(jp).normalize();
          const delta=new T.Quaternion().setFromUnitVectors(a,b),angle=2*Math.acos(Math.min(1,Math.abs(delta.w)));if(angle>.20)delta.slerp(new T.Quaternion(),1-.20/angle);
          const parent=joint.parent!.getWorldQuaternion(new T.Quaternion());
          const local=parent.clone().invert().multiply(delta).multiply(parent);joint.quaternion.premultiply(local);const rest=rig.rest.get(joint)!;const bend=rest.angleTo(joint.quaternion),limit=joint.name.includes('distal')?1.25:joint.name.includes('intermediate')?1.65:1.45;if(bend>limit)joint.quaternion.copy(rest.clone().slerp(joint.quaternion,limit/bend));joint.updateWorldMatrix(false,true);
        }
      }
      if(debug)queueMicrotask(()=>console.log('V05_CONTACT',JSON.stringify(Object.entries(targets).map(([finger,contact])=>{const p=rig.scene.getObjectByName(finger+'-tip')!.getWorldPosition(new T.Vector3()),projected=p.clone().project(camera);return{finger,target:contact,actual:p.toArray(),errorMm:p.distanceTo(new T.Vector3(...contact))*1000,ndc:projected.toArray()};}))));
    }
  },[rig,pose,grip,target?.[0],target?.[1],target?.[2],targetNormal?.[0],targetNormal?.[1],targetNormal?.[2],contacts,opposedThumb,debug,camera,position[0],position[1],position[2],rotation[0],rotation[1],rotation[2]]);
  return <group ref={root} position={position} rotation={rotation} scale={scale}>
    <primitive object={rig.scene} position={rig.wristPosition.clone().negate()}/>
    {forearm&&<group position={[0,.063,0]}>
      <mesh castShadow><cylinderGeometry args={[.026,.014,.13,32]}/><meshStandardMaterial color="#bc8b6b" roughness={.7} bumpMap={skinBump()} bumpScale={.00003}/></mesh>
      <mesh position={[0,.11,0]} castShadow><cylinderGeometry args={[.034,.026,.105,32]}/><meshStandardMaterial color="#242b29" roughness={.93}/></mesh>
    </group>}
  </group>;
}
