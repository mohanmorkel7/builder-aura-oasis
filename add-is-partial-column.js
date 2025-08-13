const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Database configuration from environment variables
const pool = new Pool({
  user: process.env.PG_USER || "postgres",
  host: process.env.PG_HOST || "localhost",
  database: process.env.PG_DB || "crm_dev",
  password: process.env.PG_PASSWORD || "password",
  port: Number(process.env.PG_PORT) || 5432,
  ssl: false,
});

async function addIsPartialColumn() {
  console.log("🔧 Adding is_partial column to VCs table...");
  console.log(
    `Connecting to: ${process.env.PG_HOST || "localhost"}:${Number(process.env.PG_PORT) || 5432}`,
  );
  console.log(`Database: ${process.env.PG_DB || "crm_dev"}`);
  console.log(`User: ${process.env.PG_USER || "postgres"}`);

  try {
    // Test connection
    const client = await pool.connect();
    console.log("✅ Database connection successful!");

    // Read the migration script
    const migrationPath = path.join(
      __dirname,
      "server/database/add-vc-partial-column.sql",
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    console.log("📄 Running migration script...");
    console.log("SQL:", migrationSQL);

    // Execute the migration
    await client.query(migrationSQL);

    console.log("✅ Migration completed successfully!");
    console.log("🎉 is_partial column added to VCs table");

    // Verify the column was added
    const result = await client.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'vcs' AND column_name = 'is_partial'
    `);

    if (result.rows.length > 0) {
      console.log("✅ Verification: is_partial column exists");
      console.log("   Type:", result.rows[0].data_type);
      console.log("   Default:", result.rows[0].column_default);
    } else {
      console.log("❌ Verification failed: is_partial column not found");
    }

    client.release();
    console.log("🔌 Database connection closed");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    console.log("");
    console.log("💡 Possible solutions:");
    console.log("  1. Make sure PostgreSQL is running");
    console.log("  2. Check your database credentials");
    console.log("  3. Ensure the VCs table exists");
    console.log("  4. Run: node setup-database.js (to create tables)");
  } finally {
    await pool.end();
  }
}

// Run the migration
addIsPartialColumn();
