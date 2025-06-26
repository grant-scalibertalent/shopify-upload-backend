const { google } = require('googleapis');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

let tokenStore = null;

const getAuthUrl = () => {
  const scopes = ['https://www.googleapis.com/auth/drive.file'];
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
};

const setTokensFromCode = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  tokenStore = tokens;
};

const getAuthClient = () => {
  if (tokenStore) {
    oauth2Client.setCredentials(tokenStore);
    return oauth2Client;
  }
  throw new Error('OAuth token not set. Please authenticate.');
};

module.exports = {
  getAuthUrl,
  setTokensFromCode,
  getAuthClient,
};