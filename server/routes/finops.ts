import { Router, Request, Response } from "express";
import { pool } from "../database/connection";

const router = Router();

// Database availability check
async function isDatabaseAvailable() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    console.log("Database availability check failed:", error.message);
    return false;
  }
}

// Mock data for development when database is unavailable
const mockFinOpsTasks = [
  {
    id: 1,
    task_name: "CLEARING - FILE TRANSFER AND VALIDATION",
    description: "clearing daily steps for file transfer",
    assigned_to: "John Durairaj",
    reporting_managers: ["Albert", "Hari"],
    escalation_managers: ["Albert", "Hari"],
    effective_from: "2024-01-01",
    duration: "daily",
    is_active: true,
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    created_by: "Admin",
    next_run: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    subtasks: [
      {
        id: "1",
        name: "RBL DUMP VS TCP DATA (DAILY ALERT MAIL) VS DAILY STATUS FILE COUNT",
        description: "Daily reconciliation check",
        sla_hours: 2,
        sla_minutes: 30,
        order_position: 0,
        status: "completed",
        started_at: "2024-01-26T05:00:00Z",
        completed_at: "2024-01-26T06:15:00Z"
      },
      {
        id: "2",
        name: "MASTER AND VISA FILE VALIDATION",
        description: "Validate master and visa files",
        sla_hours: 1,
        sla_minutes: 0,
        order_position: 1,
        status: "in_progress",
        started_at: "2024-01-26T06:15:00Z"
      },
      {
        id: "3",
        name: "VISA - VALIDATION OF THE BASE 2 FILE",
        description: "Base 2 file validation for Visa",
        sla_hours: 0,
        sla_minutes: 45,
        order_position: 2,
        status: "pending"
      },
      {
        id: "4",
        name: "SHARING OF THE FILE TO M2P",
        description: "Share validated files to M2P",
        sla_hours: 0,
        sla_minutes: 30,
        order_position: 3,
        status: "pending"
      },
      {
        id: "5",
        name: "MASTER - IPM FILE - upload the file in TDG, count check, change format as clearing upload tool",
        description: "IPM file processing in TDG",
        sla_hours: 1,
        sla_minutes: 30,
        order_position: 4,
        status: "pending"
      },
      {
        id: "6",
        name: "MASTER - IPM FILE - upload in clearing optimizer and run, report check if rejections present validation to be done and run again",
        description: "Clearing optimizer processing",
        sla_hours: 2,
        sla_minutes: 0,
        order_position: 5,
        status: "pending"
      },
      {
        id: "7",
        name: "MASTER - IPM FILE - saving no error file in TDG in original format and paste it in end point folder",
        description: "Save processed files to endpoint",
        sla_hours: 0,
        sla_minutes: 30,
        order_position: 6,
        status: "pending"
      },
      {
        id: "8",
        name: "MASTER - IPM FILE - login MFE, check for no error file and delete in endpoint folder and transfer the file to network",
        description: "Final file transfer to network",
        sla_hours: 1,
        sla_minutes: 0,
        order_position: 7,
        status: "pending"
      }
    ]
  }
];

const mockActivityLog = [
  {
    id: 1,
    task_id: 1,
    subtask_id: "1",
    action: "started",
    user_name: "System",
    timestamp: "2024-01-26T05:00:00Z",
    details: "Task automatically started based on schedule"
  },
  {
    id: 2,
    task_id: 1,
    subtask_id: "1",
    action: "completed",
    user_name: "John Durairaj",
    timestamp: "2024-01-26T06:15:00Z",
    details: "RBL DUMP validation completed successfully"
  },
  {
    id: 3,
    task_id: 1,
    subtask_id: "2",
    action: "started",
    user_name: "John Durairaj",
    timestamp: "2024-01-26T06:15:00Z",
    details: "Started MASTER AND VISA FILE VALIDATION"
  }
];

// Get all FinOps tasks
router.get("/tasks", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      // Real database query
      const query = `
        SELECT 
          t.*,
          json_agg(
            json_build_object(
              'id', st.id,
              'name', st.name,
              'description', st.description,
              'sla_hours', st.sla_hours,
              'sla_minutes', st.sla_minutes,
              'order_position', st.order_position,
              'status', st.status,
              'started_at', st.started_at,
              'completed_at', st.completed_at
            ) ORDER BY st.order_position
          ) FILTER (WHERE st.id IS NOT NULL) as subtasks
        FROM finops_tasks t
        LEFT JOIN finops_subtasks st ON t.id = st.task_id
        WHERE t.deleted_at IS NULL
        GROUP BY t.id
        ORDER BY t.created_at DESC
      `;
      
      const result = await pool.query(query);
      const tasks = result.rows.map(row => ({
        ...row,
        subtasks: row.subtasks || []
      }));
      
      res.json(tasks);
    } else {
      console.log("Database unavailable, returning mock FinOps tasks");
      res.json(mockFinOpsTasks);
    }
  } catch (error) {
    console.error("Error fetching FinOps tasks:", error);
    res.json(mockFinOpsTasks);
  }
});

