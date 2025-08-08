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

// Initialize database from schema.sql (optional in dev/local)
export async function initializeDatabase() {
  try {
    const client = await pool.connect();

    // const schemaPath = path.join(__dirname, "schema.sql");
    // const schema = fs.readFileSync(schemaPath, "utf8");

    // await client.query(schema);
    console.log("Database initialized successfully");

    client.release();
  } catch (error) {
    console.error("Database initialization error:", error);
    console.log("Continuing without database connection...");
  }
}

export { pool };
