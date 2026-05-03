import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import AdminUsers from "../../pages/users/index";
import { gwDepartments, gwUsers } from "../../mocks/handlers";
import { renderWithProviders } from "../utils";

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

const resetGatewayStores = () => {
  gwDepartments.splice(0, gwDepartments.length, ...INITIAL_DEPARTMENTS);
  gwUsers.splice(0, gwUsers.length, ...INITIAL_USERS);
};

const openInviteDrawer = async () => {
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: /invite user/i }));
  return { user, drawer: await screen.findByRole("dialog") };
};

beforeEach(() => resetGatewayStores());

describe("Users workflow", () => {
  it("opens invite drawer and toggles invite/direct mode", async () => {
    renderWithProviders(<AdminUsers />);
    const { user, drawer } = await openInviteDrawer();

    expect(within(drawer).getByPlaceholderText("employee@company.com")).toBeInTheDocument();

    await user.click(within(drawer).getByText(/set password/i));
    expect(within(drawer).getByPlaceholderText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it("submits invite form with required payload fields", async () => {
    renderWithProviders(<AdminUsers />);
    const { user, drawer } = await openInviteDrawer();

    await user.type(within(drawer).getByPlaceholderText("employee@company.com"), "alice.new@company.com");
    await user.type(within(drawer).getByPlaceholderText("Nguyen Van A"), "Alice New");

    const deptLabel = within(drawer).getByText(/department/i);
    const deptItem = deptLabel.closest(".ant-form-item");
    expect(deptItem).toBeTruthy();
    const deptCombo = within(deptItem as HTMLElement).getByRole("combobox");
    await user.click(deptCombo);
    await user.click(await screen.findByRole("option", { name: "Human Resources" }));

    await user.click(within(drawer).getByRole("button", { name: /send invite/i }));

    await waitFor(() => {
      expect(screen.queryByPlaceholderText("employee@company.com")).not.toBeInTheDocument();
    });
    expect(gwUsers.some((item) => item.email === "alice.new@company.com")).toBe(true);
  });

  it("opens user detail drawer from user name", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminUsers />);

    await user.click(await screen.findByRole("button", { name: /john doe/i }));
    expect(await screen.findByTestId("user-detail-content")).toBeInTheDocument();
  });

  it("disables then enables a user from list actions", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminUsers />);
    await screen.findByText("Jane Smith");

    const janeRow = screen
      .getAllByRole("row")
      .find((row) => within(row).queryByText("Jane Smith"));
    expect(janeRow).toBeTruthy();

    await user.click(within(janeRow as HTMLElement).getByRole("button", { name: /disable/i }));
    await waitFor(() => {
      expect(gwUsers.find((item) => item.userId === "gw-user-3")?.status).toBe("DISABLED");
    });

    const updatedRow = screen
      .getAllByRole("row")
      .find((row) => within(row).queryByText("Jane Smith"));
    expect(updatedRow).toBeTruthy();
    await user.click(within(updatedRow as HTMLElement).getByRole("button", { name: /enable/i }));

    await waitFor(() => {
      expect(gwUsers.find((item) => item.userId === "gw-user-3")?.status).toBe("ACTIVE");
    });
  });

  it("opens import excel modal", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminUsers />);

    await user.click(await screen.findByRole("button", { name: /import excel/i }));
    expect(await screen.findByText(/template rules/i)).toBeInTheDocument();
  });

  it("filters by role and search", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminUsers />);
    await screen.findByText("KK HR Manager");

    const roleSelect =
      screen.queryByTitle(/all roles/i) ?? screen.getAllByRole("combobox")[1];
    await user.click(roleSelect);
    await user.click(await screen.findByRole("option", { name: /^HR$/i }));

    await waitFor(() => {
      expect(screen.getByText("KK HR Manager")).toBeInTheDocument();
      expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search by name, email or department/i);
    await user.clear(searchInput);
    await user.type(searchInput, "Jane");
    fireEvent.keyDown(searchInput, { key: "Enter", code: "Enter", keyCode: 13 });

    await waitFor(() => {
      expect(screen.queryByText("KK HR Manager")).not.toBeInTheDocument();
      expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
    });
  });
});
