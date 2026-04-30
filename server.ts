import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import authRoutes from "./server_backend/routes/authRoutes.js";
import materialRoutes from "./server_backend/routes/materialRoutes.js";
import sessionRoutes from "./server_backend/routes/sessionRoutes.js";
import quizRoutes from "./server_backend/routes/quizRoutes.js";
import messageRoutes from "./server_backend/routes/messageRoutes.js";
import userRoutes from "./server_backend/routes/userRoutes.js";
import groupRoutes from "./server_backend/routes/groupRoutes.js";
import roomRoutes from "./server_backend/routes/roomRoutes.js";
import { checkDbConnection } from "./server_backend/middleware/dbMiddleware.js";
import { createServer } from "http";
import { initSocket } from "./server_backend/socket.js";

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
      const connectWithRetry = async (retries = process.env.VERCEL ? 1 : 10) => {
        try {
          await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: process.env.VERCEL ? 3000 : 5000,
            connectTimeoutMS: process.env.VERCEL ? 3000 : 5000,
          });
          console.log("✅ Connected to MongoDB successfully");
        } catch (err: any) {
          if (retries > 0) {
            const delay = 2000;
            console.warn(`❌ MongoDB connection failed: ${err.message}. Retrying in ${delay}ms... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return connectWithRetry(retries - 1);
          } else {
            console.error("❌ FATAL: MongoDB connection error after all retries:", err.message);
            // Don't throw the error so the app can still be returned and handle requests (it will return 500 DB not connected)
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
  app.use("/api/rooms", checkDbConnection, roomRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    try {
      // Hide from Vercel's file tracer
      const dynamicImport = new Function('modulePath', 'return import(modulePath)');
      const { createServer: createViteServer } = await dynamicImport("vite");
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

const appPromise = startServer();
export default appPromise;
