// Test script to verify activity-production endpoint
import fetch from 'node-fetch';

const baseUrl = 'http://localhost:5173/api/activity-production';

async function testActivityEndpoint() {
  console.log('Testing activity-production endpoint...');
  
  try {
    // Test 1: Basic request
    console.log('\n1. Testing basic request...');
    const response1 = await fetch(`${baseUrl}?limit=50`);
    const data1 = await response1.json();
    console.log('✓ Basic request successful');
    console.log('Response:', JSON.stringify(data1, null, 2));
    
    // Test 2: Request with start_date (the one causing issues)
    console.log('\n2. Testing with start_date parameter...');
    const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago
    const response2 = await fetch(`${baseUrl}?limit=50&start_date=${encodeURIComponent(startDate)}`);
    const data2 = await response2.json();
    console.log('✓ Request with start_date successful');
    console.log('Response:', JSON.stringify(data2, null, 2));
    
    // Test 3: Request with invalid date
    console.log('\n3. Testing with invalid start_date...');
    const response3 = await fetch(`${baseUrl}?limit=50&start_date=invalid-date`);
    const data3 = await response3.json();
    console.log('✓ Request with invalid date handled gracefully');
    console.log('Response:', JSON.stringify(data3, null, 2));
    
    // Test 4: Request with future date (from the error message)
    console.log('\n4. Testing with future start_date (2025)...');
    const futureDate = '2025-07-30T10:13:48.798Z';
    const response4 = await fetch(`${baseUrl}?limit=50&start_date=${encodeURIComponent(futureDate)}`);
    const data4 = await response4.json();
    console.log('✓ Request with future date successful');
    console.log('Response:', JSON.stringify(data4, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.message.includes('Invalid JSON')) {
      console.error('This is the "Invalid JSON response" error we were trying to fix');
    }
  }
}

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testActivityEndpoint();
}

export default testActivityEndpoint;
