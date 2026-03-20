export interface ScriptVariation {
  hook: string;
  body: string;
  callToAction: string;
  suggestedClips: string[];
}

import { getYouTubeTranscript } from './getTranscript';

const fallbackScript: ScriptVariation[] = [
  {
    hook: "This scene from Breaking Bad will change the way you think about fear...",
    body: "Walter White didn't just become Heisenberg overnight. He realized that living in fear is worse than death itself. Every single day, you are making a choice. You are either the one knocking, or the one hiding behind the door.",
    callToAction: "Subscribe if you want to become the danger.",
    suggestedClips: ["Breaking Bad Tuco confrontation scene", "Walter White I am the danger clip"]
  }
];

export async function analyzeAndGenerateScripts(
  topicIdOrUrl: string,
  format: { key: string; label: string; hasVoiceover: boolean; hashtags: string[] },
  originalTitle?: string,
  originalViewCount?: number
): Promise<ScriptVariation[]> {
  // Dynamically import youtube-transcript to get actual video captions
  let transcriptText = '';
  let videoId = topicIdOrUrl;

  // If it looks like a YouTube video ID, try to fetch captions using Python
  if (topicIdOrUrl && !topicIdOrUrl.includes(' ')) {
    try {
      console.log(`   📜 Pulling transcript from video: ${videoId}`);
      transcriptText = await getYouTubeTranscript(videoId);
      console.log(`   ✅ Transcript loaded (${transcriptText.length} chars)`);
    } catch (e: any) {
      console.log(`   ⚠️ Could not fetch transcript: ${e.message}. Using title analysis instead.`);
      transcriptText = `Video title: ${originalTitle || topicIdOrUrl}`;
    }
  } else {
    transcriptText = `Topic: ${topicIdOrUrl}`;
  }

  const viewContext = originalViewCount ? `(This video has ${originalViewCount.toLocaleString()} views — write something 10x better)'` : '';

  const formatInstructions: Record<string, string> = {
    "reddit-story": `FORMAT: REDDIT STORY (VOICEOVER READS THE POST)
- Hook is the Reddit post TITLE — juicy, scroll-stopping, curiosity-inducing
- Body IS the Reddit post — TTS voiceover narrates it. Split into narrative beats that escalate.
- Background clips: eerie gameplay (Roblox horror, Poppy Playtime), liminal spaces, dark atmospheric visuals
- suggestedClips: creepy Roblox horror moments, unsettling game scenes, "found footage" vibes
- Tone: narrator reads with slight urgency, like telling a campfire story
- Duration: 25-34 seconds max (Shorts format)
- End CTA: "Full story on my page" energy`,

    "roblox-gameplay": `FORMAT: ROBLOX GAMEPLAY STORY
- Hook names a specific Roblox game AND teases a wild moment
- Body narrates what happened in the game — commentate like you're a gaming YouTuber
- Background clips: Roblox gameplay, horror games, speedruns, Obby challenges
- suggestedClips: Roblox horror game moments, "wait for it" moments, impossible wins, brutal fails
- Tone: excited, energetic commentary, like you're showing your best friend a clip
- 45-55 seconds spoken pace`,

    "psychology-fact": `FORMAT: PSYCHOLOGY FACT DROP (NO VOICEOVER)
- Hook is ONE shocking psychology fact that stops the scroll
- Body delivers 3-5 FACTS, one at a time, screen fills with each fact
- Each fact = 1 screen, 10-15 seconds on screen, big bold white text
- Background: dark moody visuals, mysterious abstract clips
- No voiceover needed — let the text hit hard on its own
- suggestedClips: dark abstract visuals, dramatic close-ups, moody atmosphere`,

    "dark-psychology": `FORMAT: DARK PSYCHOLOGY (VOICEOVER)
- Hook is forbidden knowledge or a shocking psychological truth
- Body reveals the dark mechanics of human behavior — specific, not generic
- Background clips: cold calculating characters — Patrick Bateman, Tommy Shelby, Light Yagami, Walter White
- suggestedClips: scenes that show manipulation, power dynamics, psychological control
- Tone: menacing, knowing, like you're getting classified information
- 45-55 seconds`,

    "top5-countdown": `FORMAT: TOP 5 COUNTDOWN
- Hook names the topic and builds anticipation ("Top 5 most DEVASTATING moments...")
- Body counts down: "Number 5... [clip reveal]. Number 4... [clip reveal]..." — full countdown structure
- Each number revealed with a brief dramatic pause and a clip
- suggestedClips: exactly 5 clips, one per ranking position, each matching the drama of that rank
- Voiceover narrates what each clip is showing as it's revealed
- Total: 45-55 seconds`,

    "anime-breakdown": `FORMAT: ANIME BREAKDOWN
- Hook names the anime and teases the emotional/psychological depth
- Body flows: describe the scene → reveal its deeper meaning → connect to real life psychology
- Background clips: iconic emotional anime moments
- suggestedClips: Naruto healing Sasuke, Attack on Titan titan reveals, Jujutsu Kaisen cursed energy, One Piece Gear 5
- Tone: emotional, insightful, like you're sharing something profound with a friend
- 45-55 seconds`,

    "rick-morty": `FORMAT: RICK AND MORTY HIDDEN MEANING
- Hook teases the hidden philosophical layer of a Rick and Morty scene
- Body breaks down the dark science/philosophy in accessible, mind-blowing terms
- Background clips: iconic Rick and Morty scenes — Pickle Rick, Tiny Rick, Morty's Mind Blowers, Unity
- suggestedClips: Rick and Morty scenes that have layers of meaning
- Tone: intellectual, slightly unhinged, like you're high on your own supply of ideas
- 45-55 seconds`,
  };

  // Find the matching format instruction using the videoStyle parameter (passed from index.ts)
  const formatRule = formatInstructions[format.key] || formatInstructions["dark-psychology"];

  const prompt = `You are a viral Shorts mastermind. Your job is to write a script that PERFORMANCES BETTER than the competition.

VIRAL VIDEO DATA:
"${transcriptText}"
${viewContext}

Current date: ${new Date().toLocaleDateString()}

${formatRule}

HOOK: maximum viral energy, max 15 words. Must make someone stop scrolling in 0.3 seconds.
BODY: 45-55 seconds spoken pace (~100-120 words). Every sentence ESCALATES — no flat lines, no filler.
CTA: "You're not on this page yet..." energy — feels like a gift, not a request.

Return ONLY valid JSON (no markdown):
[
  {
    "hook": "string",
    "body": "string",
    "callToAction": "string",
    "suggestedClips": ["scene 1", "scene 2", ...]
  }
]`;

  const MODELS = [
    'deepseek-v3.1:671b-cloud',
    'qwen2.5:14b',
    'llama3.1:8b',
    'mistral:7b',
  ];

  for (const modelName of MODELS) {
    try {
      console.log(`   💭 Trying ${modelName}...`);
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          prompt: prompt,
          stream: false,
          format: 'json',
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const responseText = data.response;

      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        const jsonMatch = responseText.match(/\[[\s\S]*\]/s) || responseText.match(/\{[\s\S]*\}/s);
        if (!jsonMatch) throw new Error('Invalid JSON');
        parsed = JSON.parse(jsonMatch[0]);
      }

      const result = Array.isArray(parsed) ? parsed : [parsed];
      if (result[0]?.hook && result[0]?.body) {
        console.log(`   ✅ Success with ${modelName}`);
        return result;
      }
    } catch (e: any) {
      console.log(`   ⚠️  ${modelName} failed: ${e.message}`);
    }
  }

  // Nothing worked — use fallback
  console.warn('   ⚠️  All models failed. Using fallback script.');
  return fallbackScript;
}
