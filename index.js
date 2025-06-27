require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const uploadToDrive = require('./upload');
const { getAuthUrl, setTokensFromCode, getAuthClient } = require('./auth');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const upload = multer({ dest: 'uploads/' });

const TOKEN_PATH = path.join(__dirname, 'token.json');

// 🔄 Load token if exists on server start
if (fs.existsSync(TOKEN_PATH)) {
  try {
    const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH));
    const client = getAuthClient();
    client.setCredentials(tokens);
    console.log('✅ Token loaded from token.json');
  } catch (err) {
    console.warn('⚠️ Failed to load token.json:', err.message);
  }
}

// 🔐 Step 1: Start OAuth
app.get('/auth', (req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
});

// 🔐 Step 2: Handle callback from Google
app.get('/oauth2callback', async (req, res) => {
  try {
    const code = req.query.code;
    await setTokensFromCode(code);
    res.send('✅ Google Drive connected! You can now upload videos.');
  } catch (err) {
    console.error(err);
    res.status(500).send('OAuth Error: ' + err.message);
  }
});

// 📤 Video Upload Endpoint
app.post('/upload', upload.single('video'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).send('No file uploaded');

    // Check for token before proceeding
    const client = getAuthClient(); // Will throw error if token not set
    const result = await uploadToDrive(file.path, file.originalname, client);

    res.json({ message: 'Upload successful', link: result.webViewLink });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed: ' + err.message });
  }
});

// 🖥️ Server start
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Visit to authenticate: https://${process.env.RENDER_PROJECT_NAME || 'your-app-name'}.onrender.com/auth`);
});
