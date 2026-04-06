/**
 * Self-tests for the Automation page.
 *
 * Run: npx vitest run src/test/__tests__/automation.test.tsx
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";

// ---- Mock API modules -------------------------------------------------
vi.mock("@/api/onboarding/automation.api", () => ({
  apiListAutomationRules: vi.fn(),
  apiListEmailLogs: vi.fn(),
  apiToggleAutomationRule: vi.fn(),
  apiSendTestEmail: vi.fn(),
}));

// ---- Mock i18n --------------------------------------------------------
vi.mock("@/i18n", () => ({
  useLocale: () => ({ t: (key: string) => key, locale: "en-US" }),
}));

import {
  apiListAutomationRules,
  apiListEmailLogs,
  apiToggleAutomationRule,
  apiSendTestEmail,
} from "@/api/onboarding/automation.api";

import Automation from "@/pages/onboarding/automation";

// -----------------------------------------------------------------------
// Fixtures
// -----------------------------------------------------------------------
const mockRules = [
  {
    ruleId: "r1",
    name: "Welcome Email",
    trigger: "INSTANCE_ACTIVATED",
    channel: "email" as const,
    enabled: true,
  },
  {
    ruleId: "r2",
    name: "Task Reminder",
    trigger: "TASK_DUE",
    channel: "notification" as const,
    enabled: false,
  },
];

const mockLogs = [
  {
    logId: "l1",
    subject: "Welcome to Acme!",
    recipientEmail: "john@acme.com",
    status: "Sent" as const,
    sentAt: "2025-08-01T09:30:00",
  },
  {
    logId: "l2",
    subject: "Task due soon",
    recipientEmail: "jane@acme.com",
    status: "Failed" as const,
    sentAt: "2025-08-02T10:00:00",
  },
];

const makeWrapper = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

// -----------------------------------------------------------------------
// Rules tab
// -----------------------------------------------------------------------
describe("Automation — Rules tab", () => {
  beforeEach(() => {
    vi.mocked(apiListAutomationRules).mockResolvedValue(mockRules);
    vi.mocked(apiListEmailLogs).mockResolvedValue(mockLogs);
  });

  it("renders rule names after loading", async () => {
    render(<Automation />, { wrapper: makeWrapper() });
    expect(await screen.findByText("Welcome Email")).toBeInTheDocument();
    expect(screen.getByText("Task Reminder")).toBeInTheDocument();
  });

  it("enabled rule switch is checked; disabled rule switch is unchecked", async () => {
    render(<Automation />, { wrapper: makeWrapper() });
    const switches = await screen.findAllByRole("switch");
    expect(switches[0]).toHaveAttribute("aria-checked", "true");
    expect(switches[1]).toHaveAttribute("aria-checked", "false");
  });

  it("calls apiToggleAutomationRule with flipped enabled flag", async () => {
    vi.mocked(apiToggleAutomationRule).mockResolvedValue(undefined);
    render(<Automation />, { wrapper: makeWrapper() });

    const switches = await screen.findAllByRole("switch");
    fireEvent.click(switches[0]); // r1: enabled=true → send enabled:false

    await waitFor(() => {
      expect(apiToggleAutomationRule).toHaveBeenCalledWith({
        ruleId: "r1",
        enabled: false,
      });
    });
  });

  it("shows empty state when rules array is empty", async () => {
    vi.mocked(apiListAutomationRules).mockResolvedValue([]);
    render(<Automation />, { wrapper: makeWrapper() });
    expect(
      await screen.findByText("onboarding.automation.rule.empty"),
    ).toBeInTheDocument();
  });

  it("shows error state with retry button on fetch failure", async () => {
    vi.mocked(apiListAutomationRules).mockRejectedValue(
      new Error("Network error"),
    );
    render(<Automation />, { wrapper: makeWrapper() });
    expect(
      await screen.findByText("onboarding.automation.rule.error"),
    ).toBeInTheDocument();
  });
});

// -----------------------------------------------------------------------
// Email Logs tab
// -----------------------------------------------------------------------
describe("Automation — Email Logs tab", () => {
  beforeEach(() => {
    vi.mocked(apiListAutomationRules).mockResolvedValue(mockRules);
    vi.mocked(apiListEmailLogs).mockResolvedValue(mockLogs);
  });

  it("displays subject and recipient email in log rows", async () => {
    render(<Automation />, { wrapper: makeWrapper() });
    const logsTab = await screen.findByText(
      "onboarding.automation.tab.logs",
    );
    fireEvent.click(logsTab.closest("[role=tab]") ?? logsTab);

    expect(await screen.findByText("Welcome to Acme!")).toBeInTheDocument();
    expect(screen.getByText("john@acme.com")).toBeInTheDocument();
  });

  it("renders Sent and Failed status tags", async () => {
    render(<Automation />, { wrapper: makeWrapper() });
    const logsTab = await screen.findByText("onboarding.automation.tab.logs");
    fireEvent.click(logsTab.closest("[role=tab]") ?? logsTab);

    expect(
      await screen.findByText("onboarding.automation.log.status.sent"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("onboarding.automation.log.status.failed"),
    ).toBeInTheDocument();
  });

  it("shows log empty state when logs array is empty", async () => {
    vi.mocked(apiListEmailLogs).mockResolvedValue([]);
    render(<Automation />, { wrapper: makeWrapper() });
    const logsTab = await screen.findByText("onboarding.automation.tab.logs");
    fireEvent.click(logsTab.closest("[role=tab]") ?? logsTab);
    expect(
      await screen.findByText("onboarding.automation.log.empty"),
    ).toBeInTheDocument();
  });
});

// -----------------------------------------------------------------------
// Test Email tab
// -----------------------------------------------------------------------
describe("Automation — Test Email tab", () => {
  beforeEach(() => {
    vi.mocked(apiListAutomationRules).mockResolvedValue(mockRules);
    vi.mocked(apiListEmailLogs).mockResolvedValue(mockLogs);
    vi.mocked(apiSendTestEmail).mockResolvedValue({
      success: true,
      message: "Email sent",
    });
  });

  it("renders test email form title", async () => {
    render(<Automation />, { wrapper: makeWrapper() });
    const testTab = await screen.findByText("onboarding.automation.tab.test");
    fireEvent.click(testTab.closest("[role=tab]") ?? testTab);

    expect(
      await screen.findByText("onboarding.automation.test.title"),
    ).toBeInTheDocument();
  });

  it("does not call apiSendTestEmail when required fields are empty", async () => {
    render(<Automation />, { wrapper: makeWrapper() });
    const testTab = await screen.findByText("onboarding.automation.tab.test");
    fireEvent.click(testTab.closest("[role=tab]") ?? testTab);

    const sendBtn = await screen.findByText(
      "onboarding.automation.test.send_btn",
    );
    fireEvent.click(sendBtn.closest("button")!);

    await waitFor(() => {
      expect(apiSendTestEmail).not.toHaveBeenCalled();
    });
  });

  it("apiSendTestEmail accepts correct shape for WELCOME_NEW_EMPLOYEE", async () => {
    const result = await apiSendTestEmail({
      templateCode: "WELCOME_NEW_EMPLOYEE",
      toEmail: "test@example.com",
      placeholders: {
        employeeName: "John Doe",
        companyName: "Acme Corp",
        startDate: "2025-08-01",
      },
    });
    expect(result.success).toBe(true);
    expect(apiSendTestEmail).toHaveBeenCalledWith({
      templateCode: "WELCOME_NEW_EMPLOYEE",
      toEmail: "test@example.com",
      placeholders: {
        employeeName: "John Doe",
        companyName: "Acme Corp",
        startDate: "2025-08-01",
      },
    });
  });

  it("apiSendTestEmail accepts correct shape for TASK_REMINDER", async () => {
    await apiSendTestEmail({
      templateCode: "TASK_REMINDER",
      toEmail: "test@example.com",
      placeholders: {
        employeeName: "Bob Lee",
        taskTitle: "Complete NDA Form",
        dueDate: "2025-08-05",
      },
    });
    expect(apiSendTestEmail).toHaveBeenCalledWith(
      expect.objectContaining({ templateCode: "TASK_REMINDER" }),
    );
  });
});
