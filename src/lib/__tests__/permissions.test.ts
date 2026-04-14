import { describe, it, expect } from "vitest";
import { hasPermission, getPermissionsForRole, isAdmin, getAllPermissionKeys } from "../permissions";

describe("hasPermission", () => {
  it("admin has all permissions", () => {
    expect(hasPermission("admin", "roles.manage")).toBe(true);
    expect(hasPermission("admin", "leave.approve_all")).toBe(true);
    expect(hasPermission("admin", "pipeline.view")).toBe(true);
  });

  it("analyst has VC permissions but not admin permissions", () => {
    expect(hasPermission("analyst", "pipeline.view")).toBe(true);
    expect(hasPermission("analyst", "roles.manage")).toBe(false);
    expect(hasPermission("analyst", "leave.approve_all")).toBe(false);
  });

  it("operations has ops permissions but not VC permissions", () => {
    expect(hasPermission("operations", "legal.view")).toBe(true);
    expect(hasPermission("operations", "pipeline.view")).toBe(false);
    expect(hasPermission("operations", "roles.manage")).toBe(false);
  });

  it("operations can view own leave", () => {
    expect(hasPermission("operations", "leave.view_own")).toBe(true);
    expect(hasPermission("operations", "leave.approve_all")).toBe(false);
  });
});

describe("isAdmin", () => {
  it("returns true only for admin", () => {
    expect(isAdmin("admin")).toBe(true);
    expect(isAdmin("analyst")).toBe(false);
    expect(isAdmin("operations")).toBe(false);
  });
});

describe("getPermissionsForRole", () => {
  it("returns non-empty array for all roles", () => {
    expect(getPermissionsForRole("admin").length).toBeGreaterThan(0);
    expect(getPermissionsForRole("analyst").length).toBeGreaterThan(0);
    expect(getPermissionsForRole("operations").length).toBeGreaterThan(0);
  });
});

describe("getAllPermissionKeys", () => {
  it("returns a non-empty array (admin permissions)", () => {
    expect(getAllPermissionKeys().length).toBeGreaterThan(0);
  });
});
