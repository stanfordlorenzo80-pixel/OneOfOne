import dotenv from 'dotenv';
dotenv.config();
import { findBestNiches } from './niche-finder.js';
import { generateScriptForNiche } from './script-generator.js';
import { postProcess } from './post-processor.js';
import { runCleanup } from './cleanup.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verify() {
  console.log('🧪 Starting Modular Verification...\n');

  // 1. Test Niche Finder
  console.log('[1/4] Testing Niche Finder...');
  const niches = await findBestNiches();
  console.log(`   ✅ Found ${niches.length} niches. Top: ${niches[0]?.name} (Score: ${niches[0]?.score})`);

  // 2. Test Script Generator
  console.log('\n[2/4] Testing Script Generator...');
  const format = { key: 'dark-psychology', label: '🖤 Dark Psychology', hasVoiceover: true, hashtags: ['sigma'] };
  const script = await generateScriptForNiche(niches[0]?.name || 'test niche', format);
  console.log(`   ✅ Generated hook: "${script.hook}"`);

  // 3. Test Post Processor (with a dummy file)
  console.log('\n[3/4] Testing Post Processor...');
  const dummyFile = path.resolve(__dirname, '../temp/dummy_video.mp4');
  if (!fs.existsSync(path.dirname(dummyFile))) fs.mkdirSync(path.dirname(dummyFile), { recursive: true });
  fs.writeFileSync(dummyFile, 'dummy content');
  
  const postedPath = await postProcess(dummyFile, 'test_niche', 'test_format', { youtube: 'test_url' });
  if (fs.existsSync(postedPath)) {
    console.log(`   ✅ Post-processed file created: ${path.basename(postedPath)}`);
  } else {
    console.error('   ❌ Post-processed file missing!');
  }

  // 4. Test Cleanup
  console.log('\n[4/4] Testing Cleanup...');
  // Create an "old" file
  const oldFile = path.resolve(__dirname, '../output/posted/old_video.mp4');
  fs.writeFileSync(oldFile, 'old content');
  const oldTime = Date.now() - (10 * 24 * 60 * 60 * 1000); // 10 days ago
  fs.utimesSync(oldFile, new Date(oldTime), new Date(oldTime));
  
  await runCleanup();
  if (!fs.existsSync(oldFile)) {
    console.log('   ✅ Old file successfully cleaned up.');
  } else {
    console.warn('   ⚠️ Old file still exists (check retention settings).');
  }

  console.log('\n✨ Verification complete!');
}

verify().catch(console.error);
