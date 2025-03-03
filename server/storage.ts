import { InsertUser, User, Campaign, Connection, insertCampaignSchema, insertConnectionSchema } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private campaigns: Map<number, Campaign>;
  private connections: Map<number, Connection>;
  private currentId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.campaigns = new Map();
    this.connections = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getUsersByType(type: "company" | "influencer"): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.userType === type);
  }

  async createCampaign(campaign: Omit<Campaign, "id">): Promise<Campaign> {
    const id = this.currentId++;
    const newCampaign = { ...campaign, id };
    this.campaigns.set(id, newCampaign);
    return newCampaign;
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }

  async getCampaignsByCompany(companyId: number): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(
      campaign => campaign.companyId === companyId
    );
  }

  async getActiveCampaigns(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(
      campaign => campaign.status === "active"
    );
  }

  async createConnection(connection: Omit<Connection, "id">): Promise<Connection> {
    const id = this.currentId++;
    const newConnection = { ...connection, id };
    this.connections.set(id, newConnection);
    return newConnection;
  }

  async getConnectionsByInfluencer(influencerId: number): Promise<Connection[]> {
    return Array.from(this.connections.values()).filter(
      conn => conn.influencerId === influencerId
    );
  }

  async getConnectionsByCampaign(campaignId: number): Promise<Connection[]> {
    return Array.from(this.connections.values()).filter(
      conn => conn.campaignId === campaignId
    );
  }

  async updateConnectionStatus(id: number, status: "accepted" | "rejected"): Promise<Connection> {
    const connection = this.connections.get(id);
    if (!connection) throw new Error("Connection not found");
    const updated = { ...connection, status };
    this.connections.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
