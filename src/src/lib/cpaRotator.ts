import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CPA_PATH = path.join(__dirname, '../../cpa-links.json');

export function getRotatedCPALink(niche: string, platform: string) {
  if (!fs.existsSync(CPA_PATH)) return "🔗 Join the Empire: [link_in_bio]";

  const data = JSON.parse(fs.readFileSync(CPA_PATH, 'utf-8'));
  const offers = data.offers || [];

  // Filter by niche if possible, otherwise pick random
  const filtered = offers.filter((o: any) => o.niche === niche || !o.niche);
  const offer = filtered.length > 0 
    ? filtered[Math.floor(Math.random() * filtered.length)]
    : offers[Math.floor(Math.random() * offers.length)];

  if (!offer) return "🔗 Join the Empire: [link_in_bio]";

  // Bobert's UTM Tracking:
  const date = new Date().toISOString().split('T')[0];
  const utm = `?utm_source=${platform}&utm_medium=shorts&utm_campaign=${date}`;
  
  return `🔗 ${offer.name.toUpperCase()}: ${offer.url}${utm}`;
}
