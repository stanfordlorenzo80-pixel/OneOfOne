import { Composition } from 'remotion';
import { TikTokShort } from './TikTokShort';
import React from 'react';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TikTokShort"
        component={TikTokShort}
        durationInFrames={60 * 60} // Will be overridden via CLI duration
        fps={60}
        width={1080}
        height={1920}
        defaultProps={{
          hook: "Sigma Grindset",
          audioUrl: "",
          videoUrl: ""
        }}
      />
    </>
  );
};
