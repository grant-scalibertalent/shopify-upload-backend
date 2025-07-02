// index.js (revamped)
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
const PORT = process.env.PORT || 5000;
const upload = multer({ dest: 'uploads/' });

// --- MIDDLEWARE ---
app.use(cors({
  origin: [
    'https://issdesigns.myshopify.com',
    'https://www.modernshelving.com',
    'http://127.0.0.1:9292',
    'http://localhost:9292'
  ],
  methods: ['GET', 'POST'],
}));
app.use(express.json());

// --- ROUTES ---

// Public key for frontend Klaviyo integration
app.get('/klaviyo-key', (req, res) => {
  res.json({ key: process.env.KLAVIYO_PUBLIC_KEY });
});

// Step 1: Redirect to Google's OAuth2 consent screen
app.get('/auth', (req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
});

// Step 2: Handle Google's OAuth2 redirect callback
app.get('/oauth2callback', async (req, res) => {
  try {
    await setTokensFromCode(req.query.code);
    res.send('✅ Google Drive connected! You can now upload videos.');
  } catch (err) {
    console.error('OAuth Error:', err.message);
    res.status(500).send('OAuth Error: ' + err.message);
  }
});

// Main form upload handler
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

    if (!finalVideoUrl && videoUrl) finalVideoUrl = videoUrl;
    if (!finalVideoUrl) return res.status(400).json({ error: 'No video uploaded or URL provided' });

    await sendToKlaviyo({ name, email, story, videoUrl: finalVideoUrl, videoFileName, permission });
    res.json({ message: '✅ Submission received', link: finalVideoUrl });

  } catch (err) {
    console.error('❌ Upload failed:', err.message);
    res.status(500).json({ error: 'Upload failed: ' + err.message });
  }
});

// Klaviyo fallback route
app.post('/track-klaviyo', async (req, res) => {
  try {
    const response = await fetch('https://a.klaviyo.com/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: process.env.KLAVIYO_PUBLIC_KEY,
        event: req.body.event,
        customer_properties: req.body.customer_properties,
        properties: req.body.properties
      })
    });

    const result = await response.json();
    if (!response.ok) return res.status(400).json({ error: result.message || 'Klaviyo error' });
    res.json({ success: true });

  } catch (err) {
    console.error('Klaviyo error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- SERVER START ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Authenticate at: ${process.env.BASE_URL || 'http://localhost:' + PORT}/auth`);
});
