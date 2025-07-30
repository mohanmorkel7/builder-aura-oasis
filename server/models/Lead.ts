import { pool } from "../database/connection";

export interface Lead {
  id: number;
  lead_id: string; // #001, #002, etc.
  lead_source: "email" | "social-media" | "phone" | "website" | "referral" | "cold-call" | "event" | "other";
  status: "in-progress" | "won" | "lost" | "completed";

  // Project Information
  project_title?: string;
  project_description?: string;
  project_budget?: number;
  project_timeline?: string;
  project_requirements?: string;

  // Enhanced Project Info
  solutions?: string[]; // CardToken, MylapaySecure, FRM, etc.
  priority_level?: "high" | "medium" | "low";
  start_date?: string; // expected or confirmed
  targeted_end_date?: string;
  expected_daily_txn_volume?: number;
  project_value?: number; // expected revenue or deal size
  spoc?: string; // Single Point of Contact

  // Commercials
  commercials?: string[]; // CardToken, MylapaySecure, FRM, Switch-Cards, etc.
  commercial_pricing?: Array<{
    solution: string;
    value: number;
    unit: "paisa" | "cents";
    currency: "INR" | "USD" | "Dubai";
  }>;

  // Client Information
  client_name: string;
  contact_person: string;
  email: string;
  phone?: string;
  company?: string;
  industry?: string;
  company_size?: string;
  
  // Additional fields
  priority: "low" | "medium" | "high" | "urgent";
  expected_close_date?: string;
  probability?: number; // 0-100%
  sales_rep_id?: number;
  created_by: number;
  notes?: string;
  
  created_at: string;
  updated_at: string;
  
  // Relations
  sales_rep_name?: string;
  creator_name?: string;
}

export interface LeadStep {
  id: number;
  lead_id: number;
  name: string;
  description?: string;
  status: "pending" | "in_progress" | "completed";
  step_order: number;
  due_date?: string;
  completed_date?: string;
  estimated_days: number;
  created_at: string;
  updated_at: string;
}

export interface LeadChat {
  id: number;
  step_id: number;
  user_id?: number;
  user_name: string;
  message: string;
  message_type: "text" | "file" | "system";
  is_rich_text: boolean;
  created_at: string;
  
  // File attachments
  attachments?: LeadChatAttachment[];
}

export interface LeadChatAttachment {
  id: number;
  chat_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_at: string;
}

export interface CreateLeadData {
  lead_source: "email" | "social-media" | "phone" | "website" | "referral" | "cold-call" | "event" | "other";
  
  // Project Information
  project_title?: string;
  project_description?: string;
  project_budget?: number;
  project_timeline?: string;
  project_requirements?: string;

  // Enhanced Project Info
  solutions?: string[];
  priority_level?: "high" | "medium" | "low";
  start_date?: string;
  targeted_end_date?: string;
  expected_daily_txn_volume?: number;
  project_value?: number;
  spoc?: string;

  // Commercials
  commercials?: string[];
  commercial_pricing?: Array<{
    solution: string;
    value: number;
    unit: "paisa" | "cents";
    currency: "INR" | "USD" | "Dubai";
  }>;

  // Client Information
  client_name: string;
  contact_person: string;
  email: string;
  phone?: string;
  company?: string;
  industry?: string;
  company_size?: string;

  priority?: "low" | "medium" | "high" | "urgent";
  expected_close_date?: string;
  probability?: number;
  sales_rep_id?: number;
  created_by: number;
  notes?: string;
}

export interface UpdateLeadData {
  lead_source?: "email" | "social-media" | "phone" | "website" | "referral" | "cold-call" | "event" | "other";
  status?: "in-progress" | "won" | "lost" | "completed";
  
  // Project Information
  project_title?: string;
  project_description?: string;
  project_budget?: number;
  project_timeline?: string;
  project_requirements?: string;

  // Enhanced Project Info
  solutions?: string[];
  priority_level?: "high" | "medium" | "low";
  start_date?: string;
  targeted_end_date?: string;
  expected_daily_txn_volume?: number;
  project_value?: number;
  spoc?: string;

  // Commercials
  commercials?: string[];

  // Client Information
  client_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  company?: string;
  industry?: string;
  company_size?: string;

