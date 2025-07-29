import { Router, Request, Response } from "express";
import { UserRepository, CreateUserData, UpdateUserData } from "../models/User";
import { MockDataService } from "../services/mockData";

const router = Router();

// Helper function to check if database is available
async function isDatabaseAvailable() {
  try {
    await UserRepository.findAll();
    return true;
  } catch (error) {
    return false;
  }
}

// Get all users
router.get("/", async (req: Request, res: Response) => {
  try {
    if (await isDatabaseAvailable()) {
      const users = await UserRepository.findAll();
      res.json(users);
    } else {
      const users = await MockDataService.getAllUsers();
      res.json(users);
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    // Fallback to mock data
    const users = await MockDataService.getAllUsers();
    res.json(users);
  }
});

// Get user by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    let user;
    if (await isDatabaseAvailable()) {
      user = await UserRepository.findById(id);
    } else {
      // Use mock data
      const users = await MockDataService.getAllUsers();
      user = users.find((u) => u.id === id);
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    // Fallback to mock data
    try {
      const users = await MockDataService.getAllUsers();
      const user = users.find((u) => u.id === id);
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (fallbackError) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  }
});

// Create new user
router.post("/", async (req: Request, res: Response) => {
  try {
    const userData: CreateUserData = req.body;

    // Validate required fields
    if (
      !userData.first_name ||
      !userData.last_name ||
      !userData.email ||
      !userData.password ||
      !userData.role
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate role
    if (!["admin", "sales", "product"].includes(userData.role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    let user;
    if (await isDatabaseAvailable()) {
      // Check if email already exists
      const existingUser = await UserRepository.findByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ error: "Email already exists" });
      }
      user = await UserRepository.create(userData);
    } else {
      // Check if email already exists in mock data
      const existingUser = await MockDataService.findUserByEmail(
        userData.email,
      );
      if (existingUser) {
        return res.status(409).json({ error: "Email already exists" });
      }
      user = await MockDataService.createUser(userData);
    }

    res.status(201).json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Update user
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const userData: UpdateUserData = req.body;

    // Validate role if provided
    if (
      userData.role &&
      !["admin", "sales", "product"].includes(userData.role)
    ) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Validate status if provided
    if (
      userData.status &&
      !["active", "inactive", "pending"].includes(userData.status)
    ) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Check if email already exists (if being updated)
    if (userData.email) {
      const existingUser = await UserRepository.findByEmail(userData.email);
      if (existingUser && existingUser.id !== id) {
        return res.status(409).json({ error: "Email already exists" });
      }
    }

    const user = await UserRepository.update(id, userData);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Delete user
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const success = await UserRepository.delete(id);
    if (!success) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// User authentication
router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    let user;
    if (await isDatabaseAvailable()) {
      user = await UserRepository.verifyPassword(email, password);
      if (user) {
        await UserRepository.updateLastLogin(user.id);
      }
    } else {
      user = await MockDataService.verifyPassword(email, password);
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Error during login:", error);
    // Fallback to mock data
    try {
      const user = await MockDataService.verifyPassword(
        req.body.email,
        req.body.password,
      );
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      res.json({ user });
    } catch (fallbackError) {
      res.status(500).json({ error: "Login failed" });
    }
  }
});

export default router;
