import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TasksPage } from "./TasksPage.tsx";

function addTask(title: string) {
  fireEvent.change(screen.getByLabelText("New task"), { target: { value: title } });
  fireEvent.click(screen.getByRole("button", { name: "Add" }));
}

describe("TasksPage", () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it("adds a task and updates the summary", () => {
    render(<TasksPage />);
    addTask("Write the plan");

    expect(screen.getByText("Write the plan")).toBeDefined();
    expect(screen.getByText("1 open · 0 done")).toBeDefined();
  });

  it("shows an error for an empty title", () => {
    render(<TasksPage />);
    addTask("   ");

    expect(screen.getByRole("alert").textContent).toContain("needs a title");
  });

  it("keeps tasks after a reload", () => {
    const first = render(<TasksPage />);
    addTask("Survive a reload");
    first.unmount();

    render(<TasksPage />);
    expect(screen.getByText("Survive a reload")).toBeDefined();
  });
});
