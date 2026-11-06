import React from 'react';
import {AbsoluteFill, Series, staticFile, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {Lighting} from './scenes/Lighting';
import {Tabletop} from './scenes/Tabletop';
import {Drawing} from './scenes/Drawing';
import {Hero} from './scenes/Hero';
import {Water} from './scenes/Water';
import {Label} from './scenes/Label';
import {PencilScene} from './scenes/PencilScene';
import {Clock} from './scenes/Clock';
import {Return} from './scenes/Return';
export const Film = () => {
  const {fps} = useVideoConfig();
  return <AbsoluteFill>
    <Series>
    <Series.Sequence name="Lighting" durationInFrames={96} premountFor={fps}><Lighting/></Series.Sequence>
    <Series.Sequence name="Tabletop" durationInFrames={58} premountFor={fps}><Tabletop/></Series.Sequence>
    <Series.Sequence name="Drawing" durationInFrames={77} premountFor={fps}><Drawing/></Series.Sequence>
    <Series.Sequence name="Hero" durationInFrames={38} premountFor={fps}><Hero/></Series.Sequence>
    <Series.Sequence name="Water" durationInFrames={62} premountFor={fps}><Water/></Series.Sequence>
    <Series.Sequence name="Label" durationInFrames={14} premountFor={fps}><Label/></Series.Sequence>
    <Series.Sequence name="PencilScene" durationInFrames={22} premountFor={fps}><PencilScene/></Series.Sequence>
    <Series.Sequence name="Clock" durationInFrames={26} premountFor={fps}><Clock/></Series.Sequence>
    <Series.Sequence name="Return" durationInFrames={39} premountFor={fps}><Return/></Series.Sequence>
    </Series>
    <Audio src={staticFile('sound-design.m4a')} premountFor={fps} volume={0.8}/>
  </AbsoluteFill>;
};
