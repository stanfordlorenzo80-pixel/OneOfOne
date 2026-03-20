import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

let youtubeClient: ReturnType<typeof google.youtube> | null = null;

/**
 * Lazily initialize the YouTube client so dotenv has time to load first.
 */
export function getYouTube() {
  if (!youtubeClient) {
    if (!process.env.YOUTUBE_API_KEY) {
      console.warn("⚠️  Missing YOUTUBE_API_KEY environment variable.");
    }
    youtubeClient = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY,
    });
  }
  return youtubeClient;
}