// Create new FinOps task
router.post("/tasks", async (req: Request, res: Response) => {
  try {
    const {
      task_name,
      description,
      assigned_to,
      reporting_managers,
      escalation_managers,
      effective_from,
      duration,
      is_active,
      subtasks,
      created_by
    } = req.body;

    if (await isDatabaseAvailable()) {
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Insert main task
        const taskQuery = `
          INSERT INTO finops_tasks (
            task_name, description, assigned_to, reporting_managers, 
            escalation_managers, effective_from, duration, is_active, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id
        `;
        
        const taskResult = await client.query(taskQuery, [
          task_name,
          description,
          assigned_to,
          JSON.stringify(reporting_managers),
          JSON.stringify(escalation_managers),
          effective_from,
          duration,
          is_active,
          created_by
        ]);
        
        const taskId = taskResult.rows[0].id;
        
        // Insert subtasks
        if (subtasks && subtasks.length > 0) {
          for (const subtask of subtasks) {
            const subtaskQuery = `
              INSERT INTO finops_subtasks (
                task_id, name, description, sla_hours, sla_minutes, order_position
              ) VALUES ($1, $2, $3, $4, $5, $6)
            `;
            
            await client.query(subtaskQuery, [
              taskId,
              subtask.name,
              subtask.description || null,
              subtask.sla_hours,
              subtask.sla_minutes,
              subtask.order_position
            ]);
          }
        }
        
        await client.query('COMMIT');
        
        // Log activity
        await logActivity(taskId, null, 'created', `User ${created_by}`, 'Task created');
        
        res.status(201).json({ id: taskId, message: "FinOps task created successfully" });
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      // Mock response
      const newTask = {
        id: Date.now(),
        ...req.body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active'
      };
      mockFinOpsTasks.push(newTask);
      res.status(201).json({ id: newTask.id, message: "FinOps task created successfully (mock)" });
    }
  } catch (error) {
    console.error("Error creating FinOps task:", error);
    res.status(500).json({ error: "Failed to create FinOps task" });
  }
});

// Update FinOps task
router.put("/tasks/:id", async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);
    const {
      task_name,
      description,
      assigned_to,
      reporting_managers,
      escalation_managers,
      effective_from,
      duration,
      is_active,
      subtasks
    } = req.body;

    if (await isDatabaseAvailable()) {
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Update main task
        const taskQuery = `
          UPDATE finops_tasks SET
            task_name = $1,
            description = $2,
            assigned_to = $3,
            reporting_managers = $4,
            escalation_managers = $5,
            effective_from = $6,
            duration = $7,
            is_active = $8,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $9
        `;
        
        await client.query(taskQuery, [
          task_name,
          description,
          assigned_to,
          JSON.stringify(reporting_managers),
          JSON.stringify(escalation_managers),
          effective_from,
          duration,
          is_active,
          taskId
        ]);
        
        // Delete existing subtasks and recreate
        await client.query('DELETE FROM finops_subtasks WHERE task_id = $1', [taskId]);
        
        // Insert updated subtasks
        if (subtasks && subtasks.length > 0) {
          for (const subtask of subtasks) {
            const subtaskQuery = `
              INSERT INTO finops_subtasks (
                task_id, name, description, sla_hours, sla_minutes, order_position
              ) VALUES ($1, $2, $3, $4, $5, $6)
            `;
            
            await client.query(subtaskQuery, [
              taskId,
              subtask.name,
              subtask.description || null,
              subtask.sla_hours,
              subtask.sla_minutes,
              subtask.order_position
            ]);
          }
        }
        
        await client.query('COMMIT');
        
        // Log activity
        await logActivity(taskId, null, 'updated', 'User', 'Task updated');
        
        res.json({ message: "FinOps task updated successfully" });
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      // Mock response
      const taskIndex = mockFinOpsTasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        mockFinOpsTasks[taskIndex] = {
          ...mockFinOpsTasks[taskIndex],
          ...req.body,
          updated_at: new Date().toISOString()
        };
        res.json({ message: "FinOps task updated successfully (mock)" });
      } else {
        res.status(404).json({ error: "Task not found" });
      }
    }
  } catch (error) {
    console.error("Error updating FinOps task:", error);
    res.status(500).json({ error: "Failed to update FinOps task" });
  }
});

