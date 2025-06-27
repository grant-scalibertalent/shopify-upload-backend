require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const uploadToDrive = require('./upload');
const { getAuthUrl, setTokensFromCode, getAuthClient } = require('./auth');
const sendToKlaviyo = require('./klaviyo');

const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 5000;

const upload = multer({ dest: 'uploads/' });
const TOKEN_PATH = path.join(__dirname, 'token.json');

app.get('/klaviyo-key', (req, res) => {
  res.json({ key: process.env.KLAVIYO_PUBLIC_KEY });
});

// 🔄 Load token at startup
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

// 🔐 OAuth Step 1
app.get('/auth', (req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
});

// 🔐 OAuth Step 2
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

// 📤 Upload + Klaviyo
app.post('/upload', upload.single('video'), async (req, res) => {
  try {
    const { name, email, story, videoUrl, permission } = req.body;
    const file = req.file;
    const authClient = getAuthClient();

    let finalVideoUrl = '';
    let videoFileName = '';

    if (file && file.size > 0) {
      const result = await uploadToDrive(file.path, file.originalname, authClient);
      finalVideoUrl = result.webViewLink;
      videoFileName = file.originalname;
    }

    if (!finalVideoUrl && videoUrl) {
      finalVideoUrl = videoUrl;
    }

    if (!finalVideoUrl) {
      return res.status(400).json({ error: 'No video uploaded or URL provided' });
    }

    await sendToKlaviyo({
      name,
      email,
      story,
      videoUrl: finalVideoUrl,
      videoFileName,
      permission
    });

    res.json({ message: '✅ Submission received', link: finalVideoUrl });

  } catch (err) {
    console.error('❌ Upload failed:', err.message);
    res.status(500).json({ error: 'Upload failed: ' + err.message });
  }
});

// 🚀 Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Authenticate at: https://${process.env.RENDER_PROJECT_NAME || 'your-app-name'}.onrender.com/auth`);
});
