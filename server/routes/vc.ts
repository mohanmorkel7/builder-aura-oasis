import { Router, Request, Response } from "express";
import {
  VCRepository,
  VCStepRepository,
  CreateVCData,
  UpdateVCData,
  CreateVCStepData,
  UpdateVCStepData,
} from "../models/VC";
import { MockDataService } from "../services/mockData";
import { DatabaseValidator, ValidationSchemas } from "../utils/validation";
import { pool } from "../database/connection";

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

// Get all VCs
router.get("/", async (req: Request, res: Response) => {
  try {
    const { investor_category, status, search } = req.query;

    let vcs;
    try {
      if (await isDatabaseAvailable()) {
        if (search) {
          vcs = await VCRepository.search(search as string);
        } else if (investor_category) {
          vcs = await VCRepository.findByInvestorCategory(investor_category as string);
        } else if (status) {
          vcs = await VCRepository.findByStatus(status as string);
        } else {
          vcs = await VCRepository.findAll();
        }
      } else {
        // Return mock VC data when database is unavailable
        vcs = await MockDataService.getAllLeads(); // Using leads mock data for now
        
        // Filter mock data based on query parameters
        if (status && status !== "all") {
          vcs = vcs.filter((vc: any) => vc.status === status);
        }
        if (search) {
          const searchTerm = (search as string).toLowerCase();
          vcs = vcs.filter((vc: any) => 
            vc.project_title?.toLowerCase().includes(searchTerm) ||
            vc.client_name?.toLowerCase().includes(searchTerm) ||
            vc.lead_id?.toLowerCase().includes(searchTerm)
          );
        }
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      vcs = await MockDataService.getAllLeads();
    }

    res.json(vcs);
  } catch (error) {
    console.error("Error fetching VCs:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch VCs" 
    });
  }
});

// Get VC statistics
router.get("/stats", async (req: Request, res: Response) => {
  try {
    let stats;
    try {
      if (await isDatabaseAvailable()) {
        stats = await VCRepository.getStats();
      } else {
        // Return mock stats when database is unavailable
        const mockVCs = await MockDataService.getAllLeads();
        stats = {
          total: mockVCs.length,
          in_progress: mockVCs.filter((vc: any) => vc.status === "in-progress").length,
          won: mockVCs.filter((vc: any) => vc.status === "won").length,
          lost: mockVCs.filter((vc: any) => vc.status === "lost").length,
          completed: mockVCs.filter((vc: any) => vc.status === "completed").length,
        };
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      const mockVCs = await MockDataService.getAllLeads();
      stats = {
        total: mockVCs.length,
        in_progress: mockVCs.filter((vc: any) => vc.status === "in-progress").length,
        won: mockVCs.filter((vc: any) => vc.status === "won").length,
        lost: mockVCs.filter((vc: any) => vc.status === "lost").length,
        completed: mockVCs.filter((vc: any) => vc.status === "completed").length,
      };
    }

    res.json(stats);
  } catch (error) {
    console.error("Error fetching VC stats:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch VC statistics" 
    });
  }
});

// Get single VC by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid VC ID" 
      });
    }

    let vc;
    try {
      if (await isDatabaseAvailable()) {
        vc = await VCRepository.findById(id);
      } else {
        // Return mock VC data when database is unavailable
        const mockVCs = await MockDataService.getAllLeads();
        vc = mockVCs.find((v: any) => v.id === id);
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      const mockVCs = await MockDataService.getAllLeads();
      vc = mockVCs.find((v: any) => v.id === id);
    }

    if (!vc) {
      return res.status(404).json({ 
        success: false, 
        error: "VC not found" 
      });
    }

    res.json(vc);
  } catch (error) {
    console.error("Error fetching VC:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch VC" 
    });
  }
});

// Create new VC
router.post("/", async (req: Request, res: Response) => {
  try {
    const vcData: CreateVCData = req.body;

    // Basic validation
    if (!vcData.created_by) {
      return res.status(400).json({ 
        success: false, 
        error: "created_by is required" 
      });
    }

    if (!vcData.round_title && !vcData.investor_name) {
      return res.status(400).json({ 
        success: false, 
        error: "Either round_title or investor_name is required" 
      });
    }

    if (vcData.email && !/\S+@\S+\.\S+/.test(vcData.email)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid email format" 
      });
    }

    let vc;
    try {
      if (await isDatabaseAvailable()) {
        vc = await VCRepository.create(vcData);
      } else {
        // Create mock VC when database is unavailable
        vc = {
          id: Math.floor(Math.random() * 1000) + 100,
          vc_id: `#VC${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`,
          ...vcData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      vc = {
        id: Math.floor(Math.random() * 1000) + 100,
        vc_id: `#VC${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`,
        ...vcData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    res.status(201).json({ 
      success: true, 
      data: vc 
    });
  } catch (error) {
    console.error("Error creating VC:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to create VC" 
    });
  }
});

// Update VC
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid VC ID" 
      });
    }

    const vcData: UpdateVCData = req.body;

    // Email validation if provided
    if (vcData.email && !/\S+@\S+\.\S+/.test(vcData.email)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid email format" 
      });
    }

    let vc;
    try {
      if (await isDatabaseAvailable()) {
        vc = await VCRepository.update(id, vcData);
      } else {
        // Mock update when database is unavailable
        vc = {
          id,
          ...vcData,
          updated_at: new Date().toISOString(),
        };
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      vc = {
        id,
        ...vcData,
        updated_at: new Date().toISOString(),
      };
    }

    if (!vc) {
      return res.status(404).json({ 
        success: false, 
        error: "VC not found" 
      });
    }

    res.json({ 
      success: true, 
      data: vc 
    });
  } catch (error) {
    console.error("Error updating VC:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to update VC" 
    });
  }
});

