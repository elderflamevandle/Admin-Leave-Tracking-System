import { describe, it, expect } from "vitest";
import {
  calculateWorkingDays,
  calculateHoursWorked,
  dateRangesOverlap,
  parsePagination,
  buildPaginationMeta,
  formatDateISO,
} from "../utils";

describe("calculateWorkingDays", () => {
  it("counts 5 weekdays Mon-Fri", () => {
    // Apr 14 (Mon) to Apr 18 (Fri) = 5 working days
    expect(calculateWorkingDays(new Date("2026-04-14"), new Date("2026-04-18"))).toBe(5);
  });

  it("skips weekend across two weeks", () => {
    // Apr 14 (Mon) to Apr 21 (Mon) = 6 working days (14,15,16,17,18,21)
    expect(calculateWorkingDays(new Date("2026-04-14"), new Date("2026-04-21"))).toBe(6);
  });

  it("returns 1 for single weekday", () => {
    // Apr 14 is Monday
    expect(calculateWorkingDays(new Date("2026-04-14"), new Date("2026-04-14"))).toBe(1);
  });

  it("returns 0 for a single Saturday", () => {
    // Apr 19 is Saturday
    expect(calculateWorkingDays(new Date("2026-04-19"), new Date("2026-04-19"))).toBe(0);
  });
});

describe("calculateHoursWorked", () => {
  it("calculates standard 8 hour day", () => {
    expect(calculateHoursWorked("09:00", "17:00", 0)).toBe(8);
  });

  it("subtracts 30 min break", () => {
    expect(calculateHoursWorked("09:00", "17:30", 30)).toBe(8);
  });

  it("returns 0 for reversed times", () => {
    expect(calculateHoursWorked("17:00", "09:00", 0)).toBe(0);
  });

  it("handles partial hours correctly", () => {
    expect(calculateHoursWorked("09:00", "09:30", 0)).toBe(0.5);
  });
});

describe("dateRangesOverlap", () => {
  it("detects overlap", () => {
    expect(dateRangesOverlap(
      new Date("2026-04-14"), new Date("2026-04-18"),
      new Date("2026-04-16"), new Date("2026-04-21")
    )).toBe(true);
  });

  it("detects no overlap", () => {
    expect(dateRangesOverlap(
      new Date("2026-04-14"), new Date("2026-04-15"),
      new Date("2026-04-16"), new Date("2026-04-18")
    )).toBe(false);
  });

  it("adjacent dates do not overlap", () => {
    expect(dateRangesOverlap(
      new Date("2026-04-13"), new Date("2026-04-14"),
      new Date("2026-04-15"), new Date("2026-04-17")
    )).toBe(false);
  });
});

describe("parsePagination", () => {
  it("returns defaults for empty params", () => {
    const params = new URLSearchParams();
    expect(parsePagination(params)).toEqual({ page: 1, limit: 25, skip: 0 });
  });

  it("clamps limit to 100", () => {
    const params = new URLSearchParams({ page: "1", limit: "200" });
    expect(parsePagination(params).limit).toBe(100);
  });

  it("calculates skip correctly", () => {
    const params = new URLSearchParams({ page: "3", limit: "10" });
    expect(parsePagination(params).skip).toBe(20);
  });
});

describe("buildPaginationMeta", () => {
  it("calculates total pages", () => {
    expect(buildPaginationMeta(100, 1, 25)).toEqual({ total: 100, page: 1, limit: 25, totalPages: 4 });
  });

  it("rounds up for partial last page", () => {
    expect(buildPaginationMeta(101, 1, 25).totalPages).toBe(5);
  });
});

describe("formatDateISO", () => {
  it("formats date as YYYY-MM-DD", () => {
    expect(formatDateISO(new Date("2026-04-14T10:00:00Z"))).toBe("2026-04-14");
  });
});
