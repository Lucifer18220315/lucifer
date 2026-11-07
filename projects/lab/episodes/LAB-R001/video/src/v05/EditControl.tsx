import React from 'react';
import {AbsoluteFill,Series,staticFile,useVideoConfig} from 'remotion';
import {Audio,Video} from '@remotion/media';

// The final edit has twelve independently editable clips, timed to the source.
export const EditV05Control=()=>{const {fps}=useVideoConfig();return <AbsoluteFill>
  <Series>
    <Series.Sequence name="01 Свет" durationInFrames={94} premountFor={Math.ceil(fps)}><Video src={staticFile('v05-clips/LightingV05.mp4')} premountFor={Math.ceil(fps)}/></Series.Sequence>
    <Series.Sequence name="02 Обход стола" durationInFrames={60} premountFor={Math.ceil(fps)}><Video src={staticFile('v05-clips/TabletopV05.mp4')} premountFor={Math.ceil(fps)}/></Series.Sequence>
    <Series.Sequence name="03 Подъезд к чертежу" durationInFrames={15} premountFor={Math.ceil(fps)}><Video src={staticFile('v05-clips/BlueprintV05.mp4')} premountFor={Math.ceil(fps)}/></Series.Sequence>
    <Series.Sequence name="04 Листание" durationInFrames={31} premountFor={Math.ceil(fps)}><Video src={staticFile('v05-clips/PagesV05.mp4')} premountFor={Math.ceil(fps)}/></Series.Sequence>
    <Series.Sequence name="05 Блокнот" durationInFrames={31} premountFor={Math.ceil(fps)}><Video src={staticFile('v05-clips/FlipbookV05.mp4')} premountFor={Math.ceil(fps)}/></Series.Sequence>
    <Series.Sequence name="06 Stop motion" durationInFrames={38} premountFor={Math.ceil(fps)}><Video src={staticFile('v05-clips/FoldingV05.mp4')} premountFor={Math.ceil(fps)}/></Series.Sequence>
    <Series.Sequence name="07 Налив" durationInFrames={61} premountFor={Math.ceil(fps)}><Video src={staticFile('v05-clips/PourV05.mp4')} premountFor={Math.ceil(fps)}/></Series.Sequence>
    <Series.Sequence name="08 Карточка" durationInFrames={14} premountFor={Math.ceil(fps)}><Video src={staticFile('v05-clips/SweepV05.mp4')} premountFor={Math.ceil(fps)}/></Series.Sequence>
    <Series.Sequence name="09 Карандаш в руке" durationInFrames={9} premountFor={Math.ceil(fps)}><Video src={staticFile('v05-clips/PencilHandV05.mp4')} premountFor={Math.ceil(fps)}/></Series.Sequence>
    <Series.Sequence name="10 Макро по действию" durationInFrames={13} premountFor={Math.ceil(fps)}><Video src={staticFile('v05-clips/PencilMacroV05.mp4')} premountFor={Math.ceil(fps)}/></Series.Sequence>
    <Series.Sequence name="11 Перекидные часы" durationInFrames={26} premountFor={Math.ceil(fps)}><Video src={staticFile('v05-clips/ClockV05.mp4')} premountFor={Math.ceil(fps)}/></Series.Sequence>
    <Series.Sequence name="12 Возврат рукой" durationInFrames={31} premountFor={Math.ceil(fps)}><Video src={staticFile('v05-clips/ReturnV05.mp4')} premountFor={Math.ceil(fps)}/></Series.Sequence>
  </Series>
  <Audio src={staticFile('v04-reference-audio.m4a')} premountFor={Math.ceil(fps)}/>
</AbsoluteFill>;};
