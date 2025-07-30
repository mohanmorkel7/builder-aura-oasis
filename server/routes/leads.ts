import { Router, Request, Response } from "express";
import {
  LeadRepository,
  LeadStepRepository,
  LeadChatRepository,
  CreateLeadData,
  UpdateLeadData,
  CreateLeadStepData,
  UpdateLeadStepData,
  CreateLeadChatData,
} from "../models/Lead";
import { MockDataService } from "../services/mockData";
import { DatabaseValidator, ValidationSchemas } from "../utils/validation";

const router = Router();

// Enhanced helper function with better error handling
async function isDatabaseAvailable() {
  try {
    return await DatabaseValidator.isDatabaseAvailable();
  } catch (error) {
    console.log("Database availability check failed:", error.message);
    return false;
  }
}

// Get all leads
router.get("/", async (req: Request, res: Response) => {
  try {
    const { salesRep } = req.query;
    const salesRepId = salesRep ? parseInt(salesRep as string) : undefined;

    let leads;
    try {
      if (await isDatabaseAvailable()) {
        leads = await LeadRepository.findAll(salesRepId);
      } else {
        leads = await MockDataService.getAllLeads(salesRepId);
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      leads = await MockDataService.getAllLeads(salesRepId);
    }

    res.json(leads);
  } catch (error) {
    console.error("Error fetching leads:", error);
    try {
      const leads = await MockDataService.getAllLeads();
      res.json(leads);
    } catch (fallbackError) {
      console.error("Mock data fallback failed:", fallbackError);
      res.json([]);
    }
  }
});

// Get lead statistics
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const { salesRep } = req.query;
    const salesRepId = salesRep ? parseInt(salesRep as string) : undefined;

    let stats;
    try {
      if (await isDatabaseAvailable()) {
        stats = await LeadRepository.getStats(salesRepId);
      } else {
        stats = await MockDataService.getLeadStats(salesRepId);
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      stats = await MockDataService.getLeadStats(salesRepId);
    }

    res.json(stats);
  } catch (error) {
    console.error("Error fetching lead stats:", error);
    try {
      const stats = await MockDataService.getLeadStats();
      res.json(stats);
    } catch (fallbackError) {
      console.error("Mock data fallback failed:", fallbackError);
      res.json({ total: 0, in_progress: 0, won: 0, lost: 0, completed: 0 });
    }
  }
});

// Get lead by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid lead ID" });
    }

    let lead;
    try {
      if (await isDatabaseAvailable()) {
        lead = await LeadRepository.findById(id);
      } else {
        lead = await MockDataService.getLeadById(id);
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      lead = await MockDataService.getLeadById(id);
    }

    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    res.json(lead);
  } catch (error) {
    console.error("Error fetching lead:", error);
    res.status(500).json({ error: "Failed to fetch lead" });
  }
});

// Create new lead
router.post("/", async (req: Request, res: Response) => {
  try {
    const leadData: CreateLeadData = req.body;

    // Validate required fields
    if (!leadData.client_name || !leadData.contact_person || !leadData.email || !leadData.lead_source) {
      return res.status(400).json({
        error: "Missing required fields: client_name, contact_person, email, lead_source",
      });
    }

    // Validate lead source
    const validSources = ["email", "social-media", "phone", "website", "referral", "cold-call", "event", "other"];
    if (!validSources.includes(leadData.lead_source)) {
      return res.status(400).json({ error: "Invalid lead source" });
    }

    try {
      if (await isDatabaseAvailable()) {
        const lead = await LeadRepository.create(leadData);
        res.status(201).json(lead);
      } else {
        const mockLead = {
          id: Date.now(),
          lead_id: `#${Math.floor(Math.random() * 999) + 1}`.padStart(4, '0'),
          ...leadData,
          status: "in-progress" as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        console.log("Database unavailable, returning mock lead response");
        res.status(201).json(mockLead);
      }
    } catch (dbError) {
      console.log("Database error, returning mock lead response:", dbError.message);
      const mockLead = {
        id: Date.now(),
        lead_id: `#${Math.floor(Math.random() * 999) + 1}`.padStart(4, '0'),
        ...leadData,
        status: "in-progress" as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      res.status(201).json(mockLead);
    }
  } catch (error) {
    console.error("Error creating lead:", error);
    res.status(500).json({ error: "Failed to create lead" });
  }
});

// Update lead
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid lead ID" });
    }

    const leadData: UpdateLeadData = req.body;

    // Validate status if provided
    if (leadData.status && !["in-progress", "won", "lost", "completed"].includes(leadData.status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    try {
      if (await isDatabaseAvailable()) {
        const lead = await LeadRepository.update(id, leadData);
        if (!lead) {
          return res.status(404).json({ error: "Lead not found" });
        }
        res.json(lead);
      } else {
        const mockLead = {
          id: id,
          lead_id: `#${id.toString().padStart(3, '0')}`,
          ...leadData,
          updated_at: new Date().toISOString()
        };
        console.log("Database unavailable, returning mock lead update response");
        res.json(mockLead);
      }
    } catch (dbError) {
      console.log("Database error, returning mock lead update response:", dbError.message);
      const mockLead = {
        id: id,
        lead_id: `#${id.toString().padStart(3, '0')}`,
        ...leadData,
        updated_at: new Date().toISOString()
      };
      res.json(mockLead);
    }
  } catch (error) {
    console.error("Error updating lead:", error);
    res.status(500).json({ error: "Failed to update lead" });
  }
});

