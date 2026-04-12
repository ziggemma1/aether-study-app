import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./src/server/routes/authRoutes.js";
import materialRoutes from "./src/server/routes/materialRoutes.js";
import sessionRoutes from "./src/server/routes/sessionRoutes.js";
import quizRoutes from "./src/server/routes/quizRoutes.js";
import messageRoutes from "./src/server/routes/messageRoutes.js";
import userRoutes from "./src/server/routes/userRoutes.js";
import { checkDbConnection } from "./src/server/middleware/dbMiddleware.js";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());
  app.use(cookieParser());
  app.use(cors({
    origin: true, // Reflect request origin
    credentials: true
  }));

  // MongoDB Connection
  const MONGODB_URI = process.env.MONGODB_URI;
  if (MONGODB_URI) {
    if (MONGODB_URI.includes('<') || MONGODB_URI.includes('>')) {
      console.error("CRITICAL: Your MONGODB_URI contains '<' or '>'.");
    } else {
      try {
        // Use a shorter timeout for serverless to avoid function timeout
        await mongoose.connect(MONGODB_URI, {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 10000,
        });
        console.log("✅ Connected to MongoDB");
      } catch (err: any) {
        console.error("❌ MongoDB connection error:", err.message);
      }
    }
  } else {
    console.warn("⚠️ MONGODB_URI not found.");
  }

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      dbConnected: mongoose.connection.readyState === 1,
      hasUri: !!process.env.MONGODB_URI 
    });
  });

  app.use("/api/auth", checkDbConnection, authRoutes);
  app.use("/api/materials", checkDbConnection, materialRoutes);
  app.use("/api/sessions", checkDbConnection, sessionRoutes);
  app.use("/api/quizzes", checkDbConnection, quizRoutes);
  app.use("/api/messages", checkDbConnection, messageRoutes);
  app.use("/api/users", checkDbConnection, userRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn("Vite failed to load in dev mode:", e);
    }
  } else if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

export const appPromise = startServer();
