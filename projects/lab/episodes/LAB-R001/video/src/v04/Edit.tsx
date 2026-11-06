import React from 'react';
import {AbsoluteFill,Series,staticFile,useVideoConfig} from 'remotion';
import {Audio,Video} from '@remotion/media';

// The final edit has twelve independently editable clips, timed to the source.
export const EditV04=()=>{const {fps}=useVideoConfig();return <AbsoluteFill>
  <Series>
    <Series.Sequence name="01 Свет" durationInFrames={94} premountFor={Math.ceil(fps)}><Video src={staticFile('v04-clips/LightingV04.mp4')} premountFor={Math.ceil(fps)}/></Series.Sequence>
    <Series.Sequence name="02 Обход стола" durationInFrames={60} premountFor={Math.ceil(fps)}><Video src={staticFile('v04-clips/TabletopV04.mp4')} premountFor={Math.ceil(fps)}/></Series.Sequence>
    <Series.Sequence name="03 Подъезд к чертежу" durationInFrames={15} premountFor={Math.ceil(fps)}><Video src={staticFile('v04-clips/BlueprintV04.mp4')} premountFor={Math.ceil(fps)}/></Series.Sequence>
    <Series.Sequence name="04 Листание" durationInFrames={31} premountFor={Math.ceil(fps)}><Video src={staticFile('v04-clips/PagesV04.mp4')} premountFor={Math.ceil(fps)}/></Series.Sequence>
    <Series.Sequence name="05 Блокнот" durationInFrames={31} premountFor={Math.ceil(fps)}><Video src={staticFile('v04-clips/FlipbookV04.mp4')} premountFor={Math.ceil(fps)}/></Series.Sequence>
    <Series.Sequence name="06 Stop motion" durationInFrames={38} premountFor={Math.ceil(fps)}><Video src={staticFile('v04-clips/FoldingV04.mp4')} premountFor={Math.ceil(fps)}/></Series.Sequence>
    <Series.Sequence name="07 Налив" durationInFrames={61} premountFor={Math.ceil(fps)}><Video src={staticFile('v04-clips/PourV04.mp4')} premountFor={Math.ceil(fps)}/></Series.Sequence>
    <Series.Sequence name="08 Карточка" durationInFrames={14} premountFor={Math.ceil(fps)}><Video src={staticFile('v04-clips/SweepV04.mp4')} premountFor={Math.ceil(fps)}/></Series.Sequence>
    <Series.Sequence name="09 Карандаш в руке" durationInFrames={9} premountFor={Math.ceil(fps)}><Video src={staticFile('v04-clips/PencilHandV04.mp4')} premountFor={Math.ceil(fps)}/></Series.Sequence>
    <Series.Sequence name="10 Макро по действию" durationInFrames={13} premountFor={Math.ceil(fps)}><Video src={staticFile('v04-clips/PencilMacroV04.mp4')} premountFor={Math.ceil(fps)}/></Series.Sequence>
    <Series.Sequence name="11 Перекидные часы" durationInFrames={26} premountFor={Math.ceil(fps)}><Video src={staticFile('v04-clips/ClockV04.mp4')} premountFor={Math.ceil(fps)}/></Series.Sequence>
    <Series.Sequence name="12 Возврат рукой" durationInFrames={31} premountFor={Math.ceil(fps)}><Video src={staticFile('v04-clips/ReturnV04.mp4')} premountFor={Math.ceil(fps)}/></Series.Sequence>
  </Series>
  <Audio src={staticFile('v04-reference-audio.m4a')} premountFor={Math.ceil(fps)}/>
</AbsoluteFill>;};
