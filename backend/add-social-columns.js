// Simple script to add social media columns to communities table
// Run with: node add-social-columns.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addSocialColumns() {
  try {
    console.log('🚀 Adding social media columns to communities table...\n');

    // Check if columns already exist by trying to select them
    const { data, error: checkError } = await supabase
      .from('communities')
      .select('twitter_url, instagram_url, tiktok_url, facebook_url, youtube_url, banner_image')
      .limit(1);

    if (!checkError) {
      console.log('✅ Social media columns already exist!');
      console.log('   Columns found:', Object.keys(data[0] || {}).filter(k =>
        ['twitter_url', 'instagram_url', 'tiktok_url', 'facebook_url', 'youtube_url', 'banner_image'].includes(k)
      ).join(', '));
      return;
    }

    console.log('⚠️  Columns not found. Please add them manually in Supabase Dashboard:');
    console.log('\n📝 SQL to run in Supabase SQL Editor:\n');
    console.log('ALTER TABLE communities');
    console.log('ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(255),');
    console.log('ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(255),');
    console.log('ADD COLUMN IF NOT EXISTS tiktok_url VARCHAR(255),');
    console.log('ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(255),');
    console.log('ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(255),');
    console.log('ADD COLUMN IF NOT EXISTS banner_image TEXT;');
    console.log('\n📍 Go to: https://supabase.com/dashboard/project/[your-project]/sql/new');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addSocialColumns();
