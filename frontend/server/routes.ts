import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertPostSchema, insertReactionSchema } from "@shared/schema";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Posts
  app.get("/api/posts", async (req, res) => {
    const structureId = req.query.structureId ? parseInt(req.query.structureId as string) : undefined;
    const posts = await storage.getPosts(structureId);
    res.json(posts);
  });

  app.post("/api/posts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const data = insertPostSchema.parse(req.body);
    const post = await storage.createPost({
      ...data,
      userId: req.user.id
    });
    res.status(201).json(post);
  });

  // Reactions
  app.get("/api/posts/:postId/reactions", async (req, res) => {
    const postId = parseInt(req.params.postId);
    const reactions = await storage.getReactionsByPost(postId);
    res.json(reactions);
  });

  app.post("/api/posts/:postId/reactions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const postId = parseInt(req.params.postId);
    const data = insertReactionSchema.parse(req.body);
    const reaction = await storage.createReaction({
      ...data,
      postId,
      userId: req.user.id
    });
    res.status(201).json(reaction);
  });
/*
  // Government Structures
  app.get("/api/structures", async (req, res) => {
    const parentId = req.query.parentId ? parseInt(req.query.parentId as string) : undefined;
    const structures = await storage.getStructures(parentId);
    res.json(structures);
  });

  // Departments
  app.get("/api/structures/:structureId/departments", async (req, res) => {
    const structureId = parseInt(req.params.structureId);
    const departments = await storage.getDepartments(structureId);
    res.json(departments);
  });
*/

  // Get Top-Level Government Structures
app.get("/api/structures", async (req, res) => {
  const structures = await storage.getTopStructures();

  res.json(structures);
});

// Get Sub-Structures (Counties, Sub-Counties)
app.get("/api/branches/:id", async (req, res) => {
  const branches = await storage.getBranches(Number(req.params.id));
  res.json(branches);
});
// Get Sub-Structures (Counties, Sub-Counties)
app.get("/api/departments/:id", async (req, res) => {
  const departments = await storage.getDepartments(Number(req.params.id));
  res.json(departments);
});
// Get Departments & Facilities under a Structure
app.get("/api/structures/:id/details", async (req, res) => {
  const details = await storage.getDetailsByStructure(Number(req.params.id));
  res.json(details);
});

  const httpServer = createServer(app);
  return httpServer;
}