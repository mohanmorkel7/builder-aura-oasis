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
        error: "Invalid SSO user data",
      });
    }

    console.log(`SSO login attempt for: ${ssoUser.mail}`);

    // Create or update user based on SSO data
    const userDepartmentInfo =
      await DepartmentService.createOrUpdateSSOUser(ssoUser);

    if (!userDepartmentInfo) {
      return res.status(403).json({
        success: false,
        error:
          "User not authorized. Contact administrator to add you to the department mapping.",
      });
    }

    console.log(
      `SSO login successful for: ${ssoUser.mail}, Department: ${userDepartmentInfo.department}`,
    );

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
        azureObjectId: ssoUser.id,
      },
    });
  } catch (error) {
    console.error("SSO login error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error during SSO login",
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
        error: "Invalid user ID",
      });
    }

    // This would require getting email first, then department info
    // Implementation depends on your user lookup needs

    res.json({
      success: true,
      message: "Endpoint for getting user department info",
    });
  } catch (error) {
    console.error("Error getting user department:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get user department info",
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
      message: "User departments loaded successfully from JSON",
    });
  } catch (error) {
    console.error("Error loading departments:", error);
    res.status(500).json({
      success: false,
      error: "Failed to load user departments",
    });
  }
});

// Check user permission
router.get(
  "/user/:userId/permission/:permission",
  async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const permission = req.params.permission;

      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid user ID",
        });
      }

      const hasPermission = await DepartmentService.userHasPermission(
        userId,
        permission,
      );

      res.json({
        success: true,
        hasPermission,
      });
    } catch (error) {
      console.error("Error checking user permission:", error);
      res.status(500).json({
        success: false,
        error: "Failed to check user permission",
      });
    }
  },
);

// Upload new department data via JSON
router.post("/admin/upload-departments", async (req: Request, res: Response) => {
  try {
    const { departments, users } = req.body;

    if (!departments || !users) {
      return res.status(400).json({
        success: false,
        error: "Invalid JSON structure. Must contain 'departments' and 'users' properties."
      });
    }

    // Validate users have required fields
    for (const user of users) {
      if (!user.email || !user.displayName || !user.department || !user.ssoId) {
        return res.status(400).json({
          success: false,
          error: `Invalid user data. Each user must have: email, displayName, department, ssoId. Missing for: ${user.email || 'unknown'}`
        });
      }
    }

    // Update the JSON file
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '../data/user-departments.json');

    fs.writeFileSync(filePath, JSON.stringify({ departments, users }, null, 2));

    // Reload the data
    await DepartmentService.loadUserDepartmentsFromJSON();

    console.log(`📁 Department data updated with ${users.length} users`);

    res.json({
      success: true,
      message: `Successfully uploaded ${users.length} users across ${Object.keys(departments).length} departments`,
      data: { userCount: users.length, departmentCount: Object.keys(departments).length }
    });
  } catch (error) {
    console.error("Error uploading departments:", error);
    res.status(500).json({
      success: false,
      error: "Failed to upload department data"
    });
  }
});

// Get current department data
router.get("/admin/current-departments", async (req: Request, res: Response) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '../data/user-departments.json');

    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(fileContent);

      res.json({
        success: true,
        data
      });
    } else {
      res.json({
        success: true,
        data: null
      });
    }
  } catch (error) {
    console.error("Error getting current departments:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get current department data"
    });
  }
});

export default router;
