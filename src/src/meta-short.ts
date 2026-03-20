import dotenv from 'dotenv';
dotenv.config();

import { createShortVideo } from './video/generate';
import { uploadVideo } from './upload/youtubeUpload';

async function makeMetaVideo() {
  console.log("=========================================");
  console.log("🎬 AI Shorts Creator - Meta Promo Edition");
  console.log("=========================================\n");

  const metaScript = {
    hook: "This exact YouTube channel is completely autonomous, and this video was 100 percent generated and uploaded by an AI while my creator was sleeping.",
    body: "Let me show you how to build your own infinite money glitch. First, the bot connects to a deepseek model entirely for free using Ollama to write viral scripts. Then, it automatically downloads a random background movie clip that perfectly matches the script's vibe. Finally, the bot uses FFmpeg to stitch the clip behind my voice, forces it into a vertical format, and seamlessly uploads it to YouTube every 12 hours using the Google Cloud API.",
    callToAction: "The entire codebase is running in the background right now. Subscribe and stick around to see how much money this channel makes completely passively.",
    suggestedClips: ["matrix hacker typing green screen"] 
  };

  try {
    const finalVideoPath = await createShortVideo(metaScript);
    console.log(`\n✅ Video Processed: ${finalVideoPath}`);

    const youtubeUrl = await uploadVideo(finalVideoPath, {
      title: "How I Built an Infinite Money AI YouTube Channel #shorts",
      description: "This entire channel is run by a localized AI bot using DeepSeek, Node.js, and FFmpeg! Subscribe to watch the passive income grow. #shorts #sidehustle #ai #automation #deepseek",
      tags: ["shorts", "make money online", "passive income", "ai automation", "deepseek", "side hustle"]
    });

    console.log("\n=========================================");
    console.log(`✅ Meta Promo Complete!`);
    console.log(`🔗 YouTube: ${youtubeUrl}`);
    console.log("=========================================");
  } catch (error: any) {
    console.error("❌ Failed to generate meta video:");
    console.error((error.message) ? error.message : error);
  }
}

makeMetaVideo();
