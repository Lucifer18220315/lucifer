import * as T from 'three';
import {canvasMap} from '../v03/materials';

export function designPage(kind:number,stage=1){return canvasMap(`v05-page-${kind}-${stage}`,1536,2048,c=>{
  c.fillStyle=kind===5||kind===10?'#f7f8fc':'#f2f1ef';c.fillRect(0,0,1536,2048);
  if(kind===4||kind===11){
    c.strokeStyle='#bcc5d0';c.lineWidth=1;
    for(let x=35;x<1536;x+=44){c.beginPath();c.moveTo(x,0);c.lineTo(x,2048);c.stroke();}
    for(let y=0;y<2048;y+=44){c.beginPath();c.moveTo(0,y);c.lineTo(1536,y);c.stroke();}
    if(kind===4){c.fillStyle='#25272a';c.font='700 140px Arial';c.fillText('СДЕЛАНО',220,1050);c.fillText('С УМОМ',220,1230);}
    return;
  }
  if(kind===5||kind===10){
    c.strokeStyle='#adbcd7';c.lineWidth=1.5;
    for(let x=20;x<1536;x+=34){c.beginPath();c.moveTo(x,0);c.lineTo(x,2048);c.stroke();}
    for(let y=0;y<2048;y+=34){c.beginPath();c.moveTo(0,y);c.lineTo(1536,y);c.stroke();}
    c.strokeStyle='#899dbe';c.lineWidth=2;
    // Horizontal spine and two visible fields of the open notebook.
    c.beginPath();c.moveTo(0,1050);c.lineTo(1536,1050);c.stroke();
    const back={l:510,r:1040,t:470,b:900},vp={x:770,y:700};
    c.strokeRect(back.l,back.t,back.r-back.l,back.b-back.t);
    for(let i=0;i<=12;i++){
      const x=i/12*1536;
      c.beginPath();c.moveTo(x,1050);c.lineTo(vp.x+(x-vp.x)*.34,back.b);c.stroke();
      c.beginPath();c.moveTo(x,120);c.lineTo(vp.x+(x-vp.x)*.34,back.t);c.stroke();
    }
    for(let i=0;i<=8;i++){
      const t=(i/8)**1.5;
      c.beginPath();c.moveTo(0,1050-150*t);c.lineTo(back.l,back.b-430*t);c.lineTo(back.r,back.b-430*t);c.lineTo(1536,1050-150*t);c.stroke();
    }
    if(kind===5&&stage>.8){
      c.strokeStyle='#3e4d92';c.lineWidth=3.5;
      c.beginPath();c.moveTo(600,360);c.bezierCurveTo(680,430,850,415,940,320);c.lineTo(920,970);c.lineTo(630,970);c.closePath();c.stroke();
      c.beginPath();c.moveTo(610,380);c.bezierCurveTo(750,450,880,420,930,350);c.moveTo(765,415);c.lineTo(765,970);c.moveTo(778,418);c.lineTo(778,970);c.stroke();
      for(let y=460;y<950;y+=10){const j=Math.sin(y*1.7)*4;c.beginPath();c.moveTo(643+j,y);c.lineTo(750+j,y-38);c.stroke();}
    }
    return;
  }
  c.strokeStyle=kind===5?'#c2cce0':'#aeb7b2';c.lineWidth=1;
  for(let x=48;x<1500;x+=kind>=6?36:48){c.beginPath();c.moveTo(x,80);c.lineTo(x,1950);c.stroke();}
  for(let y=80;y<1960;y+=kind>=6?36:48){c.beginPath();c.moveTo(48,y);c.lineTo(1488,y);c.stroke();}
  c.strokeStyle=kind===5?'#3b4d83':'#525b61';c.fillStyle=c.strokeStyle;c.lineWidth=4;
  if(kind>=6){
    c.lineCap='round';c.lineJoin='round';c.strokeStyle='#555d78';c.fillStyle='#555d78';
    c.font='29px Arial';c.fillText('PLAYBOY / PAPER OBJECT',95,135);c.font='21px Arial';c.fillText('ЧЕРТЁЖ / ОБРАЗЕЦ',95,177);
    const front=(x:number,y:number,s:number)=>{c.save();c.translate(x,y);c.scale(s,s);c.beginPath();c.moveTo(-270,-490);c.bezierCurveTo(-180,-420,-80,-340,0,-350);c.bezierCurveTo(90,-350,190,-430,270,-500);c.lineTo(220,500);c.lineTo(-215,500);c.closePath();c.stroke();c.beginPath();c.moveTo(-270,-490);c.bezierCurveTo(-140,-570,130,-575,270,-500);c.moveTo(-210,-445);c.bezierCurveTo(-120,-290,130,-290,220,-445);c.stroke();c.setLineDash([13,9]);c.beginPath();c.moveTo(0,-390);c.lineTo(0,470);c.stroke();c.setLineDash([]);c.restore();};
    if(kind===13){
      front(820,1000,1.08);c.font='25px Arial';c.fillText('КЛАПАН 1',110,420);c.fillText('ЛИНИЯ СГИБА',110,610);c.beginPath();c.moveTo(340,430);c.lineTo(620,530);c.moveTo(350,620);c.lineTo(720,710);c.stroke();
    }else if(kind===6){
      for(let i=0;i<3;i++){front(300+i*470,1050,.69);c.font='22px Arial';c.fillText(['A / OPEN','B / FOLD','C / CLOSED'][i],150+i*470,1570);c.font='18px Arial';c.fillText('PAPER / PROTOTYPE',150+i*470,1620);}
    }else if(kind===7){
      c.beginPath();c.moveTo(430,550);c.quadraticCurveTo(450,480,520,460);c.lineTo(1080,460);c.quadraticCurveTo(1155,480,1170,550);c.lineTo(1115,1630);c.lineTo(485,1630);c.closePath();c.stroke();c.setLineDash([12,8]);c.beginPath();c.moveTo(795,470);c.lineTo(795,1630);c.stroke();c.setLineDash([]);c.font='22px Arial';c.fillText('CURVED',145,500);c.fillText('SHOULDER',145,535);c.beginPath();c.moveTo(290,540);c.lineTo(475,500);c.stroke();c.font='24px Arial';c.save();c.translate(835,1200);c.rotate(-Math.PI/2);c.fillText('REVERSE / FOLD AXIS',0,0);c.restore();
    }else if(kind===8){
      c.beginPath();c.moveTo(440,475);c.bezierCurveTo(570,690,845,670,1110,435);c.lineTo(1245,1600);c.lineTo(710,1660);c.closePath();c.stroke();c.beginPath();c.moveTo(480,490);c.bezierCurveTo(625,660,860,625,1110,435);c.moveTo(510,545);c.bezierCurveTo(670,720,900,680,1115,505);c.moveTo(620,685);c.lineTo(920,1620);c.stroke();c.setLineDash([12,8]);c.beginPath();c.moveTo(795,640);c.lineTo(1060,1615);c.stroke();c.setLineDash([]);c.save();c.translate(970,1300);c.rotate(-1.76);c.font='24px Arial';c.fillText('SIDE / FOLD AXIS',0,0);c.restore();
    }else{
      c.beginPath();c.moveTo(520,400);c.quadraticCurveTo(530,335,610,320);c.lineTo(1050,320);c.quadraticCurveTo(1130,335,1140,400);c.lineTo(1080,1520);c.lineTo(575,1520);c.closePath();c.stroke();
      c.setLineDash([10,8]);c.beginPath();c.moveTo(832,340);c.lineTo(832,1490);c.stroke();c.setLineDash([]);
      c.font='26px Arial';c.fillText('НЕ ПЕРЕЛИВАТЬ',120,480);c.fillText('УРОВЕНЬ НАЛИВА',960,700);
      c.beginPath();c.moveTo(350,490);c.lineTo(525,460);c.moveTo(950,718);c.lineTo(1105,718);c.stroke();
      c.save();c.translate(865,1300);c.rotate(-Math.PI/2);c.font='27px Arial';c.fillText('СГИБ ПО ЛИНИИ',0,0);c.restore();
    }
    c.lineWidth=2;c.strokeRect(75,1660,1385,310);c.font='25px Arial';c.fillText('ПРОЕКТ: БУМАЖНЫЙ СТАКАН',115,1740);c.font='21px Arial';c.fillText(({6:'ТРИ ПРОТОТИПА',7:'ОБРАТНАЯ СТОРОНА',8:'БОКОВОЙ ВИД',9:'СХЕМА СБОРКИ',13:'ОТКРЫТЫЙ КЛАПАН'} as Record<number,string>)[kind],115,1820);c.fillText('PLAYBOY / 2026',920,1920);return;
  }
  c.font='36px Arial';c.fillText('PLAYBOY / PAPER OBJECT',92,132);c.font='20px Arial';c.fillText(`DESIGN STUDY / 0${kind+1} / PROTOTYPE`,92,176);
  const cx=kind%2?900:650,cy=950,rx=kind===2?430:350;
  c.save();c.translate(cx,cy);c.rotate(kind===2?-.18:0);
  c.beginPath();c.moveTo(-rx,-450);c.lineTo(-rx*.76,540);c.lineTo(rx*.76,540);c.lineTo(rx,-450);c.bezierCurveTo(rx*.5,-600,-rx*.5,-600,-rx,-450);c.stroke();
  c.beginPath();c.moveTo(-rx,-450);c.bezierCurveTo(-rx*.5,-110,rx*.5,-110,rx,-450);c.stroke();
  c.setLineDash([12,8]);c.beginPath();c.moveTo(-rx-85,-560);c.lineTo(-rx-85,580);c.moveTo(-rx-30,650);c.lineTo(rx+30,650);c.stroke();c.setLineDash([]);
  c.font='25px Arial';c.fillText('117',-rx-145,90);c.fillText('62.0',-35,704);c.restore();
  if(kind===1||kind===3){for(let j=0;j<3;j++){c.strokeRect(110,400+j*310,300,240);c.font='21px Arial';c.fillText(['SECTION A / A','FOLD LINE','PAPER 0.26'][j],120,680+j*310);}}
  c.strokeRect(75,1820,1385,150);c.font='23px Arial';c.fillText('OBJECT LAB     |     MATERIAL / PAPER     |     REVISION 04',110,1880);c.font='20px Arial';c.fillText('DRAWING / EXPLORATION',110,1930);
});}

