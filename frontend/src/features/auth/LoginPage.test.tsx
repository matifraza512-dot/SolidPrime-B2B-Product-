import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/utils";
import { LoginPage } from "./LoginPage";
import * as authApi from "./api";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("LoginPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows validation errors when submitted empty", async () => {
    renderWithProviders(<LoginPage />);
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(await screen.findByText("Password is required")).toBeInTheDocument();
  });

  it("calls the login API and stores the session on valid submit", async () => {
    const loginSpy = vi.spyOn(authApi, "login").mockResolvedValue({
      access: "fake-access",
      refresh: "fake-refresh",
      user: {
        public_id: "1", email: "a@b.com", full_name: "Ada Lovelace", first_name: "Ada",
        last_name: "Lovelace", role: "admin", avatar: null, phone: "", job_title: "",
        organization: { public_id: "org1", name: "Acme", slug: "acme", created_at: "" },
        is_active_member: true, date_joined: "",
      },
    });

    renderWithProviders(<LoginPage />);
    await userEvent.type(screen.getByLabelText("Work email"), "a@b.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => expect(loginSpy).toHaveBeenCalled());
    expect(loginSpy.mock.calls[0][0]).toEqual({ email: "a@b.com", password: "password123" });
  });
});
