import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculate working days between two dates (excludes weekends).
 * Does not exclude public holidays (Phase 2 feature).
 */
export function calculateWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

/**
 * Calculate hours worked from login/logout times and break.
 * Times are in "HH:mm" 24h format.
 */
export function calculateHoursWorked(
  loginTime: string,
  logoutTime: string,
  breakMinutes: number
): number {
  const [loginH, loginM] = loginTime.split(":").map(Number);
  const [logoutH, logoutM] = logoutTime.split(":").map(Number);

  const loginMinutes = loginH * 60 + loginM;
  const logoutMinutes = logoutH * 60 + logoutM;
  const workedMinutes = logoutMinutes - loginMinutes - breakMinutes;

  return Math.max(0, Number((workedMinutes / 60).toFixed(2)));
}

/**
 * Check if two date ranges overlap.
 */
export function dateRangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 <= end2 && start2 <= end1;
}

/**
 * Format date to YYYY-MM-DD string.
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Get the start of the current week (Monday).
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Parse pagination params from URL search params.
 */
export function parsePagination(searchParams: URLSearchParams): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "25", 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Build pagination metadata for API responses.
 */
export function buildPaginationMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
