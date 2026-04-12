import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./src/server/routes/authRoutes";
import materialRoutes from "./src/server/routes/materialRoutes";
import sessionRoutes from "./src/server/routes/sessionRoutes";
import quizRoutes from "./src/server/routes/quizRoutes";
import messageRoutes from "./src/server/routes/messageRoutes";
import userRoutes from "./src/server/routes/userRoutes";
import { checkDbConnection } from "./src/server/middleware/dbMiddleware";

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
      console.error("CRITICAL: Your MONGODB_URI contains '<' or '>'. Please remove these brackets and only include the actual password in the Settings menu.");
    } else {
      mongoose.connect(MONGODB_URI)
        .then(() => console.log("✅ Connected to MongoDB"))
        .catch((err) => {
          console.error("❌ MongoDB connection error:", err.message);
          console.error("Tip: Check if your IP is allowlisted in MongoDB Atlas and if your password is correct.");
        });
    }
  } else {
    console.warn("⚠️ MONGODB_URI not found. Please add it to the Settings menu to enable database features.");
  }

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", checkDbConnection, authRoutes);
  app.use("/api/materials", checkDbConnection, materialRoutes);
  app.use("/api/sessions", checkDbConnection, sessionRoutes);
  app.use("/api/quizzes", checkDbConnection, quizRoutes);
  app.use("/api/messages", checkDbConnection, messageRoutes);
  app.use("/api/users", checkDbConnection, userRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (process.env.NODE_ENV === "production") {
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

const appPromise = startServer();

export default async (req: any, res: any) => {
  const app = await appPromise;
  app(req, res);
};
