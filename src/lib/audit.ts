import { db } from "./db";
import { logger } from "./logger";
import type { AuditLogInput } from "@/types";

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

export function getClientInfo(request: Request): { ipAddress: string; userAgent: string } {
  const forwarded = request.headers.get("x-forwarded-for");
  // Take the last entry added by our own infrastructure (Vercel/load balancer),
  // not the first which is fully client-controlled and trivially spoofable.
  const trustedHops = parseInt(process.env.TRUSTED_PROXY_COUNT ?? "1", 10);
  const ips = forwarded?.split(",").map((ip) => ip.trim()) ?? [];
  const ipAddress =
    ips.at(-trustedHops) ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  return { ipAddress, userAgent };
}
