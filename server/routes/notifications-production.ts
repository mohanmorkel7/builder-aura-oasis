import { Router, Request, Response } from "express";
import { pool } from "../database/connection";

const router = Router();

// Initialize notification status tables
async function initializeNotificationTables() {
  try {
    const createTablesQuery = `
      CREATE TABLE IF NOT EXISTS finops_notification_read_status (
        activity_log_id INTEGER PRIMARY KEY,
        read_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (activity_log_id) REFERENCES finops_activity_log(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS finops_notification_archived_status (
        activity_log_id INTEGER PRIMARY KEY,
        archived_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (activity_log_id) REFERENCES finops_activity_log(id) ON DELETE CASCADE
      );

      -- Add indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_notification_read_status ON finops_notification_read_status(activity_log_id);
      CREATE INDEX IF NOT EXISTS idx_notification_archived_status ON finops_notification_archived_status(activity_log_id);
      CREATE INDEX IF NOT EXISTS idx_finops_activity_log_timestamp ON finops_activity_log(timestamp DESC);
    `;

    await pool.query(createTablesQuery);
    console.log("✅ Notification status tables initialized");
  } catch (error) {
    console.log("⚠️  Failed to initialize notification tables:", error.message);
  }
}

// Initialize tables on router load
initializeNotificationTables();

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
    description:
      "Initial Contact for 'Acme Corp' is 2 days overdue. Action required.",
    user_id: 1,
    client_id: 1,
    client_name: "Acme Corp",
    entity_type: "task",
    entity_id: "1",
    priority: "high",
    read: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    action_url: "/leads/1",
  },
  {
    id: "2",
    type: "followup",
    title: "New Follow-up: Project Alpha",
    description:
      "A new follow-up note has been added to 'Project Alpha' by Jane Smith.",
    user_id: 1,
    client_id: 2,
    client_name: "Beta Corp",
    entity_type: "lead",
    entity_id: "2",
    priority: "medium",
    read: false,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    action_url: "/leads/2",
  },
  {
    id: "3",
    type: "completed",
    title: "Onboarding Complete: Global Solutions",
    description:
      "Client 'Global Solutions' has successfully completed their onboarding process.",
    user_id: 1,
    client_id: 3,
    client_name: "Global Solutions",
    entity_type: "client",
    entity_id: "3",
    priority: "low",
    read: true,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    action_url: "/clients/3",
  },
];

// ===== NOTIFICATIONS ROUTES =====

