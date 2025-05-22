const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabaseUrl = process.env.SUPABASE_RESEARCHER_URL;
const supabaseKey = process.env.SUPABASE_RESEARCHER_KEY;

// Supabase client for researcher
const supabaseResearcher = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
  },
});

module.exports = supabaseResearcher;