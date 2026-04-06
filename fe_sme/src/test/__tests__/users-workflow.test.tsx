/**
 * Users Workflow Tests
 *
 * Flow 4 – Invite (Create) User
 * Flow 5 – Update User / Change Role
 * Flow 6 – Disable / Enable User
 * Flow 7 – Bulk Import Users
 * Flow 8 – Filter Users by Role & Department
 *
 * Each suite uses MSW gateway handlers that route by operationType.
 */

import { screen, waitFor, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders } from "../utils";
import AdminUsers from "../../pages/users/index";
import { gwDepartments, gwUsers } from "../../mocks/handlers";

// ── Seed snapshots ────────────────────────────────────────────────────────────
const INITIAL_DEPARTMENTS = [
  {
    departmentId: "dept-hr",
    name: "Human Resources",
    type: "HR",
    managerUserId: "gw-user-kk",
  },
  {
    departmentId: "dept-eng",
    name: "Engineering",
    type: "IT",
    managerUserId: "gw-user-2",
  },
];

const INITIAL_USERS = [
  {
    userId: "gw-user-kk",
    email: "kk@gmail.com",
    fullName: "KK HR Manager",
    roles: ["HR"],
    departmentId: "dept-hr",
    departmentName: "Human Resources",
    status: "ACTIVE" as const,
    phone: null,
    managerUserId: null,
    jobTitle: "HR Manager",
    workLocation: "Hanoi",
    startDate: "2024-01-01",
    employeeId: "emp-kk",
    employeeCode: "KK001",
    employeeName: "KK HR Manager",
    employeeEmail: "kk@gmail.com",
    employeePhone: null,
    employeeStatus: "ACTIVE",
    createdAt: "2024-01-01",
  },
  {
    userId: "gw-user-2",
    email: "john.doe@company.com",
    fullName: "John Doe",
    roles: ["MANAGER"],
    departmentId: "dept-eng",
    departmentName: "Engineering",
    status: "ACTIVE" as const,
    phone: null,
    managerUserId: null,
    jobTitle: "Engineering Manager",
    workLocation: "HCM",
    startDate: "2024-02-01",
    employeeId: "emp-2",
    employeeCode: "ENG001",
    employeeName: "John Doe",
    employeeEmail: "john.doe@company.com",
    employeePhone: null,
    employeeStatus: "ACTIVE",
    createdAt: "2024-02-01",
  },
  {
    userId: "gw-user-3",
    email: "jane.smith@company.com",
    fullName: "Jane Smith",
    roles: ["EMPLOYEE"],
    departmentId: "dept-eng",
    departmentName: "Engineering",
    status: "ACTIVE" as const,
    phone: null,
    managerUserId: "gw-user-2",
    jobTitle: "Software Engineer",
    workLocation: "HCM",
    startDate: "2024-03-01",
    employeeId: "emp-3",
    employeeCode: "ENG002",
    employeeName: "Jane Smith",
    employeeEmail: "jane.smith@company.com",
    employeePhone: null,
    employeeStatus: "ACTIVE",
    createdAt: "2024-03-01",
  },
  {
    userId: "gw-user-4",
    email: "bob.lee@company.com",
    fullName: "Bob Lee",
    roles: ["IT"],
    departmentId: "dept-eng",
    departmentName: "Engineering",
    status: "INVITED" as const,
    phone: null,
    managerUserId: "gw-user-2",
    jobTitle: "IT Engineer",
    workLocation: "Hanoi",
    startDate: null,
    employeeId: "emp-4",
    employeeCode: "IT001",
    employeeName: "Bob Lee",
    employeeEmail: "bob.lee@company.com",
    employeePhone: null,
    employeeStatus: "INVITED",
    createdAt: "2024-04-01",
  },
];

function resetGatewayStores() {
  gwDepartments.splice(0, gwDepartments.length, ...INITIAL_DEPARTMENTS);
  gwUsers.splice(0, gwUsers.length, ...INITIAL_USERS);
}

// MSW server lifecycle is handled by src/test/setup.ts; only reset data here.
beforeEach(() => resetGatewayStores());

