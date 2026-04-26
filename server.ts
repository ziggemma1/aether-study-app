import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import authRoutes from "./src/server/routes/authRoutes.js";
import materialRoutes from "./src/server/routes/materialRoutes.js";
import sessionRoutes from "./src/server/routes/sessionRoutes.js";
import quizRoutes from "./src/server/routes/quizRoutes.js";
import messageRoutes from "./src/server/routes/messageRoutes.js";
import userRoutes from "./src/server/routes/userRoutes.js";
import groupRoutes from "./src/server/routes/groupRoutes.js";
import { checkDbConnection } from "./src/server/middleware/dbMiddleware.js";
import { createServer } from "http";
import { initSocket } from "./src/server/socket.js";

dotenv.config();

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const PORT = 3000;

  // Initialize Socket.io
  initSocket(httpServer);

  // Trust the first proxy (e.g. Cloud Run / Nginx) to securely parse X-Forwarded-For
  app.set('trust proxy', 1);

  // Security Middleware
  app.use(helmet({
    contentSecurityPolicy: false, 
    crossOriginEmbedderPolicy: false,
  }));
  app.use(mongoSanitize());

  // General rate limiter for all routes
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 1000,
    message: "Too many requests from this IP, please try again later.",
    validate: { xForwardedForHeader: false }
  });
  app.use("/api/", globalLimiter);

  // Authentication specific rate limiter
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 50, // Limit each IP to 50 login/register requests per windowMs
    message: "Too many authentication attempts, please try again after 15 minutes",
    standardHeaders: true, 
    legacyHeaders: false, 
    validate: { xForwardedForHeader: false }
  });
  app.use("/api/auth", authLimiter);

  // Payload Limit constraints
  app.use(express.json({ limit: '5mb' })); 
  app.use(express.urlencoded({ limit: '5mb', extended: true }));
  app.use(cookieParser());
  
  // CORS Configuration (Strict)
  app.use(cors({
    origin: function (origin, callback) {
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  // MongoDB Connection
  const MONGODB_URI = process.env.MONGODB_URI;
  if (MONGODB_URI) {
    if (MONGODB_URI.includes('<db_password>') || MONGODB_URI.includes('<') || MONGODB_URI.includes('>')) {
      console.error("❌ CRITICAL ERROR: Your MONGODB_URI contains placeholder text like '<db_password>'.");
      console.error("👉 ACTION REQUIRED: Please replace '<db_password>' with your actual MongoDB database password in your environment variables.");
    } else {
      const connectWithRetry = async (retries = 10) => {
        try {
          await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
          });
          console.log("✅ Connected to MongoDB successfully");
        } catch (err: any) {
          if (retries > 0) {
            const delay = 5000;
            console.warn(`❌ MongoDB connection failed: ${err.message}. Retrying in ${delay}ms... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return connectWithRetry(retries - 1);
          } else {
            console.error("❌ FATAL: MongoDB connection error after all retries:", err.message);
            throw err;
          }
        }
      };
      
      // In production/Vercel, we MUST wait for the connection to be established
      // before returning the app, otherwise the serverless function may complete 
      // while the connection is still in 'disconnected' state.
      if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
        console.log("⏳ Awaiting MongoDB connection for production environment...");
        try {
          await connectWithRetry();
        } catch (e) {
          console.error("Failed to establish initial DB connection in production.");
        }
      } else {
        connectWithRetry();
      }
    }
  } else {
    console.error("❌ ERROR: MONGODB_URI environment variable is missing.");
    console.error("👉 ACTION REQUIRED: You must set the MONGODB_URI environment variable in your deployment settings (e.g., Vercel, GitHub, or .env file).");
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
  app.use("/api/groups", checkDbConnection, groupRoutes);

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
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

export const appPromise = startServer();
