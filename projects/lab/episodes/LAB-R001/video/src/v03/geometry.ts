import * as T from 'three';

export const CUP_SCALE=.043;
export const rimPoint=(a:number)=>new T.Vector3(.9*Math.sin(a),2.57-.16*Math.cos(2*a),.9*Math.cos(a));
const geometry=(p:number[],uv:number[],idx:number[])=>{
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
};
function paperThickness(g:T.BufferGeometry,thickness:number){
  const p=g.getAttribute('position'),normal=g.getAttribute('normal'),uv=g.getAttribute('uv'),old=Array.from(g.index!.array),points=Array.from(p.array),coords=Array.from(uv.array),idx=[...old],edges=new Map<string,{a:number,b:number,n:number}>();
  for(let i=0;i<p.count;i++){points.push(p.getX(i)-normal.getX(i)*thickness,p.getY(i)-normal.getY(i)*thickness,p.getZ(i)-normal.getZ(i)*thickness);coords.push(uv.getX(i),uv.getY(i));}
  for(let i=0;i<old.length;i+=3){const [a,b,c]=old.slice(i,i+3);idx.push(c+p.count,b+p.count,a+p.count);for(const [x,y] of [[a,b],[b,c],[c,a]]){const key=[Math.min(x,y),Math.max(x,y)].join('/');const edge=edges.get(key);if(edge)edge.n++;else edges.set(key,{a:x,b:y,n:1});}}
  for(const {a,b,n} of edges.values())if(n===1)idx.push(a,b+p.count,b,a,a+p.count,b+p.count);
  const closed=geometry(points,coords,idx);g.dispose();return closed;
}
// One continuous wall, including a thin, rounded return into the inner wall.
// All edges use exactly the same angular samples as the flap boundaries.
export const cupShell=()=>{
  const n=160,rows=40,p:number[]=[],uv:number[]=[],idx:number[]=[];
  const ring=(v:number,radialOffset:number,yOffset:number)=>{
    for(let i=0;i<=n;i++){
      const a=-Math.PI+2*Math.PI*i/n,r=.62+.28*v+radialOffset;
      p.push(r*Math.sin(a),.02+2.55*v-.16*Math.cos(2*a)*v**12+yOffset,r*Math.cos(a));uv.push(i/n,v);
    }
  };
  for(let j=0;j<=rows;j++)ring(j/rows,0,0);
  // Paper thickness .006 modelling units = .258 mm in the scene.
  for(let j=1;j<=6;j++){const a=j/6*Math.PI;ring(1,-.003+.003*Math.cos(a),.003*Math.sin(a));}
  for(let j=rows-1;j>=0;j--)ring(j/rows,-.006,0);
  const count=p.length/3/(n+1);
  for(let j=0;j<count-1;j++)for(let i=0;i<n;i++){const a=j*(n+1)+i,b=a+n+1;idx.push(a,a+1,b,a+1,b+1,b);}
  return geometry(p,uv,idx);
};

// Each end is ONE vertex. No .998 cut-off and no collapsed rectangular quads.
export const cupFlap=(back=false)=>{
  const n=80,rows=20,p:number[]=[],uv:number[]=[],idx:number[]=[],grid:number[][]=[];
  const sign=back?-1:1;
  const add=(x:number,y:number,z:number,u:number,v:number)=>{const id=p.length/3;p.push(x,y,z);uv.push(u,v);return id;};
  const left=add(-.9,2.73,0,0,.5),right=add(.9,2.73,0,1,.5);
  for(let j=0;j<=rows;j++){
    const v=j/rows,row:number[]=[left];
    for(let i=1;i<n;i++){
      const a=-Math.PI/2+Math.PI*i/n,e=rimPoint(a);
      row.push(add(e.x,e.y+(.13*Math.sin(Math.PI*v)-.07*v)*Math.cos(a),e.z*(1-.76*v)*sign,i/n,v));
    }
    row.push(right);grid.push(row);
  }
  for(let j=0;j<rows;j++)for(let i=0;i<n;i++){
    const a=grid[j][i],b=grid[j][i+1],c=grid[j+1][i],d=grid[j+1][i+1];
    const push=(x:number,y:number,z:number)=>idx.push(...(back?[x,y,z]:[x,z,y]));
    if(a!==c)push(a,c,b);if(b!==d)push(b,c,d);
  }
  return paperThickness(geometry(p,uv,idx),.006);
};

export const bevelBox=(x:number,y:number,z:number,r:number)=>{
  // Native rounded extruded outline, no overlapping boxes at the silhouette.
  const s=new T.Shape();const a=x/2-r,b=z/2-r;
  s.moveTo(-a+r,-b);s.lineTo(a-r,-b);s.quadraticCurveTo(a,-b,a,-b+r);s.lineTo(a,b-r);s.quadraticCurveTo(a,b,a-r,b);s.lineTo(-a+r,b);s.quadraticCurveTo(-a,b,-a,b-r);s.lineTo(-a,-b+r);s.quadraticCurveTo(-a,-b,-a+r,-b);
  const g=new T.ExtrudeGeometry(s,{depth:Math.max(.00001,y-2*r),bevelEnabled:true,bevelSize:r,bevelThickness:r,bevelSegments:3,steps:1,curveSegments:8});
  g.rotateX(-Math.PI/2);g.translate(0,-y/2+r,0);return g;
};
