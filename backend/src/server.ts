import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";

import { env } from "./config/env";
import { errorMiddleware } from "./middleware/error.middleware";
import { logger } from "./utils/logger";

import authRoutes from "./routes/auth.routes";
import usersRoutes from "./routes/users.routes";
import leaveRoutes from "./routes/leave.routes";
import timelogRoutes from "./routes/timelog.routes";
import activityRoutes from "./routes/activity.routes";
import notificationsRoutes from "./routes/notifications.routes";
import adminRoutes from "./routes/admin.routes";
import exportRoutes from "./routes/export.routes";

const app = express();

// Security headers
app.use(helmet());

// CORS — allow frontend with credentials
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);

// Body parsing
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1/leave", leaveRoutes);
app.use("/api/v1/timelog", timelogRoutes);
app.use("/api/v1/activity", activityRoutes);
app.use("/api/v1/notifications", notificationsRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/export", exportRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Not found" });
});

// Global error handler
app.use(errorMiddleware);

app.listen(env.PORT, () => {
  logger.info(`Backend server started`, { port: env.PORT, env: env.NODE_ENV });
});

export default app;
