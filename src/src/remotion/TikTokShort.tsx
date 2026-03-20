import { AbsoluteFill, Audio, Video, useCurrentFrame, useVideoConfig, spring, staticFile } from 'remotion';
import React from 'react';

export const TikTokShort: React.FC<{hook: string, audioUrl: string, videoUrl: string}> = ({ hook, audioUrl, videoUrl }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const scale = spring({
    fps,
    frame,
    config: { mass: 1.5, damping: 12, stiffness: 150 },
  });

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {videoUrl && <Video src={staticFile(videoUrl)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loop />}
      
      {frame < fps * 4 && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div style={{
            color: 'white',
            fontSize: '90px',
            fontFamily: 'Impact, sans-serif, Arial',
            textAlign: 'center',
            textTransform: 'uppercase',
            lineHeight: '1.1',
            textShadow: '8px 8px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000, 2px 2px 0px #000',
            transform: `scale(${scale})`,
            padding: '40px',
            maxWidth: '1000px',
            WebkitTextStroke: '2px black'
          }}>
            {hook}
          </div>
        </AbsoluteFill>
      )}

      {frame > fps * 54 && (
        <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: '200px' }}>
          <div style={{ color: 'yellow', fontSize: '65px', fontFamily: 'Impact, sans-serif, Arial', textTransform: 'uppercase', textShadow: '5px 5px 0px #000', WebkitTextStroke: '1px black' }}>
            Follow For More Psychological Secrets
          </div>
        </AbsoluteFill>
      )}

      {audioUrl && <Audio src={staticFile(audioUrl)} />}
    </AbsoluteFill>
  );
};