  priority?: "low" | "medium" | "high" | "urgent";
  expected_close_date?: string;
  probability?: number;
  sales_rep_id?: number;
  notes?: string;
}

export interface CreateLeadStepData {
  lead_id: number;
  name: string;
  description?: string;
  due_date?: string;
  estimated_days: number;
  step_order?: number;
}

export interface UpdateLeadStepData {
  name?: string;
  description?: string;
  status?: "pending" | "in_progress" | "completed";
  due_date?: string;
  completed_date?: string;
  estimated_days?: number;
  step_order?: number;
}

export interface CreateLeadChatData {
  step_id: number;
  user_id?: number;
  user_name: string;
  message: string;
  message_type?: "text" | "file" | "system";
  is_rich_text?: boolean;
  attachments?: {
    file_name: string;
    file_path: string;
    file_size: number;
    file_type: string;
  }[];
}

export class LeadRepository {
  static async findAll(salesRepId?: number): Promise<Lead[]> {
    const query = `
      SELECT l.*, 
             CONCAT(u.first_name, ' ', u.last_name) as sales_rep_name,
             CONCAT(c.first_name, ' ', c.last_name) as creator_name
      FROM leads l
      LEFT JOIN users u ON l.sales_rep_id = u.id
      LEFT JOIN users c ON l.created_by = c.id
      ${salesRepId ? 'WHERE l.sales_rep_id = $1' : ''}
      ORDER BY l.created_at DESC
    `;
    
    const values = salesRepId ? [salesRepId] : [];
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findById(id: number): Promise<Lead | null> {
    const query = `
      SELECT l.*, 
             CONCAT(u.first_name, ' ', u.last_name) as sales_rep_name,
             CONCAT(c.first_name, ' ', c.last_name) as creator_name
      FROM leads l
      LEFT JOIN users u ON l.sales_rep_id = u.id
      LEFT JOIN users c ON l.created_by = c.id
      WHERE l.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async create(leadData: CreateLeadData): Promise<Lead> {
    // Generate lead ID
    const countResult = await pool.query("SELECT COUNT(*) as count FROM leads");
    const count = parseInt(countResult.rows[0].count) + 1;
    const leadId = `#${count.toString().padStart(3, '0')}`;

    const query = `
      INSERT INTO leads (
        lead_id, lead_source, client_name, contact_person, email, phone, company, 
        industry, company_size, project_title, project_description, project_budget,
        project_timeline, project_requirements, priority, expected_close_date, 
        probability, sales_rep_id, created_by, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *
    `;

    const values = [
      leadId,
      leadData.lead_source,
      leadData.client_name,
      leadData.contact_person,
      leadData.email,
      leadData.phone || null,
      leadData.company || null,
      leadData.industry || null,
      leadData.company_size || null,
      leadData.project_title || null,
      leadData.project_description || null,
      leadData.project_budget || null,
      leadData.project_timeline || null,
      leadData.project_requirements || null,
      leadData.priority || "medium",
      leadData.expected_close_date || null,
      leadData.probability || 50,
      leadData.sales_rep_id || null,
      leadData.created_by,
      leadData.notes || null,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async update(id: number, leadData: UpdateLeadData): Promise<Lead | null> {
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(leadData)) {
      if (value !== undefined) {
        setClause.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (setClause.length === 0) {
      return this.findById(id);
    }

    setClause.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE leads 
      SET ${setClause.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async delete(id: number): Promise<boolean> {
    const query = "DELETE FROM leads WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }

  static async getStats(salesRepId?: number) {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'in-progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'won') as won,
        COUNT(*) FILTER (WHERE status = 'lost') as lost,
        COUNT(*) FILTER (WHERE status = 'completed') as completed
      FROM leads
      ${salesRepId ? 'WHERE sales_rep_id = $1' : ''}
    `;
    
    const values = salesRepId ? [salesRepId] : [];
    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

export class LeadStepRepository {
  static async findByLeadId(leadId: number): Promise<LeadStep[]> {
    const query = `
      SELECT * FROM lead_steps 
      WHERE lead_id = $1 
      ORDER BY step_order ASC, created_at ASC
    `;
    const result = await pool.query(query, [leadId]);
    return result.rows;
  }

  static async create(stepData: CreateLeadStepData): Promise<LeadStep> {
    // Get next step order if not provided
    let stepOrder = stepData.step_order;
    if (!stepOrder) {
      const orderQuery = `
        SELECT COALESCE(MAX(step_order), 0) + 1 as next_order 
        FROM lead_steps 
        WHERE lead_id = $1
      `;
      const orderResult = await pool.query(orderQuery, [stepData.lead_id]);
      stepOrder = orderResult.rows[0].next_order;
    }

    const query = `
      INSERT INTO lead_steps 
      (lead_id, name, description, due_date, estimated_days, step_order)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      stepData.lead_id,
      stepData.name,
      stepData.description || null,
      stepData.due_date || null,
      stepData.estimated_days,
      stepOrder,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async update(id: number, stepData: UpdateLeadStepData): Promise<LeadStep | null> {
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(stepData)) {
      if (value !== undefined) {
        setClause.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (setClause.length === 0) {
      return this.findById(id);
    }

    setClause.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE lead_steps 
      SET ${setClause.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async delete(id: number): Promise<boolean> {
    const query = "DELETE FROM lead_steps WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }

  static async reorderSteps(leadId: number, stepOrders: { id: number; order: number }[]): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      
      for (const { id, order } of stepOrders) {
        await client.query(
          "UPDATE lead_steps SET step_order = $1 WHERE id = $2 AND lead_id = $3",
          [order, id, leadId]
        );
      }
      
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private static async findById(id: number): Promise<LeadStep | null> {
    const query = "SELECT * FROM lead_steps WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }
}

export class LeadChatRepository {
  static async findByStepId(stepId: number): Promise<LeadChat[]> {
    const query = `
      SELECT lc.*, 
             json_agg(
               json_build_object(
                 'id', lca.id,
                 'file_name', lca.file_name,
                 'file_path', lca.file_path,
                 'file_size', lca.file_size,
                 'file_type', lca.file_type,
                 'uploaded_at', lca.uploaded_at
               )
             ) FILTER (WHERE lca.id IS NOT NULL) as attachments
      FROM lead_chats lc
      LEFT JOIN lead_chat_attachments lca ON lc.id = lca.chat_id
      WHERE lc.step_id = $1
      GROUP BY lc.id
      ORDER BY lc.created_at ASC
    `;
    const result = await pool.query(query, [stepId]);
    return result.rows;
  }

  static async create(chatData: CreateLeadChatData): Promise<LeadChat> {
    const client = await pool.connect();
    
    try {
      await client.query("BEGIN");

      // Create chat message
      const chatQuery = `
        INSERT INTO lead_chats 
        (step_id, user_id, user_name, message, message_type, is_rich_text)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const chatValues = [
        chatData.step_id,
        chatData.user_id || null,
        chatData.user_name,
        chatData.message,
        chatData.message_type || "text",
        chatData.is_rich_text || false,
      ];

      const chatResult = await client.query(chatQuery, chatValues);
      const chat = chatResult.rows[0];

      // Create attachments if provided
      if (chatData.attachments && chatData.attachments.length > 0) {
        const attachmentPromises = chatData.attachments.map(attachment => {
          return client.query(
            `INSERT INTO lead_chat_attachments 
             (chat_id, file_name, file_path, file_size, file_type)
             VALUES ($1, $2, $3, $4, $5)`,
            [chat.id, attachment.file_name, attachment.file_path, attachment.file_size, attachment.file_type]
          );
        });
        
        await Promise.all(attachmentPromises);
      }

      await client.query("COMMIT");
      
      // Return with attachments
      return this.findById(chat.id);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async delete(id: number): Promise<boolean> {
    const query = "DELETE FROM lead_chats WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }

  private static async findById(id: number): Promise<LeadChat> {
    const query = `
      SELECT lc.*, 
             json_agg(
               json_build_object(
                 'id', lca.id,
                 'file_name', lca.file_name,
                 'file_path', lca.file_path,
                 'file_size', lca.file_size,
                 'file_type', lca.file_type,
                 'uploaded_at', lca.uploaded_at
               )
             ) FILTER (WHERE lca.id IS NOT NULL) as attachments
      FROM lead_chats lc
      LEFT JOIN lead_chat_attachments lca ON lc.id = lca.chat_id
      WHERE lc.id = $1
      GROUP BY lc.id
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}
