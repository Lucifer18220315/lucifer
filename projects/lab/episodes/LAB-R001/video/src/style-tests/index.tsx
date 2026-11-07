import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {LiveVFX} from './LiveVFX';
import {Tactile} from './Tactile';
import {Collage} from './Collage';
import {Thriller} from './Thriller';
import {Portrait} from './Portrait';
import {Surreal} from './Surreal';
import {Kinetic} from './Kinetic';
import {MusicCut} from './MusicCut';
import {FilmLook} from './FilmLook';
import {Screen} from './Screen';
const Root=()=> <>
 <Composition id="Style01" component={LiveVFX} durationInFrames={144} fps={24} width={720} height={1280}/>
 <Composition id="Style02" component={Tactile} durationInFrames={144} fps={24} width={720} height={1280}/>
 <Composition id="Style03" component={Kinetic} durationInFrames={144} fps={24} width={720} height={1280}/>
 <Composition id="Style04" component={Collage} durationInFrames={144} fps={24} width={720} height={1280}/>
 <Composition id="Style05" component={Thriller} durationInFrames={144} fps={24} width={720} height={1280}/>
 <Composition id="Style06" component={Portrait} durationInFrames={144} fps={24} width={720} height={1280}/>
 <Composition id="Style07" component={Surreal} durationInFrames={144} fps={24} width={720} height={1280}/>
 <Composition id="Style08" component={MusicCut} durationInFrames={144} fps={24} width={720} height={1280}/>
 <Composition id="Style09" component={FilmLook} durationInFrames={144} fps={24} width={720} height={1280}/>
 <Composition id="Style10" component={Screen} durationInFrames={144} fps={24} width={720} height={1280}/>
</>;
registerRoot(Root);
