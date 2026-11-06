import * as THREE from 'three';

const cache = new Map<string, THREE.CanvasTexture>();
export const texture = (kind: 'wood' | 'paper' | 'label' | 'drawing' | 'clock' | 'shadow') => {
  const existing = cache.get(kind);
  if (existing) return existing;
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = kind === 'label' || kind === 'clock' ? 512 : 1024;
  const ctx = canvas.getContext('2d')!;
  let seed = 1871;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const {width: w, height: h} = canvas;
  if (kind === 'wood' || kind === 'paper') {
    const img = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const grain = Math.sin(y * 0.24 + Math.sin(x * 0.009) * 5.2 + Math.sin(y * 0.017) * 4);
        const fine = Math.sin(y * 1.7 + x * 0.003) * 2;
        const noise = (rand() - .5) * (kind === 'paper' ? 13 : 10);
        const delta = kind === 'wood' ? grain * 10 + fine + noise : noise;
        const base = kind === 'wood' ? [111, 75, 49] : [239, 234, 222];
        const i = (y * w + x) * 4;
        img.data[i] = base[0] + delta;
        img.data[i + 1] = base[1] + delta * .75;
        img.data[i + 2] = base[2] + delta * .5;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  if (kind === 'label') {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#252523';
    ctx.font = '500 128px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('FOLD', 512, 238);
    ctx.font = '30px Arial';
    ctx.fillText('P A P E R   S T U D Y   /   0 1', 512, 315);
    ctx.fillRect(375, 365, 274, 2);
    ctx.font = '24px Arial';
    ctx.fillText('FORM FOLLOWS CURIOSITY', 512, 410);
  }
  if (kind === 'drawing') {
    ctx.fillStyle = '#e7e1cf'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#ccd0c6'; ctx.lineWidth = 1;
    for (let i = 32; i < 1024; i += 32) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
    }
    ctx.fillStyle = '#3c565b'; ctx.font = '48px Arial'; ctx.fillText('FOLD / 01', 78, 96);
    ctx.font = '19px Arial'; ctx.fillText('PAPER ENGINEERING     /     FORM STUDY', 80, 130);
    ctx.strokeStyle = '#405b64'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(265, 720); ctx.lineTo(190, 300);
    ctx.bezierCurveTo(320, 355, 350, 200, 495, 290);
    ctx.bezierCurveTo(640, 200, 675, 355, 810, 300);
    ctx.lineTo(735, 720); ctx.quadraticCurveTo(500, 795, 265, 720); ctx.stroke();
    ctx.setLineDash([10, 8]); ctx.lineWidth = 2;
    for (const x of [285, 500, 715]) {
      ctx.beginPath(); ctx.moveTo(x, 320); ctx.lineTo(500 + (x - 500) * .65, 730); ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(135, 290); ctx.lineTo(135, 750); ctx.stroke();
    for (const y of [290, 750]) {ctx.beginPath();ctx.moveTo(115,y);ctx.lineTo(155,y);ctx.stroke();}
    ctx.save(); ctx.translate(110, 585); ctx.rotate(-Math.PI / 2);
    ctx.font = '25px Arial'; ctx.fillText('110 mm', 0, 0); ctx.restore();
    ctx.beginPath(); ctx.moveTo(275, 835); ctx.lineTo(735, 835); ctx.stroke();
    ctx.font = '26px Arial'; ctx.fillText('75 mm', 450, 872);
    ctx.font = '19px Arial'; ctx.fillText('SECTION A–A     /     1 : 1', 80, 960);
    ctx.fillText('LAB     /     06 NOV 2026', 650, 960);
  }
  if (kind === 'clock') {
    ctx.fillStyle = '#d4c9ab'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#34352e'; ctx.font = '240px Georgia'; ctx.textAlign = 'center';
    ctx.fillText('06:18', 512, 340);
    ctx.strokeStyle = '#9b947d';ctx.lineWidth = 3;ctx.beginPath();ctx.moveTo(30,255);ctx.lineTo(994,255);ctx.stroke();
    ctx.font = '24px Arial';ctx.fillText('STUDIO  /  SLOW MOMENTS',512,450);
  }
  if (kind === 'shadow') {
    const grad=ctx.createRadialGradient(512,512,40,512,512,500);
    grad.addColorStop(0,'rgba(14,10,5,0.65)');grad.addColorStop(.45,'rgba(14,10,5,0.26)');grad.addColorStop(1,'rgba(14,10,5,0)');
    ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  cache.set(kind, tex);
  return tex;
};
