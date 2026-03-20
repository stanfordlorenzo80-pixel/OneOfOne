const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  '933283513488-q8mvci2bqlggt0nbrh4s17jkumdq0jkc.apps.googleusercontent.com',
  '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',
  'http://localhost:3000/oauth2callback'
);

// We use the EXACT code intercepted by the subagent
oauth2Client.getToken('4/0AfrIepAI29E7T39hCTILz21NcNIKrhU-FAAj1NV_Da5p4U5Rgn-PyENcWWWDeDV2FHumrA')
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
