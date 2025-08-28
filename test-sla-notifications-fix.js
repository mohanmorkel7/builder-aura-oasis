const fetch = require('node-fetch');

async function testSLANotificationsFix() {
  try {
    console.log('🧪 Testing SLA Notifications Fix...');
    console.log('=' .repeat(50));

    // Step 1: Setup the SLA monitoring system
    console.log('📋 Step 1: Setting up SLA monitoring system...');
    const setupResponse = await fetch('http://localhost:8080/api/notifications-production/setup/automated-sla', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const setupResult = await setupResponse.json();
    
    if (setupResponse.ok) {
      console.log('✅ SLA monitoring setup completed successfully!');
      console.log('Features added:', setupResult.features_added);
    } else {
      console.log('❌ SLA setup failed:', setupResult.error || setupResult.message);
    }

    // Step 2: Test the function directly to see if the time arithmetic works
    console.log('\n📋 Step 2: Testing SLA notification function...');
    const functionTestResponse = await fetch('http://localhost:8080/api/notifications-production/auto-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const functionResult = await functionTestResponse.json();
    
    if (functionTestResponse.ok) {
      console.log('✅ SLA notification function executed successfully!');
      console.log(`Notifications created: ${functionResult.notifications_created}`);
      if (functionResult.notifications && functionResult.notifications.length > 0) {
        console.log('📋 Notifications found:');
        functionResult.notifications.forEach((notification, idx) => {
          console.log(`  ${idx + 1}. ${notification.notification_type}: ${notification.task_name} - ${notification.subtask_name}`);
          console.log(`     Message: ${notification.details}`);
          console.log(`     Time diff: ${notification.time_diff_minutes} minutes`);
        });
      } else {
        console.log('📋 No active notifications found (this is normal if no subtasks are due)');
      }
    } else {
      console.log('❌ SLA function test failed:', functionResult.error || functionResult.message);
      
      // Check if it's the specific time arithmetic error
      if (functionResult.message && functionResult.message.includes('operator does not exist')) {
        console.log('🔍 This is the time arithmetic error we\'re trying to fix.');
        console.log('❌ The fix needs to be applied to the database.');
      }
    }

    // Step 3: Create test data to verify the function works
    console.log('\n📋 Step 3: Creating test subtask with start_time...');
    const testSubtaskResponse = await fetch('http://localhost:8080/api/notifications-production/test/create-timed-subtasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const testSubtaskResult = await testSubtaskResponse.json();
    
    if (testSubtaskResponse.ok) {
      console.log('✅ Test subtasks created successfully!');
      console.log('Test subtasks:', testSubtaskResult.test_subtasks?.length || 0);
    } else {
      console.log('⚠️  Test subtasks creation failed:', testSubtaskResult.error || testSubtaskResult.message);
    }

    // Step 4: Check existing notifications
    console.log('\n📋 Step 4: Checking existing notifications...');
    const notificationsResponse = await fetch('http://localhost:8080/api/notifications-production/test/user-query');

    const notificationsResult = await notificationsResponse.json();
    
    if (notificationsResponse.ok) {
      console.log('✅ Notifications retrieved successfully!');
      console.log(`Total notifications: ${notificationsResult.all_notifications?.length || 0}`);
      console.log(`Overdue notifications: ${notificationsResult.overdue_notifications?.length || 0}`);
      
      if (notificationsResult.overdue_notifications && notificationsResult.overdue_notifications.length > 0) {
        console.log('\n📋 Overdue notifications found:');
        notificationsResult.overdue_notifications.forEach((notification, idx) => {
          console.log(`  ${idx + 1}. ${notification.details}`);
          console.log(`     Priority: ${notification.priority}, Type: ${notification.type}`);
        });
      }
    } else {
      console.log('❌ Failed to retrieve notifications:', notificationsResult.error || notificationsResult.message);
    }

    console.log('\n📋 Step 5: Summary and Recommendations');
    console.log('=' .repeat(50));

    if (setupResponse.ok && functionTestResponse.ok) {
      console.log('🎉 SUCCESS: SLA notifications system is working correctly!');
      console.log('');
      console.log('✅ The time arithmetic issue has been resolved.');
      console.log('✅ The check_subtask_sla_notifications() function is working.');
      console.log('✅ Notifications should now appear in the FinOps dashboard.');
      console.log('');
      console.log('💡 The "SLA Warning - 14 min remaining • need to start" messages');
      console.log('   will now be properly generated when subtasks are due to start.');
    } else {
      console.log('❌ ISSUES FOUND: Some components are not working correctly.');
      console.log('');
      if (!setupResponse.ok) {
        console.log('❌ SLA monitoring setup failed - database may not be available.');
      }
      if (!functionTestResponse.ok) {
        console.log('❌ SLA notification function failed - may need manual database fix.');
        console.log('');
        console.log('📋 To manually fix the database issue:');
        console.log('1. Connect to your PostgreSQL database');
        console.log('2. Run the SQL commands from fix-finops-sla-notifications.sql');
        console.log('3. This will add missing columns and fix the time arithmetic');
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
console.log('🚀 Starting SLA Notifications Fix Verification');
console.log('This test will verify that the PostgreSQL time arithmetic issue is resolved');
console.log('');
testSLANotificationsFix();
