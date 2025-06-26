const fs = require('fs');
const { google } = require('googleapis');
const { getAuthClient } = require('./auth');

async function uploadToDrive(filePath, originalName) {
  const auth = getAuthClient();
  const drive = google.drive({ version: 'v3', auth });

  const fileMetadata = { name: originalName };
  const media = { mimeType: 'video/mp4', body: fs.createReadStream(filePath) };

  const res = await drive.files.create({
    resource: fileMetadata,
    media,
    fields: 'id, webViewLink',
  });

  return res.data;
}

module.exports = uploadToDrive;
