const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'banani_crm',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function checkColumns() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'leads' 
      AND column_name IN (
        'expected_daily_txn_volume_year1',
        'expected_daily_txn_volume_year2', 
        'expected_daily_txn_volume_year3',
        'expected_daily_txn_volume_year5',
        'billing_currency',
        'flat_fee_config',
        'transaction_fee_config',
        'lead_created_by'
      )
      ORDER BY column_name;
    `);
    
    console.log('=== MIGRATION STATUS CHECK ===');
    console.log('Checking for new columns added by migration-add-commercials-config.sql:');
    console.log('');
    
    if (result.rows.length === 0) {
      console.log('❌ NO NEW COLUMNS FOUND - Migration has NOT been applied');
    } else {
      console.log('✅ Found', result.rows.length, 'of 8 expected columns:');
      result.rows.forEach(row => {
        console.log(`  • ${row.column_name} (${row.data_type})`);
      });
      
      const expectedColumns = [
        'expected_daily_txn_volume_year1',
        'expected_daily_txn_volume_year2', 
        'expected_daily_txn_volume_year3',
        'expected_daily_txn_volume_year5',
        'billing_currency',
        'flat_fee_config',
        'transaction_fee_config',
        'lead_created_by'
      ];
      
      const foundColumns = result.rows.map(row => row.column_name);
      const missingColumns = expectedColumns.filter(col => !foundColumns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('');
        console.log('⚠️  Missing columns:', missingColumns.join(', '));
        console.log('Migration appears to be partially applied');
      } else {
        console.log('');
        console.log('✅ All expected columns are present - Migration has been applied');
      }
    }
    
    await pool.end();
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    console.log('This might mean the database is not running or migration cannot be checked');
    await pool.end();
  }
}

checkColumns();
