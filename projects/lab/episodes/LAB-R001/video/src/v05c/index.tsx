import React from 'react';
import {registerRoot,Composition} from 'remotion';
import {FlipbookV05C} from './Flipbook';
import {EditV05C} from './Edit';
const Root=()=> <>
 <Composition id="EditV05C" component={EditV05C} width={720} height={1280} fps={2997/125} durationInFrames={423}/>
 <Composition id="FlipbookV05C" component={FlipbookV05C} width={720} height={1280} fps={2997/125} durationInFrames={31}/>
</>;
registerRoot(Root);
