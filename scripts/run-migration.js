const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  try {
    console.log('Reading migration file...');
    const migration = fs.readFileSync('./src/database/migrations/002_add_verification_and_block.sql', 'utf8');

    console.log('Running migration...\n');

    // Split by semicolon and run each statement
    const statements = migration
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 100)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.error('Error:', error);
        } else {
          console.log('✅ Success\n');
        }
      }
    }

    console.log('\n✅ Migration completed!');
  } catch (error) {
    console.error('Migration failed:', error.message);
  }
}

runMigration();
