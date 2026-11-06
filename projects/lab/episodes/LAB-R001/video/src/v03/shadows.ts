import * as T from 'three';

export const LIGHT_POS=new T.Vector3(-.26,.32,.26);
export const LIGHT_TARGET=new T.Vector3(0,.055,0);
export const SOURCE_SMALL:[number,number]=[.04,.04];
export const SOURCE_LARGE:[number,number]=[.28,.38];
export const SHADOW_W=.64,SHADOW_D=.52;
const halton=(i:number,b:number)=>{let f=1,r=0;while(i>0){f/=b;r+=f*(i%b);i=Math.floor(i/b);}return r;};

// Ground shadow is an integral over the same rectangle that illuminates the scene.
// Deterministic samples; no time-based noise, Gaussian substitute or helper sun.
export function bakeAreaShadow(gl:T.WebGLRenderer,objects:T.Object3D[],size:[number,number],samples=48){
  const res=768,scene=new T.Scene(),rt=new T.WebGLRenderTarget(res,res,{depthBuffer:true});
  const camera=new T.OrthographicCamera(-SHADOW_W/2,SHADOW_W/2,SHADOW_D/2,-SHADOW_D/2,.01,2);
  camera.position.set(0,1,0);camera.up.set(0,0,-1);camera.lookAt(0,0,0);
  const receiver=new T.Mesh(new T.PlaneGeometry(SHADOW_W,SHADOW_D),new T.ShadowMaterial({opacity:1}));
  receiver.rotation.x=-Math.PI/2;receiver.position.y=.00045;receiver.receiveShadow=true;scene.add(receiver);
  const invisible=new T.MeshBasicMaterial({colorWrite:false,depthWrite:false,side:T.DoubleSide});
  for(const object of objects){object.updateWorldMatrix(true,true);object.traverse(o=>{
    if(o instanceof T.Mesh && o.userData.shadowCaster){const mesh=new T.Mesh(o.geometry,invisible);mesh.matrixAutoUpdate=false;mesh.matrix.copy(o.matrixWorld);mesh.castShadow=true;scene.add(mesh);}
  });}
  const spot=new T.SpotLight('#ffffff',1,3,Math.PI/2.7,0,0);spot.castShadow=true;
  spot.shadow.mapSize.set(1024,1024);spot.shadow.camera.near=.015;spot.shadow.camera.far=2;spot.shadow.bias=-.00001;spot.shadow.normalBias=.00001;
  spot.target.position.copy(LIGHT_TARGET);scene.add(spot,spot.target);
  const basis=new T.Matrix4().lookAt(LIGHT_POS,LIGHT_TARGET,new T.Vector3(0,1,0));
  const right=new T.Vector3().setFromMatrixColumn(basis,0),up=new T.Vector3().setFromMatrixColumn(basis,1);
  const rgba=new Uint8Array(res*res*4),sum=new Float32Array(res*res);
  const oldTarget=gl.getRenderTarget(),oldClear=gl.getClearColor(new T.Color()),oldAlpha=gl.getClearAlpha(),oldTone=gl.toneMapping,oldType=gl.shadowMap.type,oldAuto=gl.shadowMap.autoUpdate,oldEnabled=gl.shadowMap.enabled;
  gl.toneMapping=T.NoToneMapping;gl.shadowMap.enabled=true;gl.shadowMap.type=T.BasicShadowMap;gl.shadowMap.autoUpdate=true;gl.setClearColor('#000000',0);
  for(let i=0;i<samples;i++){
    spot.position.copy(LIGHT_POS).addScaledVector(right,(halton(i+1,2)-.5)*size[0]).addScaledVector(up,(halton(i+1,3)-.5)*size[1]);
    gl.setRenderTarget(rt);gl.clear();gl.render(scene,camera);gl.readRenderTargetPixels(rt,0,0,res,res,rgba);
    for(let k=0;k<sum.length;k++)sum[k]+=rgba[4*k+3]/samples;
  }
  let partial=0,opaque=0,total=0;
  for(let k=0;k<sum.length;k++){const a=Math.round(sum[k]);rgba[4*k]=rgba[4*k+1]=rgba[4*k+2]=0;rgba[4*k+3]=a;if(a>25&&a<230)partial++;if(a>=230)opaque++;total+=a/255;}
  const texture=new T.DataTexture(rgba,res,res,T.RGBAFormat,T.UnsignedByteType);texture.needsUpdate=true;texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearFilter;
  gl.setRenderTarget(oldTarget);gl.setClearColor(oldClear,oldAlpha);gl.toneMapping=oldTone;gl.shadowMap.type=oldType;gl.shadowMap.autoUpdate=oldAuto;gl.shadowMap.enabled=oldEnabled;
  rt.dispose();receiver.geometry.dispose();(receiver.material as T.Material).dispose();invisible.dispose();spot.shadow.map?.dispose();
  return {texture,stats:{samples,resolution:res,size,partialPixels:partial,opaquePixels:opaque,integratedOpacity:total}};
}
