const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID || 'REPLACE_WITH_CLIENT_ID',
  process.env.YOUTUBE_CLIENT_SECRET || 'REPLACE_WITH_CLIENT_SECRET',
  process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/oauth2callback'
);

// Replacement code for token exchange
const authCode = process.env.YOUTUBE_AUTH_CODE || 'REPLACE_WITH_AUTH_CODE';
oauth2Client.getToken(authCode)
  .then(res => {
    console.log('✅ TOKEN=' + res.tokens.refresh_token);
    const fs = require('fs');
    fs.appendFileSync('.env', `\nYOUTUBE_REFRESH_TOKEN=${res.tokens.refresh_token}\n`);
    console.log('✅ Appended to .env securely.');
    process.exit(0);
  })
  .catch(e => {
    console.error('❌ Failed to exchange code for token:', e.message);
    process.exit(1);
  });