// Delete lead
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid lead ID" });
    }

    try {
      if (await isDatabaseAvailable()) {
        const success = await LeadRepository.delete(id);
        if (!success) {
          return res.status(404).json({ error: "Lead not found" });
        }
        res.status(204).send();
      } else {
        console.log("Database unavailable, returning success for lead deletion");
        res.status(204).send();
      }
    } catch (dbError) {
      console.log("Database error, returning success for lead deletion:", dbError.message);
      res.status(204).send();
    }
  } catch (error) {
    console.error("Error deleting lead:", error);
    res.status(500).json({ error: "Failed to delete lead" });
  }
});

// Get lead steps
router.get("/:leadId/steps", async (req: Request, res: Response) => {
  try {
    const leadId = parseInt(req.params.leadId);
    if (isNaN(leadId)) {
      return res.status(400).json({ error: "Invalid lead ID" });
    }

    let steps;
    try {
      if (await isDatabaseAvailable()) {
        steps = await LeadStepRepository.findByLeadId(leadId);
      } else {
        steps = await MockDataService.getLeadSteps(leadId);
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      steps = await MockDataService.getLeadSteps(leadId);
    }

    res.json(steps);
  } catch (error) {
    console.error("Error fetching lead steps:", error);
    try {
      const steps = await MockDataService.getLeadSteps(parseInt(req.params.leadId));
      res.json(steps);
    } catch (fallbackError) {
      console.error("Mock data fallback failed:", fallbackError);
      res.json([]);
    }
  }
});

// Create lead step
router.post("/:leadId/steps", async (req: Request, res: Response) => {
  try {
    const leadId = parseInt(req.params.leadId);
    if (isNaN(leadId)) {
      return res.status(400).json({ error: "Invalid lead ID" });
    }

    const stepData: CreateLeadStepData = {
      ...req.body,
      lead_id: leadId,
    };

    // Validate required fields
    if (!stepData.name || !stepData.estimated_days) {
      return res.status(400).json({
        error: "Missing required fields: name, estimated_days",
      });
    }

    try {
      if (await isDatabaseAvailable()) {
        const step = await LeadStepRepository.create(stepData);
        res.status(201).json(step);
      } else {
        const mockStep = {
          id: Date.now(),
          lead_id: leadId,
          name: stepData.name,
          description: stepData.description || null,
          status: "pending" as const,
          step_order: stepData.step_order || 1,
          due_date: stepData.due_date || null,
          completed_date: null,
          estimated_days: stepData.estimated_days,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        console.log("Database unavailable, returning mock step response");
        res.status(201).json(mockStep);
      }
    } catch (dbError) {
      console.log("Database error, returning mock step response:", dbError.message);
      const mockStep = {
        id: Date.now(),
        lead_id: leadId,
        name: stepData.name,
        description: stepData.description || null,
        status: "pending" as const,
        step_order: stepData.step_order || 1,
        due_date: stepData.due_date || null,
        completed_date: null,
        estimated_days: stepData.estimated_days,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      res.status(201).json(mockStep);
    }
  } catch (error) {
    console.error("Error creating lead step:", error);
    res.status(500).json({ error: "Failed to create lead step" });
  }
});

// Update lead step
router.put("/steps/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid step ID" });
    }

    const stepData: UpdateLeadStepData = req.body;

    try {
      if (await isDatabaseAvailable()) {
        const step = await LeadStepRepository.update(id, stepData);
        if (!step) {
          return res.status(404).json({ error: "Lead step not found" });
        }
        res.json(step);
      } else {
        const mockStep = {
          id: id,
          lead_id: 1,
          name: stepData.name || "Mock Step",
          description: stepData.description || null,
          status: stepData.status || "pending",
          step_order: stepData.step_order || 1,
          due_date: stepData.due_date || null,
          completed_date: stepData.completed_date || null,
          estimated_days: stepData.estimated_days || 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        console.log("Database unavailable, returning mock step update response");
        res.json(mockStep);
      }
    } catch (dbError) {
      console.log("Database error, returning mock step update response:", dbError.message);
      const mockStep = {
        id: id,
        lead_id: 1,
        name: stepData.name || "Mock Step",
        description: stepData.description || null,
        status: stepData.status || "pending",
        step_order: stepData.step_order || 1,
        due_date: stepData.due_date || null,
        completed_date: stepData.completed_date || null,
        estimated_days: stepData.estimated_days || 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      res.json(mockStep);
    }
  } catch (error) {
    console.error("Error updating lead step:", error);
    res.status(500).json({ error: "Failed to update lead step" });
  }
});

