const { google } = require('googleapis');
const fs = require('fs');
require('dotenv').config();

const TOKEN_PATH = './token.json';

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Generate the Google OAuth consent URL
const getAuthUrl = () => {
  const scopes = ['https://www.googleapis.com/auth/drive.file'];
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
  });
};

// Set and save tokens to file after OAuth callback
const setTokensFromCode = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  console.log('✅ Token saved to disk.');
};

// Load token from file if available
const getAuthClient = () => {
  if (fs.existsSync(TOKEN_PATH)) {
    const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oauth2Client.setCredentials(tokenData);
    return oauth2Client;
  }
  throw new Error('OAuth token not set. Please authenticate.');
};

module.exports = {
  getAuthUrl,
  setTokensFromCode,
  getAuthClient,
};
