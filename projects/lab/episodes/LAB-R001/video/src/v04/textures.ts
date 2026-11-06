import * as T from 'three';
import {canvasMap} from '../v03/materials';

export function designPage(kind:number,stage=1){return canvasMap(`v04-page-${kind}-${stage}`,1536,2048,c=>{
  c.fillStyle=kind===5?'#faf8f0':'#e9e3d1';c.fillRect(0,0,1536,2048);
  if(kind===4){
    c.fillStyle='#1f2824';c.font='900 350px Arial';c.fillText('P',100,390);c.lineWidth=9;c.strokeStyle='#1f2824';c.beginPath();c.arc(220,235,195,0,Math.PI*2);c.stroke();
    c.font='700 154px Arial';c.fillText('СДЕЛАНО',180,1120);c.fillText('С УМОМ',180,1320);c.font='30px Arial';c.fillText('PLAYBOY / OBJECT LAB',180,1830);return;
  }
  c.strokeStyle=kind===5?'#c2cce0':'#aeb7b2';c.lineWidth=1;
  for(let x=48;x<1500;x+=kind>=6?36:48){c.beginPath();c.moveTo(x,80);c.lineTo(x,1950);c.stroke();}
  for(let y=80;y<1960;y+=kind>=6?36:48){c.beginPath();c.moveTo(48,y);c.lineTo(1488,y);c.stroke();}
  c.strokeStyle=kind===5?'#3b4d83':'#525b61';c.fillStyle=c.strokeStyle;c.lineWidth=4;
  if(kind>=6){
    c.lineCap='round';c.lineJoin='round';c.strokeStyle='#555d78';c.fillStyle='#555d78';
    c.font='29px Arial';c.fillText('PLAYBOY / PAPER OBJECT',95,135);c.font='21px Arial';c.fillText('DESIGN STUDY / REVISION 04',95,177);
    const front=(x:number,y:number,s:number)=>{c.save();c.translate(x,y);c.scale(s,s);c.beginPath();c.moveTo(-270,-490);c.bezierCurveTo(-180,-420,-80,-340,0,-350);c.bezierCurveTo(90,-350,190,-430,270,-500);c.lineTo(220,500);c.lineTo(-215,500);c.closePath();c.stroke();c.beginPath();c.moveTo(-270,-490);c.bezierCurveTo(-140,-570,130,-575,270,-500);c.moveTo(-210,-445);c.bezierCurveTo(-120,-290,130,-290,220,-445);c.stroke();c.setLineDash([13,9]);c.beginPath();c.moveTo(0,-390);c.lineTo(0,470);c.stroke();c.setLineDash([]);c.restore();};
    if(kind===6){
      for(let i=0;i<3;i++){front(300+i*470,1050,.69);c.font='22px Arial';c.fillText(['A / OPEN','B / FOLD','C / CLOSED'][i],150+i*470,1570);c.font='18px Arial';c.fillText('PAPER / PROTOTYPE',150+i*470,1620);}
    }else if(kind===7){
      c.beginPath();c.moveTo(430,550);c.quadraticCurveTo(450,480,520,460);c.lineTo(1080,460);c.quadraticCurveTo(1155,480,1170,550);c.lineTo(1115,1630);c.lineTo(485,1630);c.closePath();c.stroke();c.setLineDash([12,8]);c.beginPath();c.moveTo(795,470);c.lineTo(795,1630);c.stroke();c.setLineDash([]);c.font='22px Arial';c.fillText('CURVED',145,500);c.fillText('SHOULDER',145,535);c.beginPath();c.moveTo(290,540);c.lineTo(475,500);c.stroke();c.font='24px Arial';c.save();c.translate(835,1200);c.rotate(-Math.PI/2);c.fillText('REVERSE / FOLD AXIS',0,0);c.restore();
    }else if(kind===8){
      c.beginPath();c.moveTo(440,475);c.bezierCurveTo(570,690,845,670,1110,435);c.lineTo(1245,1600);c.lineTo(710,1660);c.closePath();c.stroke();c.beginPath();c.moveTo(480,490);c.bezierCurveTo(625,660,860,625,1110,435);c.moveTo(510,545);c.bezierCurveTo(670,720,900,680,1115,505);c.moveTo(620,685);c.lineTo(920,1620);c.stroke();c.setLineDash([12,8]);c.beginPath();c.moveTo(795,640);c.lineTo(1060,1615);c.stroke();c.setLineDash([]);c.save();c.translate(970,1300);c.rotate(-1.76);c.font='24px Arial';c.fillText('SIDE / FOLD AXIS',0,0);c.restore();
    }else{
      front(970,1030,1.08);const labels=['FLAP','FOLD LINE','RIM','WALL','EDGE','FILL LEVEL'];
      labels.forEach((label,i)=>{const y=450+i*175;c.font='25px Arial';c.fillText(label,100,y);c.beginPath();c.moveTo(100,y+18);c.lineTo(400,y+18);c.lineTo(650+(i%2)*80,510+i*150);c.stroke();});
      c.font='22px Arial';c.fillText('OVERFILL',1110,800);c.beginPath();c.moveTo(1050,780);c.lineTo(1260,780);c.stroke();
    }
    c.lineWidth=2;c.strokeRect(75,1810,1385,170);c.font='25px Arial';c.fillText('PROJECT / PAPER OBJECT',115,1870);c.font='21px Arial';c.fillText(['','','','','','','FRONT / THREE PROTOTYPES','REVERSE PROFILE','SIDE PROFILE','FRONT / ASSEMBLY'][kind],115,1920);c.fillText('PLAYBOY / OBJECT LAB',920,1960);return;
  }
  if(kind===5){
    const strokes=[[[400,1510],[330,550],[1070,550],[1000,1510],[400,1510]],[[330,550],[700,710],[1070,550]],[[330,550],[700,370],[1070,550]],[[420,1450],[980,1450]]];
    strokes.slice(0,Math.max(1,Math.ceil(stage*strokes.length))).forEach(points=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();});
    if(stage>.65){c.lineWidth=2;for(let y=640;y<1450;y+=23){c.beginPath();c.moveTo(420,y);c.lineTo(520,y-45);c.stroke();}}return;
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

export const cuttingMat=()=>canvasMap('v04-mat',2048,2048,c=>{
  c.fillStyle='#172329';c.fillRect(0,0,2048,2048);c.strokeStyle='#a3b1b2';c.lineWidth=1.6;
  for(let x=45;x<2020;x+=87){c.beginPath();c.moveTo(x,40);c.lineTo(x,2015);c.stroke();}
  for(let y=45;y<2020;y+=87){c.beginPath();c.moveTo(40,y);c.lineTo(2015,y);c.stroke();}
  c.lineWidth=3;for(let r=130;r<650;r+=78){c.beginPath();c.arc(1500,1570,r,0,Math.PI*2);c.stroke();}
  c.fillStyle='#bac6c3';c.font='23px Arial';for(let i=0;i<22;i++){c.fillText(String(i),53+i*87,35);c.fillText(String(i),7,75+i*87);}
  c.font='24px Arial';c.fillText('CUTTING MAT / A4',60,1980);
});

export const cupPrint=(detailed=false)=>canvasMap(detailed?'v04-cup-print-detailed':'v04-cup-print',2048,2048,c=>{
  c.textAlign='center';c.fillStyle='#272820';c.font='900 143px Arial';c.fillText('PLAYBOY',1024,1840);c.font='27px Arial';c.fillText('O B J E C T   L A B',1024,1900);
  c.fillStyle='#797769';
  if(detailed){
    c.font='24px Arial';c.fillText('УРОВЕНЬ НАЛИВА',710,1320);c.fillText('НЕ ПЕРЕЛИВАТЬ',1385,1320);
    c.strokeStyle='#979386';c.lineWidth=2;c.beginPath();c.moveTo(535,1355);c.lineTo(895,1355);c.moveTo(1210,1355);c.lineTo(1560,1355);c.stroke();
    c.beginPath();c.moveTo(1210,1286);c.bezierCurveTo(1182,1320,1201,1340,1210,1340);c.bezierCurveTo(1233,1340,1237,1320,1210,1286);c.fill();
  }else{c.font='18px Arial';c.fillText('PAPER / FOLD STUDY',1024,910);c.fillText('01 — FOLD',1024,1000);c.fillText('02 — REPEAT',1024,1080);c.fillText('PAPER OBJECT / 04',1024,1160);}
});

export const cupCreases=()=>{const t=canvasMap('v04-cup-crease-height',2048,2048,c=>{
  c.fillStyle='#808080';c.fillRect(0,0,2048,2048);c.strokeStyle='#565656';c.lineWidth=7;c.lineCap='round';c.shadowColor='#565656';c.shadowBlur=3;
  c.beginPath();c.moveTo(540,475);c.lineTo(720,670);c.lineTo(870,755);c.moveTo(1508,475);c.lineTo(1328,670);c.lineTo(1178,755);c.stroke();
  c.lineWidth=3;c.beginPath();c.moveTo(535,1370);c.lineTo(895,1370);c.moveTo(1210,1370);c.lineTo(1560,1370);c.stroke();
});t.colorSpace=T.NoColorSpace;return t;};

export const flapGuideInk=(which:number)=>canvasMap('v04-flap-guide-'+which,1024,1024,c=>{
  c.textAlign='center';c.fillStyle='rgba(75,76,65,.70)';c.font='40px Arial';c.fillText('FOLD / 0'+which,512,810);c.font='28px Arial';c.fillText('ПО ЛИНИИ СГИБА',512,860);
});
export const flapGuideEmboss=()=>{const t=canvasMap('v04-flap-guide-height',1024,1024,c=>{
  c.fillStyle='#808080';c.fillRect(0,0,1024,1024);c.strokeStyle='#b8b8b8';c.lineWidth=13;c.lineCap='round';c.lineJoin='round';
  c.beginPath();c.moveTo(330,530);c.bezierCurveTo(230,410,350,315,430,410);c.moveTo(430,410);c.lineTo(385,330);c.moveTo(430,410);c.lineTo(350,425);c.moveTo(620,410);c.lineTo(715,410);c.lineTo(715,540);c.moveTo(680,505);c.lineTo(715,540);c.lineTo(750,505);c.stroke();
});t.colorSpace=T.NoColorSpace;return t;};
export const orangeTabPrint=()=>canvasMap('v04-orange-tab',512,256,c=>{c.fillStyle='#de7637';c.fillRect(0,0,512,256);c.fillStyle='#fff3df';c.textAlign='center';c.font='700 52px Arial';c.fillText('FOLD / 01',256,155);});

export const graphitePoint=(p:number)=>({x:430+p*600,y:1390+p*34+Math.sin(p*9)*2});
export const graphiteMap=(progress:number)=>canvasMap(`v04-graphite-${Math.round(progress*1000000)}`,1536,2048,c=>{
  c.fillStyle='#efede1';c.fillRect(0,0,1536,2048);c.strokeStyle='#bdc4c1';c.lineWidth=1;
  for(let x=0;x<1536;x+=75){c.beginPath();c.moveTo(x,0);c.lineTo(x,2048);c.stroke();}for(let y=0;y<2048;y+=75){c.beginPath();c.moveTo(0,y);c.lineTo(1536,y);c.stroke();}
  c.strokeStyle='#666964';c.lineWidth=2;c.strokeRect(250,290,940,1390);
  c.beginPath();c.moveTo(430,1500);c.lineTo(345,630);c.bezierCurveTo(500,390,1000,390,1120,630);c.lineTo(1030,1500);c.stroke();
  c.strokeStyle='#383d39';c.lineWidth=3;c.beginPath();
  const n=Math.floor(progress*100);for(let i=0;i<=n;i++){const q=graphitePoint(i/100);i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y);}const end=graphitePoint(progress);c.lineTo(end.x,end.y);c.stroke();
});

export const skinBump=()=>canvasMap('v04-skin',512,512,c=>{
  let seed=419;const im=c.createImageData(512,512);for(let k=0;k<512*512;k++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const q=126+(seed/4294967296-.5)*35;im.data.set([q,q,q,255],k*4);}c.putImageData(im,0,0);
});