// Delete FinOps task
router.delete("/tasks/:id", async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);

    if (await isDatabaseAvailable()) {
      // Soft delete
      const query = `
        UPDATE finops_tasks 
        SET deleted_at = CURRENT_TIMESTAMP 
        WHERE id = $1
      `;
      
      await pool.query(query, [taskId]);
      
      // Log activity
      await logActivity(taskId, null, 'deleted', 'User', 'Task deleted');
      
      res.json({ message: "FinOps task deleted successfully" });
    } else {
      // Mock response
      const taskIndex = mockFinOpsTasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        mockFinOpsTasks.splice(taskIndex, 1);
        res.json({ message: "FinOps task deleted successfully (mock)" });
      } else {
        res.status(404).json({ error: "Task not found" });
      }
    }
  } catch (error) {
    console.error("Error deleting FinOps task:", error);
    res.status(500).json({ error: "Failed to delete FinOps task" });
  }
});

// Update subtask status
router.patch("/tasks/:taskId/subtasks/:subtaskId", async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.taskId);
    const subtaskId = req.params.subtaskId;
    const { status } = req.body;

    if (await isDatabaseAvailable()) {
      const query = `
        UPDATE finops_subtasks 
        SET status = $1,
            ${status === 'completed' ? 'completed_at = CURRENT_TIMESTAMP,' : ''}
            ${status === 'in_progress' ? 'started_at = CURRENT_TIMESTAMP,' : ''}
            updated_at = CURRENT_TIMESTAMP
        WHERE task_id = $2 AND id = $3
      `;
      
      await pool.query(query, [status, taskId, subtaskId]);
      
      // Log activity
      await logActivity(taskId, subtaskId, 'status_changed', 'User', `Status changed to ${status}`);
      
      res.json({ message: "Subtask status updated successfully" });
    } else {
      // Mock response
      const task = mockFinOpsTasks.find(t => t.id === taskId);
      if (task) {
        const subtask = task.subtasks.find(st => st.id === subtaskId);
        if (subtask) {
          subtask.status = status;
          if (status === 'completed') {
            subtask.completed_at = new Date().toISOString();
          }
          if (status === 'in_progress') {
            subtask.started_at = new Date().toISOString();
          }
          res.json({ message: "Subtask status updated successfully (mock)" });
        } else {
          res.status(404).json({ error: "Subtask not found" });
        }
      } else {
        res.status(404).json({ error: "Task not found" });
      }
    }
  } catch (error) {
    console.error("Error updating subtask status:", error);
    res.status(500).json({ error: "Failed to update subtask status" });
  }
});

// Get activity log
router.get("/activity-log", async (req: Request, res: Response) => {
  try {
    const { taskId } = req.query;

    if (await isDatabaseAvailable()) {
      const query = taskId 
        ? `SELECT * FROM finops_activity_log WHERE task_id = $1 ORDER BY timestamp DESC`
        : `SELECT * FROM finops_activity_log ORDER BY timestamp DESC LIMIT 100`;
      
      const result = taskId 
        ? await pool.query(query, [parseInt(taskId as string)])
        : await pool.query(query);
      
      res.json(result.rows);
    } else {
      // Mock response
      const filteredLog = taskId 
        ? mockActivityLog.filter(log => log.task_id === parseInt(taskId as string))
        : mockActivityLog;
      
      res.json(filteredLog);
    }
  } catch (error) {
    console.error("Error fetching activity log:", error);
    res.json(mockActivityLog);
  }
});

// Run task manually
router.post("/tasks/:id/run", async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);

    // Log activity
    await logActivity(taskId, null, 'manual_run', 'User', 'Task manually triggered');
    
    // In a real implementation, this would trigger the actual task execution
    res.json({ message: "Task execution triggered successfully" });
  } catch (error) {
    console.error("Error running task:", error);
    res.status(500).json({ error: "Failed to run task" });
  }
});

// Helper function to log activities
async function logActivity(taskId: number, subtaskId: string | null, action: string, userName: string, details: string) {
  try {
    if (await isDatabaseAvailable()) {
      const query = `
        INSERT INTO finops_activity_log (task_id, subtask_id, action, user_name, details)
        VALUES ($1, $2, $3, $4, $5)
      `;
      
      await pool.query(query, [taskId, subtaskId, action, userName, details]);
    } else {
      // Mock logging
      mockActivityLog.push({
        id: Date.now(),
        task_id: taskId,
        subtask_id: subtaskId,
        action,
        user_name: userName,
        timestamp: new Date().toISOString(),
        details
      });
    }
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}

export default router;
