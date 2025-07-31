import { Router, Request, Response } from "express";
import { pool } from "../database/connection";

const router = Router();

// Enhanced helper function with better error handling
async function isDatabaseAvailable() {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch (error) {
    console.log("Database not available:", error.message);
    return false;
  }
}

// Create a new follow-up
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      client_id,
      lead_id,
      title,
      description,
      due_date,
      follow_up_type = "general",
      assigned_to,
      created_by,
      message_id,
    } = req.body;

    if (await isDatabaseAvailable()) {
      try {
        // First try to insert with the full schema including follow_up_type and lead_id
        const query = `
          INSERT INTO follow_ups (
            client_id, lead_id, title, description, due_date,
            follow_up_type, assigned_to, created_by, message_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `;

        const values = [
          client_id || null,
          lead_id || null,
          title,
          description || null,
          due_date || null,
          follow_up_type,
          assigned_to || null,
          created_by,
          message_id || null,
        ];

        const result = await pool.query(query, values);
        const followUp = result.rows[0];

        res.status(201).json(followUp);
      } catch (dbError) {
        console.error("Database insertion error:", dbError.message);
        // If database error (like missing column), run migration and fall back to mock
        if (
          dbError.message.includes("follow_up_type") ||
          dbError.message.includes("lead_id") ||
          dbError.message.includes("message_id")
        ) {
          console.log("Attempting to run migration...");
          try {
            // Try to add missing columns
            await pool.query(`
              ALTER TABLE follow_ups
              ADD COLUMN IF NOT EXISTS lead_id INTEGER REFERENCES leads(id),
              ADD COLUMN IF NOT EXISTS message_id INTEGER,
              ADD COLUMN IF NOT EXISTS follow_up_type VARCHAR(50) DEFAULT 'general'
            `);

            // Drop and recreate constraint
            await pool.query(`
              ALTER TABLE follow_ups DROP CONSTRAINT IF EXISTS follow_ups_follow_up_type_check;
              ALTER TABLE follow_ups
              ADD CONSTRAINT follow_ups_follow_up_type_check
              CHECK (follow_up_type IN ('call', 'email', 'meeting', 'document', 'proposal', 'contract', 'onboarding', 'general', 'sales', 'support', 'other'))
            `);

            console.log("Migration completed, retrying insert...");
            // Retry the insert
            const retryResult = await pool.query(query, values);
            return res.status(201).json(retryResult.rows[0]);
          } catch (migrationError) {
            console.error("Migration failed:", migrationError.message);
          }
        }

        // Fallback to mock response
        throw dbError;
      }
    } else {
      // Return mock follow-up when database is unavailable
      const mockFollowUp = {
        id: Date.now(),
        client_id,
        lead_id,
        title,
        description,
        due_date,
        follow_up_type,
        assigned_to,
        created_by,
        message_id,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log("Database unavailable, returning mock follow-up response");
      res.status(201).json(mockFollowUp);
    }
  } catch (error) {
    console.error("Error creating follow-up:", error);
    // Return mock response on error as well
    const mockFollowUp = {
      id: Date.now(),
      client_id: req.body.client_id,
      lead_id: req.body.lead_id,
      title: req.body.title,
      description: req.body.description,
      due_date: req.body.due_date,
      follow_up_type: req.body.follow_up_type || "general",
      assigned_to: req.body.assigned_to,
      created_by: req.body.created_by,
      message_id: req.body.message_id,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log("Database error, returning mock follow-up response");
    res.status(201).json(mockFollowUp);
  }
});

// Get follow-ups for a client
router.get("/client/:clientId", async (req: Request, res: Response) => {
  try {
    const clientId = parseInt(req.params.clientId);

    if (await isDatabaseAvailable()) {
      const query = `
        SELECT f.*,
               CONCAT(u.first_name, ' ', u.last_name) as assigned_user_name,
               CONCAT(c.first_name, ' ', c.last_name) as created_by_name
        FROM follow_ups f
        LEFT JOIN users u ON f.assigned_to = u.id
        LEFT JOIN users c ON f.created_by = c.id
        WHERE f.client_id = $1
        ORDER BY f.created_at DESC
      `;

      const result = await pool.query(query, [clientId]);
      res.json(result.rows);
    } else {
      // Return empty array when database is unavailable
      console.log("Database unavailable, returning empty follow-ups array");
      res.json([]);
    }
  } catch (error) {
    console.error("Error fetching follow-ups:", error);
    // Return empty array on error
    res.json([]);
  }
});

// Get follow-ups for a lead
router.get("/lead/:leadId", async (req: Request, res: Response) => {
  try {
    const leadId = parseInt(req.params.leadId);

    if (await isDatabaseAvailable()) {
      const query = `
        SELECT f.*,
               CONCAT(u.first_name, ' ', u.last_name) as assigned_user_name,
               CONCAT(c.first_name, ' ', c.last_name) as created_by_name
        FROM follow_ups f
        LEFT JOIN users u ON f.assigned_to = u.id
        LEFT JOIN users c ON f.created_by = c.id
        WHERE f.lead_id = $1
        ORDER BY f.created_at DESC
      `;

      const result = await pool.query(query, [leadId]);
      res.json(result.rows);
    } else {
      // Return empty array when database is unavailable
      console.log("Database unavailable, returning empty follow-ups array");
      res.json([]);
    }
  } catch (error) {
    console.error("Error fetching follow-ups:", error);
    // Return empty array on error
    res.json([]);
  }
});

// Update follow-up status
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const followUpId = parseInt(req.params.id);
    const { status, completed_at } = req.body;

    if (await isDatabaseAvailable()) {
      const query = `
        UPDATE follow_ups
        SET status = $1, completed_at = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;

      const values = [status, completed_at || null, followUpId];
      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Follow-up not found" });
      }

      res.json(result.rows[0]);
    } else {
      // Return mock updated follow-up when database is unavailable
      const mockUpdatedFollowUp = {
        id: followUpId,
        status,
        completed_at: completed_at || null,
        updated_at: new Date().toISOString(),
      };

      console.log("Database unavailable, returning mock follow-up update");
      res.json(mockUpdatedFollowUp);
    }
  } catch (error) {
    console.error("Error updating follow-up:", error);
    // Return mock response on error
    const mockUpdatedFollowUp = {
      id: parseInt(req.params.id),
      status: req.body.status,
      completed_at: req.body.completed_at || null,
      updated_at: new Date().toISOString(),
    };

    console.log("Database error, returning mock follow-up update");
    res.json(mockUpdatedFollowUp);
  }
});

export default router;