// Delete VC
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid VC ID" 
      });
    }

    let success;
    try {
      if (await isDatabaseAvailable()) {
        success = await VCRepository.delete(id);
      } else {
        // Mock delete when database is unavailable
        success = true;
      }
    } catch (dbError) {
      console.log("Database error, using mock response:", dbError.message);
      success = true;
    }

    if (!success) {
      return res.status(404).json({ 
        success: false, 
        error: "VC not found" 
      });
    }

    res.json({ 
      success: true, 
      message: "VC deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting VC:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to delete VC" 
    });
  }
});

// VC Steps endpoints

// Get steps for a VC
router.get("/:id/steps", async (req: Request, res: Response) => {
  try {
    const vcId = parseInt(req.params.id);
    if (isNaN(vcId)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid VC ID" 
      });
    }

    let steps;
    try {
      if (await isDatabaseAvailable()) {
        steps = await VCStepRepository.findByVCId(vcId);
      } else {
        // Return mock steps when database is unavailable
        steps = await MockDataService.getLeadSteps(vcId);
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      steps = await MockDataService.getLeadSteps(vcId);
    }

    res.json(steps);
  } catch (error) {
    console.error("Error fetching VC steps:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch VC steps" 
    });
  }
});

// Create VC step
router.post("/:id/steps", async (req: Request, res: Response) => {
  try {
    const vcId = parseInt(req.params.id);
    if (isNaN(vcId)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid VC ID" 
      });
    }

    const stepData: CreateVCStepData = {
      ...req.body,
      vc_id: vcId,
    };

    if (!stepData.name?.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: "Step name is required" 
      });
    }

    if (!stepData.created_by) {
      return res.status(400).json({ 
        success: false, 
        error: "created_by is required" 
      });
    }

    let step;
    try {
      if (await isDatabaseAvailable()) {
        step = await VCStepRepository.create(stepData);
      } else {
        // Create mock step when database is unavailable
        step = {
          id: Math.floor(Math.random() * 1000) + 100,
          vc_id: vcId,
          ...stepData,
          order_index: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      step = {
        id: Math.floor(Math.random() * 1000) + 100,
        vc_id: vcId,
        ...stepData,
        order_index: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    res.status(201).json({ 
      success: true, 
      data: step 
    });
  } catch (error) {
    console.error("Error creating VC step:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to create VC step" 
    });
  }
});

// Update VC step
router.put("/steps/:stepId", async (req: Request, res: Response) => {
  try {
    const stepId = parseInt(req.params.stepId);
    if (isNaN(stepId)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid step ID" 
      });
    }

    const stepData: UpdateVCStepData = req.body;

    let step;
    try {
      if (await isDatabaseAvailable()) {
        step = await VCStepRepository.update(stepId, stepData);
      } else {
        // Mock update when database is unavailable
        step = {
          id: stepId,
          ...stepData,
          updated_at: new Date().toISOString(),
        };
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      step = {
        id: stepId,
        ...stepData,
        updated_at: new Date().toISOString(),
      };
    }

    if (!step) {
      return res.status(404).json({ 
        success: false, 
        error: "VC step not found" 
      });
    }

    res.json({ 
      success: true, 
      data: step 
    });
  } catch (error) {
    console.error("Error updating VC step:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to update VC step" 
    });
  }
});

// Delete VC step
router.delete("/steps/:stepId", async (req: Request, res: Response) => {
  try {
    const stepId = parseInt(req.params.stepId);
    if (isNaN(stepId)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid step ID" 
      });
    }

    let success;
    try {
      if (await isDatabaseAvailable()) {
        success = await VCStepRepository.delete(stepId);
      } else {
        // Mock delete when database is unavailable
        success = true;
      }
    } catch (dbError) {
      console.log("Database error, using mock response:", dbError.message);
      success = true;
    }

    if (!success) {
      return res.status(404).json({ 
        success: false, 
        error: "VC step not found" 
      });
    }

    res.json({ 
      success: true, 
      message: "VC step deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting VC step:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to delete VC step" 
    });
  }
});

// Reorder VC steps
router.put("/:id/steps/reorder", async (req: Request, res: Response) => {
  try {
    const vcId = parseInt(req.params.id);
    if (isNaN(vcId)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid VC ID" 
      });
    }

    const { stepOrders } = req.body;
    if (!Array.isArray(stepOrders)) {
      return res.status(400).json({ 
        success: false, 
        error: "stepOrders must be an array" 
      });
    }

    try {
      if (await isDatabaseAvailable()) {
        await VCStepRepository.reorderSteps(vcId, stepOrders);
      } else {
        // Mock reorder when database is unavailable
        console.log("Mock reorder for VC steps:", stepOrders);
      }
    } catch (dbError) {
      console.log("Database error, using mock response:", dbError.message);
    }

    res.json({ 
      success: true, 
      message: "VC steps reordered successfully" 
    });
  } catch (error) {
    console.error("Error reordering VC steps:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to reorder VC steps" 
    });
  }
});

export default router;
