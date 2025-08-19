import { Router, Request, Response } from "express";
import { DepartmentService } from "../services/departmentService";

const router = Router();

// SSO login endpoint
router.post("/sso/login", async (req: Request, res: Response) => {
  try {
    const { ssoUser } = req.body;
    
    if (!ssoUser || !ssoUser.mail) {
      return res.status(400).json({
        success: false,
        error: "Invalid SSO user data"
      });
    }

    console.log(`SSO login attempt for: ${ssoUser.mail}`);
    
    // Create or update user based on SSO data
    const userDepartmentInfo = await DepartmentService.createOrUpdateSSOUser(ssoUser);
    
    if (!userDepartmentInfo) {
      return res.status(403).json({
        success: false,
        error: "User not authorized. Contact administrator to add you to the department mapping."
      });
    }

    console.log(`SSO login successful for: ${ssoUser.mail}, Department: ${userDepartmentInfo.department}`);
    
    res.json({
      success: true,
      user: {
        id: userDepartmentInfo.userId,
        name: ssoUser.displayName,
        email: userDepartmentInfo.email,
        role: "admin", // Will be overridden by department permissions
        department: userDepartmentInfo.department,
        permissions: userDepartmentInfo.permissions,
        jobTitle: userDepartmentInfo.jobTitle,
        ssoId: userDepartmentInfo.ssoId,
        azureObjectId: ssoUser.id
      }
    });
  } catch (error) {
    console.error("SSO login error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error during SSO login"
    });
  }
});

// Get user department info
router.get("/user/:userId/department", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID"
      });
    }

    // This would require getting email first, then department info
    // Implementation depends on your user lookup needs
    
    res.json({
      success: true,
      message: "Endpoint for getting user department info"
    });
  } catch (error) {
    console.error("Error getting user department:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get user department info"
    });
  }
});

// Load initial department data
router.post("/admin/load-departments", async (req: Request, res: Response) => {
  try {
    // This should be restricted to admin users only
    await DepartmentService.loadUserDepartmentsFromJSON();
    
    res.json({
      success: true,
      message: "User departments loaded successfully from JSON"
    });
  } catch (error) {
    console.error("Error loading departments:", error);
    res.status(500).json({
      success: false,
      error: "Failed to load user departments"
    });
  }
});

// Check user permission
router.get("/user/:userId/permission/:permission", async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const permission = req.params.permission;
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID"
      });
    }

    const hasPermission = await DepartmentService.userHasPermission(userId, permission);
    
    res.json({
      success: true,
      hasPermission
    });
  } catch (error) {
    console.error("Error checking user permission:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check user permission"
    });
  }
});

export default router;
