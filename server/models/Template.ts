import { pool } from '../database/connection';

export interface Template {
  id: number;
  name: string;
  description?: string;
  type: 'standard' | 'enterprise' | 'smb';
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
  steps?: TemplateStep[];
  step_count?: number;
  creator_name?: string;
}

export interface TemplateStep {
  id: number;
  template_id: number;
  step_order: number;
  name: string;
  description?: string;
  default_eta_days: number;
  auto_alert: boolean;
  email_reminder: boolean;
  created_at: string;
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  type?: 'standard' | 'enterprise' | 'smb';
  created_by: number;
  steps: CreateTemplateStepData[];
}

export interface CreateTemplateStepData {
  step_order: number;
  name: string;
  description?: string;
  default_eta_days: number;
  auto_alert: boolean;
  email_reminder: boolean;
}

export interface UpdateTemplateData {
  name?: string;
  description?: string;
  type?: 'standard' | 'enterprise' | 'smb';
  is_active?: boolean;
  steps?: CreateTemplateStepData[];
}

export class TemplateRepository {
  static async findAll(): Promise<Template[]> {
    const query = `
      SELECT t.*, 
             COUNT(ts.id) as step_count,
             CONCAT(u.first_name, ' ', u.last_name) as creator_name
      FROM onboarding_templates t
      LEFT JOIN template_steps ts ON t.id = ts.template_id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.is_active = true
      GROUP BY t.id, u.first_name, u.last_name
      ORDER BY t.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id: number): Promise<Template | null> {
    const templateQuery = `
      SELECT t.*, 
             CONCAT(u.first_name, ' ', u.last_name) as creator_name
      FROM onboarding_templates t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.id = $1
    `;
    
    const stepsQuery = `
      SELECT * FROM template_steps 
      WHERE template_id = $1 
      ORDER BY step_order ASC
    `;

    const templateResult = await pool.query(templateQuery, [id]);
    if (templateResult.rows.length === 0) {
      return null;
    }

    const stepsResult = await pool.query(stepsQuery, [id]);
    
    const template = templateResult.rows[0];
    template.steps = stepsResult.rows;
    template.step_count = stepsResult.rows.length;

    return template;
  }

  static async create(templateData: CreateTemplateData): Promise<Template> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Create template
      const templateQuery = `
        INSERT INTO onboarding_templates (name, description, type, created_by)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      
      const templateValues = [
        templateData.name,
        templateData.description || null,
        templateData.type || 'standard',
        templateData.created_by
      ];

      const templateResult = await client.query(templateQuery, templateValues);
      const template = templateResult.rows[0];

      // Create steps
      if (templateData.steps && templateData.steps.length > 0) {
        const stepQueries = templateData.steps.map((step, index) => {
          return client.query(`
            INSERT INTO template_steps (template_id, step_order, name, description, 
                                      default_eta_days, auto_alert, email_reminder)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
          `, [
            template.id,
            step.step_order || index + 1,
            step.name,
            step.description || null,
            step.default_eta_days,
            step.auto_alert,
            step.email_reminder
          ]);
        });

        const stepResults = await Promise.all(stepQueries);
        template.steps = stepResults.map(result => result.rows[0]);
        template.step_count = template.steps.length;
      }

      await client.query('COMMIT');
      return template;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async update(id: number, templateData: UpdateTemplateData): Promise<Template | null> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update template
      const setClause = [];
      const values = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(templateData)) {
        if (key !== 'steps' && value !== undefined) {
          setClause.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      if (setClause.length > 0) {
        setClause.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const templateQuery = `
          UPDATE onboarding_templates 
          SET ${setClause.join(', ')}
          WHERE id = $${paramIndex}
        `;

        await client.query(templateQuery, values);
      }

      // Update steps if provided
      if (templateData.steps) {
        // Delete existing steps
        await client.query('DELETE FROM template_steps WHERE template_id = $1', [id]);

        // Insert new steps
        if (templateData.steps.length > 0) {
          const stepQueries = templateData.steps.map((step, index) => {
            return client.query(`
              INSERT INTO template_steps (template_id, step_order, name, description, 
                                        default_eta_days, auto_alert, email_reminder)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
              id,
              step.step_order || index + 1,
              step.name,
              step.description || null,
              step.default_eta_days,
              step.auto_alert,
              step.email_reminder
            ]);
          });

          await Promise.all(stepQueries);
        }
      }

      await client.query('COMMIT');
      return this.findById(id);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async delete(id: number): Promise<boolean> {
    // Soft delete by setting is_active to false
    const query = 'UPDATE onboarding_templates SET is_active = false WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }

  static async duplicate(id: number, createdBy: number): Promise<Template | null> {
    const originalTemplate = await this.findById(id);
    if (!originalTemplate) {
      return null;
    }

    const duplicateData: CreateTemplateData = {
      name: `${originalTemplate.name} (Copy)`,
      description: originalTemplate.description,
      type: originalTemplate.type,
      created_by: createdBy,
      steps: originalTemplate.steps?.map(step => ({
        step_order: step.step_order,
        name: step.name,
        description: step.description,
        default_eta_days: step.default_eta_days,
        auto_alert: step.auto_alert,
        email_reminder: step.email_reminder
      })) || []
    };

    return this.create(duplicateData);
  }
}
