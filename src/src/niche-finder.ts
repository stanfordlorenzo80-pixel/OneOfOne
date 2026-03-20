import { getTrendingShorts } from './trends/fetchTrends.js';
import { generateNicheQueries } from './ai/nicheGenerator.js';

export interface Niche {
  id: string;
  name: string;
  score: number;
}

export async function findBestNiches(format: any): Promise<Niche[]> {
  console.log(`🔍 [SUPREME DISCOVERY] AI is searching for high-velocity niches for format: ${format.label}...`);
  
  // 1. Generate 10+ dynamic queries using the AI brain
  const dynamicNiches = await generateNicheQueries(format);
  console.log(`📡 Discovered ${dynamicNiches.length} high-potential niche paths.`);

  const scoredNiches: Niche[] = [];

  for (const nicheName of dynamicNiches) {
    try {
      const trends = await getTrendingShorts(nicheName);
      if (trends.length > 0) {
        const topVideo = trends[0];
        
        // Lorenzo's SUPREME Niche Scoring Formula:
        // Score = (TrendingViews × 1.0) + (EngagementRate × 50k) + (CPM × 10k)
        const views = topVideo.viewCount || 5000;
        const engagement = 0.08; // Target high-engagement loops
        
        // High-value niche detection
        const isHighValue = nicheName.toLowerCase().includes('psychology') || 
                           nicheName.toLowerCase().includes('secret') || 
                           nicheName.toLowerCase().includes('fact');
                           
        const cpm = isHighValue ? 10 : 3;

        const score = (views * 1.0) + (engagement * 100000) + (cpm * 5000);
        
        scoredNiches.push({
          id: topVideo.id,
          name: nicheName,
          score: Math.round(score)
        });
      }
    } catch (err) {
      console.warn(`   ⚠️ Error scoring niche "${nicheName}":`, err);
    }
  }

  // Sort by score descending and return top 3
  const results = scoredNiches.sort((a, b) => b.score - a.score).slice(0, 3);
  console.log(`✅ Ranked top ${results.length} supreme niches for this run.\n`);
  return results;
}
