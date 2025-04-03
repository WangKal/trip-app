 import { 
  users, posts, reactions, governmentStructures, branches, departments, facilities,
  type User, type Post, type Reaction, type InsertUser, type InsertPost, type InsertReaction,
  type GovernmentStructure, type Department
} from "@shared/schema";
//import { db } from "./db";
import { drizzle } from 'drizzle-orm/mysql2';
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "express-mysql-session";
import { pool } from "./db"; // Ensure MySQL pool is correctly configured

import MySQLStore from "express-mysql-session";
const MySQLSessionStore = MySQLStore(session);
const db = drizzle("mysql://root@localhost:3306/citizen_connect");
export interface IStorage {
  sessionStore: session.Store;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Post operations
  getPosts(structureId?: number): Promise<Post[]>;
  createPost(post: InsertPost & { userId: number }): Promise<Post>;

  // Reaction operations
  getReactionsByPost(postId: number): Promise<Reaction[]>;
  createReaction(reaction: InsertReaction & { userId: number }): Promise<Reaction>;

  // Structure and Department operations
  getStructures(parentId?: number): Promise<GovernmentStructure[]>;
  getDepartments(structureId: number): Promise<Department[]>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MySQLSessionStore({}, pool);
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
    const [user] = await db.insert(users).values(insertUser);
    return user;
  }

  async getPosts(structureId?: number): Promise<Post[]> {
    if (structureId) {
      return db.select().from(posts).where(eq(posts.structureId, structureId));
    }
    return db.select().from(posts);
  }

  async createPost(insertPost: InsertPost & { userId: number }): Promise<Post> {
    const [post] = await db.insert(posts).values(insertPost).returning();
    return post;
  }

  async getReactionsByPost(postId: number): Promise<Reaction[]> {
    return db.select().from(reactions).where(eq(reactions.postId, postId));
  }

  async createReaction(insertReaction: InsertReaction & { userId: number }): Promise<Reaction> {
    const [reaction] = await db.insert(reactions).values(insertReaction).returning();
    return reaction;
  }

 /* async getStructures(parentId?: number): Promise<GovernmentStructure[]> {
    if (parentId !== undefined) {
      return db.select().from(governmentStructures).where(eq(governmentStructures.parentId, parentId));
    }
    return db.select().from(governmentStructures).where(eq(governmentStructures.parentId, null));
  }

  async getDepartments(structureId: number): Promise<Department[]> {
    return db.select().from(departments).where(eq(departments.structureId, structureId));
  }*/
  async getTopStructures() {
   const t =await db.select().from(governmentStructures);
  console.log(t);
  return t;
  }

  async getBranches(parentId: number) {
  
  const br = await db
    .select()
    .from(branches)
    .where(eq(branches.structureId,parentId));
    return br;
  }
 async getDepartments(parentId: number) {
  
  const dp = await db
    .select()
    .from(departments)
    .where(eq(departments.structureId,parentId));
    return dp;
  }
  async getDetailsByStructure(structureId: number) {
  const br = await db.select().from(branches).where(eq(branches.structureId,structureId));
  const deps = await db.select().from(departments).where(eq(departments.structureId,structureId));

  return {branches: br,departments: deps };
  }
}

export const storage = new DatabaseStorage();