export const cuttingMat=()=>canvasMap('v05-mat',2048,2048,c=>{
  c.fillStyle='#171b1f';c.fillRect(0,0,2048,2048);c.strokeStyle='#a9aaae';c.lineWidth=1.6;
  for(let x=45;x<2020;x+=87){c.beginPath();c.moveTo(x,40);c.lineTo(x,2015);c.stroke();}
  for(let y=45;y<2020;y+=87){c.beginPath();c.moveTo(40,y);c.lineTo(2015,y);c.stroke();}
  c.lineWidth=2;for(let i=0;i<=180;i+=15){const a=i*Math.PI/180;c.beginPath();c.moveTo(1900,1900);c.lineTo(1900-1800*Math.cos(a),1900-1800*Math.sin(a));c.stroke();}
  c.fillStyle='#bac6c3';c.font='23px Arial';for(let i=0;i<22;i++){c.fillText(String(i),53+i*87,35);c.fillText(String(i),7,75+i*87);}
  c.font='24px Arial';c.fillText('CUTTING MAT / A4',60,1980);
});

export const cupPrint=(detailed=false)=>canvasMap(detailed?'v05-cup-print-detailed':'v05-cup-print',2048,2048,c=>{
  c.textAlign='center';c.fillStyle='#272820';c.font='900 143px Arial';c.fillText('PLAYBOY',1024,1840);c.font='27px Arial';c.fillText('O B J E C T   L A B',1024,1900);
  c.fillStyle='#797769';
  c.font='24px Arial';c.fillText('УРОВЕНЬ НАЛИВА',710,450);c.fillText('НЕ ПЕРЕЛИВАТЬ',1385,450);
  c.strokeStyle='#969696';c.lineWidth=2;c.beginPath();c.moveTo(535,480);c.lineTo(895,480);c.moveTo(1210,480);c.lineTo(1560,480);c.stroke();
  c.beginPath();c.moveTo(1210,410);c.bezierCurveTo(1182,445,1201,460,1210,460);c.bezierCurveTo(1233,460,1237,445,1210,410);c.fill();
});

