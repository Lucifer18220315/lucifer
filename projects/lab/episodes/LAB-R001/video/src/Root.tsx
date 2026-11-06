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
import {FilmV04} from './v04/Film';
import {EditV04} from './v04/Edit';
import {SOURCE_FPS} from './v04/Stage';
import {LightingV04} from './v04/LightingV04';
import {TabletopV04} from './v04/TabletopV04';
import {BlueprintV04} from './v04/BlueprintV04';
import {PagesV04} from './v04/PagesV04';
import {FlipbookV04} from './v04/FlipbookV04';
import {FoldingV04} from './v04/FoldingV04';
import {PourV04} from './v04/PourV04';
import {SweepV04} from './v04/SweepV04';
import {PencilHandV04} from './v04/PencilHandV04';
import {PencilMacroV04} from './v04/PencilMacroV04';
import {ClockV04} from './v04/ClockV04';
import {ReturnV04} from './v04/ReturnV04';

export const Root = () => <>
  <Composition id="EditV04" component={EditV04} width={720} height={1280} fps={SOURCE_FPS} durationInFrames={423}/>
  <Composition id="FullRemakeV04" component={FilmV04} width={1080} height={1920} fps={SOURCE_FPS} durationInFrames={423}/>
  <Composition id="FullRemakeV04Motion" component={FilmV04} width={1080} height={1920} fps={SOURCE_FPS*2} durationInFrames={846}/>
  <Folder name="V04-Shots">
    <Composition id="LightingV04" component={LightingV04} width={1080} height={1920} fps={SOURCE_FPS} durationInFrames={94}/>
    <Composition id="TabletopV04" component={TabletopV04} width={1080} height={1920} fps={SOURCE_FPS} durationInFrames={60}/>
    <Composition id="BlueprintV04" component={BlueprintV04} width={1080} height={1920} fps={SOURCE_FPS} durationInFrames={15}/>
    <Composition id="PagesV04" component={PagesV04} width={1080} height={1920} fps={SOURCE_FPS} durationInFrames={31}/>
    <Composition id="FlipbookV04" component={FlipbookV04} width={1080} height={1920} fps={SOURCE_FPS} durationInFrames={31}/>
    <Composition id="FoldingV04" component={FoldingV04} width={1080} height={1920} fps={SOURCE_FPS} durationInFrames={38}/>
    <Composition id="PourV04" component={PourV04} width={1080} height={1920} fps={SOURCE_FPS} durationInFrames={61}/>
    <Composition id="SweepV04" component={SweepV04} width={1080} height={1920} fps={SOURCE_FPS} durationInFrames={14}/>
    <Composition id="PencilHandV04" component={PencilHandV04} width={1080} height={1920} fps={SOURCE_FPS} durationInFrames={9}/>
    <Composition id="PencilMacroV04" component={PencilMacroV04} width={1080} height={1920} fps={SOURCE_FPS} durationInFrames={13}/>
    <Composition id="ClockV04" component={ClockV04} width={1080} height={1920} fps={SOURCE_FPS} durationInFrames={26}/>
    <Composition id="ReturnV04" component={ReturnV04} width={1080} height={1920} fps={SOURCE_FPS} durationInFrames={31}/>
  </Folder>
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
