import React,{useMemo} from 'react';
import * as T from 'three';
import {bevelBox} from './geometry';
import {canvasMap} from '../v03/materials';

const digit=(n:number,half:'top'|'bottom'|'reverse')=>{
  const full=canvasMap(`v04-clock-${n}`,512,768,c=>{c.fillStyle='#e6decb';c.fillRect(0,0,512,768);c.fillStyle='#30383b';c.textAlign='center';c.font='700 590px Arial';c.fillText(String(n),256,600);});
  const t=full.clone();t.needsUpdate=true;t.repeat.set(1,half==='reverse'?-.5:.5);t.offset.y=half==='top'||half==='reverse'?.5:0;return t;
};
function Digit({old,next,phase,detailed=false}:{old:number,next:number,phase:number,detailed?:boolean}){
  const top=useMemo(()=>digit(next,'top'),[next]),bottom=useMemo(()=>digit(old,'bottom'),[old]),front=useMemo(()=>digit(old,'top'),[old]),rear=useMemo(()=>digit(next,'reverse'),[next]);
  const a=old===next?0:Math.min(1,phase)*Math.PI;
  return <>
    <mesh position={[0,.0082,0]}><planeGeometry args={[.022,.016]}/><meshStandardMaterial map={top} roughness={.86}/></mesh>
    <mesh position={[0,-.0082,0]}><planeGeometry args={[.022,.016]}/><meshStandardMaterial map={bottom} roughness={.86}/></mesh>
    <group rotation={[a,0,0]} position={[0,0,.00025]}>
      <mesh position={[0,.0082,0]} castShadow><planeGeometry args={[.022,.016]}/><meshStandardMaterial map={front} roughness={.86} side={T.FrontSide}/></mesh>
      <mesh position={[0,.0082,0]} castShadow><planeGeometry args={[.022,.016]}/><meshStandardMaterial map={rear} roughness={.86} side={T.BackSide}/></mesh>
    </group>
    <mesh position={[0,0,.0004]}><boxGeometry args={[.023,detailed?.00015:.00045,.0005]}/><meshStandardMaterial color="#6d6d61" roughness={.8}/></mesh>
    {detailed&&<>{[-.0114,.0114].map(x=><mesh key={x} position={[x,0,.0006]}><boxGeometry args={[.00065,.005,.0008]}/><meshStandardMaterial color="#262d2b" roughness={.66}/></mesh>)}<mesh position={[0,.0162,.0007]}><boxGeometry args={[.0014,.0011,.0007]}/><meshStandardMaterial color="#e6decb" roughness={.85}/></mesh></>}
  </>;
}

export function FlipClock({progress,position=[.105,.024,-.035],rotation=[0,-.08,0]}:{progress?:number,position?:[number,number,number],rotation?:[number,number,number]}){
  const active=progress!==undefined;
  // Read from all 26 native reference frames. The visible range ends at :53;
  // the opening :40 hold and later flip cadence are not a linear :40→:54.
  const minutes=[0,0,0,0,.7,1,2,2,3,3.5,4,5,5.75,6,7,7,8,8.6,9,10,10,11,11,12,12.6,13];
  const sourceFrame=Math.max(0,Math.min(1,progress??0))*25,i=Math.floor(sourceFrame);
  const value=minutes[i]+(minutes[Math.min(25,i+1)]-minutes[i])*(sourceFrame-i),step=Math.floor(value),phase=value-step;
  const body=useMemo(()=>bevelBox(.126,.047,.033,.003),[]);
  const digits=(time:number)=>{const h=Math.floor(time/60),m=time%60;return [Math.floor(h/10),h%10,Math.floor(m/10),m%10];};
  const start=active?12*60+40:11*60+43,old=digits(start+step),next=digits(start+step+1);
  return <group position={position} rotation={rotation}>
    <mesh geometry={body} castShadow receiveShadow><meshStandardMaterial color="#ac9b7d" roughness={.68} metalness={.12}/></mesh>
    <mesh position={[0,0,.0167]}><planeGeometry args={[.115,.036]}/><meshStandardMaterial color="#cfc4ac" roughness={.9}/></mesh>
    {[-.043,-.017,.017,.043].map((x,i)=><group key={i} position={[x,0,.0172]}><Digit old={old[i]} next={active?next[i]:old[i]} phase={phase} detailed={active}/></group>)}
    {[-.005,.005].map(y=><mesh key={y} position={[0,y,.0175]}><circleGeometry args={[.0014,16]}/><meshStandardMaterial color="#313737" roughness={.8}/></mesh>)}
    {[-.045,.045].map(x=><mesh key={x} position={[x,-.024,0]} castShadow><boxGeometry args={[.015,.003,.023]}/><meshStandardMaterial color="#68604d" roughness={.85}/></mesh>)}
    {active&&<>{[0,1,2,3].flatMap(i=>[-.036,.036].map(x=><mesh key={i+'-'+x} position={[x,-.0176-i*.001,.0171]}><boxGeometry args={[.040,.0002,.0005]}/><meshStandardMaterial color="#9c917f" roughness={.8}/></mesh>))}<mesh position={[0,-.0208,.0172]}><planeGeometry args={[.022,.004]}/><meshStandardMaterial transparent map={canvasMap('v04-clock-brand',512,96,c=>{c.fillStyle='#827d70';c.textAlign='center';c.font='700 64px Arial';c.fillText('playboy',256,73);})} roughness={.9}/></mesh></>}
  </group>;
}
