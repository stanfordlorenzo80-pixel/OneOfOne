import { google } from 'googleapis';
import http from 'http';
import { URL } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Missing YOUTUBE_CLIENT_ID or YOUTUBE_CLIENT_SECRET in .env');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const scopes = ['https://www.googleapis.com/auth/youtube.upload'];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent'
});

console.log('================================================================');
console.log('🚨 ACTION REQUIRED 🚨');
console.log('1. Click or copy/paste this URL into your browser:');
console.log('\n' + authUrl + '\n');
console.log('2. Sign in with your YouTube account and click "Allow".');
console.log('3. The browser will redirect to a blank page on localhost, and this script will capture your secure refresh token!');
console.log('================================================================');

const server = http.createServer(async (req, res) => {
  if (req.url?.startsWith('/oauth2callback')) {
    const qs = new URL(req.url, 'http://localhost:3000').searchParams;
    const code = qs.get('code');
    
    if (code) {
      res.end('Authentication successful! Please return to the terminal.');
      server.close();
      
      try {
        const { tokens } = await oauth2Client.getToken(code);
        console.log('\n✅ SUCCESS! Intercepted your exact Refresh Token:');
        console.log(tokens.refresh_token);
        
        // Append to .env
        fs.appendFileSync('.env', `\nYOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
        console.log('✅ Automatically saved to your .env file!');
        process.exit(0);
      } catch (err: any) {
        console.error('Error retrieving access token', err.message);
      }
    }
  }
}).listen(3000, () => {
  console.log('Listening on http://localhost:3000 for the secure Google callback...');
});
