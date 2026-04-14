import { describe, it, expect } from "vitest";
import { validatePasswordStrength, hashToken, getRefreshTokenExpiry } from "../auth";

describe("validatePasswordStrength", () => {
  it("accepts a strong password", () => {
    expect(validatePasswordStrength("MyPass123!")).toBeNull();
  });

  it("rejects short password", () => {
    expect(validatePasswordStrength("Ab1!")).not.toBeNull();
  });

  it("rejects password without uppercase", () => {
    expect(validatePasswordStrength("mypass123!")).not.toBeNull();
  });

  it("rejects password without number", () => {
    expect(validatePasswordStrength("MyPassword!")).not.toBeNull();
  });

  it("rejects password without special character", () => {
    expect(validatePasswordStrength("MyPassword1")).not.toBeNull();
  });
});

describe("hashToken", () => {
  it("returns a string", () => {
    expect(typeof hashToken("some-token-value")).toBe("string");
  });

  it("is deterministic — same input produces same hash", () => {
    const token = "test-refresh-token-abc123";
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it("different inputs produce different hashes", () => {
    expect(hashToken("token-a")).not.toBe(hashToken("token-b"));
  });
});

describe("getRefreshTokenExpiry", () => {
  it("returns 30-day expiry when rememberMe is true", () => {
    const expiry = getRefreshTokenExpiry(true);
    const now = Date.now();
    const diff = expiry.getTime() - now;
    // Should be ~30 days (allow 1 minute tolerance)
    expect(diff).toBeGreaterThan(29 * 24 * 60 * 60 * 1000);
    expect(diff).toBeLessThan(31 * 24 * 60 * 60 * 1000);
  });

  it("returns 7-day expiry when rememberMe is false", () => {
    const expiry = getRefreshTokenExpiry(false);
    const now = Date.now();
    const diff = expiry.getTime() - now;
    expect(diff).toBeGreaterThan(6 * 24 * 60 * 60 * 1000);
    expect(diff).toBeLessThan(8 * 24 * 60 * 60 * 1000);
  });
});