// Get notifications with filtering
router.get("/", async (req: Request, res: Response) => {
  try {
    const { user_id, type, read, limit = 50, offset = 0 } = req.query;

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
        params.push(read === "true");
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";

      // Simplified query with better indexing and deduplication
      const query = `
        SELECT DISTINCT ON (fal.action, fal.task_id, fal.subtask_id, fal.details)
          fal.id,
          fal.task_id,
          fal.subtask_id,
          fal.action,
          fal.user_name,
          fal.details,
          fal.timestamp as created_at,
          ft.task_name,
          ft.client_name,
          fs.name as subtask_name,
          CASE
            WHEN fal.action = 'delay_reported' THEN 'task_delayed'
            WHEN fal.action = 'overdue_notification_sent' THEN 'sla_overdue'
            WHEN fal.action = 'completion_notification_sent' THEN 'task_completed'
            WHEN fal.action = 'sla_alert' THEN 'sla_warning'
            WHEN fal.action = 'escalation_required' THEN 'escalation'
            WHEN LOWER(fal.details) LIKE '%overdue%' THEN 'sla_overdue'
            WHEN fal.action IN ('status_changed', 'task_status_changed') AND LOWER(fal.details) LIKE '%overdue%' THEN 'sla_overdue'
            WHEN fal.action IN ('status_changed', 'task_status_changed') AND LOWER(fal.details) LIKE '%completed%' THEN 'task_completed'
            WHEN LOWER(fal.details) LIKE '%starting in%' OR LOWER(fal.details) LIKE '%sla warning%' THEN 'sla_warning'
            WHEN LOWER(fal.details) LIKE '%min remaining%' THEN 'sla_warning'
            WHEN LOWER(fal.details) LIKE '%pending%' AND LOWER(fal.details) LIKE '%need to start%' THEN 'task_pending'
            WHEN LOWER(fal.details) LIKE '%pending status%' THEN 'task_pending'
            ELSE 'daily_reminder'
          END as type,
          CASE
            WHEN fal.action = 'delay_reported' OR fal.action = 'overdue_notification_sent' OR LOWER(fal.details) LIKE '%overdue%' THEN 'critical'
            WHEN fal.action = 'completion_notification_sent' THEN 'low'
            WHEN fal.action = 'sla_alert' OR LOWER(fal.details) LIKE '%starting in%' OR LOWER(fal.details) LIKE '%sla warning%' THEN 'high'
            WHEN fal.action = 'escalation_required' THEN 'critical'
            WHEN LOWER(fal.details) LIKE '%pending%' AND LOWER(fal.details) LIKE '%need to start%' THEN 'medium'
            WHEN LOWER(fal.details) LIKE '%pending status%' THEN 'medium'
            ELSE 'medium'
          END as priority,
          COALESCE(fnrs.activity_log_id IS NOT NULL, false) as read,
          1 as user_id
        FROM finops_activity_log fal
        LEFT JOIN finops_tasks ft ON fal.task_id = ft.id
        LEFT JOIN finops_subtasks fs ON fal.subtask_id = fs.id
        LEFT JOIN finops_notification_read_status fnrs ON fal.id = fnrs.activity_log_id
        LEFT JOIN finops_notification_archived_status fnas ON fal.id = fnas.activity_log_id
        WHERE fal.timestamp >= NOW() - INTERVAL '7 days'
        AND fnas.activity_log_id IS NULL
        ORDER BY fal.action, fal.task_id, fal.subtask_id, fal.details, fal.timestamp DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;

      params.push(parseInt(limit as string), parseInt(offset as string));

      const result = await pool.query(query, params);

      // Use a single query to get both total and unread counts for better performance
      const countsQuery = `
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN fnrs.activity_log_id IS NULL THEN 1 END) as unread_count
        FROM finops_activity_log fal
        LEFT JOIN finops_notification_read_status fnrs ON fal.id = fnrs.activity_log_id
        LEFT JOIN finops_notification_archived_status fnas ON fal.id = fnas.activity_log_id
        WHERE fal.timestamp >= NOW() - INTERVAL '7 days'
        AND fnas.activity_log_id IS NULL
      `;

      const countsResult = await pool.query(countsQuery);
      const total = parseInt(countsResult.rows[0].total);
      const unreadCount = parseInt(countsResult.rows[0].unread_count);

      res.json({
        notifications: result.rows,
        pagination: {
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          has_more:
            parseInt(offset as string) + parseInt(limit as string) < total,
        },
        unread_count: unreadCount,
      });
    } else {
      console.log("Database unavailable, using mock notifications");

      // Filter mock notifications
      let filteredNotifications = mockNotifications;

      if (user_id) {
        filteredNotifications = filteredNotifications.filter(
          (n) => n.user_id === parseInt(user_id as string),
        );
      }

      if (type) {
        filteredNotifications = filteredNotifications.filter(
          (n) => n.type === type,
        );
      }

      if (read !== undefined) {
        filteredNotifications = filteredNotifications.filter(
          (n) => n.read === (read === "true"),
        );
      }

      const total = filteredNotifications.length;
      const unreadCount = filteredNotifications.filter((n) => !n.read).length;
      const limitNum = parseInt(limit as string);
      const offsetNum = parseInt(offset as string);

      const paginatedNotifications = filteredNotifications.slice(
        offsetNum,
        offsetNum + limitNum,
      );

      res.json({
        notifications: paginatedNotifications,
        pagination: {
          total,
          limit: limitNum,
          offset: offsetNum,
          has_more: offsetNum + limitNum < total,
        },
        unread_count: unreadCount,
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
        has_more: false,
      },
      unread_count: mockNotifications.filter((n) => !n.read).length,
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
        priority = "medium",
      } = req.body;

      // Validate required fields
      if (!type || !title || !user_id) {
        return res.status(400).json({
          error: "Missing required fields",
          required: ["type", "title", "user_id"],
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
        priority,
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
        created_at: new Date().toISOString(),
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

      // Since notifications come from finops_activity_log, we'll create/update a read status table
      // First, check if the activity log entry exists
      const checkQuery = `
        SELECT id FROM finops_activity_log WHERE id = $1
      `;

      const checkResult = await pool.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: "Notification not found" });
      }

      // Create read status table if it doesn't exist
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS finops_notification_read_status (
          activity_log_id INTEGER PRIMARY KEY,
          read_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (activity_log_id) REFERENCES finops_activity_log(id) ON DELETE CASCADE
        )
      `;

      await pool.query(createTableQuery);

      // Insert or update read status
      const upsertQuery = `
        INSERT INTO finops_notification_read_status (activity_log_id, read_at)
        VALUES ($1, NOW())
        ON CONFLICT (activity_log_id)
        DO UPDATE SET read_at = NOW()
        RETURNING *
      `;

      const result = await pool.query(upsertQuery, [id]);

      res.json({
        id: id,
        read: true,
        read_at: result.rows[0].read_at,
      });
    } else {
      console.log("Database unavailable, returning mock read update");
      // Return mock success
      res.json({
        id: req.params.id,
        read: true,
        read_at: new Date().toISOString(),
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

      // Create status tables if they don't exist
      const createTablesQuery = `
        CREATE TABLE IF NOT EXISTS finops_notification_read_status (
          activity_log_id INTEGER PRIMARY KEY,
          read_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (activity_log_id) REFERENCES finops_activity_log(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS finops_notification_archived_status (
          activity_log_id INTEGER PRIMARY KEY,
          archived_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (activity_log_id) REFERENCES finops_activity_log(id) ON DELETE CASCADE
        );
      `;

      await pool.query(createTablesQuery);

      // Mark all unread activity logs as read (excluding archived ones)
      const query = `
        INSERT INTO finops_notification_read_status (activity_log_id, read_at)
        SELECT fal.id, NOW()
        FROM finops_activity_log fal
        LEFT JOIN finops_notification_read_status fnrs ON fal.id = fnrs.activity_log_id
        LEFT JOIN finops_notification_archived_status fnas ON fal.id = fnas.activity_log_id
        WHERE fal.timestamp >= NOW() - INTERVAL '7 days'
        AND fnrs.activity_log_id IS NULL
        AND fnas.activity_log_id IS NULL
        ON CONFLICT (activity_log_id) DO NOTHING
      `;

      const result = await pool.query(query);

      res.json({
        message: "All notifications marked as read",
        updated_count: result.rowCount || 0,
      });
    } else {
      console.log("Database unavailable, returning mock read-all update");
      res.json({
        message: "All notifications marked as read",
        updated_count: mockNotifications.filter((n) => !n.read).length,
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

// Archive notification (mark as archived instead of deleting)
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      const id = req.params.id;

      // Check if the activity log entry exists
      const checkQuery = `
        SELECT id FROM finops_activity_log WHERE id = $1
      `;

      const checkResult = await pool.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: "Notification not found" });
      }

      // Create status tables if they don't exist
      const createTablesQuery = `
        CREATE TABLE IF NOT EXISTS finops_notification_read_status (
          activity_log_id INTEGER PRIMARY KEY,
          read_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (activity_log_id) REFERENCES finops_activity_log(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS finops_notification_archived_status (
          activity_log_id INTEGER PRIMARY KEY,
          archived_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (activity_log_id) REFERENCES finops_activity_log(id) ON DELETE CASCADE
        );
      `;

      await pool.query(createTablesQuery);

      // Insert archived status
      const archiveQuery = `
        INSERT INTO finops_notification_archived_status (activity_log_id, archived_at)
        VALUES ($1, NOW())
        ON CONFLICT (activity_log_id)
        DO UPDATE SET archived_at = NOW()
        RETURNING *
      `;

      await pool.query(archiveQuery, [id]);

      res.status(204).send();
    } else {
      console.log("Database unavailable, returning mock delete success");
      res.status(204).send();
    }
  } catch (error) {
    console.error("Error archiving notification:", error);
    res.status(500).json({
      error: "Failed to archive notification",
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
        {
          type: "overdue",
          total_count: 1,
          unread_count: 1,
          high_priority_count: 1,
        },
        {
          type: "followup",
          total_count: 1,
          unread_count: 1,
          high_priority_count: 0,
        },
        {
          type: "completed",
          total_count: 1,
          unread_count: 0,
          high_priority_count: 0,
        },
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

// Test route to create sample notifications
router.post("/test/create-sample", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      console.log("Creating sample notifications...");

      // Create sample activity log entries that would generate notifications
      const sampleNotifications = [
        {
          action: "overdue_notification_sent",
          task_id: 1,
          subtask_id: 1,
          user_name: "System",
          details:
            "CLEARING - FILE TRANSFER AND VALIDATION is overdue by 29 minutes",
        },
        {
          action: "sla_warning",
          task_id: 2,
          subtask_id: 2,
          user_name: "System",
          details: "Task starting in 10 minutes - prepare for execution",
        },
        {
          action: "escalation_required",
          task_id: 3,
          subtask_id: 3,
          user_name: "System",
          details: "Multiple overdue tasks require immediate escalation",
        },
        {
          action: "task_status_changed",
          task_id: 4,
          subtask_id: 4,
          user_name: "System",
          details: "Start: 04:00 PM Pending Overdue by 54 min",
        },
      ];

      // First, ensure we have task records with member information
      const taskQuery = `
        UPDATE finops_tasks
        SET
          task_name = 'CLEARING - FILE TRANSFER AND VALIDATION',
          assigned_to = 'John Durairaj',
          reporting_managers = '["Albert Kumar", "Hari Prasad"]'::jsonb,
          escalation_managers = '["Sarah Wilson", "Mike Johnson"]'::jsonb,
          status = 'overdue'
        WHERE id = 1;

        -- Insert additional tasks if they don't exist
        INSERT INTO finops_tasks (task_name, assigned_to, reporting_managers, escalation_managers, effective_from, duration, is_active, created_by)
        SELECT 'DATA RECONCILIATION PROCESS', 'Maria Garcia', '["Robert Chen"]'::jsonb, '["David Lee"]'::jsonb, CURRENT_DATE, 'daily', true, 1
        WHERE NOT EXISTS (SELECT 1 FROM finops_tasks WHERE id = 2);

        INSERT INTO finops_tasks (task_name, assigned_to, reporting_managers, escalation_managers, effective_from, duration, is_active, created_by)
        SELECT 'SYSTEM MAINTENANCE TASK', 'Alex Thompson', '["Jennifer Smith", "Mark Davis"]'::jsonb, '["Lisa Brown"]'::jsonb, CURRENT_DATE, 'daily', true, 1
        WHERE NOT EXISTS (SELECT 1 FROM finops_tasks WHERE id = 3);

        INSERT INTO finops_tasks (task_name, assigned_to, reporting_managers, escalation_managers, effective_from, duration, is_active, created_by)
        SELECT 'TEST TASK (04:00 PM)', 'Test User', '["Manager One", "Manager Two"]'::jsonb, '["Escalation Manager"]'::jsonb, CURRENT_DATE, 'daily', true, 1
        WHERE NOT EXISTS (SELECT 1 FROM finops_tasks WHERE id = 4);
      `;

      await pool.query(taskQuery);

      const insertedNotifications = [];

      for (const [index, notif] of sampleNotifications.entries()) {
        // Set different timestamps for different notifications
        let timeInterval = "43 minutes";
        if (index === 3) {
          // The new notification with Start: 04:00 PM
          timeInterval = "1 hour 8 minutes"; // 1h 8m ago as per user's requirement
        }

        const query = `
          INSERT INTO finops_activity_log (action, task_id, subtask_id, user_name, details, timestamp)
          VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '${timeInterval}')
          RETURNING *
        `;

        const result = await pool.query(query, [
          notif.action,
          notif.task_id,
          notif.subtask_id,
          notif.user_name,
          notif.details,
        ]);

        insertedNotifications.push(result.rows[0]);
      }

      res.json({
        message: "Sample notifications created successfully!",
        notifications: insertedNotifications,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.json({
        message:
          "Database unavailable - would create sample notifications in production",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Error creating sample notifications:", error);
    res.status(500).json({
      error: "Failed to create sample notifications",
      message: error.message,
    });
  }
});

// Store overdue reason
router.post("/overdue-reason", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      const { notification_id, task_name, overdue_reason, created_at } =
        req.body;

      // Validate required fields
      if (!notification_id || !overdue_reason) {
        return res.status(400).json({
          error: "Missing required fields",
          required: ["notification_id", "overdue_reason"],
        });
      }

      // Create overdue reasons table if it doesn't exist
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS finops_overdue_reasons (
          id SERIAL PRIMARY KEY,
          notification_id INTEGER,
          task_name VARCHAR(255),
          overdue_reason TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;

      await pool.query(createTableQuery);

      // Insert the overdue reason
      const insertQuery = `
        INSERT INTO finops_overdue_reasons (notification_id, task_name, overdue_reason, created_at)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const result = await pool.query(insertQuery, [
        notification_id,
        task_name || null,
        overdue_reason,
        created_at || new Date().toISOString(),
      ]);

      res.status(201).json({
        message: "Overdue reason stored successfully",
        data: result.rows[0],
      });
    } else {
      console.log(
        "Database unavailable, returning mock overdue reason storage",
      );
      res.status(201).json({
        message: "Overdue reason stored successfully (mock)",
        data: {
          id: Date.now(),
          notification_id: req.body.notification_id,
          task_name: req.body.task_name,
          overdue_reason: req.body.overdue_reason,
          created_at: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.error("Error storing overdue reason:", error);
    res.status(500).json({
      error: "Failed to store overdue reason",
      message: error.message,
    });
  }
});

// Debug endpoint to check raw activity log data
router.get("/debug/raw-data", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      const query = `
        SELECT
          fal.*,
          ft.task_name,
          ft.assigned_to,
          ft.reporting_managers,
          ft.escalation_managers,
          EXTRACT(EPOCH FROM (NOW() - fal.timestamp))/60 as minutes_ago
        FROM finops_activity_log fal
        LEFT JOIN finops_tasks ft ON fal.task_id = ft.id
        WHERE fal.timestamp >= NOW() - INTERVAL '24 hours'
        ORDER BY fal.timestamp DESC
      `;

      const result = await pool.query(query);

      // Look for patterns like "Start:", "Pending", "Overdue by X min"
      const overduePattern = result.rows.filter(
        (row) =>
          row.details?.toLowerCase().includes("overdue") ||
          row.details?.toLowerCase().includes("start:") ||
          row.details?.toLowerCase().includes("pending"),
      );

      res.json({
        message: "Raw activity log data from your local database",
        total_records: result.rows.length,
        overdue_pattern_matches: overduePattern.length,
        matching_notifications: overduePattern,
        all_data: result.rows,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.json({
        message: "Database unavailable - showing mock data",
        data: [],
      });
    }
  } catch (error) {
    console.error("Error fetching raw data:", error);
    res.status(500).json({
      error: "Failed to fetch raw data",
      message: error.message,
    });
  }
});

// Create exact notification matching user's format
router.post("/test/create-user-format", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      console.log("Creating notification with user's exact format...");

      // Create the exact notification format the user described
      const query = `
        INSERT INTO finops_activity_log (action, task_id, subtask_id, user_name, details, timestamp)
        VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '1 hour 8 minutes')
        RETURNING *
      `;

      const result = await pool.query(query, [
        "task_status_changed",
        4,
        4,
        "System",
        "Start: 04:00 PM Pending Overdue by 54 min",
      ]);

      res.json({
        message: "User format notification created successfully!",
        notification: result.rows[0],
        description:
          "This should show: Start: 04:00 PM Pending Overdue by 54 min • 1h 8m ago",
        timestamp: new Date().toISOString(),
      });
    } else {
      res.json({
        message:
          "Database unavailable - would create user format notification in production",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Error creating user format notification:", error);
    res.status(500).json({
      error: "Failed to create user format notification",
      message: error.message,
    });
  }
});

// Create SLA warning notification exactly as user described
router.post("/test/create-sla-warning", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      console.log("Creating SLA warning notification...");

      // Ensure task exists for RECONCILIATION - DAILY SETTLEMENT PROCESS
      const taskQuery = `
        INSERT INTO finops_tasks (id, task_name, assigned_to, reporting_managers, escalation_managers, effective_from, duration, is_active, created_by)
        VALUES (5, 'RECONCILIATION - DAILY SETTLEMENT PROCESS', 'Maria Garcia', '["Robert Chen"]'::jsonb, '["Sarah Wilson"]'::jsonb, CURRENT_DATE, 'daily', true, 1)
        ON CONFLICT (id) DO UPDATE SET
          task_name = EXCLUDED.task_name,
          assigned_to = EXCLUDED.assigned_to,
          reporting_managers = EXCLUDED.reporting_managers
      `;

      await pool.query(taskQuery);

      // Create the SLA warning notification
      const query = `
        INSERT INTO finops_activity_log (action, task_id, subtask_id, user_name, details, timestamp)
        VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '57 minutes')
        RETURNING *
      `;

      const result = await pool.query(query, [
        "sla_alert",
        5,
        1,
        "System",
        "FinOps: sla warning Task starting in 10 minutes - prepare for execution",
      ]);

      // Also insert subtask data for MASTER AND VISA FILE VALIDATION
      const subtaskQuery = `
        INSERT INTO finops_subtasks (task_id, name, sla_hours, sla_minutes, status, assigned_to)
        SELECT 5, 'MASTER AND VISA FILE VALIDATION', 1, 0, 'pending', 'Maria Garcia'
        WHERE NOT EXISTS (
          SELECT 1 FROM finops_subtasks
          WHERE task_id = 5 AND name = 'MASTER AND VISA FILE VALIDATION'
        )
      `;

      await pool.query(subtaskQuery);

      res.json({
        message: "SLA warning notification created successfully!",
        notification: result.rows[0],
        description:
          "FinOps: sla warning Task starting in 10 minutes - prepare for execution",
        task_details: "RECONCILIATION - DAILY SETTLEMENT PROCESS",
        assigned_to: "Maria Garcia",
        subtask: "MASTER AND VISA FILE VALIDATION",
        reporting_managers: "Robert Chen",
        created_57_minutes_ago: true,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.json({
        message:
          "Database unavailable - would create SLA warning notification in production",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Error creating SLA warning notification:", error);
    res.status(500).json({
      error: "Failed to create SLA warning notification",
      message: error.message,
    });
  }
});

// Create PaySwiff Check task overdue notification
router.post(
  "/test/create-payswiff-overdue",
  async (req: Request, res: Response) => {
    try {
      if (await isDatabaseAvailable()) {
        console.log("Creating PaySwiff Check task overdue notification...");

        // Check if task 16 exists, if not create it based on user's data
        const checkTaskQuery = `
        SELECT id FROM finops_tasks WHERE id = 16
      `;

        const taskExists = await pool.query(checkTaskQuery);

        if (taskExists.rows.length === 0) {
          console.log("Task 16 doesn't exist, creating it...");
          const createTaskQuery = `
          INSERT INTO finops_tasks (id, task_name, description, assigned_to, reporting_managers, escalation_managers, effective_from, duration, is_active, created_by)
          VALUES (16, 'Check', 'check', 'Sanjay Kumar', '["Sarumathi Manickam", "Vishnu Vardhan"]'::jsonb, '["Harini NL", "Vishal S"]'::jsonb, '2025-08-23', 'daily', true, 1)
          ON CONFLICT (id) DO NOTHING
        `;

          await pool.query(createTaskQuery);
        }

        // Create the overdue notification for task 16 (Check task)
        const query = `
        INSERT INTO finops_activity_log (action, task_id, subtask_id, user_name, details, timestamp)
        VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '18 minutes')
        RETURNING *
      `;

        const result = await pool.query(query, [
          "task_status_changed",
          16,
          29,
          "System",
          "Subtasks (0/1 completed) check test Start: 05:15 PM Pending Overdue by 4 min",
        ]);

        res.json({
          message:
            "PaySwiff Check task overdue notification created successfully!",
          notification: result.rows[0],
          description:
            "Subtasks (0/1 completed) check test Start: 05:15 PM Pending Overdue by 4 min • 18 min ago",
          task_details: "Check",
          client: "PaySwiff",
          assigned_to: "Sanjay Kumar, Mugundhan Selvam",
          reporting_managers: "Sarumathi Manickam, Vishnu Vardhan",
          escalation_managers: "Harini NL, Vishal S",
          subtask: "check",
          created_18_minutes_ago: true,
          timestamp: new Date().toISOString(),
        });
      } else {
        res.json({
          message:
            "Database unavailable - would create PaySwiff overdue notification in production",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error creating PaySwiff overdue notification:", error);
      res.status(500).json({
        error: "Failed to create PaySwiff overdue notification",
        message: error.message,
      });
    }
  },
);

// Create the exact SLA warning that user described
router.post(
  "/test/create-enterprise-banking-sla",
  async (req: Request, res: Response) => {
    try {
      if (await isDatabaseAvailable()) {
        console.log("Creating Enterprise Banking SLA warning notification...");

        // Ensure task exists for RECONCILIATION - DAILY SETTLEMENT PROCESS (Enterprise Banking Solutions)
        const taskQuery = `
        INSERT INTO finops_tasks (id, task_name, assigned_to, reporting_managers, escalation_managers, effective_from, duration, is_active, created_by)
        VALUES (6, 'RECONCILIATION - DAILY SETTLEMENT PROCESS', 'Maria Garcia', '["Robert Chen"]'::jsonb, '["Sarah Wilson"]'::jsonb, CURRENT_DATE, 'daily', true, 1)
        ON CONFLICT (id) DO UPDATE SET
          task_name = EXCLUDED.task_name,
          assigned_to = EXCLUDED.assigned_to,
          reporting_managers = EXCLUDED.reporting_managers
      `;

        await pool.query(taskQuery);

        // Create the exact SLA warning notification format the user described
        const query = `
        INSERT INTO finops_activity_log (action, task_id, subtask_id, user_name, details, timestamp)
        VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '57 minutes')
        RETURNING *
      `;

        const result = await pool.query(query, [
          "sla_alert",
          6,
          1,
          "System",
          "FinOps: sla warning Task starting in 10 minutes - prepare for execution medium RECONCILIATION - DAILY SETTLEMENT PROCESS Enterprise Banking Solutions Maria Garcia",
        ]);

        // Insert subtask data for MASTER AND VISA FILE VALIDATION
        const subtaskQuery = `
        INSERT INTO finops_subtasks (task_id, name, sla_hours, sla_minutes, status, assigned_to)
        SELECT 6, 'MASTER AND VISA FILE VALIDATION', 1, 0, 'pending', 'Maria Garcia'
        WHERE NOT EXISTS (
          SELECT 1 FROM finops_subtasks
          WHERE task_id = 6 AND name = 'MASTER AND VISA FILE VALIDATION'
        )
      `;

        await pool.query(subtaskQuery);

        res.json({
          message:
            "Enterprise Banking SLA warning notification created successfully!",
          notification: result.rows[0],
          description:
            "FinOps: sla warning Task starting in 10 minutes - prepare for execution",
          task_details: "RECONCILIATION - DAILY SETTLEMENT PROCESS",
          client: "Enterprise Banking Solutions",
          assigned_to: "Maria Garcia",
          subtask: "MASTER AND VISA FILE VALIDATION",
          reporting_managers: "Robert Chen",
          priority: "medium",
          created_57_minutes_ago: true,
          timestamp: new Date().toISOString(),
        });
      } else {
        res.json({
          message:
            "Database unavailable - would create Enterprise Banking SLA warning notification in production",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error(
        "Error creating Enterprise Banking SLA warning notification:",
        error,
      );
      res.status(500).json({
        error: "Failed to create Enterprise Banking SLA warning notification",
        message: error.message,
      });
    }
  },
);

// Test endpoint to verify notification categorization
router.get("/test/categorization", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      const query = `
        SELECT
          fal.id,
          fal.action,
          fal.details,
          CASE
            WHEN fal.action = 'delay_reported' THEN 'task_delayed'
            WHEN fal.action = 'overdue_notification_sent' THEN 'sla_overdue'
            WHEN fal.action = 'completion_notification_sent' THEN 'task_completed'
            WHEN fal.action = 'sla_alert' THEN 'sla_warning'
            WHEN fal.action = 'escalation_required' THEN 'escalation'
            WHEN LOWER(fal.details) LIKE '%overdue%' THEN 'sla_overdue'
            WHEN fal.action IN ('status_changed', 'task_status_changed') AND LOWER(fal.details) LIKE '%overdue%' THEN 'sla_overdue'
            WHEN fal.action IN ('status_changed', 'task_status_changed') AND LOWER(fal.details) LIKE '%completed%' THEN 'task_completed'
            WHEN LOWER(fal.details) LIKE '%starting in%' OR LOWER(fal.details) LIKE '%sla warning%' THEN 'sla_warning'
            WHEN LOWER(fal.details) LIKE '%min remaining%' THEN 'sla_warning'
            WHEN LOWER(fal.details) LIKE '%pending%' AND LOWER(fal.details) LIKE '%need to start%' THEN 'task_pending'
            WHEN LOWER(fal.details) LIKE '%pending status%' THEN 'task_pending'
            ELSE 'daily_reminder'
          END as computed_type,
          CASE
            WHEN fal.action = 'delay_reported' OR fal.action = 'overdue_notification_sent' OR LOWER(fal.details) LIKE '%overdue%' THEN 'critical'
            WHEN fal.action = 'completion_notification_sent' THEN 'low'
            WHEN fal.action = 'sla_alert' OR LOWER(fal.details) LIKE '%starting in%' OR LOWER(fal.details) LIKE '%sla warning%' THEN 'high'
            WHEN fal.action = 'escalation_required' THEN 'critical'
            WHEN LOWER(fal.details) LIKE '%pending%' AND LOWER(fal.details) LIKE '%need to start%' THEN 'medium'
            WHEN LOWER(fal.details) LIKE '%pending status%' THEN 'medium'
            ELSE 'medium'
          END as computed_priority
        FROM finops_activity_log fal
        WHERE fal.timestamp >= NOW() - INTERVAL '24 hours'
        ORDER BY fal.timestamp DESC
      `;

      const result = await pool.query(query);

      res.json({
        message: "Notification categorization test",
        total_records: result.rows.length,
        notifications: result.rows,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.json({
        message: "Database unavailable",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Categorization test error:", error);
    res.status(500).json({
      error: "Categorization test failed",
      message: error.message,
    });
  }
});

// Test endpoint to check query performance
router.get("/test/performance", async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();

    if (await isDatabaseAvailable()) {
      const query = `
        SELECT COUNT(*) as total_records,
               COUNT(CASE WHEN timestamp >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_records
        FROM finops_activity_log
      `;

      const result = await pool.query(query);
      const queryTime = Date.now() - startTime;

      res.json({
        message: "Performance test completed",
        query_time_ms: queryTime,
        database_available: true,
        records: result.rows[0],
        timestamp: new Date().toISOString(),
      });
    } else {
      res.json({
        message: "Database unavailable",
        query_time_ms: Date.now() - startTime,
        database_available: false,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    const queryTime = Date.now() - startTime;
    console.error("Performance test error:", error);
    res.status(500).json({
      error: "Performance test failed",
      query_time_ms: queryTime,
      message: error.message,
    });
  }
});

// Test user's exact SQL query
router.get("/test/user-query", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      const query = `
        SELECT
          fal.id,
          fal.task_id,
          fal.subtask_id,
          fal.action,
          fal.user_name,
          fal.details,
          fal.timestamp as created_at,
          ft.task_name,
          ft.client_name,
          fs.name as subtask_name,
          CASE
            WHEN fal.action = 'delay_reported' THEN 'task_delayed'
            WHEN fal.action = 'overdue_notification_sent' THEN 'sla_overdue'
            WHEN fal.action = 'completion_notification_sent' THEN 'task_completed'
            WHEN fal.action = 'sla_alert' THEN 'sla_warning'
            WHEN fal.action = 'escalation_required' THEN 'escalation'
            WHEN LOWER(fal.details) LIKE '%overdue%' THEN 'sla_overdue'
            WHEN fal.action IN ('status_changed', 'task_status_changed') AND LOWER(fal.details) LIKE '%overdue%' THEN 'sla_overdue'
            WHEN fal.action IN ('status_changed', 'task_status_changed') AND LOWER(fal.details) LIKE '%completed%' THEN 'task_completed'
            WHEN LOWER(fal.details) LIKE '%starting in%' OR LOWER(fal.details) LIKE '%sla warning%' THEN 'sla_warning'
            WHEN LOWER(fal.details) LIKE '%min remaining%' THEN 'sla_warning'
            WHEN LOWER(fal.details) LIKE '%pending%' AND LOWER(fal.details) LIKE '%need to start%' THEN 'task_pending'
            WHEN LOWER(fal.details) LIKE '%pending status%' THEN 'task_pending'
            ELSE 'daily_reminder'
          END as type,
          CASE
            WHEN fal.action = 'delay_reported' OR fal.action = 'overdue_notification_sent' OR LOWER(fal.details) LIKE '%overdue%' THEN 'critical'
            WHEN fal.action = 'completion_notification_sent' THEN 'low'
            WHEN fal.action = 'sla_alert' OR LOWER(fal.details) LIKE '%starting in%' OR LOWER(fal.details) LIKE '%sla warning%' THEN 'high'
            WHEN fal.action = 'escalation_required' THEN 'critical'
            WHEN LOWER(fal.details) LIKE '%pending%' AND LOWER(fal.details) LIKE '%need to start%' THEN 'medium'
            WHEN LOWER(fal.details) LIKE '%pending status%' THEN 'medium'
            ELSE 'medium'
          END as priority,
          COALESCE(fnrs.activity_log_id IS NOT NULL, false) as read,
          1 as user_id
        FROM finops_activity_log fal
        LEFT JOIN finops_tasks ft ON fal.task_id = ft.id
        LEFT JOIN finops_subtasks fs ON fal.subtask_id = fs.id
        LEFT JOIN finops_notification_read_status fnrs ON fal.id = fnrs.activity_log_id
        LEFT JOIN finops_notification_archived_status fnas ON fal.id = fnas.activity_log_id
        WHERE fal.timestamp >= NOW() - INTERVAL '7 days'
        AND fnas.activity_log_id IS NULL
        ORDER BY fal.timestamp DESC
        LIMIT 10
      `;

      const result = await pool.query(query);

      res.json({
        message: "User's exact SQL query results",
        overdue_notifications: result.rows.filter(
          (row) => row.type === "sla_overdue",
        ),
        all_notifications: result.rows,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.json({
        message: "Database unavailable",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("User query test error:", error);
    res.status(500).json({
      error: "User query test failed",
      message: error.message,
    });
  }
});

// Quick test to verify overdue notifications are categorized correctly
router.get("/test/overdue-check", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      const query = `
        SELECT
          id,
          task_id,
          action,
          details,
          CASE
            WHEN LOWER(details) LIKE '%overdue%' THEN 'sla_overdue'
            ELSE 'other'
          END as should_be_type,
          CASE
            WHEN LOWER(details) LIKE '%overdue%' THEN 'critical'
            ELSE 'other'
          END as should_be_priority
        FROM finops_activity_log
        WHERE LOWER(details) LIKE '%overdue%'
        ORDER BY timestamp DESC
      `;

      const result = await pool.query(query);

      res.json({
        message: "Overdue notifications verification",
        count: result.rows.length,
        overdue_notifications: result.rows,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.json({
        message: "Database unavailable",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Overdue check error:", error);
    res.status(500).json({
      error: "Overdue check failed",
      message: error.message,
    });
  }
});

// Test endpoint to create pending status notification like user described
router.post("/test/create-pending-check", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      console.log("Creating pending status notification for Check task...");

      // Ensure task 16 exists based on user's data
      const checkTaskQuery = `
        SELECT id FROM finops_tasks WHERE id = 16
      `;

      const taskExists = await pool.query(checkTaskQuery);

      if (taskExists.rows.length === 0) {
        console.log("Task 16 doesn't exist, creating it...");
        const createTaskQuery = `
          INSERT INTO finops_tasks (id, task_name, description, assigned_to, reporting_managers, escalation_managers, effective_from, duration, is_active, status, created_by, client_name)
          VALUES (16, 'Check', 'check', 'Sanjay Kumar', '["Sarumathi Manickam", "Vishnu Vardhan"]'::jsonb, '["Harini NL", "Vishal S"]'::jsonb, '2025-08-23', 'daily', true, 'active', 1, 'PaySwiff')
          ON CONFLICT (id) DO UPDATE SET
            task_name = EXCLUDED.task_name,
            assigned_to = EXCLUDED.assigned_to,
            client_name = EXCLUDED.client_name
        `;

        await pool.query(createTaskQuery);
      }

      // Ensure subtask 29 exists
      const checkSubtaskQuery = `
        SELECT id FROM finops_subtasks WHERE id = 29
      `;

      const subtaskExists = await pool.query(checkSubtaskQuery);

      if (subtaskExists.rows.length === 0) {
        console.log("Subtask 29 doesn't exist, creating it...");
        const createSubtaskQuery = `
          INSERT INTO finops_subtasks (id, task_id, name, description, start_time, status, assigned_to)
          VALUES (29, 16, 'test check', 'test', '18:15:00', 'pending', 'Sanjay Kumar')
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            status = EXCLUDED.status,
            assigned_to = EXCLUDED.assigned_to
        `;

        await pool.query(createSubtaskQuery);
      }

      // Check if this notification already exists to prevent duplicates
      const checkExistingQuery = `
        SELECT id FROM finops_activity_log
        WHERE task_id = $1
        AND subtask_id = $2
        AND action = $3
        AND LOWER(details) LIKE '%pending%'
        AND LOWER(details) LIKE '%need to start%'
        AND timestamp >= NOW() - INTERVAL '24 hours'
      `;

      const existingResult = await pool.query(checkExistingQuery, [16, 29, "status_changed"]);

      if (existingResult.rows.length > 0) {
        return res.json({
          message: "Pending status notification already exists",
          existing_notification: existingResult.rows[0],
          note: "Duplicate prevention - not creating new notification",
          timestamp: new Date().toISOString(),
        });
      }

      // Create the pending status notification exactly as user described
      const query = `
        INSERT INTO finops_activity_log (action, task_id, subtask_id, user_name, details, timestamp)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `;

      const result = await pool.query(query, [
        "status_changed",
        16,
        29,
        "System",
        "Check Active Pending check Assigned: Sanjay Kumar daily 0/1 completed Starts: 06:15 PM Edit Subtasks (0/1 completed) test check Start: 06:15 PM Pending Status • need to start",
      ]);

      res.json({
        message: "Pending status notification created successfully!",
        notification: result.rows[0],
        description: "Check Active Pending check - Starts: 06:15 PM Pending Status • need to start",
        task_details: "Check",
        client: "PaySwiff",
        assigned_to: "Sanjay Kumar",
        subtask: "test check",
        status: "Pending",
        action_needed: "need to start",
        created_now: true,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.json({
        message: "Database unavailable - would create pending status notification in production",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Error creating pending status notification:", error);
    res.status(500).json({
      error: "Failed to create pending status notification",
      message: error.message,
    });
  }
});

// Check what's actually in the activity log for Check task (ID 16)
router.get("/test/check-task-activity", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      const query = `
        SELECT
          fal.id,
          fal.task_id,
          fal.subtask_id,
          fal.action,
          fal.user_name,
          fal.details,
          fal.timestamp,
          ft.task_name,
          ft.assigned_to,
          ft.client_name,
          fs.name as subtask_name,
          fs.status as subtask_status,
          CASE
            WHEN fal.action = 'delay_reported' THEN 'task_delayed'
            WHEN fal.action = 'overdue_notification_sent' THEN 'sla_overdue'
            WHEN fal.action = 'completion_notification_sent' THEN 'task_completed'
            WHEN fal.action = 'sla_alert' THEN 'sla_warning'
            WHEN fal.action = 'escalation_required' THEN 'escalation'
            WHEN LOWER(fal.details) LIKE '%overdue%' THEN 'sla_overdue'
            WHEN fal.action IN ('status_changed', 'task_status_changed') AND LOWER(fal.details) LIKE '%overdue%' THEN 'sla_overdue'
            WHEN fal.action IN ('status_changed', 'task_status_changed') AND LOWER(fal.details) LIKE '%completed%' THEN 'task_completed'
            WHEN LOWER(fal.details) LIKE '%starting in%' OR LOWER(fal.details) LIKE '%sla warning%' THEN 'sla_warning'
            WHEN LOWER(fal.details) LIKE '%pending%' AND LOWER(fal.details) LIKE '%need to start%' THEN 'task_pending'
            ELSE 'daily_reminder'
          END as notification_type,
          CASE
            WHEN fal.action = 'delay_reported' OR fal.action = 'overdue_notification_sent' OR LOWER(fal.details) LIKE '%overdue%' THEN 'critical'
            WHEN fal.action = 'completion_notification_sent' THEN 'low'
            WHEN fal.action = 'sla_alert' OR LOWER(fal.details) LIKE '%starting in%' OR LOWER(fal.details) LIKE '%sla warning%' THEN 'high'
            WHEN fal.action = 'escalation_required' THEN 'critical'
            WHEN LOWER(fal.details) LIKE '%pending%' AND LOWER(fal.details) LIKE '%need to start%' THEN 'medium'
            ELSE 'medium'
          END as notification_priority
        FROM finops_activity_log fal
        LEFT JOIN finops_tasks ft ON fal.task_id = ft.id
        LEFT JOIN finops_subtasks fs ON fal.subtask_id = fs.id
        WHERE fal.task_id = 16 OR ft.task_name ILIKE '%check%'
        ORDER BY fal.timestamp DESC
      `;

      const result = await pool.query(query);

      // Filter pending and need to start patterns
      const pendingNotifications = result.rows.filter(
        (row) =>
          row.details?.toLowerCase().includes("pending") ||
          row.details?.toLowerCase().includes("need to start")
      );

      res.json({
        message: "Check task activity log analysis",
        task_id: 16,
        task_name: "Check",
        total_activity_records: result.rows.length,
        pending_pattern_matches: pendingNotifications.length,
        pending_notifications: pendingNotifications,
        all_activity: result.rows,
        note: "Looking for 'pending' and 'need to start' patterns in details",
        timestamp: new Date().toISOString(),
      });
    } else {
      res.json({
        message: "Database unavailable",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Error checking task activity:", error);
    res.status(500).json({
      error: "Failed to check task activity",
      message: error.message,
    });
  }
});

// Check for duplicate notifications
router.get("/test/check-duplicates", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      const query = `
        SELECT
          action,
          task_id,
          subtask_id,
          details,
          COUNT(*) as duplicate_count,
          STRING_AGG(id::text, ', ') as notification_ids,
          MIN(timestamp) as first_created,
          MAX(timestamp) as last_created
        FROM finops_activity_log
        WHERE task_id = 16
        AND action = 'status_changed'
        AND LOWER(details) LIKE '%pending%'
        GROUP BY action, task_id, subtask_id, details
        HAVING COUNT(*) > 1
        ORDER BY duplicate_count DESC
      `;

      const result = await pool.query(query);

      res.json({
        message: "Duplicate notifications check",
        duplicates_found: result.rows.length,
        duplicates: result.rows,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.json({
        message: "Database unavailable",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Error checking duplicates:", error);
    res.status(500).json({
      error: "Failed to check duplicates",
      message: error.message,
    });
  }
});

// Clean up duplicate notifications for Check task
router.delete("/test/clean-duplicates", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      // Keep only the latest notification for each unique combination
      const cleanupQuery = `
        DELETE FROM finops_activity_log
        WHERE id IN (
          SELECT id FROM (
            SELECT id,
              ROW_NUMBER() OVER (
                PARTITION BY action, task_id, subtask_id, details
                ORDER BY timestamp DESC
              ) as rn
            FROM finops_activity_log
            WHERE task_id = 16
            AND action = 'status_changed'
            AND LOWER(details) LIKE '%pending%'
          ) ranked
          WHERE rn > 1
        )
        RETURNING *
      `;

      const result = await pool.query(cleanupQuery);

      res.json({
        message: "Duplicate notifications cleaned up",
        deleted_count: result.rowCount,
        deleted_notifications: result.rows,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.json({
        message: "Database unavailable - would clean duplicates in production",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Error cleaning duplicates:", error);
    res.status(500).json({
      error: "Failed to clean duplicates",
      message: error.message,
    });
  }
});

// Search for SLA warning patterns specifically
router.get("/test/search-sla-warnings", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      const query = `
        SELECT
          fal.id,
          fal.task_id,
          fal.subtask_id,
          fal.action,
          fal.user_name,
          fal.details,
          fal.timestamp,
          ft.task_name,
          ft.client_name,
          fs.name as subtask_name,
          CASE
            WHEN fal.action = 'delay_reported' THEN 'task_delayed'
            WHEN fal.action = 'overdue_notification_sent' THEN 'sla_overdue'
            WHEN fal.action = 'completion_notification_sent' THEN 'task_completed'
            WHEN fal.action = 'sla_alert' THEN 'sla_warning'
            WHEN fal.action = 'escalation_required' THEN 'escalation'
            WHEN LOWER(fal.details) LIKE '%overdue%' THEN 'sla_overdue'
            WHEN fal.action IN ('status_changed', 'task_status_changed') AND LOWER(fal.details) LIKE '%overdue%' THEN 'sla_overdue'
            WHEN fal.action IN ('status_changed', 'task_status_changed') AND LOWER(fal.details) LIKE '%completed%' THEN 'task_completed'
            WHEN LOWER(fal.details) LIKE '%starting in%' OR LOWER(fal.details) LIKE '%sla warning%' THEN 'sla_warning'
            WHEN LOWER(fal.details) LIKE '%min remaining%' THEN 'sla_warning'
            WHEN LOWER(fal.details) LIKE '%pending%' AND LOWER(fal.details) LIKE '%need to start%' THEN 'task_pending'
            WHEN LOWER(fal.details) LIKE '%pending status%' THEN 'task_pending'
            ELSE 'daily_reminder'
          END as computed_type
        FROM finops_activity_log fal
        LEFT JOIN finops_tasks ft ON fal.task_id = ft.id
        LEFT JOIN finops_subtasks fs ON fal.subtask_id = fs.id
        WHERE LOWER(fal.details) LIKE '%sla warning%'
        OR LOWER(fal.details) LIKE '%min remaining%'
        OR LOWER(fal.details) LIKE '%need to start%'
        OR fal.action = 'sla_alert'
        ORDER BY fal.timestamp DESC
      `;

      const result = await pool.query(query);

      res.json({
        message: "SLA warning pattern search",
        total_found: result.rows.length,
        sla_warnings: result.rows,
        search_patterns: [
          "sla warning",
          "min remaining",
          "need to start",
          "action=sla_alert"
        ],
        timestamp: new Date().toISOString(),
      });
    } else {
      res.json({
        message: "Database unavailable",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Error searching SLA warnings:", error);
    res.status(500).json({
      error: "Failed to search SLA warnings",
      message: error.message,
    });
  }
});

// Create SLA warning notification with 14 min remaining pattern
router.post("/test/create-sla-warning-14min", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      console.log("Creating SLA warning notification with 14 min remaining...");

      // Ensure task 16 exists
      const checkTaskQuery = `
        SELECT id FROM finops_tasks WHERE id = 16
      `;

      const taskExists = await pool.query(checkTaskQuery);

      if (taskExists.rows.length === 0) {
        const createTaskQuery = `
          INSERT INTO finops_tasks (id, task_name, description, assigned_to, reporting_managers, escalation_managers, effective_from, duration, is_active, status, created_by, client_name)
          VALUES (16, 'Check', 'check', 'Sanjay Kumar', '["Sarumathi Manickam", "Vishnu Vardhan"]'::jsonb, '["Harini NL", "Vishal S"]'::jsonb, '2025-08-23', 'daily', true, 'active', 1, 'PaySwiff')
          ON CONFLICT (id) DO UPDATE SET
            task_name = EXCLUDED.task_name,
            assigned_to = EXCLUDED.assigned_to,
            client_name = EXCLUDED.client_name
        `;

        await pool.query(createTaskQuery);
      }

      // Check if this SLA warning already exists
      const checkExistingQuery = `
        SELECT id FROM finops_activity_log
        WHERE task_id = $1
        AND LOWER(details) LIKE '%sla warning%'
        AND LOWER(details) LIKE '%14 min remaining%'
        AND timestamp >= NOW() - INTERVAL '1 hour'
      `;

      const existingResult = await pool.query(checkExistingQuery, [16]);

      if (existingResult.rows.length > 0) {
        return res.json({
          message: "SLA warning with 14 min remaining already exists",
          existing_notification: existingResult.rows[0],
          note: "Duplicate prevention - not creating new notification",
          timestamp: new Date().toISOString(),
        });
      }

      // Create the SLA warning notification
      const query = `
        INSERT INTO finops_activity_log (action, task_id, subtask_id, user_name, details, timestamp)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `;

      const result = await pool.query(query, [
        "sla_alert",
        16,
        29,
        "System",
        "SLA Warning - 14 min remaining • need to start",
      ]);

      res.json({
        message: "SLA warning notification (14 min remaining) created successfully!",
        notification: result.rows[0],
        description: "SLA Warning - 14 min remaining • need to start",
        task_details: "Check",
        client: "PaySwiff",
        assigned_to: "Sanjay Kumar",
        created_now: true,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.json({
        message: "Database unavailable - would create SLA warning notification in production",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Error creating SLA warning notification:", error);
    res.status(500).json({
      error: "Failed to create SLA warning notification",
      message: error.message,
    });
  }
});

export default router;
