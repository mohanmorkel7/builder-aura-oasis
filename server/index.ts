import "dotenv/config";
import express from "express";
import cors from "cors";
import { initializeDatabase } from "./database/connection";
import { handleDemo } from "./routes/demo";
import usersRouter from "./routes/users";
import clientsRouter from "./routes/clients";
import templatesRouter from "./routes/templates";
import deploymentsRouter from "./routes/deployments";

export function createServer() {
  const app = express();

  // Initialize database
  initializeDatabase().catch(console.error);

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

  // Main API routes
  app.use("/api/users", usersRouter);
  app.use("/api/clients", clientsRouter);
  app.use("/api/templates", templatesRouter);
  app.use("/api/deployments", deploymentsRouter);

  return app;
}
