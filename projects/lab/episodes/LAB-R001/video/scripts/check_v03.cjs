const fs=require('fs'),ts=require('typescript'),Module=require('module'),T=require('three');
const filename=process.cwd()+'/src/v03/geometry.ts';
const m=new Module(filename,module);m.filename=filename;m.paths=module.paths;m._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);
const {cupShell,cupFlap,rimPoint,CUP_SCALE}=m.exports;
const bake=JSON.parse(fs.readFileSync('assets/v03-cup-occlusion.json','utf8'));
for(const [name,x] of Object.entries(bake.meshes)){const bytes=Buffer.from(x.data,'base64');if(bytes.length!==x.vertices*3)throw new Error('Invalid lighting attribute length '+name);}
if(bake.geometrySHA256!==require('crypto').createHash('sha256').update(fs.readFileSync(filename)).digest('hex'))throw new Error('Stale occlusion bake');
const results=[];
for(const [name,g] of [['shell',cupShell()],['front',cupFlap(false)],['back',cupFlap(true)]]){
 const p=g.getAttribute('position'),idx=g.index;let min=Infinity,zero=0,nonfinite=0;
 for(const x of p.array)if(!Number.isFinite(x))nonfinite++;
 const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
 for(let i=0;i<idx.count;i+=3){a.fromBufferAttribute(p,idx.getX(i));b.fromBufferAttribute(p,idx.getX(i+1));c.fromBufferAttribute(p,idx.getX(i+2));const area=b.sub(a).cross(c.sub(a)).length()/2;min=Math.min(min,area);if(area<1e-12)zero++;}
 const edges=new Map();for(let i=0;i<idx.count;i+=3){const ids=[idx.getX(i),idx.getX(i+1),idx.getX(i+2)];for(let k=0;k<3;k++){const a=ids[k],b=ids[(k+1)%3],key=[Math.min(a,b),Math.max(a,b)].join('/');edges.set(key,(edges.get(key)||0)+1);}}
 const boundaryEdges=[...edges.values()].filter(n=>n!==2).length;if(name!=='shell'&&boundaryEdges!==0)throw new Error('Open paper solid '+name);
 results.push({name,vertices:p.count,triangles:idx.count/3,minimumTriangleArea:min,degenerateTriangles:zero,nonfinite,boundaryEdges});
 if(zero||nonfinite)throw new Error('Invalid mesh '+name);
}
let seam=0;const wall=cupShell().getAttribute('position');
for(const back of [false,true]){
 const flap=cupFlap(back).getAttribute('position');
 for(let i=0;i<=80;i++){
  const id=i===0?0:i===80?1:i+1,point=new T.Vector3().fromBufferAttribute(flap,id);let closest=Infinity;
  for(let k=0;k<wall.count;k++){const dx=wall.getX(k)-point.x,dy=wall.getY(k)-point.y,dz=wall.getZ(k)-point.z;closest=Math.min(closest,dx*dx+dy*dy+dz*dz);}
  seam=Math.max(seam,Math.sqrt(closest)*CUP_SCALE);
 }
}
if(seam>1e-7)throw new Error('Flap seam is not attached');
const report={meshes:results,maxFlapWallSeamMetres:seam,paperThicknessMetres:.006*CUP_SCALE};
fs.writeFileSync('out/v03-geometry.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
