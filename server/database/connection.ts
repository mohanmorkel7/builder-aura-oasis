import { Pool } from "pg";
import fs from "fs";
import path from "path";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:password@localhost:5432/banani_db",
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  // Set timezone to IST for all connections
  options: "-c timezone=Asia/Kolkata",
});

// Initialize database
export async function initializeDatabase() {
  try {
    const client = await pool.connect();

    // Read and execute complete schema
    const schemaPath = path.join(__dirname, "complete-schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    await client.query(schema);

    // Run migration for notifications and activity logs
    try {
      const migrationPath = path.join(
        __dirname,
        "migration-fix-notifications-activity.sql",
      );
      const migration = fs.readFileSync(migrationPath, "utf8");
      await client.query(migration);
      console.log("Migration applied successfully");
    } catch (migrationError) {
      console.log(
        "Migration already applied or error:",
        migrationError.message,
      );
    }

    console.log("Database initialized successfully");

    client.release();
  } catch (error) {
    console.error("Database initialization error:", error);
    // Don't throw error to allow development without DB
    console.log("Continuing without database connection...");
  }
}

export { pool };
