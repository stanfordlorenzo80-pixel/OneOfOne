import dotenv from 'dotenv';
dotenv.config();

import { findBestNiches } from './niche-finder.js';
import { generateScriptForNiche } from './script-generator.js';
import { generateVideo } from './video-generator.js';
import { uploadToYoutube } from './uploader/uploadYoutube.js';
import { uploadToTiktok } from './uploader/uploadTiktok.js';
import { uploadToMeta } from './uploader/uploadMeta.js';
import { postProcess } from './post-processor.js';
import { logUpload, getStatsSummary } from './lib/analytics.js';
import { getRotatedCPALink } from './lib/cpaRotator.js';
import { runCleanup } from './cleanup.js';
import { checkLicense } from './lib/license.js';
import inquirer from 'inquirer';

const VIDEO_FORMATS = [
  { key: 'reddit-aita', label: '📖 Reddit AITA Story', hasVoiceover: true, hashtags: ['reddit', 'aita', 'storytime'] },
  { key: 'movie-clips', label: '🎬 Viral Movie Clips', hasVoiceover: false, hashtags: ['movies', 'cinema', 'clips'] },
  { key: 'show-clips', label: '📺 Classic Show Clips', hasVoiceover: false, hashtags: ['tvshows', 'funny', 'classic'] },
  { key: 'top-5-facts', label: '🔢 Top 5 Mind-Blowing Facts', hasVoiceover: true, hashtags: ['top5', 'facts', 'education'] },
  { key: 'dark-psychology', label: '🖤 Dark Psychology', hasVoiceover: true, hashtags: ['sigma', 'psychology', 'facts'] },
];
async function main() {
  console.log('=========================================');
  console.log('👑 AI SHORTS EMPIRE — ONE-OF-ONE EDITION');
  console.log('=========================================\n');

  // 0. License Verification
  await checkLicense();

  try {
    const isInteractive = process.argv.includes('--interactive');

    // 1. Format Selection (MOVE BEFORE NICHE DISCOVERY)
    let format: any;
    if (isInteractive) {
      // (Interactive logic handled below)
    } else {
      format = VIDEO_FORMATS[Math.floor(Math.random() * VIDEO_FORMATS.length)];
    }

    // 2. Niche Selection
    let activeNiche: any;

    if (isInteractive) {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'mode',
          message: 'What do you want to do today?',
          choices: ['Run Autonomous (Trending)', 'Create Custom Niche']
        }
      ]);

      if (answers.mode === 'Run Autonomous (Trending)') {
        format = VIDEO_FORMATS[Math.floor(Math.random() * VIDEO_FORMATS.length)];
        const bestNiches = await findBestNiches(format);
        activeNiche = bestNiches[0];
      } else {
        const customAnswers = await inquirer.prompt([
          { type: 'input', name: 'niche', message: 'Enter your custom niche (e.g. Scary Reddit Stories):' },
          { 
            type: 'list', 
            name: 'format', 
            message: 'Select Format:', 
            choices: VIDEO_FORMATS.map(f => f.label) 
          }
        ]);
        activeNiche = { name: customAnswers.niche, score: 100 };
        format = VIDEO_FORMATS.find(f => f.label === customAnswers.format);
      }
    } else {
      const bestNiches = await findBestNiches(format);
      if (bestNiches.length === 0) throw new Error("No profitable niches found.");
      activeNiche = bestNiches[0];
    }

    console.log(`\n📌 Niche: ${activeNiche.name}`);
    console.log(`🎬 Format: ${format.label}\n`);

    // 3. Script Generation
    const script = await generateScriptForNiche(activeNiche.name, format);
    
    // 4. Video Generation
    const videoPath = await generateVideo(script, format);
    
    // 5. Multi-Platform Upload
    const platforms: { [key: string]: string } = {};

    // YouTube (Primary) - SMART FAILOVER ROTATION
    const channels = [
      { id: '1', name: 'MindShift Clips', token: process.env.YOUTUBE_REFRESH_TOKEN_1 },
      { id: '2', name: 'Psychology Dark Secrets', token: process.env.YOUTUBE_REFRESH_TOKEN_2 },
      { id: '3', name: 'Dark Secrets Daily', token: process.env.YOUTUBE_REFRESH_TOKEN_3 },
    ].filter(c => !!c.token);

    const sortedChannels = [...channels].sort((a, b) => (a.id === '3' ? -1 : 1));

    let youtubeSuccess = false;
    for (const targetChannel of sortedChannels) {
      if (youtubeSuccess) break;
      
      try {
        console.log(`   📡 Attempting YouTube: ${targetChannel.name} (Channel #${targetChannel.id})...`);
        
        // 💰 CPA LINK INJECTION
        const cpaLink = getRotatedCPALink(activeNiche.name, 'youtube');
        
        const youtubeUrl = await uploadToYoutube(videoPath, {
          title: `${script.hook.substring(0, 90)} #shorts #viral`,
          description: `${script.body}\n\n${cpaLink}\n\n#shorts #fyp`,
          tags: ['shorts', 'viral', ...format.hashtags],
          channelId: targetChannel.id
        });
        
        platforms['youtube'] = youtubeUrl;
        youtubeSuccess = true;
        
        // 📊 ANALYTICS LOGGING
        logUpload({
          platform: 'youtube',
          channel: targetChannel.name,
          url: youtubeUrl,
          niche: activeNiche.name,
          format: format.key,
          cpaLinkUsed: cpaLink
        });

        console.log(`   ✅ YouTube SUCCESS on ${targetChannel.name}`);
      } catch (err: any) {
        const msg = err.message.toLowerCase();
        // Lorenzo's Fix: "exceeded" is a common error string for quotas
        const isQuota = msg.includes('quota') || msg.includes('403') || msg.includes('limit') || msg.includes('exceeded');
        console.warn(`   ⚠️ YouTube Channel #${targetChannel.id} failed: ${isQuota ? 'QUOTA EXCEEDED' : err.message}`);
        
        if (isQuota) {
          console.log(`   🔄 Switching to next available account...`);
          continue;
        } else {
          console.error(`   ❌ Critical YouTube error, skipping all accounts.`);
          break;
        }
      }
    }

    // TikTok
    try {
      const tiktokUrl = await uploadToTiktok(videoPath, script.hook);
      platforms['tiktok'] = tiktokUrl;
    } catch (err: any) {
      console.error(`   ❌ TikTok upload failed: ${err.message}`);
    }

    // Meta (Reels)
    try {
      const metaUrl = await uploadToMeta(videoPath, script.hook, script.body);
      platforms['meta'] = metaUrl;
    } catch (err: any) {
      console.error(`   ❌ Meta upload failed: ${err.message}`);
    }

    // 5. Post-Processing
    await postProcess(videoPath, activeNiche.name, format.key, platforms);

    if (isInteractive) {
      const { confirmCleanup } = await inquirer.prompt([
        { type: 'confirm', name: 'confirmCleanup', message: 'Work saved. Run 7-day cleanup now?', default: true }
      ]);
      if (confirmCleanup) await runCleanup();
    } else {
      await runCleanup();
    }

    console.log('\n=========================================');
    console.log('✅ EMPIRE RUN COMPLETE!');
    console.log(getStatsSummary());
    console.log('=========================================');

  } catch (err: any) {
    console.error(`\n💥 PIPELINE CRASHED: ${err.message}`);
    process.exit(1);
  }
}

main().catch(console.error);
