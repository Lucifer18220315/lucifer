import React from 'react';
import {AbsoluteFill, Img, Series, staticFile, useVideoConfig} from 'remotion';
import {Video} from '@remotion/media';

const textStyle: React.CSSProperties = {
  position: 'absolute', fontFamily: 'Arial, sans-serif', fontSize: 24,
  fontWeight: 500, lineHeight: 1.15, letterSpacing: .45, color: '#f3eee2',
  whiteSpace: 'nowrap', textShadow: '0 1px 2px rgba(0,0,0,.45)',
};

const LightPlate = ({phase, text, x=436, y=320}: {
  phase: number; text?: string; x?: number; y?: number;
}) => <AbsoluteFill>
  <Img src={staticFile(`v041-plates/light-${phase}.png`)} style={{width:720,height:1280}}/>
  {text && <div style={{...textStyle,left:x,top:y}}>{text}</div>}
</AbsoluteFill>;

const Question = () => <div style={{...textStyle,left:54,top:210,width:612,textAlign:'center'}}>
  Зачем стакану столько света?
</div>;

// 94 source-timed frames: the hook is a separate experiment. Every action
// after this opening remains at its original time, including the full fold.
export const HookV042 = () => {
  const {fps}=useVideoConfig();
  return <AbsoluteFill style={{backgroundColor:'#121412',overflow:'hidden'}}>
    <Series>
      <Series.Sequence name="01 Действие и вопрос" durationInFrames={24} premountFor={Math.ceil(fps)}>
        <AbsoluteFill style={{overflow:'hidden'}}>
          <Video src={staticFile('v04-clips/FoldingV04.mp4')} trimBefore={14}
            muted objectFit="cover" premountFor={Math.ceil(fps)}
            style={{width:720,height:1280,scale:1.12,transformOrigin:'50% 42%'}}/>
        </AbsoluteFill>
        <Question/>
      </Series.Sequence>
      <Series.Sequence name="02 До света" durationInFrames={10} premountFor={Math.ceil(fps)}>
        <LightPlate phase={0}/><Question/>
      </Series.Sequence>
      <Series.Sequence name="03 Основной" durationInFrames={12} premountFor={Math.ceil(fps)}>
        <LightPlate phase={7} text="ОСНОВНОЙ СВЕТ"/>
      </Series.Sequence>
      <Series.Sequence name="04 Контурный" durationInFrames={12} premountFor={Math.ceil(fps)}>
        <LightPlate phase={22} text="КОНТУРНЫЙ СВЕТ"/>
      </Series.Sequence>
      <Series.Sequence name="05 Заполнение" durationInFrames={12} premountFor={Math.ceil(fps)}>
        <LightPlate phase={38} text="ЗАПОЛНЕНИЕ"/>
      </Series.Sequence>
      <Series.Sequence name="06 Фон" durationInFrames={12} premountFor={Math.ceil(fps)}>
        <LightPlate phase={54} text="СВЕТ ФОНА" x={426} y={246}/>
      </Series.Sequence>
      <Series.Sequence name="07 Маркировка" durationInFrames={12} premountFor={Math.ceil(fps)}>
        <LightPlate phase={74} text="СВЕТ МАРКИРОВКИ" x={380} y={806}/>
      </Series.Sequence>
    </Series>
  </AbsoluteFill>;
};
