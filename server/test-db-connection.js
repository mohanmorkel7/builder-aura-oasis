const { Pool } = require('pg');

async function testDatabaseConnection() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/banani_db",
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('Testing database connection...');
    const client = await pool.connect();
    
    // Test basic query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful!');
    console.log('Current time from DB:', result.rows[0].current_time);
    
    // Test if main tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'leads', 'lead_steps', 'onboarding_templates', 'template_steps')
      ORDER BY table_name;
    `;
    
    const tables = await client.query(tablesQuery);
    console.log('📋 Available tables:', tables.rows.map(row => row.table_name));
    
    // Test if we can query users table
    try {
      const userCount = await client.query('SELECT COUNT(*) as count FROM users');
      console.log('👥 Users in database:', userCount.rows[0].count);
    } catch (userError) {
      console.log('⚠️  Users table not accessible:', userError.message);
    }
    
    // Test if we can query leads table
    try {
      const leadCount = await client.query('SELECT COUNT(*) as count FROM leads');
      console.log('🎯 Leads in database:', leadCount.rows[0].count);
    } catch (leadError) {
      console.log('⚠️  Leads table not accessible:', leadError.message);
    }
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('📝 This means the app will use mock data instead of real database data');
  }
}

testDatabaseConnection();
