// upload.js
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Uploads a video file to Google Drive using the provided auth client.
 *
 * @param {string} filePath - The local path to the file.
 * @param {string} originalName - The filename to assign in Google Drive.
 * @param {object} authClient - A pre-authenticated OAuth2 client.
 * @returns {Promise<object>} - Google Drive file info including webViewLink.
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
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, webViewLink'
    });

    const link = response.data.webViewLink;
    console.log(`✅ Uploaded "${originalName}" → ${link}`);

    // Optional: Clean up local file
    fs.unlink(filePath, (err) => {
      if (err) {
        console.warn(`⚠️ Failed to delete local file ${filePath}:`, err.message);
      } else {
        console.log(`🧹 Cleaned up local file: ${filePath}`);
      }
    });

    return response.data;

  } catch (err) {
    console.error('❌ Google Drive upload failed:', err.message);
    throw err;
  }
}

module.exports = uploadToDrive;
