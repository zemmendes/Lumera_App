import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertCampaignSchema, insertConnectionSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Get user profile
  app.get("/api/profile/:id", async (req, res) => {
    const user = await storage.getUser(parseInt(req.params.id));
    if (!user) return res.status(404).send("User not found");
    res.json(user);
  });

  // List users by type
  app.get("/api/users/:type", async (req, res) => {
    const users = await storage.getUsersByType(req.params.type as "company" | "influencer");
    res.json(users);
  });

  // Campaign routes
  app.post("/api/campaigns", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.userType !== "company") return res.sendStatus(403);
    
    const parsed = insertCampaignSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    
    const campaign = await storage.createCampaign({
      ...parsed.data,
      companyId: req.user.id,
    });
    res.json(campaign);
  });

  app.get("/api/campaigns", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const campaigns = await storage.getActiveCampaigns();
    res.json(campaigns);
  });

  app.get("/api/campaigns/company", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.userType !== "company") return res.sendStatus(403);
    
    const campaigns = await storage.getCampaignsByCompany(req.user.id);
    res.json(campaigns);
  });

  // Connection routes
  app.post("/api/connections", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.userType !== "influencer") return res.sendStatus(403);
    
    const parsed = insertConnectionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    
    const connection = await storage.createConnection({
      ...parsed.data,
      influencerId: req.user.id,
    });
    res.json(connection);
  });

  app.get("/api/connections/influencer", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.userType !== "influencer") return res.sendStatus(403);
    
    const connections = await storage.getConnectionsByInfluencer(req.user.id);
    res.json(connections);
  });

  app.get("/api/connections/campaign/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const connections = await storage.getConnectionsByCampaign(parseInt(req.params.id));
    res.json(connections);
  });

  app.patch("/api/connections/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.userType !== "company") return res.sendStatus(403);
    
    const { status } = req.body;
    if (status !== "accepted" && status !== "rejected") {
      return res.status(400).send("Invalid status");
    }
    
    const connection = await storage.updateConnectionStatus(parseInt(req.params.id), status);
    res.json(connection);
  });

  const httpServer = createServer(app);
  return httpServer;
}
