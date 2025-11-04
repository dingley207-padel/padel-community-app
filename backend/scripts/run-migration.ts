import { supabase } from '../src/config/database';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  try {
    console.log('Running migration: add_password_field.sql');

    const migrationPath = path.join(
      __dirname,
      '../database/migrations/add_password_field.sql'
    );

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL,
    });

    if (error) {
      console.error('Migration failed:', error);

      // Try alternative method: direct query
      console.log('Trying alternative method...');
      const { error: altError } = await supabase
        .from('users')
        .select('password_hash')
        .limit(1);

      if (altError && altError.message.includes('column "password_hash" does not exist')) {
        console.log('\nPlease run this SQL manually in your Supabase SQL Editor:');
        console.log('\n---');
        console.log(migrationSQL);
        console.log('---\n');
      } else if (!altError) {
        console.log('✓ Column password_hash already exists!');
      }

      process.exit(1);
    }

    console.log('✓ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runMigration();
