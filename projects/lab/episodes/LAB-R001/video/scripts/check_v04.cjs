// Check the failure-prone geometry and imported skinning data, not screenshots.
const fs=require('fs'),ts=require('typescript'),T=require('three'),crypto=require('crypto');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {flap,curledPage,crumpledPaper}=require(process.cwd()+'/src/v04/geometry.ts');
const meshes=[];
for(const [name,g,closed] of [
 ...[0,.5,1].flatMap(f=>[false,true].map(b=>[`flap-${b}-${f}`,flap(b,f),true])),
 ...[0,Math.PI/2,Math.PI].map(a=>[`page-${a}`,curledPage(.14,.19,a),false]),
 ...[1,2,3].map(s=>[`crumple-${s}`,crumpledPaper(s),false])]){
 const p=g.getAttribute('position'),ix=g.index,edges=new Map();let degenerate=0;
 if([...p.array].some(x=>!Number.isFinite(x)))throw Error('Non-finite '+name);
 for(let i=0;i<ix.count;i+=3){
  const ids=[ix.getX(i),ix.getX(i+1),ix.getX(i+2)];
  if(ids.some(k=>k<0||k>=p.count))throw Error('Index '+name);
  const [a,b,c]=ids.map(k=>new T.Vector3().fromBufferAttribute(p,k));
  if(b.sub(a).cross(c.sub(a)).length()<1e-12)degenerate++;
  for(let k=0;k<3;k++){const key=[ids[k],ids[(k+1)%3]].sort((a,b)=>a-b).join('/');edges.set(key,(edges.get(key)||0)+1);}
 }
 const boundary=[...edges.values()].filter(n=>n!==2).length;
 if(degenerate||closed&&boundary)throw Error(`Invalid ${name}: ${degenerate} zero triangles, ${boundary} open edges`);
 meshes.push({name,vertices:p.count,triangles:ix.count/3,degenerate,boundaryEdges:boundary});
}
const bytes=fs.readFileSync('public/v04-assets/right-hand-smooth.glb'),jsonLength=bytes.readUInt32LE(12),gltf=JSON.parse(bytes.subarray(20,20+jsonLength).toString()),binary=bytes.subarray(28+jsonLength);
const attr=(id)=>{const a=gltf.accessors[id],v=gltf.bufferViews[a.bufferView],components={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[a.type],size={5121:1,5123:2,5125:4,5126:4}[a.componentType],read={5121:'readUInt8',5123:'readUInt16LE',5125:'readUInt32LE',5126:'readFloatLE'}[a.componentType];return Array.from({length:a.count},(_,i)=>Array.from({length:components},(_,j)=>binary[read]((v.byteOffset||0)+(a.byteOffset||0)+i*(v.byteStride||components*size)+j*size)));};
const primitive=gltf.meshes[0].primitives[0],positions=attr(primitive.attributes.POSITION),weights=attr(primitive.attributes.WEIGHTS_0),joints=attr(primitive.attributes.JOINTS_0),indices=attr(primitive.indices).flat();
let maxWeightError=0;
for(let i=0;i<positions.length;i++){
 if(positions[i].some(x=>!Number.isFinite(x)))throw Error('Invalid hand position');
 const e=Math.abs(weights[i].reduce((a,b)=>a+b,0)-1);maxWeightError=Math.max(e,maxWeightError);
 if(e>1e-5||weights[i].some(w=>w<0)||joints[i].some(j=>j>=gltf.skins[0].joints.length))throw Error('Invalid hand skin weights '+i);
}
if(indices.some(i=>i>=positions.length))throw Error('Invalid hand triangle');
const report={meshes,hand:{vertices:positions.length,triangles:indices.length/3,joints:gltf.skins[0].joints.length,maxWeightError,sha256:crypto.createHash('sha256').update(bytes).digest('hex')}};
fs.writeFileSync('out/v04-geometry.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({meshes:meshes.length,hand:report.hand},null,2));
