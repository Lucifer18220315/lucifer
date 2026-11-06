import * as T from 'three';
export {cupShell,bevelBox,CUP_SCALE} from '../v03/geometry';
export const CUP_BASE_Y=-.00046;
export const liquidSurfaceLocalY=(amount:number)=>.7+amount*.85;

export function flap(back:boolean,fold:number){
  const n=80,rows=20,p:number[]=[],uv:number[]=[],idx:number[]=[],grid:number[][]=[],s=back?-1:1;
  const add=(x:number,y:number,z:number,u:number,v:number)=>{const i=p.length/3;p.push(x,y,z);uv.push(u,v);return i;};
  const left=add(-.9,2.73,0,0,.5),right=add(.9,2.73,0,1,.5);
  for(let j=0;j<=rows;j++){
    const v=j/rows,row=[left];
    for(let i=1;i<n;i++){
      const a=-Math.PI/2+Math.PI*i/n,c=Math.cos(a),y=2.57-.16*Math.cos(2*a);
      const lift=(.96*v*(1-fold)+(.13*Math.sin(Math.PI*v)-.07*v)*fold)*c;
      row.push(add(.9*Math.sin(a),y+lift,.9*c*(1-(.15+.61*fold)*v)*s,i/n,v));
    }row.push(right);grid.push(row);
  }
  for(let j=0;j<rows;j++)for(let i=0;i<n;i++){
    const [a,b,c,d]=[grid[j][i],grid[j][i+1],grid[j+1][i],grid[j+1][i+1]];
    const push=(x:number,y:number,z:number)=>idx.push(...(back?[x,y,z]:[x,z,y]));if(a!==c)push(a,c,b);if(b!==d)push(b,c,d);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
  const normal=g.getAttribute('normal'),count=p.length/3,edges=new Map<string,{a:number,b:number,n:number}>();
  for(let i=0;i<count;i++){p.push(p[3*i]-normal.getX(i)*.006,p[3*i+1]-normal.getY(i)*.006,p[3*i+2]-normal.getZ(i)*.006);uv.push(uv[2*i],uv[2*i+1]);}
  const old=[...idx];for(let i=0;i<old.length;i+=3){const [a,b,c]=old.slice(i,i+3);idx.push(c+count,b+count,a+count);for(const[x,y]of[[a,b],[b,c],[c,a]]){const k=[Math.min(x,y),Math.max(x,y)].join('/'),e=edges.get(k);if(e)e.n++;else edges.set(k,{a:x,b:y,n:1});}}
  for(const {a,b,n}of edges.values())if(n===1)idx.push(a,b+count,b,a,a+count,b+count);
  g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}

export function deformCupCrossSection(g:T.BufferGeometry,squeezeTop:number){
  if(squeezeTop===1)return g;
  const p=g.getAttribute('position');
  for(let i=0;i<p.count;i++){const t=Math.max(0,Math.min(1,p.getY(i)/2.73)),k=1-(1-squeezeTop)*t*t*(3-2*t);p.setX(i,p.getX(i)*k);p.setZ(i,p.getZ(i)/k);}
  p.needsUpdate=true;g.computeVertexNormals();return g;
}

export function pageSurfacePoint(width:number,height:number,angle:number,u:number,v:number,bend=.015){
  const warp=Math.sin(v*Math.PI)*Math.sin(angle)*bend;
  return new T.Vector3((u-.5)*width,Math.sin(angle)*v*height+warp*(.4+.6*u),-height/2+Math.cos(angle)*v*height+warp*.5);
}

export function curledPage(width:number,height:number,angle:number,bend=.015){
  const nx=16,ny=36,p:number[]=[],uv:number[]=[],idx:number[]=[];
  for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
    const u=i/nx,v=j/ny,q=pageSurfacePoint(width,height,angle,u,v,bend);
    p.push(q.x,q.y,q.z);uv.push(u,1-v);
  }
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+nx+1;idx.push(a,b,a+1,a+1,b,b+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}

export function crumpledPaper(seed:number){
  const nx=48,ny=48,p:number[]=[],uv:number[]=[],idx:number[]=[],original:T.Vector2[]=[],points:T.Vector3[]=[];
  for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
    const u=i/nx*2-1,v=j/ny*2-1;original.push(new T.Vector2(u,v));points.push(new T.Vector3(u,0,v));uv.push(i/nx,j/ny);
  }
  let state=seed*811+29;const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  // Fold an actual connected sheet around successive creases. Open edges remain
  // visible, unlike a faceted solid ball or a sinusoidal flower-like surface.
  for(let fold=0;fold<11;fold++){
    const a=rand()*Math.PI*2,n=new T.Vector2(Math.cos(a),Math.sin(a)),along=new T.Vector2(-n.y,n.x),d=(rand()-.5)*.55,angle=(1.2+rand()*1.65)*(fold%2?1:-1);
    const desiredA=n.clone().multiplyScalar(d).addScaledVector(along,-.7),desiredB=n.clone().multiplyScalar(d).addScaledVector(along,.7);
    const nearest=(q:T.Vector2)=>{let best=0,dist=Infinity;original.forEach((p,i)=>{const t=p.distanceToSquared(q);if(t<dist){dist=t;best=i;}});return points[best].clone();};
    const origin=nearest(desiredA),axis=nearest(desiredB).sub(origin).normalize();
    points.forEach((point,i)=>{const side=original[i].dot(n)-d;if(side>0){const blend=Math.min(1,side/.08),q=new T.Quaternion().setFromAxisAngle(axis,angle*blend);point.sub(origin).applyQuaternion(q).add(origin);}});
  }
  const bounds=new T.Box3().setFromPoints(points),center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3());
  for(const point of points)p.push((point.x-center.x)/size.x*.043,(point.y-bounds.min.y)/size.y*.031,(point.z-center.z)/size.z*.040);
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+nx+1;idx.push(a,a+1,b,a+1,b+1,b);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
