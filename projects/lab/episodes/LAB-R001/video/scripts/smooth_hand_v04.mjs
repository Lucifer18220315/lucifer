// One Loop subdivision of the MIT hand. Keep every joint/bind matrix unchanged.
import fs from 'node:fs';
const file='public/v04-assets/right-hand.glb',src=fs.readFileSync(file),jsonLength=src.readUInt32LE(12),gltf=JSON.parse(src.subarray(20,20+jsonLength).toString()),binStart=20+jsonLength+8,bin=src.subarray(binStart);
const read=i=>{const a=gltf.accessors[i],v=gltf.bufferViews[a.bufferView],n={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[a.type],type={5126:Float32Array,5125:Uint32Array,5123:Uint16Array,5121:Uint8Array}[a.componentType],stride=v.byteStride??n*type.BYTES_PER_ELEMENT,out=[];for(let k=0;k<a.count;k++){const b=bin.subarray((v.byteOffset??0)+(a.byteOffset??0)+k*stride);out.push(Array.from(new type(b.buffer,b.byteOffset,n)));}return out;};
const primitive=gltf.meshes[0].primitives[0],pos=read(primitive.attributes.POSITION),uv=read(primitive.attributes.TEXCOORD_0),joints=read(primitive.attributes.JOINTS_0),weights=read(primitive.attributes.WEIGHTS_0),faces=read(primitive.indices).flat();
const records=[],lookup=new Map(),remap=[];
for(let i=0;i<pos.length;i++){
 const key=pos[i].map(v=>v.toFixed(7)).join('/');let index=lookup.get(key);
 if(index===undefined){index=records.length;lookup.set(key,index);records.push({p:pos[i],uv:uv[i],w:joints[i].reduce((m,j,k)=>{if(weights[i][k]>0)m.set(j,(m.get(j)??0)+weights[i][k]);return m;},new Map()),neighbors:new Set(),boundary:new Set()});}remap.push(index);
}
const edges=new Map(),triangles=[];
for(let i=0;i<faces.length;i+=3){const ids=faces.slice(i,i+3).map(i=>remap[i]);if(new Set(ids).size<3)continue;triangles.push(ids);for(let k=0;k<3;k++){const a=ids[k],b=ids[(k+1)%3],o=ids[(k+2)%3],key=[Math.min(a,b),Math.max(a,b)].join('/');let edge=edges.get(key);if(!edge){edge={a,b,opp:[]};edges.set(key,edge);}edge.opp.push(o);records[a].neighbors.add(b);records[b].neighbors.add(a);}}
for(const e of edges.values())if(e.opp.length===1){records[e.a].boundary.add(e.b);records[e.b].boundary.add(e.a);}
const blend=list=>{const p=[0,0,0],uv=[0,0],w=new Map();for(const[index,f]of list){const r=records[index];r.p.forEach((v,k)=>p[k]+=v*f);r.uv.forEach((v,k)=>uv[k]+=v*f);for(const[j,v]of r.w)w.set(j,(w.get(j)??0)+v*f);}return{p,uv,w};};
const output=records.map((r,i)=>{
 const boundary=[...r.boundary];if(boundary.length===2)return blend([[i,.75],...boundary.map(j=>[j,.125])]);
 const n=r.neighbors.size,beta=n===3?3/16:3/(8*n);return blend([[i,1-n*beta],...[...r.neighbors].map(j=>[j,beta])]);
});
for(const e of edges.values()){e.index=output.length;output.push(e.opp.length===2?blend([[e.a,.375],[e.b,.375],[e.opp[0],.125],[e.opp[1],.125]]):blend([[e.a,.5],[e.b,.5]]));}
const edge=(a,b)=>edges.get([Math.min(a,b),Math.max(a,b)].join('/')).index,newIndices=[];
for(const[a,b,c]of triangles){const ab=edge(a,b),bc=edge(b,c),ca=edge(c,a);newIndices.push(a,ab,ca,b,bc,ab,c,ca,bc,ab,bc,ca);}
const positions=new Float32Array(output.flatMap(r=>r.p)),normals=new Float32Array(positions.length),texcoords=new Float32Array(output.flatMap(r=>r.uv)),skinIndex=new Uint16Array(output.length*4),skinWeight=new Float32Array(output.length*4);
output.forEach((r,i)=>{const sorted=[...r.w].sort((a,b)=>b[1]-a[1]).slice(0,4),sum=sorted.reduce((s,e)=>s+e[1],0);sorted.forEach(([j,w],k)=>{skinIndex[4*i+k]=j;skinWeight[4*i+k]=w/sum;});});
for(let k=0;k<newIndices.length;k+=3){const[a,b,c]=newIndices.slice(k,k+3),u=output[b].p.map((v,i)=>v-output[a].p[i]),v=output[c].p.map((v,i)=>v-output[a].p[i]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];for(const j of[a,b,c])n.forEach((x,i)=>normals[3*j+i]+=x);}
for(let i=0;i<normals.length;i+=3){const l=Math.hypot(normals[i],normals[i+1],normals[i+2]);for(let j=0;j<3;j++)normals[i+j]/=l||1;}
const chunks=[Buffer.from(bin)];let length=bin.length;
function append(array,type,componentType){
 const pad=(4-length%4)%4;if(pad){chunks.push(Buffer.alloc(pad));length+=pad;}
 const bytes=Buffer.from(array.buffer,array.byteOffset,array.byteLength),view=gltf.bufferViews.length;gltf.bufferViews.push({buffer:0,byteOffset:length,byteLength:bytes.length});chunks.push(bytes);length+=bytes.length;
 const n={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[type],accessor={bufferView:view,componentType,count:array.length/n,type};if(array===positions){accessor.min=[0,1,2].map(k=>Math.min(...output.map(r=>r.p[k])));accessor.max=[0,1,2].map(k=>Math.max(...output.map(r=>r.p[k])));}const id=gltf.accessors.length;gltf.accessors.push(accessor);return id;
}
primitive.attributes={POSITION:append(positions,'VEC3',5126),NORMAL:append(normals,'VEC3',5126),TEXCOORD_0:append(texcoords,'VEC2',5126),JOINTS_0:append(skinIndex,'VEC4',5123),WEIGHTS_0:append(skinWeight,'VEC4',5126)};primitive.indices=append(new Uint32Array(newIndices),'SCALAR',5125);
gltf.buffers[0].byteLength=length;gltf.asset.generator+=' / skin-preserving Loop subdivision';let json=Buffer.from(JSON.stringify(gltf)),padding=(4-json.length%4)%4;json=Buffer.concat([json,Buffer.alloc(padding,32)]);let binary=Buffer.concat(chunks);padding=(4-binary.length%4)%4;binary=Buffer.concat([binary,Buffer.alloc(padding)]);
const header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(20+json.length+8+binary.length,8);header.writeUInt32LE(json.length,12);header.writeUInt32LE(0x4e4f534a,16);const bh=Buffer.alloc(8);bh.writeUInt32LE(binary.length,0);bh.writeUInt32LE(0x004e4942,4);fs.writeFileSync('public/v04-assets/right-hand-smooth.glb',Buffer.concat([header,json,bh,binary]));console.log('Smoothed hand:',output.length,'vertices',newIndices.length/3,'triangles; joints/bind matrices preserved.');
