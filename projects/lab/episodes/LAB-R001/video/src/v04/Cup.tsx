import React,{useMemo} from 'react';
import * as T from 'three';
import {cupShell,flap,CUP_SCALE,CUP_BASE_Y,liquidSurfaceLocalY,deformCupCrossSection} from './geometry';
import {cupPrint,cupCreases,flapGuideInk,flapGuideEmboss,orangeTabPrint} from './textures';

function paperMaterial(paper:T.Texture[],printed:boolean,sleeve=false,detailed=false,guide=0,printShift=0){
  const m=new T.MeshPhysicalMaterial({map:paper[0],normalMap:paper[1],normalScale:new T.Vector2(.11,.11),roughnessMap:paper[2],roughness:.91,color:'#f5efdc',side:T.DoubleSide,sheen:.12});
  if(printed&&detailed){m.bumpMap=cupCreases();m.bumpScale=.0004;}
  if(guide){m.bumpMap=flapGuideEmboss();m.bumpScale=.0006;}
  if(printed||guide)m.onBeforeCompile=s=>{
    s.uniforms.print={value:printed?cupPrint(detailed):flapGuideInk(guide)};
    s.vertexShader='varying vec2 vPaperUv;\n'+s.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nvPaperUv=uv;');
    s.fragmentShader='uniform sampler2D print;varying vec2 vPaperUv;\n'+s.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      float sleeve=${sleeve?'1.':'0.'}*(1.-smoothstep(.288,.293,vPaperUv.y));
      diffuseColor.rgb*=mix(vec3(1.),vec3(.60,.41,.20),sleeve);
      vec4 ink=texture2D(print,vec2(fract(vPaperUv.x+${printShift.toFixed(8)}),vPaperUv.y));diffuseColor.rgb=mix(diffuseColor.rgb,ink.rgb,ink.a);`);
    // Three's stock normal chunk selects the normal map OR the bump map.
    // Compose the embossed folds after the paper's tangent-space fine normal.
    if(detailed||guide)s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
      #if defined(USE_BUMPMAP) && defined(USE_NORMALMAP_TANGENTSPACE)
      normal=perturbNormalArb(-vViewPosition,normal,dHdxy_fwd(),faceDirection);
      #endif`);
  };
  m.customProgramCacheKey=()=>`v04-paper-${printed}-${sleeve}-${detailed}-${guide}-${printShift}`;return m;
}

export function CupV04({paper,front=1,back=1,angle=0,lift=0,water=0,detailed=false,guides=false,squeezeTop=1}:{paper:T.Texture[],front?:number,back?:number,angle?:number,lift?:number,water?:number,detailed?:boolean,guides?:boolean,squeezeTop?:number}){
  const assemblyYaw=guides?-.55:0;
  const shell=useMemo(()=>deformCupCrossSection(cupShell(),squeezeTop).rotateY(assemblyYaw),[squeezeTop,assemblyYaw]),a=useMemo(()=>deformCupCrossSection(flap(false,front),squeezeTop).rotateY(assemblyYaw),[front,squeezeTop,assemblyYaw]),b=useMemo(()=>deformCupCrossSection(flap(true,back),squeezeTop).rotateY(assemblyYaw),[back,squeezeTop,assemblyYaw]);
  const outside=useMemo(()=>paperMaterial(paper,true,water>0,detailed,0,assemblyYaw/(Math.PI*2)),[paper[0],water>0,detailed,assemblyYaw]),inside=useMemo(()=>paperMaterial(paper,false),[paper[0]]);
  const frontMaterial=useMemo(()=>guides?paperMaterial(paper,false,false,false,2):inside,[paper[0],guides,inside]),backMaterial=useMemo(()=>guides?paperMaterial(paper,false,false,false,1):inside,[paper[0],guides,inside]);
  const tab=useMemo(()=>{const s=new T.Shape();s.moveTo(-.20,0);s.lineTo(.20,0);s.lineTo(.20,.16);s.quadraticCurveTo(.20,.24,.12,.24);s.lineTo(-.12,.24);s.quadraticCurveTo(-.20,.24,-.20,.16);s.closePath();const g=new T.ExtrudeGeometry(s,{depth:.006,bevelEnabled:false,curveSegments:12}),p=g.getAttribute('position'),uv=g.getAttribute('uv');for(let i=0;i<p.count;i++)uv.setXY(i,(p.getX(i)+.20)/.40,p.getY(i)/.24);return g;},[]);
  return <group position={[0,CUP_BASE_Y+lift,0]} rotation={[0,angle,0]} scale={[CUP_SCALE*.80,CUP_SCALE,CUP_SCALE*.80]}>
    <mesh geometry={shell} material={outside} castShadow receiveShadow/>
    <mesh geometry={a} material={frontMaterial} castShadow receiveShadow/><mesh geometry={b} material={backMaterial} castShadow receiveShadow/>
    {water>0&&<mesh geometry={tab} position={[.69,2.64,-.45]} rotation={[.10,-.15,-.12]} scale={.42} castShadow receiveShadow><meshStandardMaterial map={orangeTabPrint()} roughness={.88} normalMap={paper[1]} normalScale={[.035,.035]} side={T.DoubleSide}/></mesh>}
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,.025,0]} receiveShadow><circleGeometry args={[.614,96]}/><primitive object={inside} attach="material"/></mesh>
    {water>0&&<group position={[0,liquidSurfaceLocalY(water),0]}>
      <mesh rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.70,96]}/><meshPhysicalMaterial color="#6d4d28" roughness={.13} metalness={0} transmission={.30} thickness={.06} ior={1.333}/></mesh>
      {[0,1,2].map(i=><mesh key={i} rotation={[-Math.PI/2,0,0]} position={[0,.001+i*.001,0]} scale={.25+((water*2+i*.3)%1)*.65}><ringGeometry args={[.33,.337,96]}/><meshBasicMaterial color="#f5e8c6" transparent opacity={.2*(1-((water*2+i*.3)%1))} side={T.DoubleSide}/></mesh>)}
    </group>}
  </group>;
}
