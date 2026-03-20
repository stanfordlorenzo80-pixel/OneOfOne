/**
 * Quick test script that runs just the Trend Discovery + AI Script Generation.
 * Skips FFmpeg video stitching (run separately or on your local machine).
 * Outputs the generated script and voiceover audio file.
 */
import dotenv from 'dotenv';
dotenv.config();

import { getTrendingShorts } from './trends/fetchTrends';
import { analyzeAndGenerateScripts } from './ai/generateScript';
import fs from 'fs';
import path from 'path';

async function testPipeline() {
  console.log("=========================================");
  console.log("🚀 AI Shorts Creator - Pipeline Test");
  console.log("=========================================\n");
  
  // 1. Fetch Trends
  console.log("[1/3] 🔍 Finding trending Shorts...");
  let topVideo;
  try {
    const trends = await getTrendingShorts("Movie scenes that hit different");
    if (trends.length === 0) {
      console.log("   ⚠️  No results. Using fallback topic.");
      topVideo = { id: '', title: 'Movie scenes that hit different', viewCount: 0 };
    } else {
      topVideo = trends[0];
      console.log(`   ✅ Found: "${topVideo.title}" (${topVideo.viewCount.toLocaleString()} views)`);
    }
  } catch (err: any) {
    console.log(`   ⚠️  YouTube API error: ${err.message}. Using fallback.`);
    topVideo = { id: '', title: 'Movie scenes that hit different', viewCount: 0 };
  }

  // 2. Generate Commentary Scripts
  console.log("\n[2/3] 🧠 Generating movie-commentary scripts with Gemini AI...");
  const dummyFormat = { key: 'reddit-story', label: '📖 Reddit Story', hasVoiceover: true, hashtags: ['reddit'] };
  const scripts = await analyzeAndGenerateScripts(topVideo.id || 'motivation movie clips', dummyFormat, topVideo.title, topVideo.viewCount);
  
  console.log("\n📝 Generated Scripts:");
  scripts.forEach((s, i) => {
    console.log(`\n--- Script ${i + 1} ---`);
    console.log(`🎣 Hook: "${s.hook}"`);
    console.log(`📖 Body: "${s.body}"`);
    console.log(`📢 CTA: "${s.callToAction}"`);
    console.log(`🎬 Clips: ${s.suggestedClips?.join(', ') || 'N/A'}`);
  });

  // 3. Generate Voiceover with Edge TTS
  console.log("\n[3/3] 🎙️  Generating Voiceover with FREE Edge TTS...");
  const selectedScript = scripts[0];
  const fullScript = `${selectedScript.hook} ${selectedScript.body} ${selectedScript.callToAction}`;
  
  const tempDir = path.resolve(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  
  try {
    const gTTS = (await import('gtts')).default;
    const tts = new gTTS(fullScript, 'en');
    const audioFile = path.join(tempDir, `voiceover_${Date.now()}.mp3`);
    
    await new Promise<void>((resolve, reject) => {
      tts.save(audioFile, (err: any) => {
        if (err) return reject(err);
        resolve();
      });
    });
    
    console.log(`   ✅ Voiceover saved: ${audioFile}`);
  } catch (err: any) {
    console.log(`   ⚠️  TTS error: ${err.message}`);
  }

  console.log("\n=========================================");
  console.log("✅ Pipeline test complete!");
  console.log("=========================================");
}

testPipeline().catch(console.error);
