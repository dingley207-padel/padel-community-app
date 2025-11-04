const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://ross@localhost:5432/padel_app'
});

async function runMigration() {
  const client = await pool.connect();
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'migrations/add_community_social_media.sql'), 'utf8');
    await client.query(sql);
    console.log('✅ Social media migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
