import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const execPromise = util.promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function getYouTubeTranscript(videoId: string): Promise<string> {
  const scriptPath = path.resolve(__dirname, '__fetch_transcript.py');

  const pythonScript = `
import sys
from youtube_transcript_api import YouTubeTranscriptApi

try:
    transcript = YouTubeTranscriptApi.get_transcript(sys.argv[1], languages=['en'])
    text = ' '.join([item['text'] for item in transcript])
    print(text)
except Exception as e:
    print(f"ERROR:{e}", file=sys.stderr)
    sys.exit(1)
`;

  fs.writeFileSync(scriptPath, pythonScript);

  try {
    const { stdout } = await execPromise(`python "${scriptPath}" "${videoId}"`, { timeout: 30000 });
    const text = stdout.trim();
    if (text.startsWith('ERROR:')) throw new Error(text.replace('ERROR:', ''));
    return text;
  } finally {
    try { if (fs.existsSync(scriptPath)) fs.unlinkSync(scriptPath); } catch {}
  }
}
