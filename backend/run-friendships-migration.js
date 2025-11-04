const fs = require('fs');
const path = require('path');
const db = require('./dist/config/database');

async function runMigration() {
  try {
    const sqlPath = path.join(__dirname, 'migrations', 'create_friendships_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await db.query(sql);
    console.log('✅ Friendships table migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

runMigration();
