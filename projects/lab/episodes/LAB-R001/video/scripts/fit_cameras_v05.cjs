const fs=require('fs'),ts=require('typescript'),T=require('three');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {cupShell,flap,CUP_SCALE,CUP_BASE_Y}=require(process.cwd()+'/src/v05/geometry.ts');
const {CAMERA_FITS}=require(process.cwd()+'/src/v05/camera-fits.ts');
function points(front,back,yaw=0){const out=[];for(const g of[cupShell(),flap(false,front),flap(true,back)]){const a=g.getAttribute('position');for(let i=0;i<a.count;i+=3){const v=new T.Vector3(a.getX(i),a.getY(i),a.getZ(i)).applyAxisAngle(new T.Vector3(0,1,0),yaw).multiply(new T.Vector3(CUP_SCALE*CAMERA_FITS.cupScale[0],CUP_SCALE,CUP_SCALE*CAMERA_FITS.cupScale[1]));v.y+=CUP_BASE_Y;out.push(v);}}return out;}
const solid=points(1,1);
function projection(ps,c){c.updateMatrixWorld();const m=new T.Matrix4().multiplyMatrices(c.projectionMatrix,c.matrixWorldInverse),v=new T.Vector3(),box=[Infinity,Infinity,-Infinity,-Infinity];for(const p of ps){v.copy(p).applyMatrix4(m);const x=(v.x+1)*360,y=(1-v.y)*640;box[0]=Math.min(box[0],x);box[1]=Math.min(box[1],y);box[2]=Math.max(box[2],x);box[3]=Math.max(box[3],y);}return box;}
function search(initial,steps,loss,bounds){let p=[...initial],step=[...steps],best=loss(p);for(let k=0;k<900;k++){let changed=false;for(let j=0;j<p.length;j++)for(const sign of[-1,1]){const q=[...p];q[j]+=step[j]*sign;if(q[j]<bounds[j][0]||q[j]>bounds[j][1])continue;const l=loss(q);if(l<best){p=q;best=l;changed=true;}}if(!changed)step=step.map(x=>x*.67);if(step.every(x=>x<1e-6))break;}return{params:p,loss:best};}
function camera(p,fov=44){const c=new T.PerspectiveCamera(p[5]??fov,9/16,.002,3);c.position.set(p[0],p[1],p[2]);c.lookAt(p[3],p[4],.008);c.updateMatrixWorld();return c;}
const targets=[{frame:94,box:[265,513,417,825],clock:[355,450]},{frame:123,box:[252,477,452,864],clock:[465,406]},{frame:153,box:[240,454,480,886],clock:[615,390]}];
const results=[];
const foldTargets=[{frame:231,front:.55,back:0,box:[254,378,495,929]},{frame:268,front:1,back:1,box:[238,438,538,1027]}];
const alternatives=[];
for(const yaw of[-.55,-.40,-.25,-.10,.05,.20,.35]){
 const fold=[];
 for(const t of foldTargets){const ps=points(t.front,t.back,yaw+(t.frame===231?-.03:.02)),c=new T.PerspectiveCamera(32,9/16,.002,3);const loss=p=>{c.position.set(.025,p[3],p[0]);c.lookAt(p[2],p[1],0);return projection(ps,c).reduce((s,x,i)=>s+(x-t.box[i])**2,0);};const r=search([.56,.078,-.005,.15],[.02,.003,.002,.006],loss,[[.25,.9],[.02,.15],[-.04,.04],[.08,.30]]);loss(r.params);fold.push({...t,...r,predicted:projection(ps,c)});}
 alternatives.push({yaw,fold,loss:fold.reduce((n,f)=>n+f.loss,0)});
}
alternatives.sort((a,b)=>a.loss-b.loss);const best=alternatives[0],fold=best.fold;
const value={...CAMERA_FITS,fold:fold.map(r=>r.params),foldYaw:best.yaw};
fs.writeFileSync('src/v05/camera-fits.ts','// Joint screen projection fit; not physical camera recovery.\nexport const CAMERA_FITS='+JSON.stringify(value)+';\n');
fs.mkdirSync('../v05',{recursive:true});fs.writeFileSync('../v05/camera-fit.json',JSON.stringify({method:'Coordinate search for folding endpoints and yaw against manual cup bounds. Tabletop/cup/clock joint calibration is in joint-scene-fit.json. Bounds ~+/-8px; not physical camera recovery.',tabletop:results,fold,foldYaw:best.yaw,alternatives},null,2)+'\n');console.log(JSON.stringify({tabletop:results.map(x=>({frame:x.frame,predicted:x.predicted,loss:x.loss})),fold:fold.map(x=>({frame:x.frame,predicted:x.predicted,loss:x.loss}))},null,2));
