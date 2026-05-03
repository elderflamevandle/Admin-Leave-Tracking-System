import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateWorkingDays(startDate: Date, endDate: Date, holidayDates: Date[] = []): number {
  const holidaySet = new Set(
    holidayDates.map((d) => new Date(d).toISOString().split("T")[0])
  );
  let count = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    const day = current.getDay();
    const iso = current.toISOString().split("T")[0];
    if (day !== 0 && day !== 6 && !holidaySet.has(iso)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

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

export function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

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

export function buildPaginationMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
