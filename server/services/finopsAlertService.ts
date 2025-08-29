import { pool } from "../database/connection";
import * as nodemailer from "nodemailer";

// IST timezone helper functions
const IST_TIMEZONE = "Asia/Kolkata";

const getCurrentISTTime = (): Date => {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: IST_TIMEZONE }),
  );
};

const convertToIST = (date: Date | string): Date => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Date(dateObj.toLocaleString("en-US", { timeZone: IST_TIMEZONE }));
};

const formatISTDateTime = (date: Date): string => {
  return date.toLocaleString("en-IN", {
    timeZone: IST_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

interface AlertConfig {
  taskId: number;
  subtaskId?: string;
  alertType: "sla_warning" | "sla_overdue" | "subtask_incomplete";
  recipientType: "assigned_user" | "reporting_managers" | "escalation_managers";
  minutes: number;
}

interface EmailRecipient {
  name: string;
  email: string;
  type: "assigned" | "reporting" | "escalation";
}

class FinOpsAlertService {
  private emailTransporter: nodemailer.Transporter;

  constructor() {
    // Initialize email transporter
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "localhost",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
      },
    });
  }

  /**
   * Check all active tasks for SLA breaches and send alerts
   */
  async checkSLAAlerts(): Promise<void> {
    try {
      console.log("Starting SLA alert check...");

      // Get all active tasks with their subtasks
      const activeTasks = await this.getActiveTasksWithSubtasks();

      for (const task of activeTasks) {
        await this.processTaskAlerts(task);
      }

      console.log("SLA alert check completed");
    } catch (error) {
      console.error("Error in SLA alert check:", error);
    }
  }

  /**
   * Check for daily tasks that need to be executed
   */
  async checkDailyTaskExecution(): Promise<void> {
    try {
      console.log("Checking for daily tasks to execute...");

const today = new Date().toISOString().split("T")[0];

      const tasksToExecute = await pool.query(
        `
        SELECT * FROM finops_tasks 
        WHERE is_active = true 
        AND duration = 'daily'
        AND effective_from <= $1
        AND (last_run IS NULL OR DATE(last_run AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') < $1)
        AND deleted_at IS NULL
      `,
      [today],
      );

      for (const task of tasksToExecute.rows) {
        await this.executeTask(task);
      }

      console.log(
        `Daily task execution completed. Processed ${tasksToExecute.rows.length} tasks`,
      );
    } catch (error) {
      console.error("Error in daily task execution:", error);
    }
  }

  /**
   * Process alerts for a specific task
   */
  private async processTaskAlerts(task: any): Promise<void> {
    for (const subtask of task.subtasks) {
      if (subtask.status === "pending") {
        await this.checkSubtaskSLA(task, subtask);
      }
    }
  }

  /**
   * Check SLA for individual subtask and send alerts if needed
   */
  private async checkSubtaskSLA(task: any, subtask: any): Promise<void> {
const now = new Date();

    // Only check pending tasks for overdue status
    if (subtask.status !== "pending") {
      return;
    }

    // Calculate due time based on task schedule (start_time)
    // For pending tasks, we check against their scheduled start time
    let dueTime: Date;

    if (subtask.start_time) {
      // Parse start_time (format: "HH:MM:SS" or "HH:MM")
      const today = new Date();
      const [hours, minutes] = subtask.start_time.split(":").map(Number);

      dueTime = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        hours,
        minutes || 0,
      );

      // If the scheduled time has passed today, the task is overdue
      if (now > dueTime) {
        const minutesOverdue = Math.floor(
          (now.getTime() - dueTime.getTime()) / (1000 * 60),
        );

        console.log(
          `Pending task overdue - Task: ${task.task_name}, Subtask: ${subtask.name}, Overdue by: ${minutesOverdue} minutes`,
        );

        // Mark as overdue and send alert
        await this.sendSLAOverdueAlert(task, subtask, minutesOverdue);
        await this.updateSubtaskStatus(task.id, subtask.id, "overdue");
      }
    } else {
      console.log(
        `Subtask ${subtask.id} has no start_time defined, cannot check for overdue status`,
      );
    }
  }

  /**
   * Send SLA warning alert (15 minutes before breach)
   */
  private async sendSLAWarningAlert(
    task: any,
    subtask: any,
    minutesRemaining: number,
  ): Promise<void> {
    try {
      // Check if warning already sent
      const existingAlert = await pool.query(
        `
        SELECT * FROM finops_alerts 
        WHERE task_id = $1 AND subtask_id = $2 AND alert_type = 'sla_warning'
        AND created_at > (CURRENT_TIMESTAMP - INTERVAL '1 hour')
      `,
        [task.id, subtask.id],
      );

      if (existingAlert.rows.length > 0) {
        return; // Alert already sent
      }

      const recipients = [
        {
          name: task.assigned_to,
          email: `${task.assigned_to.toLowerCase().replace(" ", ".")}@company.com`,
          type: "assigned" as const,
        },
        ...JSON.parse(task.reporting_managers || "[]").map((name: string) => ({
          name,
          email: `${name.toLowerCase().replace(" ", ".")}@company.com`,
          type: "reporting" as const,
        })),
      ];

      const currentTimeIST = formatISTDateTime(getCurrentISTTime());
      const subject = `⚠️ SLA Warning: ${task.task_name} - ${subtask.name}`;
      const message = `
        <h2>SLA Warning Alert</h2>
        <p><strong>Task:</strong> ${task.task_name}</p>
        <p><strong>Subtask:</strong> ${subtask.name}</p>
        <p><strong>Time Remaining:</strong> ${minutesRemaining} minutes</p>
        <p><strong>Current Status:</strong> ${subtask.status}</p>
        <p><strong>Assigned To:</strong> ${task.assigned_to}</p>
        <p><strong>Alert Time (IST):</strong> ${currentTimeIST}</p>

        <p>This subtask is approaching its SLA deadline. Please ensure timely completion to avoid escalation.</p>

        <hr>
        <p><small>This is an automated alert from the FinOps Task Management System (IST).</small></p>
      `;

      await this.sendEmailAlerts(recipients, subject, message);
      await this.logAlert(
        task.id,
        subtask.id,
        "sla_warning",
        "assigned_user,reporting_managers",
        minutesRemaining,
      );
    } catch (error) {
      console.error("Error sending SLA warning alert:", error);
    }
  }

  /**
   * Send SLA overdue alert (immediate escalation)
   */
  private async sendSLAOverdueAlert(
    task: any,
    subtask: any,
    minutesOverdue: number,
  ): Promise<void> {
    try {
      // Check if overdue alert already sent
      const existingAlert = await pool.query(
        `
        SELECT * FROM finops_alerts 
        WHERE task_id = $1 AND subtask_id = $2 AND alert_type = 'sla_overdue'
        AND created_at > (CURRENT_TIMESTAMP - INTERVAL '30 minutes')
      `,
        [task.id, subtask.id],
      );

      if (existingAlert.rows.length > 0) {
        return; // Alert already sent
      }

      const recipients = [
        {
          name: task.assigned_to,
          email: `${task.assigned_to.toLowerCase().replace(" ", ".")}@company.com`,
          type: "assigned" as const,
        },
        ...JSON.parse(task.reporting_managers || "[]").map((name: string) => ({
          name,
          email: `${name.toLowerCase().replace(" ", ".")}@company.com`,
          type: "reporting" as const,
        })),
        ...JSON.parse(task.escalation_managers || "[]").map((name: string) => ({
          name,
          email: `${name.toLowerCase().replace(" ", ".")}@company.com`,
          type: "escalation" as const,
        })),
      ];

      const currentTimeIST = formatISTDateTime(getCurrentISTTime());
      const subject = `🚨 SLA OVERDUE: ${task.task_name} - ${subtask.name}`;
      const message = `
        <h2 style="color: #dc2626;">SLA OVERDUE ALERT</h2>
        <p><strong>Task:</strong> ${task.task_name}</p>
        <p><strong>Subtask:</strong> ${subtask.name}</p>
        <p><strong>Time Overdue:</strong> ${minutesOverdue} minutes</p>
        <p><strong>Current Status:</strong> ${subtask.status}</p>
        <p><strong>Assigned To:</strong> ${task.assigned_to}</p>
        <p><strong>Alert Time (IST):</strong> ${currentTimeIST}</p>

        <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #dc2626; margin-top: 0;">IMMEDIATE ACTION REQUIRED</h3>
          <p>This subtask has exceeded its SLA deadline and requires immediate escalation.</p>
          <p>Escalation managers have been notified.</p>
        </div>

        <hr>
        <p><small>This is an automated escalation alert from the FinOps Task Management System (IST).</small></p>
      `;

      await this.sendEmailAlerts(recipients, subject, message);
      await this.logAlert(
        task.id,
        subtask.id,
        "sla_overdue",
        "all",
        minutesOverdue,
      );
    } catch (error) {
      console.error("Error sending SLA overdue alert:", error);
    }
  }

  /**
   * Execute a task (create daily instances of subtasks)
   */
  private async executeTask(task: any): Promise<void> {
    try {
      console.log(`Executing daily task: ${task.task_name}`);

      // Get subtasks for this task
      const subtasks = await pool.query(
        `
        SELECT * FROM finops_subtasks 
        WHERE task_id = $1 
        ORDER BY order_position
      `,
        [task.id],
      );

      // Reset all subtasks to pending status for daily execution
      for (const subtask of subtasks.rows) {
        await pool.query(
          `
          UPDATE finops_subtasks 
          SET status = 'pending', 
              started_at = NULL, 
              completed_at = NULL,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `,
          [subtask.id],
        );
      }

      // Update task last run time
      await pool.query(
        `
        UPDATE finops_tasks 
        SET last_run = CURRENT_TIMESTAMP,
            next_run = CURRENT_TIMESTAMP + INTERVAL '1 day'
        WHERE id = $1
      `,
        [task.id],
      );

      // Log activity
      await this.logActivity(
        task.id,
        null,
        "daily_execution",
        "System",
        "Daily task execution started",
      );

      console.log(`Daily task executed successfully: ${task.task_name}`);
    } catch (error) {
      console.error(`Error executing daily task ${task.task_name}:`, error);
    }
  }

  /**
   * Get all active tasks with their subtasks
   */
  private async getActiveTasksWithSubtasks(): Promise<any[]> {
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
      WHERE t.is_active = true AND t.deleted_at IS NULL
      GROUP BY t.id
    `;

    const result = await pool.query(query);
    return result.rows.map((row) => ({
      ...row,
      subtasks: row.subtasks || [],
    }));
  }

  /**
   * Send email alerts to recipients
   */
  private async sendEmailAlerts(
    recipients: EmailRecipient[],
    subject: string,
    htmlMessage: string,
  ): Promise<void> {
    for (const recipient of recipients) {
      try {
        await this.emailTransporter.sendMail({
          from: process.env.SMTP_FROM || "finops@company.com",
          to: recipient.email,
          subject: subject,
          html: htmlMessage,
        });

        console.log(
          `Alert email sent to ${recipient.name} (${recipient.email})`,
        );
      } catch (error) {
        console.error(`Failed to send email to ${recipient.name}:`, error);
      }
    }
  }

  /**
   * Log alert in database
   */
  private async logAlert(
    taskId: number,
    subtaskId: string,
    alertType: string,
    recipients: string,
    minutesData: number,
  ): Promise<void> {
    try {
      await pool.query(
        `
        INSERT INTO finops_alerts (task_id, subtask_id, alert_type, recipients, minutes_data, status)
        VALUES ($1, $2, $3, $4, $5, 'sent')
      `,
        [taskId, subtaskId, alertType, recipients, minutesData],
      );
    } catch (error) {
      console.error("Error logging alert:", error);
    }
  }

  /**
   * Update subtask status
   */
  private async updateSubtaskStatus(
    taskId: number,
    subtaskId: string,
    status: string,
  ): Promise<void> {
    try {
      await pool.query(
        `
        UPDATE finops_subtasks 
        SET status = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE task_id = $2 AND id = $3
      `,
        [status, taskId, subtaskId],
      );

      await this.logActivity(
        taskId,
        subtaskId,
        "status_changed",
        "System",
        `Status automatically changed to ${status} due to SLA breach`,
      );
    } catch (error) {
      console.error("Error updating subtask status:", error);
    }
  }

  /**
   * Create an overdue reason request that requires immediate attention
   */
  private async createOverdueReasonRequest(
    task: any,
    subtask: any,
    overdueMinutes: number,
  ): Promise<void> {
    try {
      console.log(
        `Creating overdue reason request for ${task.task_name} - ${subtask.name}`,
      );

      // Create a special notification type that requires overdue reason
      await pool.query(
        `
        INSERT INTO finops_activity_log (action, task_id, subtask_id, user_name, details, timestamp)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `,
        [
          "overdue_reason_required",
          task.id,
          subtask.id,
          "System",
          `OVERDUE REASON REQUIRED: ${task.task_name} - ${subtask.name} is overdue by ${overdueMinutes} minutes. Immediate explanation required.`,
        ],
      );

      // Also create an entry in a dedicated overdue tracking table
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS finops_overdue_tracking (
          id SERIAL PRIMARY KEY,
          task_id INTEGER NOT NULL,
          subtask_id INTEGER,
          task_name VARCHAR(255),
          subtask_name VARCHAR(255),
          assigned_to VARCHAR(255),
          overdue_minutes INTEGER DEFAULT 0,
          reason_provided BOOLEAN DEFAULT FALSE,
          reason_text TEXT,
          overdue_detected_at TIMESTAMP DEFAULT NOW(),
          reason_provided_at TIMESTAMP,
          status VARCHAR(50) DEFAULT 'pending_reason',
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;

      await pool.query(createTableQuery);

      // Insert tracking record
      await pool.query(
        `
        INSERT INTO finops_overdue_tracking
        (task_id, subtask_id, task_name, subtask_name, assigned_to, overdue_minutes, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'pending_reason')
        ON CONFLICT DO NOTHING
      `,
        [
          task.id,
          subtask.id,
          task.task_name,
          subtask.name,
          task.assigned_to,
          overdueMinutes,
        ],
      );

      console.log(
        `✅ Overdue reason request created for ${task.task_name} - ${subtask.name}`,
      );
    } catch (error) {
      console.error("Error creating overdue reason request:", error);
    }
  }

  /**
   * Log activity
   */
  private async logActivity(
    taskId: number,
    subtaskId: string | null,
    action: string,
    userName: string,
    details: string,
  ): Promise<void> {
    try {
      await pool.query(
        `
        INSERT INTO finops_activity_log (task_id, subtask_id, action, user_name, details)
        VALUES ($1, $2, $3, $4, $5)
      `,
        [taskId, subtaskId, action, userName, details],
      );
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  }

  /**
   * Check for incomplete subtasks and send alerts
   */
  async checkIncompleteSubtasks(): Promise<void> {
    try {
      console.log("Checking for incomplete subtasks...");

      const incompleteSubtasks = await pool.query(`
        SELECT t.*, st.*, 
               t.task_name, t.assigned_to, t.reporting_managers, t.escalation_managers
        FROM finops_subtasks st
        JOIN finops_tasks t ON st.task_id = t.id
        WHERE st.status = 'in_progress'
        AND st.started_at < (CURRENT_TIMESTAMP - INTERVAL '2 hours')
        AND t.is_active = true
        AND t.deleted_at IS NULL
      `);

      for (const row of incompleteSubtasks.rows) {
        await this.sendIncompleteSubtaskAlert(row);
      }

      console.log(
        `Incomplete subtask check completed. Found ${incompleteSubtasks.rows.length} incomplete subtasks`,
      );
    } catch (error) {
      console.error("Error checking incomplete subtasks:", error);
    }
  }

  /**
   * Send alert for incomplete subtasks
   */
  private async sendIncompleteSubtaskAlert(subtaskData: any): Promise<void> {
    try {
      const recipients = [
        {
          name: subtaskData.assigned_to,
          email: `${subtaskData.assigned_to.toLowerCase().replace(" ", ".")}@company.com`,
          type: "assigned" as const,
        },
        ...JSON.parse(subtaskData.reporting_managers || "[]").map(
          (name: string) => ({
            name,
            email: `${name.toLowerCase().replace(" ", ".")}@company.com`,
            type: "reporting" as const,
          }),
        ),
      ];

      const subject = `📋 Incomplete Subtask Alert: ${subtaskData.task_name}`;
      const message = `
        <h2>Incomplete Subtask Alert</h2>
        <p><strong>Task:</strong> ${subtaskData.task_name}</p>
        <p><strong>Subtask:</strong> ${subtaskData.name}</p>
        <p><strong>Status:</strong> ${subtaskData.status}</p>
        <p><strong>Started At:</strong> ${new Date(subtaskData.started_at).toLocaleString()}</p>
        <p><strong>Assigned To:</strong> ${subtaskData.assigned_to}</p>
        
        <p>This subtask has been in progress for more than 2 hours. Please review and update the status.</p>
        
        <hr>
        <p><small>This is an automated alert from the FinOps Task Management System.</small></p>
      `;

      await this.sendEmailAlerts(recipients, subject, message);
      await this.logAlert(
        subtaskData.task_id,
        subtaskData.id,
        "subtask_incomplete",
        "assigned_user,reporting_managers",
        0,
      );
    } catch (error) {
      console.error("Error sending incomplete subtask alert:", error);
    }
  }
}

export default new FinOpsAlertService();
