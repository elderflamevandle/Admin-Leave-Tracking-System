import { db } from "../config/db";
import { logger } from "./logger";
import type { AuditLogInput } from "../types";
import type { Request } from "express";

export async function logAudit(input: AuditLogInput): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: input.userId,
        eventKey: input.eventKey,
        details: input.details,
        metadata: (input.metadata ?? undefined) as import("@prisma/client").Prisma.InputJsonValue | undefined,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        module: input.module,
      },
    });
  } catch (error) {
    // Audit write failure must not block the primary action
    logger.error("Audit log write failed", {
      error: String(error),
      userId: input.userId,
      eventKey: input.eventKey,
      module: input.module,
    });
  }
}

export function getClientInfo(req: Request): { ipAddress: string; userAgent: string } {
  const forwarded = req.headers["x-forwarded-for"];
  const trustedHops = parseInt(process.env.TRUSTED_PROXY_COUNT ?? "1", 10);
  const ips = (typeof forwarded === "string" ? forwarded : forwarded?.[0] ?? "")
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);
  const ipAddress =
    ips.at(-trustedHops) ??
    (req.headers["x-real-ip"] as string) ??
    req.socket?.remoteAddress ??
    "unknown";
  const userAgent = (req.headers["user-agent"] as string) ?? "unknown";
  return { ipAddress, userAgent };
}
