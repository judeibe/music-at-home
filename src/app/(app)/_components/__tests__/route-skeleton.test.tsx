import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RouteSkeleton } from "../route-skeleton";

describe("RouteSkeleton", () => {
  it("renders the provided title", () => {
    render(<RouteSkeleton title="Music at Home" description="Core shell ready." />);
    expect(screen.getByRole("heading", { name: "Music at Home" })).toBeInTheDocument();
  });

  it("renders the provided description", () => {
    render(<RouteSkeleton title="Players" description="Playback controls for your devices." />);
    expect(screen.getByText("Playback controls for your devices.")).toBeInTheDocument();
  });

  it("renders Section A and Section B placeholders", () => {
    render(<RouteSkeleton title="Library" description="Browse your media." />);
    expect(screen.getByText(/section a/i)).toBeInTheDocument();
    expect(screen.getByText(/section b/i)).toBeInTheDocument();
  });

  it("renders the foundation placeholder notice", () => {
    render(<RouteSkeleton title="Search" description="Find music fast." />);
    expect(screen.getByText(/foundation-only placeholder/i)).toBeInTheDocument();
  });
});
