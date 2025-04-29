const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase client for Food Researcher System
const supabaseResearcher = createClient(
  process.env.SUPABASE_URL_RESEARCHER,
  process.env.SUPABASE_KEY_RESEARCHER
);

// Supabase client for Nutritionist System
const supabaseNutritionist = createClient(
  process.env.SUPABASE_URL_NUTRITIONIST,
  process.env.SUPABASE_KEY_NUTRITIONIST
);

module.exports = { supabaseResearcher, supabaseNutritionist };