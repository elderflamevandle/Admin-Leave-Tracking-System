import { db } from "./db";
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
    // Audit write failure should not block the primary action (per PRD-04 spec)
    console.error("Audit log write failed:", error);
  }
}

export function getClientInfo(request: Request): { ipAddress: string; userAgent: string } {
  const forwarded = request.headers.get("x-forwarded-for");
  const ipAddress = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  return { ipAddress, userAgent };
}
