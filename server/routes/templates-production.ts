import { Router, Request, Response } from "express";
import {
  TemplateRepository,
  CreateTemplateData,
  UpdateTemplateData,
} from "../models/Template";
import { DatabaseValidator } from "../utils/validation";
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

// ===== TEMPLATE ROUTES =====

// Get all templates
router.get("/", async (req: Request, res: Response) => {
  try {
    await requireDatabase();
    const templates = await TemplateRepository.findAll();
    res.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({
      error: "Failed to fetch templates",
      message: error.message,
    });
  }
});

// Get template categories - production version
router.get("/categories", async (req: Request, res: Response) => {
  try {
    await requireDatabase();
    
    // Use actual database query for template categories
    const query = `
      SELECT 
        id, 
        name, 
        description, 
        color, 
        icon, 
        sort_order, 
        is_active,
        created_at,
        updated_at
      FROM template_categories 
      WHERE is_active = true 
      ORDER BY sort_order ASC
    `;
    
    const result = await pool.query(query);
    
    // If no categories exist in database, create default ones
    if (result.rows.length === 0) {
      const defaultCategories = [
        { name: "Product", description: "Product development templates", color: "#3B82F6", icon: "Package", sort_order: 1 },
        { name: "Leads", description: "Lead management templates", color: "#10B981", icon: "Target", sort_order: 2 },
        { name: "FinOps", description: "Financial operations templates", color: "#F59E0B", icon: "DollarSign", sort_order: 3 },
        { name: "Onboarding", description: "Onboarding templates", color: "#8B5CF6", icon: "UserPlus", sort_order: 4 },
        { name: "Support", description: "Customer support templates", color: "#EF4444", icon: "Headphones", sort_order: 5 },
      ];

      const insertQuery = `
        INSERT INTO template_categories (name, description, color, icon, sort_order, is_active)
        VALUES ($1, $2, $3, $4, $5, true)
        RETURNING *
      `;

      const insertedCategories = [];
      for (const category of defaultCategories) {
        const insertResult = await pool.query(insertQuery, [
          category.name,
          category.description,
          category.color,
          category.icon,
          category.sort_order
        ]);
        insertedCategories.push(insertResult.rows[0]);
      }
      
      res.json(insertedCategories);
    } else {
      res.json(result.rows);
    }
  } catch (error) {
    console.error("Error fetching template categories:", error);
    res.status(500).json({
      error: "Failed to fetch template categories",
      message: error.message,
    });
  }
});

// Get templates with categories
router.get("/with-categories", async (req: Request, res: Response) => {
  try {
    await requireDatabase();
    
    const query = `
      SELECT 
        t.*,
        tc.name as category_name,
        tc.color as category_color,
        tc.icon as category_icon,
        u.first_name || ' ' || u.last_name as creator_name,
        (SELECT COUNT(*) FROM template_steps ts WHERE ts.template_id = t.id) as step_count
      FROM onboarding_templates t
      LEFT JOIN template_categories tc ON t.category_id = tc.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.is_active = true
      ORDER BY t.updated_at DESC
    `;
    
    const result = await pool.query(query);
    
    const templatesWithCategories = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      usage_count: row.usage_count || 0,
      step_count: parseInt(row.step_count) || 0,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
      creator_name: row.creator_name || "Unknown",
      category_id: row.category_id,
      category: row.category_name ? {
        id: row.category_id,
        name: row.category_name,
        color: row.category_color,
        icon: row.category_icon
      } : null
    }));
    
    res.json(templatesWithCategories);
  } catch (error) {
    console.error("Error fetching templates with categories:", error);
    res.status(500).json({
      error: "Failed to fetch templates with categories",
      message: error.message,
    });
  }
});

