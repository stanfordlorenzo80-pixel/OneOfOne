import { getYouTube } from '../lib/youtube';

export interface TrendingShort {
  id: string;
  title: string;
  viewCount: number;
  likeCount: number;
  publishedAt: string;
}

/**
 * Fetches recent popular videos in a specific niche and filters for Shorts.
 * Shorts are typically identified by being <= 60 seconds.
 */
export async function getTrendingShorts(query: string, maxResults = 50): Promise<TrendingShort[]> {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    console.log(`\n⏰ [REAL-TIME DATA CHECK] Scanning YouTube algorithm between:`);
    console.log(`   Start: ${sevenDaysAgo.toISOString()}`);
    console.log(`   End:   ${today.toISOString()}\n`);

    // 1. Search for recent popular videos matching the niche
    const searchResponse = await getYouTube().search.list({
      part: ['id', 'snippet'],
      q: `${query} #shorts`, // Append #shorts to narrow down
      order: 'viewCount', // Get the most viewed
      type: ['video'],
      publishedAfter: sevenDaysAgo.toISOString(), // Strictly Last 7 days to guarantee virality
      videoDuration: 'short', // 0-4 minutes
      maxResults,
    });

    const items = searchResponse.data.items || [];
    const videoIds = items.map(item => item.id?.videoId).filter(Boolean) as string[];

    if (videoIds.length === 0) return [];

    // 2. Fetch detailed video stats for exactly <= 60s check and view counts
    const videoResponse = await getYouTube().videos.list({
      part: ['contentDetails', 'statistics', 'snippet'],
      id: videoIds,
    });

    const shorts: TrendingShort[] = [];

    for (const video of videoResponse.data.items || []) {
      const durationStr = video.contentDetails?.duration || '';
      // Parse ISO 8601 duration (e.g., PT59S, PT1M)
      // For simplicity, anything with an M > 0 is > 60s, except exactly PT1M (though shorts can be up to 60s)
      const isShort = !durationStr.includes('M') || durationStr === 'PT1M';
      
      if (isShort && video.id && video.snippet) {
        shorts.push({
          id: video.id,
          title: video.snippet.title || '',
          viewCount: parseInt(video.statistics?.viewCount || '0', 10),
          likeCount: parseInt(video.statistics?.likeCount || '0', 10),
          publishedAt: video.snippet.publishedAt || '',
        });
      }
    }

    // Sort by most viewed
    return shorts.sort((a, b) => b.viewCount - a.viewCount);
  } catch (error) {
    console.error('Error fetching trending shorts:', error);
    throw error;
  }
}
