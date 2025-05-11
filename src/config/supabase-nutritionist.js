const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

// Supabase client for Nutritionist System
const supabaseNutritionist = createClient(
    process.env.SUPABASE_NUTRITIONIST_URL, 
    process.env.SUPABASE_NUTRITIONIST_KEY);

module.exports = supabaseNutritionist;