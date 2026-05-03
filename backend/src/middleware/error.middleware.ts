import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

interface AppError extends Error {
  status?: number;
  statusCode?: number;
}

export function errorMiddleware(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.status ?? err.statusCode ?? 500;
  const message = err.message ?? "Internal server error";

  if (status >= 500) {
    logger.error("Unhandled error", { error: String(err), stack: err.stack });
  }

  res.status(status).json({
    success: false,
    error: status >= 500 ? "Internal server error" : message,
  });
}
