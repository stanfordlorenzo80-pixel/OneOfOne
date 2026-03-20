# 🤖 Infinite Money Bot (AI Shorts Creator)

A fully autonomous, passive-income YouTube Shorts generator that runs completely locally. It scrapes YouTube for trending niches, uses **Ollama** (DeepSeek/Qwen/Llama) to write viral variations, dynamically downloads background movie/anime clips via `yt-dlp`, synthesizes voiceovers, and uploads to your YouTube channel every 12 hours.

## 🌟 Features
- **100% Free AI Engine:** Uses local/cloud Ollama instead of paid Gemini/OpenAI APIs.
- **Dynamic Content:** Automatically rotates between Top 5 Lists, Anime Breakdowns, Movie Commentaries, and Psychology formats.
- **True TikTok Aesthetics:** Automatically crops and zooms horizontal movie clips natively into the 9:16 vertical ratio (no black bars).
- **Hard 59-Second Cutoff:** Enforces strict FFmpeg duration limits so videos are guaranteed to be recognized as #Shorts by the YouTube algorithm.
- **Auto-Poster Cron Job:** Runs silently in the background, waking up twice a day to post.

---

## 🛠️ Setup Guide

### 1. Prerequisites
- **Node.js**: Ensure Node.js (v18+) is installed.
- **FFmpeg**: Must be installed and added to your systemic PATH.
- **Ollama**: Download and install Ollama. Pull your desired model (e.g., `ollama run deepseek-v3.1:671b-cloud` or `llama3.1:8b`).

### 2. Environment Variables (`.env`)
Create a `.env` file in the root directory:
```env
# The YouTube Data API Key (for finding trends)
YOUTUBE_API_KEY=your_api_key_here

# YouTube OAuth Credentials (for uploading to your channel)
YOUTUBE_CLIENT_ID=your_oauth_client_id
YOUTUBE_CLIENT_SECRET=your_oauth_client_secret
YOUTUBE_REFRESH_TOKEN=your_refresh_token

# Optional: Set your specific Ollama model
OLLAMA_MODEL=deepseek-v3.1:671b-cloud
```

### 3. Google Cloud OAuth (For Brand Accounts)
To allow the bot to upload to a YouTube *Brand Account* without "Unverified Test User" errors:
1. Go to Google Cloud Console > APIs & Services > OAuth Consent Screen.
2. Click **Publish App** to push it to Production.
3. Run `node src/upload/auth-server.js` to get your authorization link.
4. Click through the warnings and authenticate your channel. The terminal will spit out your `YOUTUBE_REFRESH_TOKEN`.

### 4. Running the Bot
- **Manual Single Run:** `npx tsx src/index.ts`
- **Passive Income Mode (Every 12 Hours):** Just double-click the `START_BOT.bat` file. Keep the terminal minimized to enjoy infinite content.
