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
      const query = `
        INSERT INTO follow_ups (
          client_id, lead_id, title, description, due_date,
          follow_up_type, assigned_to, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
      ];

      const result = await pool.query(query, values);
      const followUp = result.rows[0];

      res.status(201).json(followUp);
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
  } catch (error) {
    console.error("Error updating follow-up:", error);
    res.status(500).json({ error: "Failed to update follow-up" });
  }
});

export default router;
