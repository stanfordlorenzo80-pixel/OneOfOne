import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_PATH = path.join(__dirname, '../../output/upload-log.jsonl');

export function logUpload(data: {
  platform: string;
  channel: string;
  url: string;
  niche: string;
  format: string;
  cpaLinkUsed: string;
}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...data
  };

  const outputDir = path.dirname(LOG_PATH);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  fs.appendFileSync(LOG_PATH, JSON.stringify(logEntry) + '\n');
  
  console.log(`\n📊 [REPORT] Upload logged for ${data.platform} (${data.niche})`);
}

export function getStatsSummary() {
  if (!fs.existsSync(LOG_PATH)) return "No uploads recorded yet.";
  
  const entries = fs.readFileSync(LOG_PATH, 'utf-8').split('\n').filter(l => !!l).map(l => JSON.parse(l));
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = entries.filter(e => e.timestamp.startsWith(today));

  return `
  📊 TODAY'S EMPIRE STATS (${today}):
  🎬 Videos Posted: ${todayEntries.length}
  📡 Platforms: ${[...new Set(todayEntries.map(e => e.platform))].join(', ')}
  💰 CPA Clicks: Pending Analytics...
  `;
}