// ─────────────────────────────────────────────────────────────────────────────
// Flow 4: Invite User
// ─────────────────────────────────────────────────────────────────────────────
describe("Flow 4 – Invite User", () => {
  it("renders 'Invite User' button and existing users", async () => {
    renderWithProviders(<AdminUsers />);

    const inviteBtn = await screen.findByRole("button", {
      name: /invite user/i,
    });
    expect(inviteBtn).toBeInTheDocument();

    // Existing users should be displayed
    expect(await screen.findByText("KK HR Manager")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("opens invite drawer when 'Invite User' is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminUsers />);

    await screen.findByRole("button", { name: /invite user/i });
    await user.click(screen.getByRole("button", { name: /invite user/i }));

    // antd Drawer title is not a heading role — use the email input as proxy
    await screen.findByPlaceholderText("employee@company.com");
  });

  it("fills and submits the invite form", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminUsers />);

    await screen.findByRole("button", { name: /invite user/i });
    await user.click(screen.getByRole("button", { name: /invite user/i }));

    // Wait for drawer content via email input placeholder
    const emailInput = await screen.findByPlaceholderText(
      "employee@company.com",
    );
    await user.clear(emailInput);
    await user.type(emailInput, "alice.new@company.com");

    // Fill in the full name — actual placeholder is "Nguyen Van A"
    const nameInput = screen.getByPlaceholderText("Nguyen Van A");
    await user.clear(nameInput);
    await user.type(nameInput, "Alice New");

    // Submit via "Create User" button
    const createBtn = await screen.findByRole("button", {
      name: /^create user$/i,
    });
    await user.click(createBtn);

    // Drawer closes — email input disappears
    await waitFor(
      () =>
        expect(
          screen.queryByPlaceholderText("employee@company.com"),
        ).toBeNull(),
      { timeout: 5000 },
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Flow 5: Update User / Change Role
// ─────────────────────────────────────────────────────────────────────────────
describe("Flow 5 – Update User / Change Role", () => {
  it("opens user detail drawer when clicking a user name", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminUsers />);

    // Wait for user list to load
    const johnBtn = await screen.findByRole("button", { name: /john doe/i });
    await user.click(johnBtn);

    // User detail drawer renders the user's email as text inside the content
    await screen.findByTestId("user-detail-content");
  });

  it("shows user details in the drawer", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminUsers />);

    const johnBtn = await screen.findByRole("button", { name: /john doe/i });
    await user.click(johnBtn);

    // Drawer content: email visible (also appears in table row, so use findAll)
    const emailEls = await screen.findAllByText("john.doe@company.com");
    expect(emailEls.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Flow 6: Disable / Enable User
// ─────────────────────────────────────────────────────────────────────────────
describe("Flow 6 – Disable / Enable User", () => {
  it("shows Disable button for active users", async () => {
    renderWithProviders(<AdminUsers />);

    // Wait for users to load
    await screen.findByText("KK HR Manager");

    // Disable buttons should be present for active users
    const disableBtns = await screen.findAllByRole("button", {
      name: /disable/i,
    });
    expect(disableBtns.length).toBeGreaterThan(0);
  });

  it("disables a user when Disable button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminUsers />);

    await screen.findByText("Jane Smith");

    // Find and click the disable button for Jane Smith
    // The button is in the same table row
    const rows = screen.getAllByRole("row");
    const janeRow = rows.find((row) => within(row).queryByText("Jane Smith"));
    expect(janeRow).toBeTruthy();

    const disableBtn = within(janeRow!).getByRole("button", {
      name: /disable/i,
    });
    await user.click(disableBtn);

    // After disabling, the in-memory store for Jane should be DISABLED
    await waitFor(() => {
      const jane = gwUsers.find((u) => u.userId === "gw-user-3");
      expect(jane?.status).toBe("DISABLED");
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Flow 7: Bulk Import Users
// ─────────────────────────────────────────────────────────────────────────────
describe("Flow 7 – Bulk Import Users", () => {
  it("renders the Import CSV button", async () => {
    renderWithProviders(<AdminUsers />);

    // The toolbar has an import button
    const importBtn = await screen.findByRole("button", { name: /import/i });
    expect(importBtn).toBeInTheDocument();
  });

  it("opens bulk import modal when Import CSV is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminUsers />);

    const importBtn = await screen.findByRole("button", { name: /import/i });
    await user.click(importBtn);

    // The bulk import modal should appear — look for modal title or upload area
    await waitFor(() => {
      // The modal could show various text; check for any import-related heading
      const modal = document.querySelector(".ant-modal");
      expect(modal).toBeTruthy();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Flow 8: Filter Users by Role & Department
// ─────────────────────────────────────────────────────────────────────────────
describe("Flow 8 – Filter Users", () => {
  it("shows all users by default with role filter chips", async () => {
    renderWithProviders(<AdminUsers />);

    // All users should be visible
    expect(await screen.findByText("KK HR Manager")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();

    // Role filter chips should be present
    expect(screen.getByRole("button", { name: /^all$/i })).toBeInTheDocument();
  });

  it("filters users by clicking the HR role chip", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminUsers />);

    await screen.findByText("KK HR Manager");

    // Click the HR role filter
    const hrChip = screen.getByRole("button", { name: /^hr$/i });
    await user.click(hrChip);

    // Only HR users (KK HR Manager) should be visible; John Doe should disappear
    await waitFor(() => {
      expect(screen.getByText("KK HR Manager")).toBeInTheDocument();
      expect(screen.queryByText("John Doe")).toBeNull();
    });
  });

  it("filters users back to all when clicking 'All'", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminUsers />);

    await screen.findByText("KK HR Manager");

    // First filter by HR
    await user.click(screen.getByRole("button", { name: /^hr$/i }));
    await waitFor(() => expect(screen.queryByText("John Doe")).toBeNull());

    // Then click All to reset
    await user.click(screen.getByRole("button", { name: /^all$/i }));
    await waitFor(() =>
      expect(screen.getByText("John Doe")).toBeInTheDocument(),
    );
  });

  it("filters users by department dropdown", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminUsers />);

    await screen.findByText("KK HR Manager");

    // Open the department Select
    const deptSelect =
      screen.queryByTitle(/all departments/i) ??
      screen.getAllByRole("combobox")[0];
    await user.click(deptSelect);

    // Wait for dropdown to open
    await screen.findByRole("option", { name: "Human Resources" });

    // rc-select pre-highlights the first option (index 0 = "Human Resources") when
    // the dropdown opens. Just pressing Enter selects that highlighted option.
    fireEvent.keyDown(deptSelect, {
      key: "Enter",
      code: "Enter",
      keyCode: 13,
      which: 13,
    });

    // After filtering by HR dept, only KK HR Manager visible
    await waitFor(() => {
      expect(screen.getByText("KK HR Manager")).toBeInTheDocument();
      expect(screen.queryByText("John Doe")).toBeNull();
    });
  });

  it("searches users by name", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminUsers />);

    await screen.findByText("KK HR Manager");

    // Find the search input
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.clear(searchInput);
    await user.type(searchInput, "Jane");

    // Trigger search (Enter or change event)
    await user.keyboard("{Enter}");

    // Only Jane Smith should be visible
    await waitFor(() => {
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.queryByText("KK HR Manager")).toBeNull();
    });
  });
});
