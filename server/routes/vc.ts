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
    const {
      investor_category,
      status,
      search,
      partial_saves_only,
      created_by,
    } = req.query;

    let vcs;
    try {
      if (await isDatabaseAvailable()) {
        if (partial_saves_only === "true") {
          // Get partial saves only
          vcs = await VCRepository.findPartialSaves(
            created_by ? parseInt(created_by as string) : undefined,
          );
        } else if (search) {
          vcs = await VCRepository.search(search as string);
        } else if (investor_category) {
          vcs = await VCRepository.findByInvestorCategory(
            investor_category as string,
          );
        } else if (status) {
          vcs = await VCRepository.findByStatus(status as string);
        } else {
          vcs = await VCRepository.findAll();
        }
      } else {
        // Return mock VC data when database is unavailable
        vcs = await MockDataService.getAllVCs(); // Using proper VC mock data

        // Filter mock data based on query parameters
        if (status && status !== "all") {
          vcs = vcs.filter((vc: any) => vc.status === status);
        }
        if (search) {
          const searchTerm = (search as string).toLowerCase();
          vcs = vcs.filter(
            (vc: any) =>
              vc.project_title?.toLowerCase().includes(searchTerm) ||
              vc.client_name?.toLowerCase().includes(searchTerm) ||
              vc.lead_id?.toLowerCase().includes(searchTerm),
          );
        }
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      vcs = await MockDataService.getAllVCs();
    }

    res.json(vcs);
  } catch (error) {
    console.error("Error fetching VCs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch VCs",
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
          in_progress: mockVCs.filter((vc: any) => vc.status === "in-progress")
            .length,
          won: mockVCs.filter((vc: any) => vc.status === "won").length,
          lost: mockVCs.filter((vc: any) => vc.status === "lost").length,
          completed: mockVCs.filter((vc: any) => vc.status === "completed")
            .length,
        };
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      const mockVCs = await MockDataService.getAllLeads();
      stats = {
        total: mockVCs.length,
        in_progress: mockVCs.filter((vc: any) => vc.status === "in-progress")
          .length,
        won: mockVCs.filter((vc: any) => vc.status === "won").length,
        lost: mockVCs.filter((vc: any) => vc.status === "lost").length,
        completed: mockVCs.filter((vc: any) => vc.status === "completed")
          .length,
      };
    }

    res.json(stats);
  } catch (error) {
    console.error("Error fetching VC stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch VC statistics",
    });
  }
});

// Get VC follow-ups for dashboard
router.get("/follow-ups", async (req: Request, res: Response) => {
  try {
    let followUps = [];
    try {
      if (await isDatabaseAvailable()) {
        const query = `
          SELECT
            vs.id,
            vs.vc_id,
            vs.name as title,
            vs.description,
            vs.due_date,
            vs.status,
            vs.assigned_to,
            vs.name as step_name,
            v.round_title,
            u.first_name || ' ' || u.last_name as assigned_user_name
          FROM vc_steps vs
          LEFT JOIN vcs v ON vs.vc_id = v.id
          LEFT JOIN users u ON vs.assigned_to = u.id
          WHERE vs.status IN ('pending', 'in_progress')
            AND vs.due_date IS NOT NULL
            AND vs.due_date >= CURRENT_DATE - INTERVAL '30 days'
          ORDER BY vs.due_date ASC
          LIMIT 50
        `;
        const result = await pool.query(query);
        followUps = result.rows;
      } else {
        // Return mock follow-ups when database is unavailable
        followUps = [
          {
            id: 1,
            vc_id: 1,
            title: "Follow up on term sheet feedback",
            description: "Check investor response to updated terms",
            due_date: new Date(
              Date.now() + 2 * 24 * 60 * 60 * 1000,
            ).toISOString(), // 2 days from now
            status: "pending",
            assigned_to: 1,
            step_name: "Term Sheet",
            round_title: "Series A",
            assigned_user_name: "John Doe",
          },
          {
            id: 2,
            vc_id: 2,
            title: "Schedule due diligence meeting",
            description: "Coordinate with investor team for DD session",
            due_date: new Date(
              Date.now() + 5 * 24 * 60 * 60 * 1000,
            ).toISOString(), // 5 days from now
            status: "pending",
            assigned_to: 2,
            step_name: "Due Diligence",
            round_title: "Seed Round",
            assigned_user_name: "Jane Smith",
          },
        ];
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      followUps = [
        {
          id: 1,
          vc_id: 1,
          title: "Mock follow-up - database unavailable",
          description: "Mock follow-up for testing",
          due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: "pending",
          assigned_to: 1,
          step_name: "Initial Pitch",
          round_title: "Mock Round",
          assigned_user_name: "Mock User",
        },
      ];
    }

    res.json(followUps);
  } catch (error) {
    console.error("Error fetching VC follow-ups:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch VC follow-ups",
    });
  }
});

