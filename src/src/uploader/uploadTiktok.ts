import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

export async function uploadToTiktok(filePath: string, caption: string): Promise<string> {
  const apiKey = process.env.TOKPORTAL_API_KEY;

  if (!apiKey) {
    console.warn("   ⚠️ TOKPORTAL_API_KEY missing. Skipping live TikTok upload.");
    return "https://tiktok.com/simulated_upload";
  }

  console.log(`   ⬆️  Uploading ${filePath} to TikTok via TokPortal...`);

  try {
    const formData = new FormData();
    formData.append('video', fs.createReadStream(filePath));
    formData.append('caption', caption);

    const response = await axios.post('https://api.tokportal.com/v1/videos/upload', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${apiKey}`
      }
    });

    console.log(`   ✅ TikTok Upload Success! URL: ${response.data.url}`);
    return response.data.url;
  } catch (err: any) {
    console.error(`   ❌ TikTok upload error: ${err.message}`);
    throw err;
  }
}
