const { supabaseAdmin } = require('../dist/config/database');

async function migrate() {
  try {
    console.log('Starting migration...\n');

    // Check if columns already exist by trying to select them
    const { data: testData, error: testError } = await supabaseAdmin
      .from('companies')
      .select('domain_verified')
      .limit(1);

    if (!testError) {
      console.log('✅ Migration already applied - columns exist');
      return;
    }

    console.log('Columns not found, applying migration via direct SQL...');
    console.log('NOTE: Please run the migration SQL manually in Supabase SQL Editor:\n');
    console.log('File: src/database/migrations/002_add_verification_and_block.sql\n');
    console.log('Or use Supabase CLI or web interface to run the migration.');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

migrate();
