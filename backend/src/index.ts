import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { sequelize } from "./database/connection";
import authRoutes from "./routes/auth.routes";
import taskRoutes from "./routes/task.routes";
import userRoutes from "./routes/user.routes";
import projectRoutes from "./routes/project.routes";
import assigneeRoutes from "./routes/assignee.routes";
// import { errorHandler } from './middleware/errorHandler';
import { initializeWebSocket } from "./websocket/socketHandler";
import { metricsMiddleware, metricsEndpoint } from "./middleware/metrics";

dotenv.config();

const app: Application = express();
const httpServer = createServer(app);
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";
const PORT = process.env.PORT || 5000;
const STARTUP_RETRY_DELAY_MS = Number(process.env.STARTUP_RETRY_DELAY_MS || 5000);
const MAX_STARTUP_RETRIES = Number(process.env.MAX_STARTUP_RETRIES || 0);

// Support "*" for allow-all, or comma-separated list of origins
const corsOptions = {
  origin: corsOrigin === "*" ? true : corsOrigin.split(","),
  credentials: true,
};

const io = new Server(httpServer, {
  cors: {
    ...corsOptions,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const initializeDatabase = async (): Promise<void> => {
  let attempt = 0;

  while (MAX_STARTUP_RETRIES === 0 || attempt < MAX_STARTUP_RETRIES) {
    attempt += 1;

    try {
      await sequelize.authenticate();
      console.log("Database connection established successfully.");

      await sequelize.sync({ alter: process.env.NODE_ENV === "development" });
      console.log("Database models synced.");
      return;
    } catch (error) {
      console.error(
        `Database initialization attempt ${attempt} failed. Retrying in ${STARTUP_RETRY_DELAY_MS}ms...`,
        error
      );

      if (MAX_STARTUP_RETRIES > 0 && attempt >= MAX_STARTUP_RETRIES) {
        throw error;
      }

      await sleep(STARTUP_RETRY_DELAY_MS);
    }
  }
};

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Prometheus metrics middleware
app.use(metricsMiddleware);

// Metrics endpoint for Prometheus
app.get("/metrics", metricsEndpoint);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Readiness endpoint used by Docker health checks
app.get("/ready", (req, res) => {
  res.status(200).json({ status: "READY", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/assignees", assigneeRoutes);

// WebSocket initialization
initializeWebSocket(io);

// Error handling
// app.use(errorHandler);

const startServer = async () => {
  try {
    await initializeDatabase();

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log("WebSocket server ready");
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error("Unable to start server:", error);
    process.exit(1);
  }
};

startServer();

export { app, io };