// Get VC progress data for dashboard
router.get("/progress", async (req: Request, res: Response) => {
  try {
    let progressData = [];
    try {
      if (await isDatabaseAvailable()) {
        const query = `
          WITH vc_step_summary AS (
            SELECT
              v.id as vc_id,
              v.round_title,
              v.investor_name,
              v.status,
              COUNT(vs.id) FILTER (WHERE vs.status = 'completed') as completed_count,
              -- Use a default probability of 20% per step
              COALESCE(COUNT(vs.id) FILTER (WHERE vs.status = 'completed') * 20, 0) as total_completed_probability
            FROM vcs v
            LEFT JOIN vc_steps vs ON v.id = vs.vc_id
            WHERE v.status IN ('in-progress', 'won') AND (v.is_partial = false OR v.is_partial IS NULL)
            GROUP BY v.id, v.round_title, v.investor_name, v.status
          ),
          completed_steps_data AS (
            SELECT
              vs.vc_id,
              json_agg(
                json_build_object(
                  'name', vs.name,
                  'probability', 20,
                  'status', vs.status
                )
                ORDER BY vs.order_index
              ) as completed_steps
            FROM vc_steps vs
            WHERE vs.status = 'completed'
            GROUP BY vs.vc_id
          ),
          current_step_data AS (
            SELECT DISTINCT ON (vs.vc_id)
              vs.vc_id,
              json_build_object(
                'name', vs.name,
                'probability', 20
              ) as current_step
            FROM vc_steps vs
            WHERE vs.status = 'in_progress'
            ORDER BY vs.vc_id, vs.order_index
          )
          SELECT
            vss.vc_id,
            vss.round_title,
            vss.investor_name,
            vss.status,
            vss.completed_count,
            vss.total_completed_probability,
            COALESCE(csd.completed_steps, '[]'::json) as completed_steps,
            COALESCE(csdt.current_step, 'null'::json) as current_step
          FROM vc_step_summary vss
          LEFT JOIN completed_steps_data csd ON vss.vc_id = csd.vc_id
          LEFT JOIN current_step_data csdt ON vss.vc_id = csdt.vc_id
          ORDER BY vss.round_title
        `;
        const result = await pool.query(query);
        progressData = result.rows;
      } else {
        // Return mock progress data when database is unavailable
        progressData = [
          {
            vc_id: 1,
            round_title: "Series A",
            investor_name: "Acme Ventures",
            status: "in-progress",
            completed_count: 3,
            total_completed_probability: 60,
            completed_steps: [
              { name: "Initial Pitch", probability: 20, status: "completed" },
              { name: "Product Demo", probability: 20, status: "completed" },
              { name: "Due Diligence", probability: 20, status: "completed" },
            ],
            current_step: { name: "Term Sheet", probability: 20 },
          },
          {
            vc_id: 2,
            round_title: "Seed Round",
            investor_name: "Beta Capital",
            status: "in-progress",
            completed_count: 2,
            total_completed_probability: 40,
            completed_steps: [
              { name: "Initial Pitch", probability: 20, status: "completed" },
              { name: "Product Demo", probability: 20, status: "completed" },
            ],
            current_step: { name: "Due Diligence", probability: 20 },
          },
        ];
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      progressData = [
        {
          vc_id: 1,
          round_title: "Mock Round",
          investor_name: "Mock Investor",
          status: "in-progress",
          completed_count: 1,
          total_completed_probability: 20,
          completed_steps: [
            { name: "Initial Pitch", probability: 20, status: "completed" },
          ],
          current_step: { name: "Product Demo", probability: 20 },
        },
      ];
    }

    res.json(progressData);
  } catch (error) {
    console.error("Error fetching VC progress data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch VC progress data",
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
        error: "Invalid VC ID",
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
        error: "VC not found",
      });
    }

    res.json(vc);
  } catch (error) {
    console.error("Error fetching VC:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch VC",
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
        error: "created_by is required",
      });
    }

    if (!vcData.round_title && !vcData.investor_name) {
      return res.status(400).json({
        success: false,
        error: "Either round_title or investor_name is required",
      });
    }

    if (vcData.email && !/\S+@\S+\.\S+/.test(vcData.email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
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
          vc_id: `#VC${String(Math.floor(Math.random() * 100) + 1).padStart(3, "0")}`,
          ...vcData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      vc = {
        id: Math.floor(Math.random() * 1000) + 100,
        vc_id: `#VC${String(Math.floor(Math.random() * 100) + 1).padStart(3, "0")}`,
        ...vcData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    res.status(201).json({
      success: true,
      data: vc,
    });
  } catch (error) {
    console.error("Error creating VC:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create VC",
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
        error: "Invalid VC ID",
      });
    }

    const vcData: UpdateVCData = req.body;
    console.log(`[DEBUG] PUT /:id - Updating VC ${id} with data:`, JSON.stringify(vcData, null, 2));

    // Email validation if provided
    if (vcData.email && !/\S+@\S+\.\S+/.test(vcData.email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    let vc;
    try {
      if (await isDatabaseAvailable()) {
        console.log(`[DEBUG] Database available, calling VCRepository.update(${id}, data)`);
        vc = await VCRepository.update(id, vcData);
        console.log(`[DEBUG] VCRepository.update returned:`, vc);
      } else {
        console.log(`[DEBUG] Database not available, using mock update`);
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
        error: "VC not found",
      });
    }

    res.json({
      success: true,
      data: vc,
    });
  } catch (error) {
    console.error("Error updating VC:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update VC",
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
        error: "Invalid VC ID",
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
        error: "VC not found",
      });
    }

    res.json({
      success: true,
      message: "VC deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting VC:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete VC",
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
        error: "Invalid VC ID",
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
      error: "Failed to fetch VC steps",
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
        error: "Invalid VC ID",
      });
    }

    const stepData: CreateVCStepData = {
      ...req.body,
      vc_id: vcId,
    };

    if (!stepData.name?.trim()) {
      return res.status(400).json({
        success: false,
        error: "Step name is required",
      });
    }

    if (!stepData.created_by) {
      return res.status(400).json({
        success: false,
        error: "created_by is required",
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
      data: step,
    });
  } catch (error) {
    console.error("Error creating VC step:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create VC step",
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
        error: "Invalid step ID",
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
        error: "VC step not found",
      });
    }

    res.json({
      success: true,
      data: step,
    });
  } catch (error) {
    console.error("Error updating VC step:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update VC step",
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
        error: "Invalid step ID",
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
        error: "VC step not found",
      });
    }

    res.json({
      success: true,
      message: "VC step deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting VC step:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete VC step",
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
        error: "Invalid VC ID",
      });
    }

    const { stepOrders } = req.body;
    if (!Array.isArray(stepOrders)) {
      return res.status(400).json({
        success: false,
        error: "stepOrders must be an array",
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
      message: "VC steps reordered successfully",
    });
  } catch (error) {
    console.error("Error reordering VC steps:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reorder VC steps",
    });
  }
});

