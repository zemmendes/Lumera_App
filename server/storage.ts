import { InsertUser, User, Campaign, Connection } from "@shared/schema";
import { users, campaigns, connections } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsersByType(type: "company" | "influencer"): Promise<User[]>;

  createCampaign(campaign: Omit<Campaign, "id">): Promise<Campaign>;
  getCampaign(id: number): Promise<Campaign | undefined>;
  getCampaignsByCompany(companyId: number): Promise<Campaign[]>;
  getActiveCampaigns(): Promise<Campaign[]>;

  createConnection(connection: Omit<Connection, "id">): Promise<Connection>;
  getConnectionsByInfluencer(influencerId: number): Promise<Connection[]>;
  getConnectionsByCampaign(campaignId: number): Promise<Connection[]>;
  updateConnectionStatus(id: number, status: "accepted" | "rejected"): Promise<Connection>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUsersByType(type: "company" | "influencer"): Promise<User[]> {
    return await db.select().from(users).where(eq(users.userType, type));
  }

  async createCampaign(campaign: Omit<Campaign, "id">): Promise<Campaign> {
    const [newCampaign] = await db.insert(campaigns).values(campaign).returning();
    return newCampaign;
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign;
  }

  async getCampaignsByCompany(companyId: number): Promise<Campaign[]> {
    return await db.select().from(campaigns).where(eq(campaigns.companyId, companyId));
  }

  async getActiveCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns).where(eq(campaigns.status, "active"));
  }

  async createConnection(connection: Omit<Connection, "id">): Promise<Connection> {
    const [newConnection] = await db.insert(connections).values(connection).returning();
    return newConnection;
  }

  async getConnectionsByInfluencer(influencerId: number): Promise<Connection[]> {
    return await db.select().from(connections).where(eq(connections.influencerId, influencerId));
  }

  async getConnectionsByCampaign(campaignId: number): Promise<Connection[]> {
    return await db.select().from(connections).where(eq(connections.campaignId, campaignId));
  }

  async updateConnectionStatus(id: number, status: "accepted" | "rejected"): Promise<Connection> {
    const [updated] = await db
      .update(connections)
      .set({ status })
      .where(eq(connections.id, id))
      .returning();
    if (!updated) throw new Error("Connection not found");
    return updated;
  }
}

export const storage = new DatabaseStorage();