const { Pool } = require("pg");

// Database configuration
const pool = new Pool({
  user: process.env.PG_USER || "postgres",
  host: process.env.PG_HOST || "localhost",
  database: process.env.PG_DB || "crm_dev",
  password: process.env.PG_PASSWORD || "password",
  port: Number(process.env.PG_PORT) || 5432,
  ssl: false,
});

async function applyVCFollowUpsMigration() {
  console.log("🔧 Applying VC follow-ups migration...");
  
  try {
    const client = await pool.connect();
    console.log("✅ Database connection successful!");
    
    // Check if VC columns already exist
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'follow_ups' 
      AND column_name IN ('vc_id', 'vc_step_id')
    `);
    
    if (columnCheck.rows.length === 2) {
      console.log("✅ VC columns already exist in follow_ups table");
      client.release();
      return;
    }
    
    console.log("🔧 Adding VC support to follow_ups table...");
    
    // Add vc_id column
    if (!columnCheck.rows.some(row => row.column_name === 'vc_id')) {
      console.log("Adding vc_id column...");
      await client.query(`
        ALTER TABLE follow_ups 
        ADD COLUMN vc_id INTEGER REFERENCES vcs(id) ON DELETE CASCADE
      `);
    }
    
    // Add vc_step_id column
    if (!columnCheck.rows.some(row => row.column_name === 'vc_step_id')) {
      console.log("Adding vc_step_id column...");
      await client.query(`
        ALTER TABLE follow_ups 
        ADD COLUMN vc_step_id INTEGER REFERENCES vc_steps(id) ON DELETE CASCADE
      `);
    }
    
    // Create indexes
    console.log("Creating indexes...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_follow_ups_vc_id ON follow_ups(vc_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_follow_ups_vc_step_id ON follow_ups(vc_step_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_follow_ups_vc_context ON follow_ups(vc_id, vc_step_id)
    `);
    
    // Add constraint to ensure follow-up belongs to either lead or VC context (not both)
    console.log("Adding constraint...");
    try {
      await client.query(`
        ALTER TABLE follow_ups 
        ADD CONSTRAINT chk_follow_up_context 
        CHECK (
          (lead_id IS NOT NULL AND vc_id IS NULL) OR 
          (lead_id IS NULL AND vc_id IS NOT NULL)
        )
      `);
    } catch (constraintError) {
      if (constraintError.code === '42710') {
        console.log("⚠️ Constraint already exists, skipping...");
      } else {
        throw constraintError;
      }
    }
    
    // Show final schema
    const finalSchema = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'follow_ups'
      AND column_name IN ('vc_id', 'vc_step_id', 'lead_id', 'step_id')
      ORDER BY ordinal_position
    `);
    
    console.log("\n📊 Updated follow_ups VC-related columns:");
    finalSchema.rows.forEach((row) => {
      console.log(
        `  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`,
      );
    });
    
    client.release();
    console.log("\n✅ VC follow-ups migration completed!");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await pool.end();
  }
}

applyVCFollowUpsMigration();
