// tokenStore.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Save the Google OAuth token to Supabase
async function saveTokenToSupabase(token) {
  const { error } = await supabase
    .from('tokens')
    .upsert({ id: 'google', data: token });

  if (error) {
    console.error('❌ Failed to save token to Supabase:', error.message);
    throw error;
  }

  console.log('🔐 Token successfully saved to Supabase.');
}

// Load the stored token (if any) from Supabase
async function loadTokenFromSupabase() {
  const { data, error } = await supabase
    .from('tokens')
    .select('data')
    .eq('id', 'google')
    .single();

  if (error) {
    console.warn('⚠️ Failed to load token from Supabase:', error.message);
    return null;
  }

  if (!data || !data.data) {
    console.warn('⚠️ No token data found in Supabase.');
    return null;
  }

  return data.data;
}

module.exports = {
  saveTokenToSupabase,
  loadTokenFromSupabase,
};