// Search templates
router.get("/search", async (req: Request, res: Response) => {
  try {
    await requireDatabase();
    
    const searchTerm = req.query.q as string;
    const categoryId = req.query.category ? parseInt(req.query.category as string) : undefined;

    if (!searchTerm) {
      return res.status(400).json({ error: "Search term is required" });
    }

    let query = `
      SELECT 
        t.*,
        tc.name as category_name,
        tc.color as category_color,
        tc.icon as category_icon,
        u.first_name || ' ' || u.last_name as creator_name,
        (SELECT COUNT(*) FROM template_steps ts WHERE ts.template_id = t.id) as step_count
      FROM onboarding_templates t
      LEFT JOIN template_categories tc ON t.category_id = tc.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.is_active = true 
        AND (t.name ILIKE $1 OR t.description ILIKE $1)
    `;
    
    const params = [`%${searchTerm}%`];
    
    if (categoryId) {
      query += ` AND t.category_id = $2`;
      params.push(categoryId.toString());
    }
    
    query += ` ORDER BY t.updated_at DESC`;
    
    const result = await pool.query(query, params);
    
    const templates = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      usage_count: row.usage_count || 0,
      step_count: parseInt(row.step_count) || 0,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
      creator_name: row.creator_name || "Unknown",
      category_id: row.category_id,
      category: row.category_name ? {
        id: row.category_id,
        name: row.category_name,
        color: row.category_color,
        icon: row.category_icon
      } : null
    }));
    
    res.json(templates);
  } catch (error) {
    console.error("Error searching templates:", error);
    res.status(500).json({
      error: "Failed to search templates",
      message: error.message,
    });
  }
});

// Get template statistics
router.get("/stats", async (req: Request, res: Response) => {
  try {
    await requireDatabase();
    
    const statsQuery = `
      SELECT 
        COUNT(*) as total_templates,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_templates,
        COALESCE(SUM(usage_count), 0) as total_usage
      FROM onboarding_templates
    `;
    
    const result = await pool.query(statsQuery);
    const stats = result.rows[0];
    
    // Get most used template
    const mostUsedQuery = `
      SELECT id, name, usage_count
      FROM onboarding_templates 
      WHERE usage_count > 0
      ORDER BY usage_count DESC 
      LIMIT 1
    `;
    
    const mostUsedResult = await pool.query(mostUsedQuery);
    const mostUsed = mostUsedResult.rows[0];
    
    res.json({
      total_templates: parseInt(stats.total_templates),
      active_templates: parseInt(stats.active_templates),
      total_usage: parseInt(stats.total_usage),
      most_used_template_id: mostUsed?.id || null,
      most_used_template_name: mostUsed?.name || null,
    });
  } catch (error) {
    console.error("Error fetching template stats:", error);
    res.status(500).json({
      error: "Failed to fetch template stats",
      message: error.message,
    });
  }
});

// Get step categories
router.get("/step-categories", async (req: Request, res: Response) => {
  try {
    await requireDatabase();
    
    const query = `
      SELECT * FROM step_categories 
      ORDER BY name ASC
    `;
    
    const result = await pool.query(query);
    
    // If no step categories exist, create default ones
    if (result.rows.length === 0) {
      const defaultStepCategories = [
        { name: "Initial Setup", description: "Initial setup steps", color: "#3B82F6" },
        { name: "Documentation", description: "Documentation steps", color: "#8B5CF6" },
        { name: "Review & Approval", description: "Review and approval steps", color: "#F59E0B" },
        { name: "Communication", description: "Communication steps", color: "#10B981" },
        { name: "Technical", description: "Technical implementation", color: "#EF4444" },
        { name: "Financial", description: "Financial processes", color: "#EC4899" },
        { name: "Final Steps", description: "Completion steps", color: "#6B7280" },
      ];

      const insertQuery = `
        INSERT INTO step_categories (name, description, color)
        VALUES ($1, $2, $3)
        RETURNING *
      `;

      const insertedCategories = [];
      for (const category of defaultStepCategories) {
        const insertResult = await pool.query(insertQuery, [
          category.name,
          category.description,
          category.color
        ]);
        insertedCategories.push(insertResult.rows[0]);
      }
      
      res.json(insertedCategories);
    } else {
      res.json(result.rows);
    }
  } catch (error) {
    console.error("Error fetching step categories:", error);
    res.status(500).json({
      error: "Failed to fetch step categories",
      message: error.message,
    });
  }
});

