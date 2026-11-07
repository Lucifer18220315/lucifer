import * as T from 'three';
import {useSurfaces as useBase,canvasMap} from '../v03/materials';
export {canvasMap} from '../v03/materials';

export function useSurfaces(){
  const base=useBase();
  const color=canvasMap('v05-neutral-paper',2048,2048,c=>{
    c.drawImage(base.paper[0].image,0,0,2048,2048);
    const pixels=c.getImageData(0,0,2048,2048);
    for(let i=0;i<pixels.data.length;i+=4){
      const g=(pixels.data[i]*.2126+pixels.data[i+1]*.7152+pixels.data[i+2]*.0722)*.90+10;
      pixels.data[i]=g;pixels.data[i+1]=g;pixels.data[i+2]=g*1.003;
    }
    c.putImageData(pixels,0,0);
  });
  color.wrapS=color.wrapT=T.RepeatWrapping;
  const gobo=canvasMap('v05-diagonal-window-gobo',512,512,c=>{
    c.fillStyle='#000';c.fillRect(0,0,512,512);c.translate(256,256);c.rotate(-.38);
    const gradient=c.createLinearGradient(0,-120,0,120);
    gradient.addColorStop(0,'#000');gradient.addColorStop(.12,'#fff');
    gradient.addColorStop(.85,'#fff');gradient.addColorStop(1,'#000');
    c.fillStyle=gradient;c.fillRect(-330,-120,660,240);
  });
  return {...base,paper:[color,base.paper[1],base.paper[2]],gobo};
}
