const { google } = require('googleapis');
const fs = require('fs');
const { getAuthClient } = require('./auth');
require('dotenv').config();

async function uploadToDrive(filePath, originalName) {
  const auth = getAuthClient();
  const drive = google.drive({ version: 'v3', auth });

  const fileMetadata = {
    name: originalName,
    parents: [process.env.UPLOAD_FOLDER_ID]
  };

  const media = {
    mimeType: 'video/mp4',
    body: fs.createReadStream(filePath)
  };

  const res = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id, webViewLink'
  });

  return res.data;
}

module.exports = uploadToDrive;
