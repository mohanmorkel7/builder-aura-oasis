import { Router, Request, Response } from "express";
import {
  ClientRepository,
  CreateClientData,
  UpdateClientData,
} from "../models/Client";
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

// Get all clients with enhanced validation
router.get("/", async (req: Request, res: Response) => {
  try {
    const { salesRep } = req.query;
    let salesRepId: number | undefined;

    // Validate salesRep parameter
    if (salesRep) {
      salesRepId = parseInt(salesRep as string);
      if (isNaN(salesRepId) || salesRepId <= 0) {
        return res.status(400).json({ error: "Invalid sales rep ID format" });
      }

      // Check if sales rep exists (only if database is available)
      if (await isDatabaseAvailable()) {
        const userExists = await DatabaseValidator.userExists(salesRepId);
        if (!userExists) {
          return res.status(404).json({ error: "Sales representative not found" });
        }
      }
    }

    let clients;
    try {
      if (await isDatabaseAvailable()) {
        if (salesRepId) {
          clients = await ClientRepository.findBySalesRep(salesRepId);
        } else {
          clients = await ClientRepository.findAll();
        }
      } else {
        clients = await MockDataService.getAllClients();
        if (salesRepId) {
          clients = clients.filter((client) => client.sales_rep_id === salesRepId);
        }
      }
    } catch (dbError) {
      console.log("Database error, using mock data:", dbError.message);
      clients = await MockDataService.getAllClients();
      if (salesRepId) {
        clients = clients.filter((client) => client.sales_rep_id === salesRepId);
      }
    }

    res.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    try {
      const clients = await MockDataService.getAllClients();
      res.json(clients);
    } catch (fallbackError) {
      console.error("Mock data fallback failed:", fallbackError);
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  }
});

// Get client statistics
router.get("/stats", async (req: Request, res: Response) => {
  try {
    let stats;
    if (await isDatabaseAvailable()) {
      stats = await ClientRepository.getStats();
    } else {
      stats = await MockDataService.getClientStats();
    }
    res.json(stats);
  } catch (error) {
    console.error("Error fetching client stats:", error);
    // Fallback to mock data
    const stats = await MockDataService.getClientStats();
    res.json(stats);
  }
});

// Get client by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid client ID" });
    }

    let client;
    if (await isDatabaseAvailable()) {
      client = await ClientRepository.findById(id);
    } else {
      // Use mock data
      const clients = await MockDataService.getAllClients();
      client = clients.find((c) => c.id === id);
    }

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json(client);
  } catch (error) {
    console.error("Error fetching client:", error);
    // Fallback to mock data
    try {
      const clients = await MockDataService.getAllClients();
      const client = clients.find((c) => c.id === id);
      if (client) {
        res.json(client);
      } else {
        res.status(404).json({ error: "Client not found" });
      }
    } catch (fallbackError) {
      res.status(500).json({ error: "Failed to fetch client" });
    }
  }
});

// Create new client
router.post("/", async (req: Request, res: Response) => {
  try {
    const clientData: CreateClientData = req.body;

    // Validate required fields
    if (
      !clientData.client_name ||
      !clientData.contact_person ||
      !clientData.email
    ) {
      return res
        .status(400)
        .json({
          error: "Missing required fields: client_name, contact_person, email",
        });
    }

    // Validate priority if provided
    if (
      clientData.priority &&
      !["low", "medium", "high", "urgent"].includes(clientData.priority)
    ) {
      return res.status(400).json({ error: "Invalid priority value" });
    }

    const client = await ClientRepository.create(clientData);
    res.status(201).json(client);
  } catch (error) {
    console.error("Error creating client:", error);
    res.status(500).json({ error: "Failed to create client" });
  }
});

// Update client
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid client ID" });
    }

    const clientData: UpdateClientData = req.body;

    // Validate priority if provided
    if (
      clientData.priority &&
      !["low", "medium", "high", "urgent"].includes(clientData.priority)
    ) {
      return res.status(400).json({ error: "Invalid priority value" });
    }

    // Validate status if provided
    if (
      clientData.status &&
      !["active", "inactive", "onboarding", "completed"].includes(
        clientData.status,
      )
    ) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const client = await ClientRepository.update(id, clientData);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json(client);
  } catch (error) {
    console.error("Error updating client:", error);
    res.status(500).json({ error: "Failed to update client" });
  }
});

// Delete client
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid client ID" });
    }

    const success = await ClientRepository.delete(id);
    if (!success) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting client:", error);
    res.status(500).json({ error: "Failed to delete client" });
  }
});

export default router;
