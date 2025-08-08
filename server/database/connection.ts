import { Pool } from "pg";
import fs from "fs";
import path from "path";

// Use environment variables or fallback values
const pool = new Pool({
  user: process.env.PG_USER || "crmuser",
  host: process.env.PG_HOST || "10.30.11.95",
  database: process.env.PG_DB || "crm_test",
  password: process.env.PG_PASSWORD || "myl@p@y-crm$102019",
  port: Number(process.env.PG_PORT) || 2019,
  ssl: false, // Change to { rejectUnauthorized: false } if required in production
});

// Check if database is available
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    return true;
  } catch (error) {
    return false;
  }
}

// Initialize database only if available
export async function initializeDatabase() {
  try {
    // Quick connection test first
    const isAvailable = await isDatabaseAvailable();
    if (!isAvailable) {
      console.log("Database not available, skipping initialization");
      console.log("Application will run with mock data");
      return;
    }

    const client = await pool.connect();

    // Check if schema exists before reading large files
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log("Initializing database schema...");

      // Read and execute complete schema
      const schemaPath = path.join(__dirname, "complete-schema.sql");
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, "utf8");
        await client.query(schema);
        console.log("Database schema initialized");
      }

      // Run migration for notifications and activity logs
      try {
        const migrationPath = path.join(
          __dirname,
          "migration-fix-notifications-activity.sql",
        );
        if (fs.existsSync(migrationPath)) {
          const migration = fs.readFileSync(migrationPath, "utf8");
          await client.query(migration);
          console.log("Migration applied successfully");
        }
      } catch (migrationError) {
        console.log(
          "Migration already applied or error:",
          migrationError.message,
        );
      }
    } else {
      console.log("Database schema already exists");
    }

    // await client.query(schema);
    console.log("Database initialized successfully");
    client.release();
  } catch (error) {
    console.error("Database initialization error:", error.message);
    // Don't throw error to allow development without DB
    console.log("Continuing without database connection...");
  }
}

export { pool };
