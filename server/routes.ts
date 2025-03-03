import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertCampaignSchema, insertConnectionSchema } from "@shared/schema";
import multer from "multer";
import { randomBytes } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Get user profile
  app.get("/api/profile/:id", async (req, res) => {
    const user = await storage.getUser(parseInt(req.params.id));
    if (!user) return res.status(404).send("User not found");
    res.json(user);
  });

  // Update user profile
  app.patch("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const user = await storage.updateUser(req.user.id, req.body);
    res.json(user);
  });

  // Upload profile picture
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  });

  app.post("/api/upload", upload.single("image"), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.file) return res.status(400).send("No file uploaded");

    try {
      // Generate a unique filename
      const filename = `${randomBytes(16).toString("hex")}-${req.file.originalname}`;

      // For demo purposes, we'll return a placeholder URL
      // In a production environment, you would upload this to a proper storage service
      const url = `https://images.unsplash.com/photo-1507679799987-c73779587ccf`;

      res.json({ url });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).send("Failed to upload file");
    }
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