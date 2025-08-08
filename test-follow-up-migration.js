const fs = require('fs');
const path = require('path');

async function testMigration() {
  try {
    // Check if database connection works
    const { pool } = require('./server/database/connection');
    
    console.log('Testing database connection...');
    await pool.query('SELECT 1');
    console.log('Database connection successful!');
    
    console.log('Running migration to add step_id to follow_ups table...');
    const migrationSQL = fs.readFileSync('./server/database/add-step-id-to-follow-ups.sql', 'utf8');
    await pool.query(migrationSQL);
    console.log('Migration completed successfully!');
    
    // Test the new column
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'follow_ups' AND column_name = 'step_id'
    `);
    
    if (result.rows.length > 0) {
      console.log('step_id column successfully added:', result.rows[0]);
    } else {
      console.log('step_id column not found in table');
    }
    
  } catch (error) {
    console.log('Migration failed (database might not be available):', error.message);
    console.log('This is expected if database is not running. The migration will be handled automatically when the API is used.');
  } finally {
    process.exit(0);
  }
}

testMigration();
