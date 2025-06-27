const { google } = require('googleapis');
const fs = require('fs');
require('dotenv').config();

const TOKEN_PATH = './token.json';

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Load token if it exists on startup
if (fs.existsSync(TOKEN_PATH)) {
  const storedTokens = JSON.parse(fs.readFileSync(TOKEN_PATH));
  oauth2Client.setCredentials(storedTokens);
  console.log("✅ OAuth token loaded from disk.");
}

const getAuthUrl = () => {
  const scopes = ['https://www.googleapis.com/auth/drive.file'];
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent' // Optional: force refresh token if needed
  });
};

const setTokensFromCode = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  console.log("🔐 OAuth tokens saved to disk.");
};

const getAuthClient = () => {
  if (oauth2Client.credentials && oauth2Client.credentials.access_token) {
    return oauth2Client;
  }
  throw new Error('OAuth token not set. Please authenticate at /auth.');
};

module.exports = {
  getAuthUrl,
  setTokensFromCode,
  getAuthClient,
};
