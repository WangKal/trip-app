// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/auth.ts
import session2 from "express-session";
import passport from "passport";
import dotenv from "dotenv";
import { Strategy as LocalStrategy } from "passport-local";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

// shared/schema.ts
import { mysqlTable as table, text, serial, int, timestamp, varchar } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
var governmentStructures = table("government_structures", {
  id: serial("id").primaryKey(),
  name: varchar("name", 255).notNull(),
  parentId: int("parent_id").references(() => governmentStructures.id, { onDelete: "cascade" }).default(null)
});
var branches = table("branches", {
  id: serial("id").primaryKey(),
  name: varchar("name", 255).notNull(),
  structureId: int("structure_id").references(() => governmentStructures.id, { onDelete: "cascade" })
});
var departments = table("departments", {
  id: serial("id").primaryKey(),
  name: varchar("name", 255).notNull(),
  structureId: int("structure_id").references(() => governmentStructures.id, { onDelete: "cascade" })
});
var facilities = table("facilities", {
  id: serial("id").primaryKey(),
  name: varchar("name", 255).notNull(),
  structureId: int("structure_id").references(() => governmentStructures.id, { onDelete: "cascade" }),
  category: varchar("category", 255).notNull()
  // e.g., 'hospital', 'huduma_center'
});
var users = table("users", {
  id: int().primaryKey().autoincrement(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  governanceLevel: text("governance_level").notNull(),
  role: text("role").notNull().default("user"),
  departmentId: int()
  // Only for admin users
});
var posts = table("posts", {
  id: serial().primaryKey().autoincrement(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  structureId: int().notNull(),
  departmentId: int(),
  userId: int().notNull(),
  type: text("type").notNull().default("suggestion"),
  // suggestion or complaint
  status: text("status").notNull().default("open"),
  // open, in_progress, resolved
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var reactions = table("reactions", {
  id: serial().primaryKey().autoincrement(),
  postId: int().notNull(),
  userId: int().notNull(),
  type: text("type").notNull(),
  // agree, neutral, against
  reason: text("reason"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  governanceLevel: true,
  departmentId: true
});
var insertPostSchema = createInsertSchema(posts).pick({
  title: true,
  content: true,
  structureId: true,
  departmentId: true,
  type: true
});
var insertReactionSchema = createInsertSchema(reactions).pick({
  postId: true,
  type: true,
  reason: true
});

// server/storage.ts
import { drizzle as drizzle2 } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import session from "express-session";

// server/db.ts
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
var isOffline = !process.env.DATABASE_URL;
var pool = mysql.createPool("mysql://root@localhost:3306/citizen_connect");
var db = drizzle("mysql://root@localhost:3306/citizen_connect");

// server/storage.ts
import MySQLStore from "express-mysql-session";
var MySQLSessionStore = MySQLStore(session);
var db2 = drizzle2("mysql://root@localhost:3306/citizen_connect");
var DatabaseStorage = class {
  sessionStore;
  constructor() {
    this.sessionStore = new MySQLSessionStore({}, pool);
  }
  async getUser(id) {
    const [user] = await db2.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username) {
    const [user] = await db2.select().from(users).where(eq(users.username, username));
    return user;
  }
  async createUser(insertUser) {
    const [user] = await db2.insert(users).values(insertUser);
    return user;
  }
  async getPosts(structureId) {
    if (structureId) {
      return db2.select().from(posts).where(eq(posts.structureId, structureId));
    }
    return db2.select().from(posts);
  }
  async createPost(insertPost) {
    const [post] = await db2.insert(posts).values(insertPost).returning();
    return post;
  }
  async getReactionsByPost(postId) {
    return db2.select().from(reactions).where(eq(reactions.postId, postId));
  }
  async createReaction(insertReaction) {
    const [reaction] = await db2.insert(reactions).values(insertReaction).returning();
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
    const t = await db2.select().from(governmentStructures);
    console.log(t);
    return t;
  }
  async getBranches(parentId) {
    const br = await db2.select().from(branches).where(eq(branches.structureId, parentId));
    return br;
  }
  async getDepartments(parentId) {
    const dp = await db2.select().from(departments).where(eq(departments.structureId, parentId));
    return dp;
  }
  async getDetailsByStructure(structureId) {
    const br = await db2.select().from(branches).where(eq(branches.structureId, structureId));
    const deps = await db2.select().from(departments).where(eq(departments.structureId, structureId));
    return { branches: br, departments: deps };
  }
};
var storage = new DatabaseStorage();

// server/auth.ts
dotenv.config();
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function setupAuth(app2) {
  const sessionSettings = {
    secret: "secret_key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore
  };
  if (app2.get("env") === "production") {
    app2.set("trust proxy", 1);
  }
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !await comparePasswords(password, user.password)) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });
  app2.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }
    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password)
    });
    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });
  app2.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}

// server/routes.ts
function registerRoutes(app2) {
  setupAuth(app2);
  app2.get("/api/posts", async (req, res) => {
    const structureId = req.query.structureId ? parseInt(req.query.structureId) : void 0;
    const posts2 = await storage.getPosts(structureId);
    res.json(posts2);
  });
  app2.post("/api/posts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const data = insertPostSchema.parse(req.body);
    const post = await storage.createPost({
      ...data,
      userId: req.user.id
    });
    res.status(201).json(post);
  });
  app2.get("/api/posts/:postId/reactions", async (req, res) => {
    const postId = parseInt(req.params.postId);
    const reactions2 = await storage.getReactionsByPost(postId);
    res.json(reactions2);
  });
  app2.post("/api/posts/:postId/reactions", async (req, res) => {
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
  app2.get("/api/structures", async (req, res) => {
    const structures = await storage.getTopStructures();
    res.json(structures);
  });
  app2.get("/api/branches/:id", async (req, res) => {
    const branches2 = await storage.getBranches(Number(req.params.id));
    res.json(branches2);
  });
  app2.get("/api/departments/:id", async (req, res) => {
    const departments2 = await storage.getDepartments(Number(req.params.id));
    res.json(departments2);
  });
  app2.get("/api/structures/:id/details", async (req, res) => {
    const details = await storage.getDetailsByStructure(Number(req.params.id));
    res.json(details);
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [react(), runtimeErrorOverlay(), themePlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.log(err);
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const PORT = 5e3;
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();
