import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateNicheQueries(format: any): Promise<string[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const diversitySeed = Math.random().toString(36).substring(7);
  const prompt = `You are an AI Viral Trend Specialist. (Diversity Seed: ${diversitySeed}) 
  Generate 10 FRESH and UNIQUE search queries for YouTube Shorts/TikTok that are likely to have massive view velocity right now specifically for the format: "${format.label}" (Key: ${format.key}).

  CRITICAL: Do NOT pick the same famous movies/shows every time. Deep-dive into specific viral sub-niches.
  - If it's "Movie Clips", find trending movies or shocking scenes.
  - If it's "AITA", find viral relationship drama topics.
  - If it's "Dark Psychology", find manipulation tactics or sigma mindset hooks.
  - If it's "Facts", find mind-blowing scientific or historical trivia.
  
  Return a JSON array of strings ONLY. No conversational text.
  Example: ["Patrick Bateman Sigma mindset psychology", "Reddit AITA for leaving my wedding"]`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Robust JSON Extraction
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array found in response");
    
    const cleanText = jsonMatch[0].trim();
    return JSON.parse(cleanText);
  } catch (err: any) {
    console.warn(`   ⚠️ AI Niche Generation failed (${err.message}), using safety fallbacks.`);
    // Fallback based on format
    if (format.key === 'movie-clips') return ["Interstellar docking scene detail", "Joker stairs dance meaning", "Fight Club ending explained"];
    if (format.key === 'reddit-aita') return ["Reddit AITA for exposing a cheater", "Reddit TIFU by calling my boss mom"];
    
    return [
      "Dark psychology secrets manipulators use",
      "Mind blowing psychology facts",
      "Movie scenes with hidden details"
    ];
  }
}
