const fetch = require('node-fetch');
require('dotenv').config();

async function sendToKlaviyo(data) {
  const payload = {
    token: process.env.KLAVIYO_PUBLIC_API_KEY,
    event: process.env.KLAVIYO_EVENT_NAME,
    customer_properties: {
      $email: data.email,
      $first_name: data.name
    },
    properties: {
      story: data.story,
      videoUrl: data.videoUrl,
      videoFileName: data.videoFileName || null,
      permission: data.permission
    }
  };

  const res = await fetch("https://a.klaviyo.com/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error("Klaviyo error");
}

module.exports = sendToKlaviyo;
