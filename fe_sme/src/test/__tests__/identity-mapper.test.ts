import { describe, expect, it } from "vitest";
import { mapUser, mapUserDetail, normalizeRoles } from "@/utils/mappers/identity";

describe("identity mappers", () => {
  it("normalizes roles and falls back to EMPLOYEE", () => {
    expect(normalizeRoles(["hr", "manager"])).toEqual(["HR", "MANAGER"]);
    expect(normalizeRoles(["unknown"])).toEqual(["EMPLOYEE"]);
  });

  it("maps user without createdAt fallback to today", () => {
    const mapped = mapUser({
      userId: "u-1",
      email: "a@b.com",
      fullName: "Alice",
      status: "ACTIVE",
      roles: ["EMPLOYEE"],
      departmentId: null,
      departmentName: null,
      phone: null,
    });
    expect(mapped.createdAt).toBe("");
    expect(mapped.status).toBe("Active");
  });

  it("maps createdAt from numeric timestamp", () => {
    const mapped = mapUser({
      userId: "u-2",
      email: "b@c.com",
      fullName: "Bob",
      status: "PENDING",
      roles: ["HR"],
      departmentId: "d-1",
      departmentName: "Human Resources",
      phone: "0909",
      createdAt: 1714521600000,
    });
    expect(mapped.createdAt).toContain("2024");
    expect(mapped.status).toBe("Invited");
  });

  it("maps user detail status and startDate safely", () => {
    const mapped = mapUserDetail({
      userId: "u-3",
      email: "c@d.com",
      fullName: "Carol",
      phone: null,
      status: "INACTIVE",
      employeeId: null,
      departmentId: null,
      employeeCode: null,
      employeeName: null,
      employeeEmail: null,
      employeePhone: null,
      jobTitle: null,
      managerUserId: null,
      startDate: "2026-04-20T00:00:00.000Z",
      workLocation: null,
      employeeStatus: null,
    });
    expect(mapped.status).toBe("INACTIVE");
    expect(mapped.startDate).toContain("2026-04-20");
  });
});
