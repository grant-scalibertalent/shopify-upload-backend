// auth.js (revamped for Supabase token storage)
const { google } = require('googleapis');
const { saveTokenToSupabase, loadTokenFromSupabase } = require('./tokenStore');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Load token from Supabase on startup
(async () => {
  try {
    const token = await loadTokenFromSupabase();
    if (token) {
      oauth2Client.setCredentials(token);
      console.log('✅ Token loaded from Supabase');
    } else {
      console.log('⚠️ No token found — please authenticate at /auth');
    }
  } catch (err) {
    console.error('Failed to load token from Supabase:', err.message);
  }
})();

const getAuthUrl = () => {
  const scopes = ['https://www.googleapis.com/auth/drive.file'];
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
};

const setTokensFromCode = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  await saveTokenToSupabase(tokens);
  console.log('🔐 Token saved to Supabase');
};

const getAuthClient = () => {
  if (oauth2Client.credentials?.access_token) {
    return oauth2Client;
  }
  throw new Error('OAuth token not set. Please authenticate at /auth.');
};

module.exports = {
  getAuthUrl,
  setTokensFromCode,
  getAuthClient
};
