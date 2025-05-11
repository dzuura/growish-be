const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

// Supabase client for Food Researcher System
const supabaseResearcher = createClient(
    process.env.SUPABASE_RESEARCHER_URL, 
    process.env.SUPABASE_RESEARCHER_KEY);

module.exports = supabaseResearcher;