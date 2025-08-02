import "dotenv/config";
import express from "express";
import cors from "cors";
import { initializeDatabase } from "./database/connection";
import { handleDemo } from "./routes/demo";
import usersRouter from "./routes/users";
import clientsRouter from "./routes/clients";
import templatesRouter from "./routes/templates";
import deploymentsRouter from "./routes/deployments";
import onboardingRouter from "./routes/onboarding";
import leadsRouter from "./routes/leads";
import followUpsRouter from "./routes/follow-ups";
import filesRouter from "./routes/files";
import ticketsRouter from "./routes/tickets";

export function createServer() {
  const app = express();

  // Initialize database with enhanced schema
  initializeDatabase().catch((error) => {
    console.error("Database initialization failed:", error);
    console.log("Server will continue with mock data fallback");
  });

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Test endpoint
  app.get("/api/test", (_req, res) => {
    res.json({ message: "Server is working!" });
  });

  // Test login endpoint
  app.post("/api/test-login", (req, res) => {
    const { email, password } = req.body;
    res.json({ message: "Test login endpoint working", email, password });
  });

  // Main API routes with error handling
  try {
    app.use("/api/users", usersRouter);
    console.log("Users router loaded successfully");
  } catch (error) {
    console.error("Error loading users router:", error);
  }

  try {
    app.use("/api/clients", clientsRouter);
    console.log("Clients router loaded successfully");
  } catch (error) {
    console.error("Error loading clients router:", error);
  }

  try {
    app.use("/api/templates", templatesRouter);
    console.log("Templates router loaded successfully");
  } catch (error) {
    console.error("Error loading templates router:", error);
  }

  try {
    app.use("/api/deployments", deploymentsRouter);
    console.log("Deployments router loaded successfully");
  } catch (error) {
    console.error("Error loading deployments router:", error);
  }

  try {
    app.use("/api/onboarding", onboardingRouter);
    console.log("Onboarding router loaded successfully");
  } catch (error) {
    console.error("Error loading onboarding router:", error);
  }

  try {
    app.use("/api/leads", leadsRouter);
    console.log("Leads router loaded successfully");
  } catch (error) {
    console.error("Error loading leads router:", error);
  }

  try {
    app.use("/api/follow-ups", followUpsRouter);
    console.log("Follow-ups router loaded successfully");
  } catch (error) {
    console.error("Error loading follow-ups router:", error);
  }

  try {
    app.use("/api/files", filesRouter);
    console.log("Files router loaded successfully");
  } catch (error) {
    console.error("Error loading files router:", error);
  }

  return app;
}
