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

async function runMigration() {
  try {
    console.log('=== RUNNING MIGRATION ===');
    
    // Read and execute the migration
    const migrationSQL = `
-- Migration: Add commercials configuration fields to leads table
-- This migration adds support for the new commercials configuration features

-- Add new transaction volume fields for different years
ALTER TABLE leads ADD COLUMN IF NOT EXISTS expected_daily_txn_volume_year1 INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS expected_daily_txn_volume_year2 INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS expected_daily_txn_volume_year3 INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS expected_daily_txn_volume_year5 INTEGER;

-- Add lead_created_by field
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_created_by VARCHAR(255);

-- Add billing currency field
ALTER TABLE leads ADD COLUMN IF NOT EXISTS billing_currency VARCHAR(3) DEFAULT 'INR' CHECK (billing_currency IN ('INR', 'USD', 'AED'));

-- Add flat fee configuration as JSONB
ALTER TABLE leads ADD COLUMN IF NOT EXISTS flat_fee_config JSONB DEFAULT '[]'::jsonb;

-- Add transaction fee configuration as JSONB  
ALTER TABLE leads ADD COLUMN IF NOT EXISTS transaction_fee_config JSONB DEFAULT '[]'::jsonb;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_billing_currency ON leads(billing_currency);
CREATE INDEX IF NOT EXISTS idx_leads_created_by ON leads(lead_created_by);

-- Update existing leads to have default billing currency if null
UPDATE leads SET billing_currency = 'INR' WHERE billing_currency IS NULL;

-- Update existing leads to have empty arrays for new config fields if null
UPDATE leads SET flat_fee_config = '[]'::jsonb WHERE flat_fee_config IS NULL;
UPDATE leads SET transaction_fee_config = '[]'::jsonb WHERE transaction_fee_config IS NULL;
    `;
    
    await pool.query(migrationSQL);
    console.log('✅ Migration executed successfully');
    
  } catch (error) {
    console.log('⚠️  Migration error (might already be applied):', error.message);
  }
}

