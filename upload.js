const { google } = require('googleapis');
const fs = require('fs');
require('dotenv').config();

/**
 * Uploads a video file to Google Drive
 * @param {string} filePath - Local file path
 * @param {string} originalName - Name to save on Drive
 * @param {object} authClient - Authenticated OAuth2 client
 */
async function uploadToDrive(filePath, originalName, authClient) {
  if (!authClient) throw new Error('Missing Google OAuth client');

  const drive = google.drive({ version: 'v3', auth: authClient });

  const fileMetadata = {
    name: originalName,
    parents: process.env.UPLOAD_FOLDER_ID ? [process.env.UPLOAD_FOLDER_ID] : []
  };

  const media = {
    mimeType: 'video/mp4',
    body: fs.createReadStream(filePath)
  };

  try {
    const res = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, webViewLink'
    });

    console.log(`✅ Uploaded: ${originalName} → ${res.data.webViewLink}`);
    return res.data;
  } catch (err) {
    console.error('❌ Google Drive upload failed:', err.message);
    throw err;
  }
}

module.exports = uploadToDrive;
