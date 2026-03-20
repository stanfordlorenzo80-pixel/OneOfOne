import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_DIR = path.resolve(__dirname, '../temp');
const POSTED_DIR = path.resolve(__dirname, '../output/posted');

const POSTED_RETENTION_DAYS = parseInt(process.env.POSTED_RETENTION_DAYS || '7');
const TEMP_RETENTION_HOURS = parseInt(process.env.TEMP_RETENTION_HOURS || '24');

export async function runCleanup() {
  console.log('🧹 Running automated cleanup...');

  // 1. Clean temp/
  const tempLimit = Date.now() - (TEMP_RETENTION_HOURS * 60 * 60 * 1000);
  cleanDirectory(TEMP_DIR, tempLimit);

  // 2. Clean output/posted/
  const postedLimit = Date.now() - (POSTED_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  cleanDirectory(POSTED_DIR, postedLimit);
}

function cleanDirectory(dir: string, limit: number) {
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir);
  let count = 0;

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.mtimeMs < limit) {
      try {
        fs.unlinkSync(filePath);
        count++;
      } catch (err) {
        console.error(`   ⚠️ Failed to delete ${file}:`, err);
      }
    }
  }

  if (count > 0) {
    console.log(`   ✅ Deleted ${count} old files in ${path.basename(dir)}`);
  }
}

import { url } from 'inspector'; // Not needed, just for path comparison

if (import.meta.url.endsWith(path.basename(process.argv[1]))) {
  runCleanup().catch(console.error);
}
