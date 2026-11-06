import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';

// Native 720×1280 positions. Readable text is separate from the expensive 3D
// plates, so changing typography never requires simplifying the scene.
export const LIGHT_STATES = [0, 7, 22, 38, 54, 74];
export const LIGHT_LABELS = [
  {from: 7, to: 22, text: 'ОСНОВНОЙ СВЕТ', x: 436, y: 320, width: 240},
  {from: 22, to: 38, text: 'КОНТУРНЫЙ СВЕТ', x: 436, y: 320, width: 240},
  {from: 38, to: 54, text: 'ЗАПОЛНЕНИЕ', x: 436, y: 320, width: 240},
  {from: 54, to: 74, text: 'СВЕТ ФОНА', x: 426, y: 246, width: 250},
  {from: 74, to: 94, text: 'СВЕТ МАРКИРОВКИ', x: 380, y: 806, width: 296},
];

export const LightingReadableV041: React.FC = () => {
  const frame = useCurrentFrame();
  const phase = LIGHT_STATES.filter(value => value <= frame).at(-1)!;
  const label = LIGHT_LABELS.find(item => frame >= item.from && frame < item.to);
  return <AbsoluteFill style={{backgroundColor: '#121412'}}>
    <Img src={staticFile(`v041-plates/light-${phase}.png`)}
      style={{width: 720, height: 1280}}/>
    {label && <div data-light-label style={{
      position: 'absolute', left: label.x, top: label.y, width: label.width,
      boxSizing: 'border-box', padding: 0,
      textShadow: '0 1px 2px rgba(0,0,0,0.45)',
      fontFamily: 'Arial, sans-serif', fontSize: 24, fontWeight: 500,
      lineHeight: 1.15, letterSpacing: 0.45, color: '#f3eee2', whiteSpace: 'nowrap',
    }}>{label.text}</div>}
  </AbsoluteFill>;
};
