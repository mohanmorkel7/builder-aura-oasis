import { Pool } from "pg";
import fs from "fs";
import path from "path";

// Use environment variables or fallback values for local development
const dbConfig = {
  user: process.env.PG_USER || "postgres",
  host: process.env.PG_HOST || "localhost",
  database: process.env.PG_DB || "banani_crm",
  password: process.env.PG_PASSWORD || "password",
  port: Number(process.env.PG_PORT) || 5432,
  ssl: false, // Change to { rejectUnauthorized: false } if required in production
};

// Log the actual connection parameters being used (hide password for security)
console.log("🔗 Database connection config:", {
  user: dbConfig.user,
  host: dbConfig.host,
  database: dbConfig.database,
  port: dbConfig.port,
  password: dbConfig.password ? "[SET]" : "[NOT SET]",
  ssl: dbConfig.ssl,
});

const pool = new Pool(dbConfig);

// Add timeout wrapper for database operations
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 5000,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error("Database operation timeout")),
        timeoutMs,
      ),
    ),
  ]);
}

// Check if database is available with timeout
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    const client = await withTimeout(pool.connect(), 3000);
    await withTimeout(client.query("SELECT 1"), 2000);
    client.release();
    return true;
  } catch (error) {
    console.log("Database availability check failed:", error.message);
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

      // Run VC probability column migration
      try {
        const vcMigrationPath = path.join(
          __dirname,
          "add-vc-probability-migration.sql",
        );
        if (fs.existsSync(vcMigrationPath)) {
          const vcMigration = fs.readFileSync(vcMigrationPath, "utf8");
          await client.query(vcMigration);
          console.log("VC probability migration applied successfully");
        }
      } catch (vcMigrationError) {
        console.log(
          "VC probability migration already applied or error:",
          vcMigrationError.message,
        );
      }

      // Run VC schema options update migration
      try {
        const vcOptionsMigrationPath = path.join(
          __dirname,
          "update-vc-schema-options.sql",
        );
        if (fs.existsSync(vcOptionsMigrationPath)) {
          const vcOptionsMigration = fs.readFileSync(vcOptionsMigrationPath, "utf8");
          await client.query(vcOptionsMigration);
          console.log("VC schema options migration applied successfully");
        }
      } catch (vcOptionsMigrationError) {
        console.log(
          "VC schema options migration already applied or error:",
          vcOptionsMigrationError.message,
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
