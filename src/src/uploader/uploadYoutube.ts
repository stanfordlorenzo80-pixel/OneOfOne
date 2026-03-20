import { google } from 'googleapis';
import fs from 'fs';

const OAuth2 = google.auth.OAuth2;

export interface YoutubeMetadata {
  title: string;
  description: string;
  tags: string[];
  channelId?: string; // Route between main and backup
}

export async function uploadToYoutube(filePath: string, metadata: YoutubeMetadata, retries = 3): Promise<string> {
  const { title, description, tags, channelId } = metadata;
  
  const hasAnyToken = process.env.YOUTUBE_REFRESH_TOKEN || process.env.YOUTUBE_REFRESH_TOKEN_1 || process.env.YOUTUBE_REFRESH_TOKEN_2;
  
  if (!process.env.YOUTUBE_CLIENT_ID || !process.env.YOUTUBE_CLIENT_SECRET || !hasAnyToken) {
    console.warn("   ⚠️ YouTube OAuth credentials missing. Skipping upload.");
    return "https://youtube.com/shorts/simulated_upload";
  }

  const oauth2Client = new OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    "http://localhost:3000/oauth2callback"
  );

  // If we have multiple channels, we use YOUTUBE_REFRESH_TOKEN_1, _2, etc.
  const tokenKey = channelId ? `YOUTUBE_REFRESH_TOKEN_${channelId}` : 'YOUTUBE_REFRESH_TOKEN_1';
  let refreshToken = process.env[tokenKey] || process.env.YOUTUBE_REFRESH_TOKEN;
  
  if (!refreshToken && !channelId) {
    // Fallback to _1 if generic is missing
    refreshToken = process.env.YOUTUBE_REFRESH_TOKEN_1;
  }

  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });

  const youtube = google.youtube({
    version: 'v3',
    auth: oauth2Client
  });

  console.log(`   ⬆️  Uploading ${filePath} to YouTube (Title: ${title})...`);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title,
            description,
            tags,
            categoryId: '22',
          },
          status: {
            privacyStatus: 'public',
            selfDeclaredMadeForKids: false,
          },
        },
        media: {
          body: fs.createReadStream(filePath),
        },
      });

      console.log(`   ✅ YouTube Upload Success! ID: ${res.data.id}`);
      return `https://youtube.com/watch?v=${res.data.id}`;
    } catch (err: any) {
      console.warn(`   ⚠️ YouTube Upload Attempt ${attempt} failed: ${err.message}`);
      if (attempt === retries) throw err;
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`   ⏳ Retrying in ${delay/1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error("YouTube upload failed after retries.");
}