// Get templates by category
router.get("/category/:categoryId", async (req: Request, res: Response) => {
  try {
    await requireDatabase();
    
    const categoryId = parseInt(req.params.categoryId);
    if (isNaN(categoryId)) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    const query = `
      SELECT 
        t.*,
        tc.name as category_name,
        tc.color as category_color,
        tc.icon as category_icon,
        u.first_name || ' ' || u.last_name as creator_name,
        (SELECT COUNT(*) FROM template_steps ts WHERE ts.template_id = t.id) as step_count
      FROM onboarding_templates t
      LEFT JOIN template_categories tc ON t.category_id = tc.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.category_id = $1 AND t.is_active = true
      ORDER BY t.updated_at DESC
    `;
    
    const result = await pool.query(query, [categoryId]);
    
    const templates = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      usage_count: row.usage_count || 0,
      step_count: parseInt(row.step_count) || 0,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
      creator_name: row.creator_name || "Unknown",
      category_id: row.category_id,
      category: row.category_name ? {
        id: row.category_id,
        name: row.category_name,
        color: row.category_color,
        icon: row.category_icon
      } : null
    }));
    
    res.json(templates);
  } catch (error) {
    console.error("Error fetching templates by category:", error);
    res.status(500).json({
      error: "Failed to fetch templates by category",
      message: error.message,
    });
  }
});

// Get template by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    await requireDatabase();
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid template ID" });
    }

    const template = await TemplateRepository.findById(id);

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.json(template);
  } catch (error) {
    console.error("Error fetching template:", error);
    res.status(500).json({
      error: "Failed to fetch template",
      message: error.message,
    });
  }
});

// Create new template
router.post("/", async (req: Request, res: Response) => {
  try {
    await requireDatabase();
    
    const templateData: CreateTemplateData = req.body;
    console.log("Creating template with data:", JSON.stringify(templateData, null, 2));

    // Validate required fields
    if (!templateData.name || !templateData.created_by) {
      return res.status(400).json({
        error: "Template name and created_by are required"
      });
    }

    // Validate type if provided
    if (templateData.type && !["standard", "enterprise", "smb"].includes(templateData.type)) {
      return res.status(400).json({ error: "Invalid template type" });
    }

    // Validate steps
    if (!templateData.steps || templateData.steps.length === 0) {
      return res.status(400).json({
        error: "Template must have at least one step"
      });
    }

    for (const step of templateData.steps) {
      if (!step.name || step.default_eta_days < 1) {
        return res.status(400).json({
          error: "Each step must have a name and valid ETA days"
        });
      }
    }

    const template = await TemplateRepository.create(templateData);
    console.log("Template created successfully:", template);
    res.status(201).json(template);
  } catch (error) {
    console.error("Error creating template:", error);
    res.status(500).json({
      error: "Failed to create template",
      message: error.message,
    });
  }
});

// Update template
router.put("/:id", async (req: Request, res: Response) => {
  try {
    await requireDatabase();
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid template ID" });
    }

    const templateData: UpdateTemplateData = req.body;

    // Validate type if provided
    if (templateData.type && !["standard", "enterprise", "smb"].includes(templateData.type)) {
      return res.status(400).json({ error: "Invalid template type" });
    }

    // Validate steps if provided
    if (templateData.steps) {
      if (templateData.steps.length === 0) {
        return res.status(400).json({
          error: "Template must have at least one step"
        });
      }

      for (const step of templateData.steps) {
        if (!step.name || step.default_eta_days < 1) {
          return res.status(400).json({
            error: "Each step must have a name and valid ETA days"
          });
        }
      }
    }

    const template = await TemplateRepository.update(id, templateData);
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.json(template);
  } catch (error) {
    console.error("Error updating template:", error);
    res.status(500).json({
      error: "Failed to update template",
      message: error.message,
    });
  }
});

// Delete template (soft delete)
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await requireDatabase();
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid template ID" });
    }

    const success = await TemplateRepository.delete(id);
    if (!success) {
      return res.status(404).json({ error: "Template not found" });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting template:", error);
    res.status(500).json({
      error: "Failed to delete template",
      message: error.message,
    });
  }
});

// Duplicate template
router.post("/:id/duplicate", async (req: Request, res: Response) => {
  try {
    await requireDatabase();
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid template ID" });
    }

    const created_by = parseInt(req.body.created_by || req.body.userId || "1");

    const duplicatedTemplate = await TemplateRepository.duplicate(id, created_by);
    if (!duplicatedTemplate) {
      return res.status(404).json({ error: "Template not found" });
    }
    
    res.status(201).json(duplicatedTemplate);
  } catch (error) {
    console.error("Error duplicating template:", error);
    res.status(500).json({
      error: "Failed to duplicate template",
      message: error.message,
    });
  }
});

export default router;