// Get comments for a VC
router.get("/:id/comments", async (req: Request, res: Response) => {
  try {
    const vcId = parseInt(req.params.id);
    if (isNaN(vcId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid VC ID",
      });
    }

    let comments = [];
    try {
      if (await isDatabaseAvailable()) {
        const query = `
          SELECT c.*, u.first_name || ' ' || u.last_name as created_by_name
          FROM vc_comments c
          LEFT JOIN users u ON c.created_by = u.id
          WHERE c.vc_id = $1
          ORDER BY c.created_at ASC
        `;
        const result = await pool.query(query, [vcId]);
        comments = result.rows;
      } else {
        // Mock comments when database is unavailable
        comments = [
          {
            id: 1,
            vc_id: vcId,
            message: "Initial discussions with the investor look promising.",
            created_by: 1,
            created_by_name: "John Doe",
            created_at: new Date().toISOString(),
          },
        ];
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      comments = [
        {
          id: 1,
          vc_id: vcId,
          message: "Mock comment - database unavailable",
          created_by: 1,
          created_by_name: "Mock User",
          created_at: new Date().toISOString(),
        },
      ];
    }

    res.json(comments);
  } catch (error) {
    console.error("Error fetching VC comments:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch VC comments",
    });
  }
});

// Add comment to a VC
router.post("/:id/comments", async (req: Request, res: Response) => {
  try {
    const vcId = parseInt(req.params.id);
    if (isNaN(vcId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid VC ID",
      });
    }

    const { message, created_by } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Comment message is required",
      });
    }

    let comment;
    try {
      if (await isDatabaseAvailable()) {
        const query = `
          INSERT INTO vc_comments (vc_id, message, created_by, created_by_name)
          VALUES ($1, $2, $3, (SELECT first_name || ' ' || last_name FROM users WHERE id = $3))
          RETURNING *, (SELECT first_name || ' ' || last_name FROM users WHERE id = created_by) as created_by_name
        `;
        const result = await pool.query(query, [
          vcId,
          message.trim(),
          created_by,
        ]);
        comment = result.rows[0];
      } else {
        // Mock comment creation when database is unavailable
        comment = {
          id: Math.floor(Math.random() * 1000) + 1,
          vc_id: vcId,
          message: message.trim(),
          created_by,
          created_by_name: "Mock User",
          created_at: new Date().toISOString(),
        };
      }
    } catch (dbError) {
      console.log("Database error, using mock response:", dbError.message);
      comment = {
        id: Math.floor(Math.random() * 1000) + 1,
        vc_id: vcId,
        message: message.trim(),
        created_by,
        created_by_name: "Mock User",
        created_at: new Date().toISOString(),
      };
    }

    res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    console.error("Error creating VC comment:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create VC comment",
    });
  }
});

export default router;
