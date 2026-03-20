import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import youtubedl from 'youtube-dl-exec';
import { ScriptVariation } from '../ai/generateScript.js';
import { exec } from 'child_process';
import util from 'util';
import { fileURLToPath } from 'url';

const execPromise = util.promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP = path.resolve(__dirname, '../../temp');
const OUT = path.resolve(__dirname, '../../output');

function log(msg: string) { console.log('   ' + msg); }

// ── VOICEOVER ──────────────────────────────────────────
async function voiceover(text: string, out: string): Promise<void> {
  log('Generating voiceover...');
  const safe = text.replace(/"/g, '\\"').replace(/\n/g, ' ');
  await execPromise(`python -m edge_tts --voice en-US-ChristopherNeural --text "${safe}" --write-media "${out}"`);
  log('Voiceover ready');
}

// ── SILENT AUDIO (for text-only formats) ───────────────
async function silentAudio(out: string, secs: number): Promise<void> {
  const py = path.join(TEMP, `__silent_${Date.now()}.py`);
  fs.writeFileSync(py, `
import struct, wave
n = int(44100 * ${secs})
with wave.open('${out.replace(/\\/g, '\\\\')}', 'wb') as f:
    f.setnchannels(2); f.setsampwidth(2); f.setframerate(44100)
    f.writeframes(struct.pack('<' + 'h'*n*2, *([0]*n*2)))
`);
  try {
    await execPromise(`python "${py}"`);
  } finally {
    try { fs.unlinkSync(py); } catch {}
  }
}

// ── DURATION ───────────────────────────────────────────
async function duration(file: string): Promise<number> {
  return new Promise(resolve => {
    ffmpeg.ffprobe(file, (e: any, m: any) => resolve(e || !m?.format?.duration ? 30 : m.format.duration));
  });
}

// ── DOWNLOAD CLIPS ──────────────────────────────────────
async function dlClip(q: string, i: number): Promise<string> {
  log(`Clip ${i+1}: "${q}"`);
  const base = `clip_${Date.now()}_${i}`;
  const tmpl = path.join(TEMP, `${base}.%(ext)s`);
  try {
    await youtubedl(`ytsearch1:${q}`, { output: tmpl, format: 'bestvideo[ext=mp4]/best', noCheckCertificates: true, noWarnings: true });
    const f = fs.readdirSync(TEMP).find(f => f.startsWith(base));
    if (f) { log(`Clip ${i+1} ready`); return path.join(TEMP, f); }
  } catch {}
  log(`Clip ${i+1} failed`);
  return '';
}

async function downloadAll(clips: string[]): Promise<string[]> {
  if (!fs.existsSync(TEMP)) fs.mkdirSync(TEMP, { recursive: true });
  const r: string[] = [];
  for (let i = 0; i < clips.length; i++) r.push(await dlClip(clips[i], i));
  return r;
}

// ── PREPARE CLIP (crop to 9:16, h264, no audio) ───────
async function prepClip(inp: string, out: string, start: number, dur: number): Promise<string> {
  return new Promise(res => {
    ffmpeg().input(inp).inputOptions([`-ss ${start}`])
      .outputOptions(['-t', String(dur), '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920', '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-an', '-y'])
      .save(out).on('end', () => res(out)).on('error', () => res(''));
  });
}

// ── CONCAT (video-only, filter_complex) ────────────────
async function concatClips(clips: string[], out: string): Promise<string> {
  const v = clips.filter(c => c && fs.existsSync(c));
  if (v.length === 0) throw new Error('No valid clips');
  if (v.length === 1) {
    return new Promise((res, rej) => {
      ffmpeg().input(v[0]).outputOptions(['-c', 'copy', '-y']).save(out)
        .on('end', () => res(out)).on('error', (e: any) => rej(e));
    });
  }
  return new Promise((res, rej) => {
    const cmd = ffmpeg();
    v.forEach(p => cmd.input(p));
    const vi = v.map((_, i) => `[${i}:v]`).join('');
    cmd.complexFilter([`${vi}concat=n=${v.length}:v=1:a=0[vout]`])
      .outputOptions(['-map', '[vout]', '-c:v', 'libx264', '-preset', 'fast', '-y'])
      .save(out).on('end', () => res(out)).on('error', (e: any) => rej(e));
  });
}

// ── TEXT OVERLAY (drawtext) ────────────────────────────
async function textOverlay(inp: string, out: string, lines: string[]): Promise<string> {
  if (!lines || lines.length === 0) {
    return new Promise((res, rej) => {
      ffmpeg().input(inp).outputOptions(['-c', 'copy', '-y']).save(out)
        .on('end', () => res(out)).on('error', (e: any) => rej(e));
    });
  }
  const filters: string[] = [];
  for (const line of lines) {
    const m = line.match(/^\[(\d+\.?\d*)-(\d+\.?\d*)\]\s*(.+)$/);
    if (!m) continue;
    const s = parseFloat(m[1]), e = parseFloat(m[2]);
    const t = m[3].replace(/'/g, "'\\''");
    filters.push(
      `drawtext=text='${t}':enable='between(t,${s},${e})':fontsize=h/9:fontcolor=white:borderw=3:bordercolor=black@0.8:x=(w-text_w)/2:y=h*0.38:shadowx=2:shadowy=2:shadowcolor=black@0.5`
    );
  }
  if (filters.length === 0) {
    return new Promise((res, rej) => {
      ffmpeg().input(inp).outputOptions(['-c', 'copy', '-y']).save(out)
        .on('end', () => res(out)).on('error', (e: any) => rej(e));
    });
  }
  return new Promise((res, rej) => {
    ffmpeg().input(inp)
      .outputOptions(['-vf', filters.join(','), '-c:v', 'libx264', '-preset', 'fast', '-y'])
      .save(out).on('end', () => res(out)).on('error', (e: any) => {
        log('Text overlay skipped: ' + e.message);
        ffmpeg().input(inp).outputOptions(['-c', 'copy', '-y']).save(out)
          .on('end', () => res(out)).on('error', (e2: any) => rej(e2));
      });
  });
}

// ── MIX AUDIO + VIDEO ──────────────────────────────────
async function mixAV(vid: string, aud: string, out: string, dur: number): Promise<void> {
  return new Promise((res, rej) => {
    ffmpeg().input(vid).input(aud)
      .outputOptions(['-map', '0:v:0', '-map', '1:a:0', '-c:v', 'libx264', '-c:a', 'aac', '-t', String(Math.min(dur, 34)), '-shortest', '-y'])
      .save(out).on('end', () => res()).on('error', (e: any) => rej(e));
  });
}

// ── TEXT BLOCKS (for text-on-screen formats) ─────────
function buildTextBlocks(body: string, totalDur: number): string[] {
  const clean = body.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#/g, '').trim();
  const sentences = clean.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 5);
  const blocks: string[] = [];
  const nb = Math.min(sentences.length, 6);
  const cs = Math.ceil(sentences.length / nb);
  for (let i = 0; i < nb; i++) {
    const chunk = sentences.slice(i * cs, (i + 1) * cs).join(' ').trim();
    if (!chunk) continue;
    const s = (i / nb) * totalDur;
    const e = ((i + 1) / nb) * totalDur - 1;
    blocks.push(`[${s.toFixed(1)}-${e.toFixed(1)}]${chunk}`);
  }
  return blocks;
}

// ── TOP 5 LABELS ─────────────────────────────────────
function buildTop5Lines(totalDur: number, n: number): string[] {
  const labels = ['#5 -- ALMOST', '#4 -- GETTING WARM', '#3 -- DEEP', '#2 -- DEEPER', '#1 -- THE TRUTH'];
  const lines: string[] = [];
  for (let i = 0; i < n; i++) {
    const s = (i / n) * totalDur;
    const e = ((i + 1) / n) * totalDur - 0.5;
    lines.push(`[${s.toFixed(1)}-${e.toFixed(1)}]${labels[i] || '#' + (n-i)}`);
  }
  return lines;
}

// ── MAIN ───────────────────────────────────────────────
export async function createShortVideo(
  script: ScriptVariation,
  format: { key: string; label: string; hasVoiceover: boolean; hashtags: string[] }
): Promise<string> {
  if (!fs.existsSync(TEMP)) fs.mkdirSync(TEMP, { recursive: true });
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  const ts = Date.now();
  const audioFile = path.join(TEMP, `audio_${ts}.mp3`);
  const finalOut = path.join(TEMP, `final_short_${ts}.mp4`);

  log(`Format: ${format.label}`);

  try {
    // 1. AUDIO
    let dur = 30;
    if (format.hasVoiceover) {
      await voiceover(`${script.hook} ${script.body} ${script.callToAction}`, audioFile);
      dur = Math.min(await duration(audioFile), 34);
    } else {
      await silentAudio(audioFile, 30);
      dur = 30;
    }
    log(`Duration: ${dur.toFixed(1)}s | Voiceover: ${format.hasVoiceover ? 'YES' : 'NO'}`);

    // 2. CLIPS
    const clips = script.suggestedClips && script.suggestedClips.length > 0 ? script.suggestedClips : ['creepy gameplay loop'];
    const raw = await downloadAll(clips);
    const valid = raw.filter(p => p && fs.existsSync(p));
    if (valid.length === 0) {
      const fb = path.resolve(__dirname, '../../public/assets/background.mp4');
      if (fs.existsSync(fb)) valid.push(fb);
      else throw new Error('No clips available');
    }

    // 3. BUILD VIDEO
    const isTop5 = format.key === 'top5-countdown';
    const isText = format.key === 'psychology-fact';
    const numSegs = Math.min(valid.length, isTop5 ? 5 : 4);
    const segDur = dur / numSegs;

    const segPaths: string[] = [];
    for (let i = 0; i < numSegs; i++) {
      const out = path.join(TEMP, `seg_${ts}_${i}.mp4`);
      const p = await prepClip(valid[i % valid.length], out, 0, segDur + 1);
      if (p) segPaths.push(p);
    }
    if (segPaths.length === 0) throw new Error('No segments prepared');

    const concatOut = path.join(TEMP, `concat_${ts}.mp4`);
    await concatClips(segPaths, concatOut);

    let processed = concatOut;
    if (isTop5) {
      const txtOut = path.join(TEMP, `top5txt_${ts}.mp4`);
      processed = await textOverlay(concatOut, txtOut, buildTop5Lines(dur, numSegs));
    } else if (isText) {
      const txtOut = path.join(TEMP, `txt_${ts}.mp4`);
      processed = await textOverlay(concatOut, txtOut, buildTextBlocks(script.body, dur));
    }

    // 4. MIX + OUTPUT
    await mixAV(processed, audioFile, finalOut, dur);
    log('DONE: ' + finalOut);
    return finalOut;

  } finally {
    try { if (fs.existsSync(audioFile)) fs.unlinkSync(audioFile); } catch {}
  }
}
