import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  userType: text("user_type", { enum: ["company", "influencer"] }).notNull(),
  name: text("name").notNull(),
  bio: text("bio"),
  avatar: text("avatar"),
  websiteUrl: text("website_url"),
});

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements"),
  budget: text("budget").notNull(),
  status: text("status", { enum: ["draft", "active", "completed"] }).notNull(),
});

export const connections = pgTable("connections", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => campaigns.id).notNull(),
  influencerId: integer("influencer_id").references(() => users.id).notNull(),
  status: text("status", { enum: ["pending", "accepted", "rejected"] }).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  userType: true,
  name: true,
  bio: true,
  avatar: true,
  websiteUrl: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).pick({
  title: true,
  description: true,
  requirements: true,
  budget: true,
  status: true,
});

export const insertConnectionSchema = createInsertSchema(connections).pick({
  campaignId: true,
  influencerId: true,
  status: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type Connection = typeof connections.$inferSelect;