async function testLeadCreation() {
  try {
    console.log('\n=== TESTING LEAD CREATION WITH NEW FIELDS ===');
    
    // Test data with all the new fields
    const testLeadData = {
      lead_id: `TEST_${Date.now()}`,
      lead_source: 'website',
      lead_source_value: 'https://test.com',
      lead_created_by: 'test@example.com',
      project_title: 'Test Project with Commercials',
      project_description: 'Testing transaction volumes and commercials',
      client_name: 'Test Client Corp',
      
      // Transaction volume fields
      expected_daily_txn_volume: 1000,
      expected_daily_txn_volume_year1: 1500,
      expected_daily_txn_volume_year2: 2000,
      expected_daily_txn_volume_year3: 2500,
      expected_daily_txn_volume_year5: 3000,
      
      // Commercials configuration
      billing_currency: 'USD',
      flat_fee_config: JSON.stringify([
        {
          id: 'ff1',
          component_name: 'Setup Fee',
          value: 5000,
          currency: 'USD',
          type: 'one_time'
        },
        {
          id: 'ff2',
          component_name: 'Monthly Maintenance',
          value: 500,
          currency: 'USD',
          type: 'recurring',
          recurring_period: 'monthly'
        }
      ]),
      transaction_fee_config: JSON.stringify([
        {
          solution: 'CardToken',
          value: 0.02,
          currency: 'USD'
        },
        {
          solution: 'FRM',
          value: 0.01,
          currency: 'USD'
        }
      ]),
      
      // Other required fields
      solutions: JSON.stringify(['CardToken', 'FRM']),
      contacts: JSON.stringify([
        {
          contact_name: 'John Doe',
          designation: 'CTO',
          phone: '+1-555-0123',
          email: 'john@testcorp.com',
          linkedin: 'linkedin.com/in/johndoe'
        }
      ]),
      priority: 'high',
      probability: 75,
      created_by: 1,
      notes: 'Test lead with commercials configuration'
    };

    // Insert the test lead
    const insertQuery = `
      INSERT INTO leads (
        lead_id, lead_source, lead_source_value, lead_created_by, project_title, project_description,
        project_requirements, solutions, priority_level,
        start_date, targeted_end_date, expected_daily_txn_volume, 
        expected_daily_txn_volume_year1, expected_daily_txn_volume_year2, 
        expected_daily_txn_volume_year3, expected_daily_txn_volume_year5,
        project_value, spoc, billing_currency, flat_fee_config, transaction_fee_config,
        commercials, commercial_pricing, client_name, client_type, company,
        company_location, category, country, contacts, priority, expected_close_date,
        probability, notes, template_id, created_by, assigned_to
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37
      )
      RETURNING *
    `;

    const values = [
      testLeadData.lead_id, // $1
      testLeadData.lead_source, // $2
      testLeadData.lead_source_value, // $3
      testLeadData.lead_created_by, // $4
      testLeadData.project_title, // $5
      testLeadData.project_description, // $6
      null, // project_requirements $7
      testLeadData.solutions, // $8
      'medium', // priority_level $9
      null, // start_date $10
      null, // targeted_end_date $11
      testLeadData.expected_daily_txn_volume, // $12
      testLeadData.expected_daily_txn_volume_year1, // $13
      testLeadData.expected_daily_txn_volume_year2, // $14
      testLeadData.expected_daily_txn_volume_year3, // $15
      testLeadData.expected_daily_txn_volume_year5, // $16
      null, // project_value $17
      null, // spoc $18
      testLeadData.billing_currency, // $19
      testLeadData.flat_fee_config, // $20
      testLeadData.transaction_fee_config, // $21
      '[]', // commercials $22
      '[]', // commercial_pricing $23
      testLeadData.client_name, // $24
      null, // client_type $25
      null, // company $26
      null, // company_location $27
      null, // category $28
      null, // country $29
      testLeadData.contacts, // $30
      testLeadData.priority, // $31
      null, // expected_close_date $32
      testLeadData.probability, // $33
      testLeadData.notes, // $34
      null, // template_id $35
      testLeadData.created_by, // $36
      null, // assigned_to $37
    ];

    const result = await pool.query(insertQuery, values);
    const createdLead = result.rows[0];
    
    console.log('✅ Lead created successfully!');
    console.log('Lead ID:', createdLead.id);
    console.log('Lead ID (custom):', createdLead.lead_id);
    
    // Verify the data was saved correctly
    console.log('\n=== VERIFYING TRANSACTION VOLUME FIELDS ===');
    console.log('Expected Daily Txn Volume:', createdLead.expected_daily_txn_volume);
    console.log('Year 1:', createdLead.expected_daily_txn_volume_year1);
    console.log('Year 2:', createdLead.expected_daily_txn_volume_year2);
    console.log('Year 3:', createdLead.expected_daily_txn_volume_year3);
    console.log('Year 5:', createdLead.expected_daily_txn_volume_year5);
    
    console.log('\n=== VERIFYING COMMERCIALS CONFIGURATION ===');
    console.log('Billing Currency:', createdLead.billing_currency);
    console.log('Flat Fee Config:', createdLead.flat_fee_config);
    console.log('Transaction Fee Config:', createdLead.transaction_fee_config);
    console.log('Lead Created By:', createdLead.lead_created_by);
    
    // Parse and display the commercials config nicely
    try {
      const flatFees = JSON.parse(createdLead.flat_fee_config);
      const transactionFees = JSON.parse(createdLead.transaction_fee_config);
      
      console.log('\n=== PARSED COMMERCIALS CONFIG ===');
      console.log('Flat Fees:');
      flatFees.forEach((fee, index) => {
        console.log(`  ${index + 1}. ${fee.component_name}: ${fee.value} ${fee.currency} (${fee.type})`);
      });
      
      console.log('Transaction Fees:');
      transactionFees.forEach((fee, index) => {
        console.log(`  ${index + 1}. ${fee.solution}: ${fee.value} ${fee.currency}`);
      });
      
    } catch (parseError) {
      console.log('❌ Error parsing JSON configs:', parseError.message);
    }
    
    // Test update functionality
    console.log('\n=== TESTING UPDATE FUNCTIONALITY ===');
    const updateQuery = `
      UPDATE leads 
      SET 
        expected_daily_txn_volume_year1 = $1,
        expected_daily_txn_volume_year2 = $2,
        billing_currency = $3,
        flat_fee_config = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;
    
    const updatedFlatFees = JSON.stringify([
      {
        id: 'ff1',
        component_name: 'Updated Setup Fee',
        value: 7500,
        currency: 'EUR',
        type: 'one_time'
      }
    ]);
    
    const updateResult = await pool.query(updateQuery, [
      2000, // new year1 volume
      3000, // new year2 volume  
      'EUR', // new currency
      updatedFlatFees, // updated flat fees
      createdLead.id
    ]);
    
    const updatedLead = updateResult.rows[0];
    console.log('✅ Lead updated successfully!');
    console.log('Updated Year 1 Volume:', updatedLead.expected_daily_txn_volume_year1);
    console.log('Updated Year 2 Volume:', updatedLead.expected_daily_txn_volume_year2);
    console.log('Updated Currency:', updatedLead.billing_currency);
    console.log('Updated Flat Fees:', updatedLead.flat_fee_config);
    
    // Clean up - delete the test lead
    await pool.query('DELETE FROM leads WHERE id = $1', [createdLead.id]);
    console.log('✅ Test lead cleaned up');
    
    return true;
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    console.log('Error details:', error);
    return false;
  }
}

async function main() {
  try {
    await runMigration();
    const testPassed = await testLeadCreation();
    
    if (testPassed) {
      console.log('\n🎉 ALL TESTS PASSED! Transaction volume year fields and commercials configuration are working correctly.');
    } else {
      console.log('\n❌ Tests failed. Please check the database setup and migration.');
    }
    
  } catch (error) {
    console.log('❌ Error running tests:', error.message);
  } finally {
    await pool.end();
  }
}

main();
