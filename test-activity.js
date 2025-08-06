// Simple test to verify activity-production endpoint
async function testEndpoint() {
  try {
    console.log('Testing activity-production endpoint...');
    
    const url = 'http://localhost:5173/api/activity-production?limit=50&start_date=' + encodeURIComponent(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    console.log('Request URL:', url);
    
    const response = await fetch(url);
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);
    
    const text = await response.text();
    console.log('Response text (first 200 chars):', text.substring(0, 200));
    
    try {
      const json = JSON.parse(text);
      console.log('✅ Valid JSON response');
      console.log('Activity logs count:', json.activity_logs?.length);
      console.log('Pagination:', json.pagination);
    } catch (jsonError) {
      console.log('❌ Invalid JSON response');
      console.log('JSON parse error:', jsonError.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Auto-run if this file is being executed
if (typeof window === 'undefined') {
  testEndpoint();
}
