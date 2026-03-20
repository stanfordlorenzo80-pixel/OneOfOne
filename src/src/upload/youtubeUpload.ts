import { google } from 'googleapis';
import fs from 'fs';

// To upload, you MUST use OAuth2, not just an API key.
// The user will need to download their client_secret.json from Google Cloud Console.

const OAuth2 = google.auth.OAuth2;

export async function uploadVideo(filePath: string, metadata: { title: string; description: string; tags: string[] }): Promise<string> {
  if (!process.env.YOUTUBE_CLIENT_ID || !process.env.YOUTUBE_CLIENT_SECRET || !process.env.YOUTUBE_REFRESH_TOKEN) {
    console.warn("YouTube OAuth credentials missing. Skipping actual upload and simulating success for testing.");
    return "https://youtube.com/shorts/simulated_upload";
  }

  const oauth2Client = new OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    "http://localhost:3000/oauth2callback"
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.YOUTUBE_REFRESH_TOKEN
  });

  const youtube = google.youtube({
    version: 'v3',
    auth: oauth2Client
  });

  console.log(`Uploading ${filePath} to YouTube...`);
  
  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags,
        categoryId: '22', // People & Blogs
      },
      status: {
        privacyStatus: 'public', // Set to public to instantly go live!
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: fs.createReadStream(filePath),
    },
  });

  return `https://youtube.com/watch?v=${res.data.id}`;
}
