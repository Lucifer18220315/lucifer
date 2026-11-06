// Deterministic geometric self-shadow + ambient-occlusion bake, independent of camera.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import * as T from 'three';
import {MeshBVH,SAH} from 'three-mesh-bvh';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

fs.mkdirSync('out',{recursive:true});
const source=fs.readFileSync('src/v03/geometry.ts','utf8');
fs.writeFileSync('out/geometry-bake.mjs',ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
const {cupShell,cupFlap,CUP_SCALE}=await import(pathToFileURL(path.resolve('out/geometry-bake.mjs')));
const geometries={shell:cupShell(),front:cupFlap(false),back:cupFlap(true)};
const world=Object.values(geometries).map(g=>g.clone().scale(CUP_SCALE,CUP_SCALE,CUP_SCALE).translate(0,-.00046,0));
const merged=mergeGeometries(world,false),bvh=new MeshBVH(merged,{strategy:SAH,targetLeafSize:8});
const pos=new T.Vector3(-.26,.32,.26),target=new T.Vector3(0,.055,0),basis=new T.Matrix4().lookAt(pos,target,new T.Vector3(0,1,0));
const right=new T.Vector3().setFromMatrixColumn(basis,0),up=new T.Vector3().setFromMatrixColumn(basis,1),emitter=target.clone().sub(pos).normalize();
const halton=(i,b)=>{let f=1,r=0;while(i>0){f/=b;r+=f*(i%b);i=Math.floor(i/b);}return r;};
const samples=48,aoSamples=32,aoRange=.025;
const sources=[[.04,.04],[.28,.38]].map(([w,h])=>Array.from({length:samples},(_,i)=>pos.clone().addScaledVector(right,(halton(i+1,2)-.5)*w).addScaledVector(up,(halton(i+1,3)-.5)*h)));
const point=new T.Vector3(),normal=new T.Vector3(),origin=new T.Vector3(),direction=new T.Vector3(),tangent=new T.Vector3(),bitangent=new T.Vector3(),axis=new T.Vector3(),ray=new T.Ray();
const start=performance.now(),output={parameters:{cupScale:CUP_SCALE,cupPosition:[0,-.00046,0],lightPosition:pos.toArray(),lightTarget:target.toArray(),sourceSizes:[[.04,.04],[.28,.38]]},geometrySHA256:createHash('sha256').update(source).digest('hex'),algorithm:'BVH visibility over actual source rectangles + cosine-weighted hemisphere AO',areaSamples:samples,aoSamples,aoRangeMetres:aoRange,originOffsetMetres:.000025,meshes:{}};
for(const [name,g] of Object.entries(geometries)){
 const p=g.getAttribute('position'),norm=g.getAttribute('normal'),bytes=new Uint8Array(p.count*3);let aoSum=0,smallSum=0,largeSum=0;
 for(let i=0;i<p.count;i++){
  point.fromBufferAttribute(p,i).multiplyScalar(CUP_SCALE).add(new T.Vector3(0,-.00046,0));normal.fromBufferAttribute(norm,i).normalize();origin.copy(point).addScaledVector(normal,.000025);
  const visibility=[];
  for(const sampleSet of sources){
   let total=0,lit=0;
   for(const source of sampleSet){
    direction.copy(source).sub(origin);const distance=direction.length();direction.divideScalar(distance);
    const weight=Math.max(0,normal.dot(direction))*Math.max(0,-emitter.dot(direction))/(distance*distance);if(weight===0)continue;
    total+=weight;ray.set(origin,direction);if(!bvh.raycastFirst(ray,T.DoubleSide,.000005,distance-.00001))lit+=weight;
   }
   visibility.push(total>0?lit/total:1);
  }
  axis.set(0,Math.abs(normal.y)<.9?1:0,Math.abs(normal.y)<.9?0:1);tangent.crossVectors(axis,normal).normalize();bitangent.crossVectors(normal,tangent).normalize();let occlusion=0;
  for(let k=0;k<aoSamples;k++){
   const u=halton(k+1,2),a=2*Math.PI*halton(k+1,3),r=Math.sqrt(u);
   direction.copy(tangent).multiplyScalar(r*Math.cos(a)).addScaledVector(bitangent,r*Math.sin(a)).addScaledVector(normal,Math.sqrt(1-u)).normalize();
   ray.set(origin,direction);const hit=bvh.raycastFirst(ray,T.DoubleSide,.000005,aoRange);if(hit)occlusion+=(1-hit.distance/aoRange)**2;
  }
  const ao=1-.85*occlusion/aoSamples;const values=[visibility[0],visibility[1],ao];values.forEach((v,k)=>bytes[3*i+k]=Math.round(v*255));
  smallSum+=visibility[0];largeSum+=visibility[1];aoSum+=ao;
 }
 output.meshes[name]={vertices:p.count,data:Buffer.from(bytes).toString('base64'),meanSmall:smallSum/p.count,meanLarge:largeSum/p.count,meanAmbientVisibility:aoSum/p.count};
 console.log(name,p.count,'vertices',Math.round(performance.now()-start)+'ms');
}
fs.writeFileSync('assets/v03-cup-occlusion.json',JSON.stringify(output)+'\n');
console.log('Saved camera-independent geometric lighting bake.');
