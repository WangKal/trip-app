import { mysqlTable as table, text, serial, int, boolean, timestamp, json,varchar } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/*export const governmentStructures = table("government_structures", {
  id: serial().primaryKey().autoincrement(),
  name: text("name").notNull(),
  level: text("level").notNull(), // national, county, ward
  parentId: int(),
});

export const departments = table("departments", {
  id: serial().primaryKey().autoincrement(),
  name: text("name").notNull(),
  structureId: int("structure_id").notNull(),
  adminId: int(), // Reference to the admin user
});*/
// Government Structures (Hierarchical)
export const governmentStructures = table("government_structures", {
  id: serial("id").primaryKey(),
  name: varchar("name", 255).notNull(),
  parentId: int("parent_id").references(() => governmentStructures.id, { onDelete: "cascade" }).default(null),
});

// Departments (Belongs to a Government Structure)
export const branches = table("branches", {
  id: serial("id").primaryKey(),
  name: varchar("name", 255).notNull(),
  structureId: int("structure_id").references(() => governmentStructures.id, { onDelete: "cascade" }),
});

// Departments (Belongs to a Government Structure)
export const departments = table("departments", {
  id: serial("id").primaryKey(),
  name: varchar("name", 255).notNull(),
  structureId: int("structure_id").references(() => governmentStructures.id, { onDelete: "cascade" }),
});

// Facilities (e.g., Hospitals, Huduma Centers, Police Posts)
export const facilities = table("facilities", {
  id: serial("id").primaryKey(),
  name: varchar("name", 255).notNull(),
  structureId: int("structure_id").references(() => governmentStructures.id, { onDelete: "cascade" }),
  category: varchar("category", 255).notNull(), // e.g., 'hospital', 'huduma_center'
});

export const users = table("users", {
  id: int().primaryKey().autoincrement(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  governanceLevel: text("governance_level").notNull(),
  role: text("role").notNull().default("user"),
  departmentId: int(), // Only for admin users
});

export const posts = table("posts", {
  id: serial().primaryKey().autoincrement(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  structureId: int().notNull(),
  departmentId: int(),
  userId: int().notNull(),
  type: text("type").notNull().default("suggestion"), // suggestion or complaint
  status: text("status").notNull().default("open"), // open, in_progress, resolved
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reactions = table("reactions", {
  id: serial().primaryKey().autoincrement(),
  postId: int().notNull(),
  userId: int().notNull(),
  type: text("type").notNull(), // agree, neutral, against
  reason: text("reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  governanceLevel: true,
  departmentId: true
});

export const insertPostSchema = createInsertSchema(posts).pick({
  title: true,
  content: true,
  structureId: true,
  departmentId: true,
  type: true
});

export const insertReactionSchema = createInsertSchema(reactions).pick({
  postId: true,
  type: true,
  reason: true
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type InsertReaction = z.infer<typeof insertReactionSchema>;
export type User = typeof users.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Reaction = typeof reactions.$inferSelect;
export type GovernmentStructure = typeof governmentStructures.$inferSelect;
export type Branch = typeof branches.$inferSelect;
export type Department = typeof departments.$inferSelect;
export type Facility = typeof facilities.$inferSelect;

export const governanceLevels = ["national", "county", "ward"] as const;
export const postTypes = ["suggestion", "complaint"] as const;
export const reactionTypes = ["agree", "neutral", "against"] as const;