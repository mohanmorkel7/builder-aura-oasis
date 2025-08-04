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

// ===== NOTIFICATIONS ROUTES =====

// Get notifications with filtering
router.get("/", async (req: Request, res: Response) => {
  try {
    await requireDatabase();
    
    const {
      user_id,
      type,
      read,
      limit = 50,
      offset = 0
    } = req.query;

    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    // Build dynamic WHERE clause
    if (user_id) {
      whereConditions.push(`n.user_id = $${paramIndex++}`);
      params.push(parseInt(user_id as string));
    }

    if (type) {
      whereConditions.push(`n.type = $${paramIndex++}`);
      params.push(type);
    }

    if (read !== undefined) {
      whereConditions.push(`n.read = $${paramIndex++}`);
      params.push(read === 'true');
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        n.*,
        u.first_name || ' ' || u.last_name as user_name,
        c.name as client_name
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      LEFT JOIN clients c ON n.client_id = c.id
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    params.push(parseInt(limit as string), parseInt(offset as string));

    const result = await pool.query(query, params);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM notifications n
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    // Get unread count
    const unreadQuery = `
      SELECT COUNT(*) as unread_count
      FROM notifications
      WHERE read = false ${user_id ? 'AND user_id = $1' : ''}
    `;

    const unreadParams = user_id ? [parseInt(user_id as string)] : [];
    const unreadResult = await pool.query(unreadQuery, unreadParams);
    const unreadCount = parseInt(unreadResult.rows[0].unread_count);

    res.json({
      notifications: result.rows,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        has_more: parseInt(offset as string) + parseInt(limit as string) < total
      },
      unread_count: unreadCount
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      error: "Failed to fetch notifications",
      message: error.message,
    });
  }
});

// Create notification
router.post("/", async (req: Request, res: Response) => {
  try {
    await requireDatabase();
    
    const {
      type,
      title,
      description,
      user_id,
      client_id,
      entity_type,
      entity_id,
      action_url,
      priority = 'medium'
    } = req.body;

    // Validate required fields
    if (!type || !title || !user_id) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["type", "title", "user_id"]
      });
    }

    const query = `
      INSERT INTO notifications (
        type, title, description, user_id, client_id, entity_type, 
        entity_id, action_url, priority, read, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, NOW())
      RETURNING *
    `;

    const result = await pool.query(query, [
      type,
      title,
      description || null,
      user_id,
      client_id || null,
      entity_type || null,
      entity_id || null,
      action_url || null,
      priority
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({
      error: "Failed to create notification",
      message: error.message,
    });
  }
});

// Mark notification as read
router.put("/:id/read", async (req: Request, res: Response) => {
  try {
    await requireDatabase();
    
    const id = req.params.id;

    const query = `
      UPDATE notifications 
      SET read = true, read_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      error: "Failed to mark notification as read",
      message: error.message,
    });
  }
});

// Mark all notifications as read for a user
router.put("/read-all", async (req: Request, res: Response) => {
  try {
    await requireDatabase();
    
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }

    const query = `
      UPDATE notifications 
      SET read = true, read_at = NOW()
      WHERE user_id = $1 AND read = false
      RETURNING id
    `;

    const result = await pool.query(query, [user_id]);

    res.json({
      message: "All notifications marked as read",
      updated_count: result.rows.length
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      error: "Failed to mark all notifications as read",
      message: error.message,
    });
  }
});

// Delete notification
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await requireDatabase();
    
    const id = req.params.id;

    const query = `DELETE FROM notifications WHERE id = $1 RETURNING id`;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      error: "Failed to delete notification", 
      message: error.message,
    });
  }
});

// Get notification types summary
router.get("/types/summary", async (req: Request, res: Response) => {
  try {
    await requireDatabase();
    
    const { user_id } = req.query;

    let whereClause = "";
    let params = [];

    if (user_id) {
      whereClause = "WHERE user_id = $1";
      params.push(parseInt(user_id as string));
    }

    const query = `
      SELECT 
        type,
        COUNT(*) as total_count,
        COUNT(CASE WHEN read = false THEN 1 END) as unread_count,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_count
      FROM notifications
      ${whereClause}
      GROUP BY type
      ORDER BY total_count DESC
    `;

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching notification types summary:", error);
    res.status(500).json({
      error: "Failed to fetch notification types summary",
      message: error.message,
    });
  }
});

// Create SLA alert notification
router.post("/sla-alert", async (req: Request, res: Response) => {
  try {
    await requireDatabase();
    
    const {
      entity_type,
      entity_id,
      entity_name,
      client_id,
      assigned_user_id,
      sla_breach_minutes,
      description
    } = req.body;

    // Validate required fields
    if (!entity_type || !entity_id || !assigned_user_id) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["entity_type", "entity_id", "assigned_user_id"]
      });
    }

    const title = `SLA Alert: ${entity_name || entity_type} #${entity_id}`;
    const alertDescription = description || `${entity_type} is approaching or has breached SLA deadline${sla_breach_minutes ? ` by ${sla_breach_minutes} minutes` : ''}`;

    const query = `
      INSERT INTO notifications (
        type, title, description, user_id, client_id, entity_type, 
        entity_id, priority, read, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'high', false, NOW())
      RETURNING *
    `;

    const result = await pool.query(query, [
      'sla_alert',
      title,
      alertDescription,
      assigned_user_id,
      client_id || null,
      entity_type,
      entity_id
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating SLA alert:", error);
    res.status(500).json({
      error: "Failed to create SLA alert",
      message: error.message,
    });
  }
});

export default router;
