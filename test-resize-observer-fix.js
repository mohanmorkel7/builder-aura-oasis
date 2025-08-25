/**
 * Test script to verify ResizeObserver error handling
 * Run this in the browser console to test the error suppression
 */

console.log('Testing ResizeObserver error handling...');

// Function to simulate a ResizeObserver loop error
function simulateResizeObserverError() {
  console.log('🔍 Simulating ResizeObserver loop error...');
  
  // Create a synthetic error that matches the ResizeObserver loop error
  const error = new Error('ResizeObserver loop completed with undelivered notifications.');
  
  // Dispatch it as an error event
  const errorEvent = new ErrorEvent('error', {
    error: error,
    message: error.message,
    filename: 'UserManagement.tsx',
    lineno: 1,
    colno: 1
  });
  
  // This should be caught and suppressed by our error handler
  window.dispatchEvent(errorEvent);
  
  console.log('✅ ResizeObserver error simulation completed');
}

// Function to test normal errors are not suppressed
function simulateNormalError() {
  console.log('🔍 Simulating normal error (should NOT be suppressed)...');
  
  const error = new Error('This is a normal error and should not be suppressed');
  
  const errorEvent = new ErrorEvent('error', {
    error: error,
    message: error.message,
    filename: 'test.js',
    lineno: 1,
    colno: 1
  });
  
  window.dispatchEvent(errorEvent);
  
  console.log('✅ Normal error simulation completed');
}

// Run tests
console.log('🚀 Starting ResizeObserver error handling tests...');

setTimeout(() => {
  simulateResizeObserverError();
}, 1000);

setTimeout(() => {
  simulateNormalError();
}, 2000);

setTimeout(() => {
  console.log('🎉 ResizeObserver error handling tests completed!');
  console.log('Check the console for "ResizeObserver loop detected and suppressed" messages');
}, 3000);
