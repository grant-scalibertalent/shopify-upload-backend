require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const uploadToDrive = require('./upload');
const { getAuthUrl, setTokensFromCode } = require('./auth');
const sendToKlaviyo = require('./klaviyo');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get('/auth', (req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
});

app.get('/oauth2callback', async (req, res) => {
  try {
    await setTokensFromCode(req.query.code);
    res.send("✅ Google Drive connected! You can now upload videos.");
  } catch (err) {
    res.status(500).send("OAuth Error: " + err.message);
  }
});

app.post('/upload', upload.single('video'), async (req, res) => {
  try {
    const { name, email, story, permission, videoUrl } = req.body;
    let finalLink = videoUrl || '';
    let fileName = null;

    if (req.file) {
      const uploaded = await uploadToDrive(req.file.path, req.file.originalname);
      finalLink = uploaded.webViewLink;
      fileName = req.file.originalname;
    }

    if (!finalLink) {
      return res.status(400).json({ error: 'No video uploaded or link provided' });
    }

    await sendToKlaviyo({ name, email, story, permission, videoUrl: finalLink, videoFileName: fileName });
    res.json({ message: 'Submitted to Klaviyo', link: finalLink });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed: ' + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server live at https://shopify-upload-backend-13ht.onrender.com`);
});
