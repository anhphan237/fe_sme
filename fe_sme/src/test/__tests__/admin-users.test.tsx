import { screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import AdminUsers from "../../pages/users/index";
import { renderWithProviders } from "../utils";
import { server } from "../server";

beforeEach(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => {
  server.resetHandlers();
  server.close();
});

describe("Admin users page", () => {
  it("shows user table with Invite User button", async () => {
    renderWithProviders(<AdminUsers />);

    expect(
      await screen.findByRole("button", { name: /invite user/i }),
    ).toBeInTheDocument();
  });

  it("renders users from gateway mock", async () => {
    renderWithProviders(<AdminUsers />);

    expect(await screen.findByText("KK HR Manager")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });
});