export const cupCreases=()=>{const t=canvasMap('v05-cup-crease-height',2048,2048,c=>{
  c.fillStyle='#808080';c.fillRect(0,0,2048,2048);c.strokeStyle='#565656';c.lineWidth=7;c.lineCap='round';c.shadowColor='#565656';c.shadowBlur=3;
  c.beginPath();c.moveTo(540,475);c.lineTo(720,670);c.lineTo(870,755);c.moveTo(1508,475);c.lineTo(1328,670);c.lineTo(1178,755);c.stroke();
  c.lineWidth=3;c.beginPath();c.moveTo(535,480);c.lineTo(895,480);c.moveTo(1210,480);c.lineTo(1560,480);c.stroke();
});t.colorSpace=T.NoColorSpace;return t;};

export const flapGuideInk=(which:number)=>canvasMap('v05-flap-guide-'+which,1024,1024,c=>{
  c.textAlign='center';c.fillStyle='rgba(75,76,65,.70)';c.font='40px Arial';c.fillText('FOLD / 0'+which,512,810);c.font='28px Arial';c.fillText('ПО ЛИНИИ СГИБА',512,860);
});
export const flapGuideEmboss=()=>{const t=canvasMap('v05-flap-guide-height',1024,1024,c=>{
  c.fillStyle='#808080';c.fillRect(0,0,1024,1024);c.strokeStyle='#b8b8b8';c.lineWidth=13;c.lineCap='round';c.lineJoin='round';
  c.beginPath();c.moveTo(330,530);c.bezierCurveTo(230,410,350,315,430,410);c.moveTo(430,410);c.lineTo(385,330);c.moveTo(430,410);c.lineTo(350,425);c.moveTo(620,410);c.lineTo(715,410);c.lineTo(715,540);c.moveTo(680,505);c.lineTo(715,540);c.lineTo(750,505);c.stroke();
});t.colorSpace=T.NoColorSpace;return t;};
export const orangeTabPrint=()=>canvasMap('v05-orange-tab',512,256,c=>{c.fillStyle='#de7637';c.fillRect(0,0,512,256);c.fillStyle='#fff3df';c.textAlign='center';c.font='700 52px Arial';c.fillText('FOLD / 01',256,155);});

