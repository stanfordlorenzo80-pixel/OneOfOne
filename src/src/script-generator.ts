import { analyzeAndGenerateScripts, ScriptVariation } from './ai/generateScript';

export async function generateScriptForNiche(niche: string, format: any): Promise<ScriptVariation> {
  console.log(`   🧠 Generating script for niche: "${niche}"...`);
  const scripts = await analyzeAndGenerateScripts(niche, format);
  return scripts[0];
}
