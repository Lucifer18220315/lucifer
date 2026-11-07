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
import {LightingReadableV041} from './v041/LightingReadable';
import {HookV042} from './v042/Hook';

import {EditV05B} from './v05b/Edit';
import {HookSetupV05B} from './v05b/HookSetup';
import {EditV05} from './v05/Edit';
import {EditV05Control} from './v05/EditControl';
import {FilmV05} from './v05/Film';
import {HookSetupV05,HookDetailV05,HookResultV05} from './v05/Hook';
import {LightingV05} from './v05/LightingV05';
import {TabletopV05} from './v05/TabletopV05';
import {BlueprintV05} from './v05/BlueprintV05';
import {PagesV05} from './v05/PagesV05';
import {FlipbookV05} from './v05/FlipbookV05';
import {FoldingV05} from './v05/FoldingV05';
import {PourV05} from './v05/PourV05';
import {SweepV05} from './v05/SweepV05';
import {PencilHandV05} from './v05/PencilHandV05';
import {PencilMacroV05} from './v05/PencilMacroV05';
import {ClockV05} from './v05/ClockV05';
import {ReturnV05} from './v05/ReturnV05';

export const Root = () => <>
  <Composition id="HookSetupV05B" component={HookSetupV05B} width={720} height={1280} fps={SOURCE_FPS} durationInFrames={36}/>
  <Composition id="EditV05B" component={EditV05B} width={720} height={1280} fps={SOURCE_FPS} durationInFrames={423}/>
  <Composition id="EditV05" component={EditV05} width={720} height={1280} fps={SOURCE_FPS} durationInFrames={423}/>
  <Composition id="EditV05Control" component={EditV05Control} width={720} height={1280} fps={SOURCE_FPS} durationInFrames={423}/>
  <Composition id="FullRemakeV05" component={FilmV05} width={720} height={1280} fps={SOURCE_FPS} durationInFrames={423}/>
  <Folder name="V05-Shots">
    <Composition id="LightingV05" component={LightingV05} width={720} height={1280} fps={SOURCE_FPS} durationInFrames={94}/>
    <Composition id="TabletopV05" component={TabletopV05} width={720} height={1280} fps={SOURCE_FPS} durationInFrames={60}/>
    <Composition id="BlueprintV05" component={BlueprintV05} width={720} height={1280} fps={SOURCE_FPS} durationInFrames={15}/>
    <Composition id="PagesV05" component={PagesV05} width={720} height={1280} fps={SOURCE_FPS} durationInFrames={31}/>
    <Composition id="FlipbookV05" component={FlipbookV05} width={720} height={1280} fps={SOURCE_FPS} durationInFrames={31}/>
    <Composition id="FoldingV05" component={FoldingV05} width={720} height={1280} fps={SOURCE_FPS} durationInFrames={38}/>
    <Composition id="PourV05" component={PourV05} width={720} height={1280} fps={SOURCE_FPS} durationInFrames={61}/>
    <Composition id="SweepV05" component={SweepV05} width={720} height={1280} fps={SOURCE_FPS} durationInFrames={14}/>
    <Composition id="PencilHandV05" component={PencilHandV05} width={720} height={1280} fps={SOURCE_FPS} durationInFrames={9}/>
    <Composition id="PencilMacroV05" component={PencilMacroV05} width={720} height={1280} fps={SOURCE_FPS} durationInFrames={13}/>
    <Composition id="ClockV05" component={ClockV05} width={720} height={1280} fps={SOURCE_FPS} durationInFrames={26}/>
    <Composition id="ReturnV05" component={ReturnV05} width={720} height={1280} fps={SOURCE_FPS} durationInFrames={31}/>
    <Composition id="HookSetupV05" component={HookSetupV05} width={720} height={1280} fps={SOURCE_FPS} durationInFrames={36}/>
    <Composition id="HookDetailV05" component={HookDetailV05} width={720} height={1280} fps={SOURCE_FPS} durationInFrames={30}/>
    <Composition id="HookResultV05" component={HookResultV05} width={720} height={1280} fps={SOURCE_FPS} durationInFrames={28}/>
  </Folder>
  <Composition id="HookV042" component={HookV042} width={720} height={1280} fps={SOURCE_FPS} durationInFrames={94}/>
  <Composition id="LightingReadableV041" component={LightingReadableV041} width={720} height={1280} fps={SOURCE_FPS} durationInFrames={94}/>
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
