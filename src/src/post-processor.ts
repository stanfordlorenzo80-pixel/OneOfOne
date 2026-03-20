import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POSTED_DIR = path.resolve(__dirname, '../output/posted');
const LOG_FILE = path.resolve(__dirname, '../output/analytics.log');

export async function postProcess(
  videoPath: string, 
  niche: string, 
  format: string, 
  platforms: { [key: string]: string }
): Promise<string> {
  if (!fs.existsSync(POSTED_DIR)) fs.mkdirSync(POSTED_DIR, { recursive: true });

  const timestamp = Date.now();
  const safeNiche = niche.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20);
  const ext = path.extname(videoPath);
  const newName = `${safeNiche}_${format}_${timestamp}${ext}`;
  const newPath = path.join(POSTED_DIR, newName);

  console.log(`   📁 Post-processing: Moving to ${newPath}...`);
  
  try {
    fs.renameSync(videoPath, newPath);
  } catch (err) {
    // If rename fails (e.g., cross-device), try copy and unlink
    fs.copyFileSync(videoPath, newPath);
    fs.unlinkSync(videoPath);
  }

  // Log to analytics
  const logEntry = {
    timestamp: new Date().toISOString(),
    niche,
    format,
    file: newName,
    platforms
  };
  
  fs.appendFileSync(LOG_FILE, JSON.stringify(logEntry) + '\n');
  console.log(`   ✅ Logged to analytics.`);

  return newPath;
}
