const fetch = require('node-fetch');
require('dotenv').config();

async function sendToKlaviyo({ name, email, story, videoUrl, videoFileName, permission }) {
  const payload = {
    token: process.env.KLAVIYO_PUBLIC_KEY,
    event: "Customer Story Submitted",
    customer_properties: {
      $email: email,
      $first_name: name
    },
    properties: {
      story,
      videoUrl,
      videoFileName,
      permission
    }
  };

  const response = await fetch('https://a.klaviyo.com/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Klaviyo error: ${err}`);
  }

  console.log('✅ Sent to Klaviyo');
}

module.exports = sendToKlaviyo;
