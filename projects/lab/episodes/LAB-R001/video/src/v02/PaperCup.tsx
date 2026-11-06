import React, {useMemo} from 'react';
import * as THREE from 'three';

const assets = new Map<string,THREE.CanvasTexture>();
export const paperAsset = (type:'bump'|'label'|'contact') => {
  const cached=assets.get(type);if(cached)return cached;
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=type==='label'?512:1024;
  const c=canvas.getContext('2d')!;
  if(type==='bump'){
    const image=c.createImageData(1024,1024);let seed=314159;
    for(let y=0;y<1024;y++)for(let x=0;x<1024;x++){
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;
      const fiber=Math.sin(x*.8+y*.033)*5;
      const value=126+(seed/4294967296-.5)*63+fiber;
      const i=(y*1024+x)*4;image.data[i]=value;image.data[i+1]=value;image.data[i+2]=value;image.data[i+3]=255;
    }c.putImageData(image,0,0);
  }
  if(type==='label'){
    c.textAlign='center';c.fillStyle='#35372f';c.font='500 176px Arial';c.fillText('FOLD',512,257);
    c.font='29px Arial';c.fillText('P A P E R   O B J E C T   /   0 2',512,344);
    c.fillRect(430,388,164,2);
  }
  if(type==='contact'){
    const gradient=c.createRadialGradient(512,512,120,512,512,500);
    gradient.addColorStop(0,'rgba(8,10,13,.55)');gradient.addColorStop(.45,'rgba(8,10,13,.22)');gradient.addColorStop(1,'rgba(8,10,13,0)');
    c.fillStyle=gradient;c.fillRect(0,0,1024,1024);
  }
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=type==='bump'?THREE.NoColorSpace:THREE.SRGBColorSpace;tex.anisotropy=8;assets.set(type,tex);return tex;
};

const shellGeometry=(inner:boolean)=>{
  const n=128,rows=40,vertices:number[]=[],uv:number[]=[],indices:number[]=[];
  for(let j=0;j<=rows;j++)for(let i=0;i<=n;i++){
    const v=j/rows,a=i/n*Math.PI*2;
    const r=.62+.28*v-(inner?.014:0);
    const y=.02+2.55*v-.16*Math.cos(2*a)*Math.pow(v,12);
    vertices.push(Math.sin(a)*r,y,Math.cos(a)*r);uv.push(i/n,v);
  }
  for(let j=0;j<rows;j++)for(let i=0;i<n;i++){const a=j*(n+1)+i,b=a+n+1;indices.push(a,a+1,b,a+1,b+1,b);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
};

const flapGeometry=()=>{
  const nx=72,ny=18,vertices:number[]=[],uv:number[]=[],indices:number[]=[];
  for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
    const u=(-1+2*i/nx)*.998,v=j/ny;
    const edgeZ=.9*Math.sqrt(Math.max(0,1-u*u));
    const edgeY=2.57-.16*(1-2*u*u);
    vertices.push(.9*u,edgeY+.13*Math.sin(v*Math.PI)-.07*v,edgeZ*(1-.76*v));uv.push(i/nx,v);
  }
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+nx+1;indices.push(a,b,a+1,b,b+1,a+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
};

export const PaperCup:React.FC<{draft:boolean}>=({draft})=>{
  const outer=useMemo(()=>shellGeometry(false),[]),inner=useMemo(()=>shellGeometry(true),[]),flap=useMemo(flapGeometry,[]);
  const rim=useMemo(()=>{
    const pts=Array.from({length:129},(_,i)=>{const a=i/128*Math.PI*2;return new THREE.Vector3(Math.sin(a)*.9,2.57-.16*Math.cos(2*a),Math.cos(a)*.9);});
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,true),160,.0055,5,true);
  },[]);
  const lines=useMemo(()=>{
    const points:number[]=[];
    for(let j=1;j<=10;j++)for(let i=0;i<72;i++){
      const v=j/10;for(const k of [i,i+1]){const a=k/72*Math.PI*2,r=.622+.28*v;points.push(Math.sin(a)*r,.02+v*2.55-.16*Math.cos(2*a)*Math.pow(v,12),Math.cos(a)*r);}
    }
    for(let i=0;i<16;i++)for(let j=0;j<20;j++)for(const k of [j,j+1]){
      const a=i/16*Math.PI*2,v=k/20,r=.622+.28*v;points.push(Math.sin(a)*r,.02+v*2.55-.16*Math.cos(2*a)*Math.pow(v,12),Math.cos(a)*r);
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));return g;
  },[]);
  const material = <meshPhysicalMaterial color="#efe8d9" roughness={.86} metalness={0} bumpMap={paperAsset('bump')} bumpScale={.0026} side={THREE.DoubleSide}/>;
  return <group position={[0,.085,0]}>
    <mesh geometry={outer} castShadow receiveShadow>{draft?<meshBasicMaterial color="#6f7f88" side={THREE.DoubleSide}/>:material}</mesh>
    <mesh geometry={inner} receiveShadow>{draft?<meshBasicMaterial color="#53636e" side={THREE.DoubleSide}/>:<meshStandardMaterial color="#d9d0bd" roughness={.96} bumpMap={paperAsset('bump')} bumpScale={.002} side={THREE.DoubleSide}/>}</mesh>
    <mesh geometry={flap} castShadow receiveShadow>{draft?<meshBasicMaterial color="#84919a" side={THREE.DoubleSide}/>:material}</mesh>
    <mesh geometry={flap} rotation={[0,Math.PI,0]} position={[0,.008,0]} castShadow receiveShadow>{draft?<meshBasicMaterial color="#84919a" side={THREE.DoubleSide}/>:material}</mesh>
    <mesh geometry={rim}>{draft?<meshBasicMaterial color="#a6bdcb"/>:<meshStandardMaterial color="#f8f0e1" roughness={.83}/>}</mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,.025,0]} receiveShadow><circleGeometry args={[.618,64]}/><meshStandardMaterial color="#d9d0bd" roughness={1}/></mesh>
    {!draft&&<mesh position={[0,.55,0]}>
      <cylinderGeometry args={[.712,.646,.6,96,1,true,-.72,1.44]}/>
      <meshStandardMaterial map={paperAsset('label')} transparent roughness={.94} polygonOffset polygonOffsetFactor={-1}/>
    </mesh>}
    {draft&&<lineSegments geometry={lines}><lineBasicMaterial color="#cbe5f1" transparent opacity={.55}/></lineSegments>}
  </group>;
};
