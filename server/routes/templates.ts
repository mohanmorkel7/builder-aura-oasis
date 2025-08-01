import { Router, Request, Response } from "express";
import {
  TemplateRepository,
  CreateTemplateData,
  UpdateTemplateData,
} from "../models/Template";
import { MockDataService } from "../services/mockData";

const router = Router();

// Helper function to check if database is available
async function isDatabaseAvailable() {
  try {
    await TemplateRepository.findAll();
    return true;
  } catch (error) {
    console.log("Database not available:", error.message);
    return false;
  }
}

// Get all templates
router.get("/", async (req: Request, res: Response) => {
  try {
    let templates;
    if (await isDatabaseAvailable()) {
      templates = await TemplateRepository.findAll();
    } else {
      templates = await MockDataService.getAllTemplates();
    }
    res.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    // Fallback to mock data
    const templates = await MockDataService.getAllTemplates();
    res.json(templates);
  }
});

// Get template by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid template ID" });
    }

    let template;
    if (await isDatabaseAvailable()) {
      template = await TemplateRepository.findById(id);
    } else {
      // Fallback to mock data
      const templates = await MockDataService.getAllTemplates();
      template = templates.find(t => t.id === id) || null;
    }

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.json(template);
  } catch (error) {
    console.error("Error fetching template:", error);
    // Fallback to mock data
    try {
      const templates = await MockDataService.getAllTemplates();
      const template = templates.find(t => t.id === id) || null;
      if (template) {
        res.json(template);
      } else {
        res.status(404).json({ error: "Template not found" });
      }
    } catch (mockError) {
      res.status(500).json({ error: "Failed to fetch template" });
    }
  }
});

// Create new template
router.post("/", async (req: Request, res: Response) => {
  try {
    const templateData: CreateTemplateData = req.body;
    console.log("Creating template with data:", JSON.stringify(templateData, null, 2));

    // Validate required fields
    if (!templateData.name || !templateData.created_by) {
      console.error("Validation failed: Missing required fields");
      return res
        .status(400)
        .json({ error: "Missing required fields: name, created_by" });
    }

    // Validate type if provided
    if (
      templateData.type &&
      !["standard", "enterprise", "smb"].includes(templateData.type)
    ) {
      console.error("Validation failed: Invalid template type");
      return res.status(400).json({ error: "Invalid template type" });
    }

    // Validate steps
    if (!templateData.steps || templateData.steps.length === 0) {
      console.error("Validation failed: No steps provided");
      return res
        .status(400)
        .json({ error: "Template must have at least one step" });
    }

    // Validate each step
    for (const step of templateData.steps) {
      if (!step.name || step.default_eta_days < 1) {
        console.error("Validation failed: Invalid step:", step);
        return res
          .status(400)
          .json({ error: "Each step must have a name and valid ETA days" });
      }
    }

    console.log("Validation passed, creating template...");

    let template;
    const dbAvailable = await isDatabaseAvailable();
    console.log("Database available:", dbAvailable);

    if (dbAvailable) {
      console.log("Using database to create template");
      template = await TemplateRepository.create(templateData);
    } else {
      console.log("Using mock data to create template");
      template = await MockDataService.createTemplate(templateData);
    }

    console.log("Template created successfully:", template);
    res.status(201).json(template);
  } catch (error) {
    console.error("Error creating template:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      error: "Failed to create template",
      details: error.message
    });
  }
});

// Update template
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid template ID" });
    }

    const templateData: UpdateTemplateData = req.body;

    // Validate type if provided
    if (
      templateData.type &&
      !["standard", "enterprise", "smb"].includes(templateData.type)
    ) {
      return res.status(400).json({ error: "Invalid template type" });
    }

    // Validate steps if provided
    if (templateData.steps) {
      if (templateData.steps.length === 0) {
        return res
          .status(400)
          .json({ error: "Template must have at least one step" });
      }

      for (const step of templateData.steps) {
        if (!step.name || step.default_eta_days < 1) {
          return res
            .status(400)
            .json({ error: "Each step must have a name and valid ETA days" });
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
    res.status(500).json({ error: "Failed to update template" });
  }
});

// Delete template (soft delete)
router.delete("/:id", async (req: Request, res: Response) => {
  try {
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
    res.status(500).json({ error: "Failed to delete template" });
  }
});

// Duplicate template
router.post("/:id/duplicate", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid template ID" });
    }

    const { created_by } = req.body;
    if (!created_by) {
      return res.status(400).json({ error: "Missing created_by field" });
    }

    const duplicatedTemplate = await TemplateRepository.duplicate(
      id,
      created_by,
    );
    if (!duplicatedTemplate) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.status(201).json(duplicatedTemplate);
  } catch (error) {
    console.error("Error duplicating template:", error);
    res.status(500).json({ error: "Failed to duplicate template" });
  }
});

export default router;
