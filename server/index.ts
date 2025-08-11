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
import finopsRouter from "./routes/finops";
import workflowRouter from "./routes/workflow";

// Production routes (database-only, no mock fallback)
import templatesProductionRouter from "./routes/templates-production";
import activityProductionRouter from "./routes/activity-production";
import notificationsProductionRouter from "./routes/notifications-production";
import adminProductionRouter from "./routes/admin-production";
import finopsProductionRouter from "./routes/finops-production";

export function createServer() {
  const app = express();

  // Initialize database with enhanced schema (non-blocking)
  setTimeout(() => {
    initializeDatabase().catch((error) => {
      console.error("Database initialization failed:", error);
      console.log("Server will continue with mock data fallback");
    });
  }, 1000); // Delay initialization to prevent blocking server startup

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Debug middleware to log all requests
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

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

  try {
    app.use("/api/tickets", ticketsRouter);
    console.log("Tickets router loaded successfully");
  } catch (error) {
    console.error("Error loading tickets router:", error);
  }

  try {
    app.use("/api/finops", finopsRouter);
    console.log("FinOps router loaded successfully");
  } catch (error) {
    console.error("Error loading FinOps router:", error);
  }

  try {
    app.use("/api/workflow", workflowRouter);
    console.log("Workflow router loaded successfully");
  } catch (error) {
    console.error("Error loading Workflow router:", error);
  }

  // Add a simple notifications route that redirects to workflow notifications
  try {
    app.get("/api/notifications", (req, res) => {
      // Redirect to workflow notifications with the same query parameters
      const queryString = Object.keys(req.query).length > 0
        ? "?" + new URLSearchParams(req.query as Record<string, string>).toString()
        : "";

      // Proxy the request to workflow notifications
      res.redirect(`/api/workflow/notifications${queryString}`);
    });
    console.log("Main notifications route added successfully");
  } catch (error) {
    console.error("Error adding notifications route:", error);
  }

  // Production routes (database-only, no mock fallback)
  try {
    app.use("/api/admin", adminProductionRouter);
    console.log("Admin production router loaded successfully");
  } catch (error) {
    console.error("Error loading Admin production router:", error);
  }

  try {
    app.use("/api/templates-production", templatesProductionRouter);
    console.log("Templates production router loaded successfully");
  } catch (error) {
    console.error("Error loading Templates production router:", error);
  }

  try {
    app.use("/api/activity-production", activityProductionRouter);
    console.log("Activity production router loaded successfully");
  } catch (error) {
    console.error("Error loading Activity production router:", error);
  }

  try {
    app.use("/api/notifications-production", notificationsProductionRouter);
    console.log("Notifications production router loaded successfully");
  } catch (error) {
    console.error("Error loading Notifications production router:", error);
  }

  try {
    app.use("/api/finops-production", finopsProductionRouter);
    console.log("FinOps production router loaded successfully");
  } catch (error) {
    console.error("Error loading FinOps production router:", error);
  }

  return app;
}
