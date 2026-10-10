import React from 'react';
import {Composition} from 'remotion';
import {ViagemMisteriosa, Previa, PREVIEW_FRAMES} from './Video';
import {FPS, TOTAL_FRAMES} from './scenes';

export const Root: React.FC = () => (
  <>
    <Composition id="ViagemMisteriosa" component={ViagemMisteriosa} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
    <Composition id="Previa" component={Previa} durationInFrames={PREVIEW_FRAMES} fps={FPS} width={1920} height={1080} />
  </>
);
