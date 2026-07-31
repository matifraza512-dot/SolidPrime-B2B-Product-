import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button", () => {
  it("renders children and responds to clicks", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save changes</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("disables the button and shows a spinner while loading", () => {
    render(<Button isLoading>Save</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("does not fire onClick when disabled", async () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Save</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });
});
