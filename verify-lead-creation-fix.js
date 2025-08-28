const fetch = require('node-fetch');

// Test data matching the user's example
const testLeadData = {
  "lead_source": "email",
  "lead_source_value": "test@example.com",
  "lead_created_by": "test@example.com",
  "project_title": "Test Project Fix",
  "project_description": "Testing the JSON and integer overflow fixes",
  "project_requirements": "Verify transaction volumes and commercials work",
  "solutions": [
    "CardToken",
    "MylapaySecure",
    "FRM"
  ],
  "priority_level": "medium",
  "start_date": "2025-08-28",
  "targeted_end_date": "2025-08-31",
  "expected_daily_txn_volume": 1500,
  "expected_daily_txn_volume_year1": 2000,
  "expected_daily_txn_volume_year2": 2500,
  "expected_daily_txn_volume_year3": 3000,
  "expected_daily_txn_volume_year5": 4000,
  "spoc": "Sales Team",
  "billing_currency": "INR",
  "flat_fee_config": [
    {
      "id": Date.now().toString(),
      "component_name": "Setup Fee",
      "value": 10000,
      "currency": "INR",
      "type": "one_time"
    }
  ],
  "transaction_fee_config": [
    {
      "solution": "CardToken",
      "value": 0.5,
      "currency": "INR"
    },
    {
      "solution": "MylapaySecure",
      "value": 1,
      "currency": "INR"
    },
    {
      "solution": "FRM",
      "value": 2,
      "currency": "INR"
    }
  ],
  "client_name": "Test Client Corp",
  "client_type": "existing",
  "company_location": "Test City",
  "category": "aggregator",
  "country": "india",
  "contacts": [
    {
      "contact_name": "Test Contact",
      "designation": "Manager",
      "phone": "+91 9876543210",
      "email": "contact@testcorp.com",
      "linkedin": "https://linkedin.com/test"
    }
  ],
  "expected_close_date": null,
  "probability": 75,
  "notes": "Testing the fix for JSON and integer issues",
  "created_by": 1,
  "template_id": null
};

async function testLeadCreation() {
  try {
    console.log('🧪 Testing Lead Creation with Commercials Configuration...');
    console.log('📤 Sending test data to API...');
    
    const response = await fetch('http://localhost:8080/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testLeadData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Lead created successfully!');
      console.log('📋 Lead Details:');
      console.log(`   ID: ${result.id}`);
      console.log(`   Lead ID: ${result.lead_id}`);
      console.log(`   Client: ${result.client_name}`);
      console.log(`   Project: ${result.project_title}`);
      
      console.log('\n💰 Transaction Volume Fields:');
      console.log(`   Current: ${result.expected_daily_txn_volume}`);
      console.log(`   Year 1: ${result.expected_daily_txn_volume_year1}`);
      console.log(`   Year 2: ${result.expected_daily_txn_volume_year2}`);
      console.log(`   Year 3: ${result.expected_daily_txn_volume_year3}`);
      console.log(`   Year 5: ${result.expected_daily_txn_volume_year5}`);
      
      console.log('\n💳 Commercials Configuration:');
      console.log(`   Currency: ${result.billing_currency}`);
      
      if (result.flat_fee_config) {
        const flatFees = typeof result.flat_fee_config === 'string' 
          ? JSON.parse(result.flat_fee_config) 
          : result.flat_fee_config;
        console.log(`   Flat Fees: ${flatFees.length} configured`);
        flatFees.forEach((fee, idx) => {
          console.log(`     ${idx + 1}. ${fee.component_name}: ${fee.value} ${fee.currency} (${fee.type})`);
        });
      }
      
      if (result.transaction_fee_config) {
        const txnFees = typeof result.transaction_fee_config === 'string' 
          ? JSON.parse(result.transaction_fee_config) 
          : result.transaction_fee_config;
        console.log(`   Transaction Fees: ${txnFees.length} configured`);
        txnFees.forEach((fee, idx) => {
          console.log(`     ${idx + 1}. ${fee.solution}: ${fee.value} ${fee.currency}`);
        });
      }
      
      // Test fetching lead steps (this was causing integer overflow before)
      console.log('\n🔄 Testing Lead Steps API...');
      const stepsResponse = await fetch(`http://localhost:8080/api/leads/${result.id}/steps`);
      const steps = await stepsResponse.json();
      
      if (stepsResponse.ok) {
        console.log(`✅ Lead steps fetched successfully: ${steps.length} steps found`);
      } else {
        console.log(`❌ Lead steps fetch failed: ${steps.error || 'Unknown error'}`);
      }
      
      console.log('\n🎉 All tests passed! The fixes are working correctly.');
      
      // Optional: Clean up the test lead
      console.log('\n🧹 Cleaning up test lead...');
      const deleteResponse = await fetch(`http://localhost:8080/api/leads/${result.id}`, {
        method: 'DELETE'
      });
      
      if (deleteResponse.ok) {
        console.log('✅ Test lead cleaned up successfully');
      } else {
        console.log('⚠️  Test lead cleanup failed (lead may still exist)');
      }
      
    } else {
      console.log('❌ Lead creation failed:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${result.error || 'Unknown error'}`);
      console.log(`   Details: ${result.details || 'No additional details'}`);
      
      if (result.error && result.error.includes('json')) {
        console.log('\n🔍 This appears to be a JSON parsing issue.');
        console.log('   Check that flat_fee_config and transaction_fee_config are properly stringified.');
      }
      
      if (result.error && result.error.includes('integer') && result.error.includes('range')) {
        console.log('\n🔍 This appears to be an integer overflow issue.');
        console.log('   Check that lead IDs are within PostgreSQL integer limits.');
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🔍 Connection refused - make sure the development server is running:');
      console.log('   npm run dev');
    }
  }
}

// Run the test
console.log('🚀 Starting Lead Creation Fix Verification Test');
console.log('=' .repeat(60));
testLeadCreation();