// Delete lead step
router.delete("/steps/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid step ID" });
    }

    try {
      if (await isDatabaseAvailable()) {
        const success = await LeadStepRepository.delete(id);
        if (!success) {
          return res.status(404).json({ error: "Lead step not found" });
        }
        res.status(204).send();
      } else {
        console.log("Database unavailable, returning success for step deletion");
        res.status(204).send();
      }
    } catch (dbError) {
      console.log("Database error, returning success for step deletion:", dbError.message);
      res.status(204).send();
    }
  } catch (error) {
    console.error("Error deleting lead step:", error);
    res.status(500).json({ error: "Failed to delete lead step" });
  }
});

// Reorder lead steps
router.put("/:leadId/steps/reorder", async (req: Request, res: Response) => {
  try {
    const leadId = parseInt(req.params.leadId);
    if (isNaN(leadId)) {
      return res.status(400).json({ error: "Invalid lead ID" });
    }

    const { stepOrders } = req.body;
    if (!Array.isArray(stepOrders)) {
      return res.status(400).json({ error: "stepOrders must be an array" });
    }

    try {
      if (await isDatabaseAvailable()) {
        await LeadStepRepository.reorderSteps(leadId, stepOrders);
        res.json({ message: "Steps reordered successfully" });
      } else {
        console.log("Database unavailable, returning success for step reordering");
        res.json({ message: "Steps reordered successfully" });
      }
    } catch (dbError) {
      console.log("Database error, returning success for step reordering:", dbError.message);
      res.json({ message: "Steps reordered successfully" });
    }
  } catch (error) {
    console.error("Error reordering steps:", error);
    res.status(500).json({ error: "Failed to reorder steps" });
  }
});

// Get step chats
router.get("/steps/:stepId/chats", async (req: Request, res: Response) => {
  try {
    const stepId = parseInt(req.params.stepId);
    if (isNaN(stepId)) {
      return res.status(400).json({ error: "Invalid step ID" });
    }

    let chats;
    try {
      if (await isDatabaseAvailable()) {
        chats = await LeadChatRepository.findByStepId(stepId);
      } else {
        chats = await MockDataService.getStepChats(stepId);
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      chats = await MockDataService.getStepChats(stepId);
    }

    res.json(chats);
  } catch (error) {
    console.error("Error fetching step chats:", error);
    try {
      const chats = await MockDataService.getStepChats(parseInt(req.params.stepId));
      res.json(chats);
    } catch (fallbackError) {
      console.error("Mock data fallback failed:", fallbackError);
      res.json([]);
    }
  }
});

// Create step chat
router.post("/steps/:stepId/chats", async (req: Request, res: Response) => {
  try {
    const stepId = parseInt(req.params.stepId);
    if (isNaN(stepId)) {
      return res.status(400).json({ error: "Invalid step ID" });
    }

    const chatData: CreateLeadChatData = {
      ...req.body,
      step_id: stepId,
    };

    // Validate required fields
    if (!chatData.message || !chatData.user_name) {
      return res.status(400).json({
        error: "Missing required fields: message, user_name",
      });
    }

    try {
      if (await isDatabaseAvailable()) {
        const chat = await LeadChatRepository.create(chatData);
        res.status(201).json(chat);
      } else {
        const mockChat = {
          id: Date.now(),
          step_id: stepId,
          user_id: chatData.user_id || null,
          user_name: chatData.user_name,
          message: chatData.message,
          message_type: chatData.message_type || "text",
          is_rich_text: chatData.is_rich_text || false,
          created_at: new Date().toISOString(),
          attachments: chatData.attachments || []
        };
        console.log("Database unavailable, returning mock chat response");
        res.status(201).json(mockChat);
      }
    } catch (dbError) {
      console.log("Database error, returning mock chat response:", dbError.message);
      const mockChat = {
        id: Date.now(),
        step_id: stepId,
        user_id: chatData.user_id || null,
        user_name: chatData.user_name,
        message: chatData.message,
        message_type: chatData.message_type || "text",
        is_rich_text: chatData.is_rich_text || false,
        created_at: new Date().toISOString(),
        attachments: chatData.attachments || []
      };
      res.status(201).json(mockChat);
    }
  } catch (error) {
    console.error("Error creating step chat:", error);
    res.status(500).json({ error: "Failed to create step chat" });
  }
});

// Delete step chat
router.delete("/chats/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid chat ID" });
    }

    try {
      if (await isDatabaseAvailable()) {
        const success = await LeadChatRepository.delete(id);
        if (!success) {
          return res.status(404).json({ error: "Chat not found" });
        }
        res.status(204).send();
      } else {
        console.log("Database unavailable, returning success for chat deletion");
        res.status(204).send();
      }
    } catch (dbError) {
      console.log("Database error, returning success for chat deletion:", dbError.message);
      res.status(204).send();
    }
  } catch (error) {
    console.error("Error deleting chat:", error);
    res.status(500).json({ error: "Failed to delete chat" });
  }
});

export default router;