export const graphitePoint=(p:number)=>({x:430+p*600,y:1390+p*34+Math.sin(p*9)*2});
export const graphiteMap=(progress:number)=>canvasMap(`v05-graphite-${Math.round(progress*1000000)}`,1536,2048,c=>{
  c.fillStyle='#f5f3f4';c.fillRect(0,0,1536,2048);c.strokeStyle='#bdc4c1';c.lineWidth=1;
  for(let y=0;y<2048;y+=95){c.beginPath();c.moveTo(0,y);c.lineTo(1536,y);c.stroke();}
  c.strokeStyle='#383d39';c.lineWidth=3;c.beginPath();
  const n=Math.floor(progress*100);for(let i=0;i<=n;i++){const q=graphitePoint(i/100);i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y);}const end=graphitePoint(progress);c.lineTo(end.x,end.y);c.stroke();
});

export const skinBump=()=>canvasMap('v05-skin',512,512,c=>{
  let seed=419;const im=c.createImageData(512,512);for(let k=0;k<512*512;k++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const q=126+(seed/4294967296-.5)*35;im.data.set([q,q,q,255],k*4);}c.putImageData(im,0,0);
});

const notebookMaps=new Map<string,T.Texture>();
export function notebookHalf(lower:boolean,stage:number){
  const key=String(lower)+'/'+stage;if(notebookMaps.has(key))return notebookMaps.get(key)!;
  const map=designPage(5,stage).clone();map.repeat.set(1,.5);map.offset.set(0,lower?0:.5);map.needsUpdate=true;notebookMaps.set(key,map);return map;
}

export const pencilWood=()=>canvasMap('v05-pencil-fibres',512,1024,c=>{
  c.fillStyle='#cbb998';c.fillRect(0,0,512,1024);let seed=419;
  for(let x=0;x<512;x+=2){seed=(Math.imul(seed,1664525)+1013904223)>>>0;c.strokeStyle=`rgba(109,87,57,${.10+(seed/4294967296)*.25})`;c.lineWidth=.7+(seed%9)/10;c.beginPath();c.moveTo(x,0);for(let y=0;y<=1024;y+=16)c.lineTo(x+Math.sin(y*.017+x)*1.8,y);c.stroke();}
});

export const landscapePlan=()=>canvasMap('v05-landscape-3-panels',4608,2048,c=>{
  [13,9,6].forEach((kind,i)=>c.drawImage(designPage(kind).image,i*1536,0,1536,2048));
});
