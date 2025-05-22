const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabaseUrl = process.env.SUPABASE_NUTRITIONIST_URL;
const supabaseKey = process.env.SUPABASE_NUTRITIONIST_KEY;

// Supabase client for nutritionist
const supabaseNutritionist = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
  },
});

module.exports = supabaseNutritionist;