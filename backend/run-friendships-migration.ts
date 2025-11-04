import { supabase } from './src/config/database';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  try {
    const sqlPath = path.join(__dirname, 'migrations', 'create_friendships_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute raw SQL using Supabase
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If exec_sql doesn't exist, we'll use the Supabase API to run it manually
      console.log('Note: Running migration via direct SQL execution may require Supabase dashboard access.');
      console.log('Please run the migration manually in Supabase SQL Editor:');
      console.log('\nMigration SQL:\n');
      console.log(sql);
    } else {
      console.log('✅ Friendships table migration completed successfully');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    console.log('\nPlease run this SQL in your Supabase SQL Editor:');
    const sqlPath = path.join(__dirname, 'migrations', 'create_friendships_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('\n' + sql);
    process.exit(1);
  }
}

runMigration();
