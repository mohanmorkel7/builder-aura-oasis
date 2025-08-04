import { Router, Request, Response } from "express";
import { pool } from "../database/connection";

const router = Router();

// Production database availability check with graceful fallback
async function isDatabaseAvailable() {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch (error) {
    console.log("Database unavailable:", error.message);
    return false;
  }
}

// Mock notifications for fallback
const mockNotifications = [
  {
    id: "1",
    type: "overdue",
    title: "Overdue: Client Onboarding - Step 1",
    description: "Initial Contact for 'Acme Corp' is 2 days overdue. Action required.",
    user_id: 1,
    client_id: 1,
    client_name: "Acme Corp",
    entity_type: "task",
    entity_id: "1",
    priority: "high",
    read: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    action_url: "/leads/1"
  },
  {
    id: "2",
    type: "followup", 
    title: "New Follow-up: Project Alpha",
    description: "A new follow-up note has been added to 'Project Alpha' by Jane Smith.",
    user_id: 1,
    client_id: 2,
    client_name: "Beta Corp",
    entity_type: "lead",
    entity_id: "2",
    priority: "medium",
    read: false,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    action_url: "/leads/2"
  },
  {
    id: "3",
    type: "completed",
    title: "Onboarding Complete: Global Solutions",
    description: "Client 'Global Solutions' has successfully completed their onboarding process.",
    user_id: 1,
    client_id: 3,
    client_name: "Global Solutions",
    entity_type: "client",
    entity_id: "3",
    priority: "low",
    read: true,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    action_url: "/clients/3"
  }
];

// ===== NOTIFICATIONS ROUTES =====

// Get notifications with filtering
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      user_id,
      type,
      read,
      limit = 50,
      offset = 0
    } = req.query;

    if (await isDatabaseAvailable()) {
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
    } else {
      console.log("Database unavailable, using mock notifications");
      
      // Filter mock notifications
      let filteredNotifications = mockNotifications;
      
      if (user_id) {
        filteredNotifications = filteredNotifications.filter(n => n.user_id === parseInt(user_id as string));
      }
      
      if (type) {
        filteredNotifications = filteredNotifications.filter(n => n.type === type);
      }
      
      if (read !== undefined) {
        filteredNotifications = filteredNotifications.filter(n => n.read === (read === 'true'));
      }

      const total = filteredNotifications.length;
      const unreadCount = filteredNotifications.filter(n => !n.read).length;
      const limitNum = parseInt(limit as string);
      const offsetNum = parseInt(offset as string);
      
      const paginatedNotifications = filteredNotifications.slice(offsetNum, offsetNum + limitNum);

      res.json({
        notifications: paginatedNotifications,
        pagination: {
          total,
          limit: limitNum,
          offset: offsetNum,
          has_more: offsetNum + limitNum < total
        },
        unread_count: unreadCount
      });
    }
  } catch (error) {
    console.error("Error fetching notifications:", error);
    // Fallback to mock data
    res.json({
      notifications: mockNotifications,
      pagination: {
        total: mockNotifications.length,
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0,
        has_more: false
      },
      unread_count: mockNotifications.filter(n => !n.read).length
    });
  }
});

// Create notification
router.post("/", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
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
    } else {
      console.log("Database unavailable, returning mock notification creation");
      // Return a mock created notification
      const mockCreated = {
        id: Date.now().toString(),
        type: req.body.type || "general",
        title: req.body.title || "Notification",
        description: req.body.description || null,
        user_id: req.body.user_id,
        client_id: req.body.client_id || null,
        entity_type: req.body.entity_type || null,
        entity_id: req.body.entity_id || null,
        action_url: req.body.action_url || null,
        priority: req.body.priority || "medium",
        read: false,
        created_at: new Date().toISOString()
      };
      res.status(201).json(mockCreated);
    }
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
    if (await isDatabaseAvailable()) {
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
    } else {
      console.log("Database unavailable, returning mock read update");
      // Return mock success
      res.json({
        id: req.params.id,
        read: true,
        read_at: new Date().toISOString()
      });
    }
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
    if (await isDatabaseAvailable()) {
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
    } else {
      console.log("Database unavailable, returning mock read-all update");
      res.json({
        message: "All notifications marked as read",
        updated_count: mockNotifications.filter(n => !n.read).length
      });
    }
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
    if (await isDatabaseAvailable()) {
      const id = req.params.id;

      const query = `DELETE FROM notifications WHERE id = $1 RETURNING id`;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Notification not found" });
      }

      res.status(204).send();
    } else {
      console.log("Database unavailable, returning mock delete success");
      res.status(204).send();
    }
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
    if (await isDatabaseAvailable()) {
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
    } else {
      console.log("Database unavailable, using mock notification types");
      // Mock summary from mock data
      const summary = [
        { type: "overdue", total_count: 1, unread_count: 1, high_priority_count: 1 },
        { type: "followup", total_count: 1, unread_count: 1, high_priority_count: 0 },
        { type: "completed", total_count: 1, unread_count: 0, high_priority_count: 0 }
      ];
      res.json(summary);
    }
  } catch (error) {
    console.error("Error fetching notification types summary:", error);
    res.status(500).json({
      error: "Failed to fetch notification types summary",
      message: error.message,
    });
  }
});

export default router;
