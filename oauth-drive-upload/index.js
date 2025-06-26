require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const open = require('open');
const uploadToDrive = require('./upload');
const { getAuthUrl, setTokensFromCode } = require('./auth');

const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 5000;

const upload = multer({ dest: 'uploads/' });

app.get('/auth', (req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
});

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

app.post('/upload', upload.single('video'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).send('No file uploaded');
    const result = await uploadToDrive(file.path, file.originalname);
    res.json({ message: 'Upload successful', link: result.webViewLink });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed: ' + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('👉 Authenticate Google Drive at: http://localhost:5000/auth');
  open(`http://localhost:${PORT}/auth`);
});
