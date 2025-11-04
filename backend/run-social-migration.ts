import dotenv from 'dotenv';
import  pg from 'pg';
const { Pool } = pg;

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('🚀 Running social media migration...');

    await client.query(`
      ALTER TABLE communities
      ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(255),
      ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(255),
      ADD COLUMN IF NOT EXISTS tiktok_url VARCHAR(255),
      ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(255),
      ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(255);
    `);

    console.log('✅ Social media columns added successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
