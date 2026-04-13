import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import DesignSystemPage from "../design-system/page";

describe("DesignSystemPage route", () => {
  it("renders the issue #28 system inventory sections", async () => {
    render(await DesignSystemPage());

    expect(
      screen.getByRole("heading", { name: "Apple Music-inspired UI system" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Token spec" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Component inventory" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Route blueprints" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Accessibility validation checklist" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Media card")).toBeInTheDocument();
  });
});
