import {useLoader} from '@react-three/fiber';
import {staticFile} from 'remotion';
import * as T from 'three';
import {RGBELoader} from 'three/examples/jsm/loaders/RGBELoader.js';

const canvases=new Map<string,T.CanvasTexture>();
export function canvasMap(id:string,w:number,h:number,draw:(c:CanvasRenderingContext2D)=>void){
  if(canvases.has(id))return canvases.get(id)!;
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;draw(canvas.getContext('2d')!);
  const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;canvases.set(id,t);return t;
}
export function useSurfaces(){
  const maps=useLoader(T.TextureLoader,['Paper001_2K-JPG_Color.jpg','Paper001_2K-JPG_NormalGL.jpg','Paper001_2K-JPG_Roughness.jpg','Wood092_2K-JPG_Color.jpg','Wood092_2K-JPG_NormalGL.jpg','Wood092_2K-JPG_Roughness.jpg'].map(n=>staticFile('v03-assets/'+n)));
  const hdr=useLoader(RGBELoader,staticFile('v03-assets/studio_small_09_1k.hdr'));
  maps.forEach((t,i)=>{t.colorSpace=i%3===0?T.SRGBColorSpace:T.NoColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;});
  hdr.mapping=T.EquirectangularReflectionMapping;
  return {paper:maps.slice(0,3),wood:maps.slice(3),hdr};
}
export function cupMaterial(paper:T.Texture[],inside=false){
  const m=new T.MeshStandardMaterial({map:paper[0],normalMap:paper[1],normalScale:new T.Vector2(.17,.17),roughnessMap:paper[2],roughness:.92,color:inside?'#e5dcc8':'#faf3e4',side:T.DoubleSide});
  const sourceLarge={value:1};m.userData.sourceLarge=sourceLarge;
  const ink=inside?null:canvasMap('v03-ink',2048,2048,c=>{
      c.textAlign='center';c.fillStyle='#252c27';c.font='500 150px Arial';c.fillText('FOLD',1024,1320);
      c.font='22px Arial';c.fillText('P A P E R   O B J E C T',1024,1374);c.fillRect(980,1425,88,2);
      c.font='18px Arial';c.fillText('S T U D I O   /   0 3',1024,1484);
  });
  m.onBeforeCompile=s=>{
    s.uniforms.sourceLarge=sourceLarge;
    s.vertexShader='attribute vec3 geometricOcclusion; varying vec3 vGeometricOcclusion;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvGeometricOcclusion=geometricOcclusion;');
    s.fragmentShader='uniform float sourceLarge; varying vec3 vGeometricOcclusion;\n'+s.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
      float keyVisibility=mix(vGeometricOcclusion.x,vGeometricOcclusion.y,sourceLarge);
      reflectedLight.directDiffuse*=keyVisibility;reflectedLight.directSpecular*=keyVisibility;
      reflectedLight.indirectDiffuse*=vGeometricOcclusion.z;reflectedLight.indirectSpecular*=sqrt(vGeometricOcclusion.z);`);
    if(ink){
      s.uniforms.inkMap={value:ink};
      s.vertexShader='varying vec2 vInkUv;\n'+s.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nvInkUv=uv;');
      s.fragmentShader='uniform sampler2D inkMap; varying vec2 vInkUv;\n'+s.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nvec4 ink=texture2D(inkMap,vInkUv); diffuseColor.rgb=mix(diffuseColor.rgb,ink.rgb,ink.a);');
    }
  };
  m.customProgramCacheKey=()=> inside?'v03-paper-geometric':'v03-paper-print-geometric';
  return m;
}
export function blueprint(){return canvasMap('v03-plan',1536,2048,c=>{
  c.fillStyle='#e6e0cf';c.fillRect(0,0,1536,2048);
  c.strokeStyle='#9faaaa';c.lineWidth=1;
  for(let x=90;x<1500;x+=44){c.beginPath();c.moveTo(x,180);c.lineTo(x,1860);c.stroke();}
  for(let y=180;y<1880;y+=44){c.beginPath();c.moveTo(90,y);c.lineTo(1450,y);c.stroke();}
  c.strokeStyle='#536469';c.lineWidth=4;
  c.beginPath();c.moveTo(390,1330);c.lineTo(300,640);c.bezierCurveTo(370,520,1130,520,1200,640);c.lineTo(1110,1330);c.closePath();c.stroke();
  c.beginPath();c.ellipse(750,640,450,110,0,0,Math.PI*2);c.moveTo(300,640);c.bezierCurveTo(450,890,1050,890,1200,640);c.stroke();
  c.setLineDash([12,12]);c.beginPath();c.moveTo(240,1480);c.lineTo(1230,1480);c.moveTo(1290,530);c.lineTo(1290,1370);c.stroke();c.setLineDash([]);
  c.fillStyle='#3a494b';c.font='48px Arial';c.fillText('FOLD / PAPER STUDY',100,125);c.font='28px Arial';c.fillText('01 — CUT / 02 — FOLD / 03 — LIGHT',110,1735);
  c.font='24px Arial';c.fillText('Ø 77 mm',650,1535);c.fillText('110',1310,980);c.fillText('1 : 1    /    OBJECT NOTES',110,1850);
  c.lineWidth=2;c.strokeRect(85,1930,1360,65);c.font='23px Arial';c.fillText('STUDIO LAB     •     MATERIAL / PAPER     •     2026',120,1973);
});}
export function rulerMap(){return canvasMap('v03-ruler',2048,128,c=>{
  c.clearRect(0,0,2048,128);c.fillStyle='#2d383b';c.font='34px Arial';
  for(let i=0;i<=150;i++){const x=28+i*13.2;c.fillRect(x,0,2,i%10===0?55:i%5===0?37:22);if(i%10===0)c.fillText(String(i/10),x+5,94);}
});}
export function clockMap(){return canvasMap('v03-clock',1024,512,c=>{
  c.fillStyle='#181c1b';c.fillRect(0,0,1024,512);c.fillStyle='#eee3cc';c.textAlign='center';c.font='330px monospace';c.fillText('10:24',512,370);
  c.fillStyle='#545349';c.fillRect(0,252,1024,4);c.font='28px Arial';c.fillStyle='#a7a08b';c.fillText('STUDIO TIME',512,470);
});}
