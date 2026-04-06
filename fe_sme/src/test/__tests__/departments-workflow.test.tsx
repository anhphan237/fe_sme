/**
 * Departments Workflow Tests
 *
 * Flow 1 – Create Department
 * Flow 2 – Edit Department
 * Flow 3 – View Department Members
 *
 * MSW is started/stopped globally by src/test/setup.ts.
 * We only need to reset the in-memory gateway data between tests.
 */

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders } from "../utils";
import Departments from "../../pages/departments/index";
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
// Flow 1: Create Department
// ─────────────────────────────────────────────────────────────────────────────
describe("Flow 1 – Create Department", () => {
  it("opens the create drawer when 'New Department' button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Departments />);

    // Wait for page to load then click "New Department"
    await user.click(
      await screen.findByRole("button", { name: /new department/i }),
    );

    // The Ant Design Drawer renders its content; verify the name input appears
    await screen.findByPlaceholderText("e.g. Engineering");
  });

  it("successfully creates a department and closes the drawer", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Departments />);

    await user.click(
      await screen.findByRole("button", { name: /new department/i }),
    );

    // Fill in department name
    const nameInput = await screen.findByPlaceholderText("e.g. Engineering");
    await user.clear(nameInput);
    await user.type(nameInput, "Finance");

    // Select a manager (required) — find the manager combobox (last combobox in the form)
    const combos = screen.getAllByRole("combobox");
    const managerCombo = combos[combos.length - 1];
    await user.click(managerCombo);
    // Wait for the dropdown option and click it
    const kkOption = await screen.findByTitle("KK HR Manager");
    await user.click(kkOption);

    // Submit
    await user.click(screen.getByRole("button", { name: /^create$/i }));

    // Drawer closes after success — the name input disappears
    await waitFor(
      () =>
        expect(screen.queryByPlaceholderText("e.g. Engineering")).toBeNull(),
      { timeout: 5000 },
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Flow 2: Edit Department
// ─────────────────────────────────────────────────────────────────────────────
describe("Flow 2 – Edit Department", () => {
  it("renders the list of departments from gateway mock", async () => {
    renderWithProviders(<Departments />);

    expect(await screen.findByText("Human Resources")).toBeInTheDocument();
    expect(screen.getByText("Engineering")).toBeInTheDocument();
  });

  it("opens edit drawer when the Edit button is clicked on a department row", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Departments />);

    // Select the HR department by clicking its card in the left panel
    const hrCard = await screen.findByRole("button", {
      name: /human resources/i,
    });
    await user.click(hrCard);

    // The right panel now shows an Edit button
    const editBtn = await screen.findByRole("button", { name: /^edit$/i });
    await user.click(editBtn);

    // Edit drawer opens — form input for department name appears
    await screen.findByPlaceholderText("e.g. Engineering");
  });

  it("saves updated department name and closes drawer", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Departments />);

    // Select HR department, open edit drawer
    await user.click(
      await screen.findByRole("button", { name: /human resources/i }),
    );
    await user.click(await screen.findByRole("button", { name: /^edit$/i }));

    const nameInput = await screen.findByPlaceholderText("e.g. Engineering");
    await user.clear(nameInput);
    await user.type(nameInput, "People & Culture");

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(
      () =>
        expect(screen.queryByPlaceholderText("e.g. Engineering")).toBeNull(),
      { timeout: 5000 },
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Flow 3: View Department Members
// ─────────────────────────────────────────────────────────────────────────────
describe("Flow 3 – View Department Members", () => {
  it("shows members in the right panel when an Engineering card is selected", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Departments />);

    // Click the Engineering card (it's a <button> in the left panel)
    const engCard = await screen.findByRole("button", { name: /engineering/i });
    await user.click(engCard);

    // The right panel renders an h2 with the selected department name
    await screen.findByRole("heading", { level: 2, name: "Engineering" });
    // John Doe is Engineering manager and also a member — getAllByText handles duplicates
    expect(screen.getAllByText("John Doe").length).toBeGreaterThan(0);
  });

  it("shows all Engineering members including invited ones", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Departments />);

    const engCard = await screen.findByRole("button", { name: /engineering/i });
    await user.click(engCard);

    // Wait for the right panel heading to confirm it rendered
    await screen.findByRole("heading", { level: 2, name: "Engineering" });
    // John Doe is both manager and member — use getAllByText
    expect(screen.getAllByText("John Doe").length).toBeGreaterThan(0);
    // Jane Smith and Bob Lee only appear in the members list
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Lee")).toBeInTheDocument();
  });
});
