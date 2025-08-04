import { Router, Request, Response } from "express";
import { pool } from "../database/connection";

const router = Router();

// Production database availability check - fail fast if no database
async function requireDatabase() {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch (error) {
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

// ===== ACTIVITY LOG ROUTES =====

// Get activity logs with filtering
router.get("/", async (req: Request, res: Response) => {
  try {
    await requireDatabase();
    
    const {
      entity_type,
      entity_id,
      action,
      user_id,
      client_id,
      limit = 50,
      offset = 0,
      start_date,
      end_date
    } = req.query;

    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    // Build dynamic WHERE clause
    if (entity_type) {
      whereConditions.push(`al.entity_type = $${paramIndex++}`);
      params.push(entity_type);
    }

    if (entity_id) {
      whereConditions.push(`al.entity_id = $${paramIndex++}`);
      params.push(entity_id);
    }

    if (action) {
      whereConditions.push(`al.action = $${paramIndex++}`);
      params.push(action);
    }

    if (user_id) {
      whereConditions.push(`al.user_id = $${paramIndex++}`);
      params.push(parseInt(user_id as string));
    }

    if (client_id) {
      whereConditions.push(`al.client_id = $${paramIndex++}`);
      params.push(parseInt(client_id as string));
    }

    if (start_date) {
      whereConditions.push(`al.timestamp >= $${paramIndex++}`);
      params.push(start_date);
    }

    if (end_date) {
      whereConditions.push(`al.timestamp <= $${paramIndex++}`);
      params.push(end_date);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        al.*,
        u.first_name || ' ' || u.last_name as user_name,
        c.name as client_name
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN clients c ON al.client_id = c.id
      ${whereClause}
      ORDER BY al.timestamp DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    params.push(parseInt(limit as string), parseInt(offset as string));

    const result = await pool.query(query, params);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM activity_logs al
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, params.slice(0, -2)); // Remove limit and offset params
    const total = parseInt(countResult.rows[0].total);

    res.json({
      activity_logs: result.rows,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        has_more: parseInt(offset as string) + parseInt(limit as string) < total
      }
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({
      error: "Failed to fetch activity logs",
      message: error.message,
    });
  }
});

// Create activity log entry
router.post("/", async (req: Request, res: Response) => {
  try {
    await requireDatabase();
    
    const {
      action,
      entity_type,
      entity_id,
      entity_name,
      user_id,
      client_id,
      details,
      changes,
      status,
      previous_status,
      delay_reason
    } = req.body;

    // Validate required fields
    if (!action || !entity_type || !entity_id || !user_id) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["action", "entity_type", "entity_id", "user_id"]
      });
    }

    const query = `
      INSERT INTO activity_logs (
        action, entity_type, entity_id, entity_name, user_id, client_id,
        details, changes, status, previous_status, delay_reason, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *
    `;

    const result = await pool.query(query, [
      action,
      entity_type,
      entity_id,
      entity_name || null,
      user_id,
      client_id || null,
      details || null,
      changes ? JSON.stringify(changes) : null,
      status || null,
      previous_status || null,
      delay_reason || null
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating activity log:", error);
    res.status(500).json({
      error: "Failed to create activity log",
      message: error.message,
    });
  }
});

// Get activity log by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    await requireDatabase();
    
    const id = req.params.id;

    const query = `
      SELECT 
        al.*,
        u.first_name || ' ' || u.last_name as user_name,
        c.name as client_name
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN clients c ON al.client_id = c.id
      WHERE al.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Activity log not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching activity log:", error);
    res.status(500).json({
      error: "Failed to fetch activity log",
      message: error.message,
    });
  }
});

// Get activity summary/stats
router.get("/stats/summary", async (req: Request, res: Response) => {
  try {
    await requireDatabase();
    
    const { days = 7 } = req.query;

    const query = `
      SELECT 
        action,
        COUNT(*) as count,
        DATE(timestamp) as date
      FROM activity_logs
      WHERE timestamp >= NOW() - INTERVAL '${parseInt(days as string)} days'
      GROUP BY action, DATE(timestamp)
      ORDER BY date DESC, count DESC
    `;

    const result = await pool.query(query);

    // Also get total counts by action
    const totalsQuery = `
      SELECT 
        action,
        COUNT(*) as total_count
      FROM activity_logs
      WHERE timestamp >= NOW() - INTERVAL '${parseInt(days as string)} days'
      GROUP BY action
      ORDER BY total_count DESC
    `;

    const totalsResult = await pool.query(totalsQuery);

    res.json({
      daily_breakdown: result.rows,
      action_totals: totalsResult.rows,
      period_days: parseInt(days as string)
    });
  } catch (error) {
    console.error("Error fetching activity stats:", error);
    res.status(500).json({
      error: "Failed to fetch activity stats",
      message: error.message,
    });
  }
});

export default router;
