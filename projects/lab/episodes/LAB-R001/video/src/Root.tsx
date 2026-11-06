import React from 'react';
import {Composition, Folder} from 'remotion';
import {Film} from './Film';
import {Lighting} from './scenes/Lighting';
import {Tabletop} from './scenes/Tabletop';
import {Drawing} from './scenes/Drawing';
import {Hero} from './scenes/Hero';
import {Water} from './scenes/Water';
import {Label} from './scenes/Label';
import {PencilScene} from './scenes/PencilScene';
import {Clock} from './scenes/Clock';
import {Return} from './scenes/Return';
import {LightStudy} from './v02/LightStudy';
import {FilmV03,V03_FRAMES} from './v03/Film';
export const Root = () => <>
  <Composition id="FoldLightV03" component={FilmV03} width={1080} height={1920} fps={24} durationInFrames={V03_FRAMES}/>
  <Composition id="FoldLightV02" component={LightStudy} width={1080} height={1920} fps={24} durationInFrames={120}/>
  <Composition id="FoldStudy" component={Film} width={1080} height={1920} fps={24} durationInFrames={432}/>
  <Folder name="Scenes">
      <Composition id="Lighting" component={Lighting} width={1080} height={1920} fps={24} durationInFrames={96}/>
      <Composition id="Tabletop" component={Tabletop} width={1080} height={1920} fps={24} durationInFrames={58}/>
      <Composition id="Drawing" component={Drawing} width={1080} height={1920} fps={24} durationInFrames={77}/>
      <Composition id="Hero" component={Hero} width={1080} height={1920} fps={24} durationInFrames={38}/>
      <Composition id="Water" component={Water} width={1080} height={1920} fps={24} durationInFrames={62}/>
      <Composition id="Label" component={Label} width={1080} height={1920} fps={24} durationInFrames={14}/>
      <Composition id="PencilScene" component={PencilScene} width={1080} height={1920} fps={24} durationInFrames={22}/>
      <Composition id="Clock" component={Clock} width={1080} height={1920} fps={24} durationInFrames={26}/>
      <Composition id="Return" component={Return} width={1080} height={1920} fps={24} durationInFrames={39}/>
  </Folder>
</>;
