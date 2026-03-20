import axios from 'axios';
import fs from 'fs';

export async function uploadToMeta(filePath: string, title: string, description: string): Promise<string> {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID;

  if (!accessToken || !pageId) {
    console.warn("   ⚠️ Meta API credentials missing (META_ACCESS_TOKEN/META_PAGE_ID). Skipping live Reels upload.");
    return "https://facebook.com/reels/simulated_upload";
  }

  console.log(`   ⬆️  Uploading ${filePath} to Facebook Reels...`);

  try {
    // 1. Initialize Upload
    const initRes = await axios.post(`https://graph.facebook.com/v19.0/${pageId}/video_reels`, {
      upload_phase: 'start',
      access_token: accessToken
    });

    const videoId = initRes.data.video_id;

    // 2. Upload Video Binary
    const videoData = fs.readFileSync(filePath);
    await axios.post(`https://graph.facebook.com/v19.0/${videoId}`, videoData, {
      headers: {
        'Authorization': `OAuth ${accessToken}`,
        'offset': '0',
        'file_size': videoData.length.toString(),
        'Content-Type': 'application/octet-stream'
      }
    });

    // 3. Publish Reel
    const publishRes = await axios.post(`https://graph.facebook.com/v19.0/${pageId}/video_reels`, {
      upload_phase: 'finish',
      video_id: videoId,
      video_state: 'PUBLISHED',
      description: `${title}\n\n${description}`,
      access_token: accessToken
    });

    console.log(`   ✅ Meta Reels Success! ID: ${publishRes.data.id}`);
    return `https://facebook.com/reels/${publishRes.data.id}`;
  } catch (err: any) {
    console.error(`   ❌ Meta upload error: ${err.response?.data || err.message}`);
    throw err;
  }
}
