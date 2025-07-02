const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function saveTokenToSupabase(token) {
  const { error } = await supabase
    .from('tokens')
    .upsert({ id: 'google', data: token });
  if (error) throw error;
}

async function loadTokenFromSupabase() {
  const { data, error } = await supabase
    .from('tokens')
    .select('data')
    .eq('id', 'google')
    .single();
  if (error || !data) return null;
  return data.data;
}

module.exports = {
  saveTokenToSupabase,
  loadTokenFromSupabase
};
