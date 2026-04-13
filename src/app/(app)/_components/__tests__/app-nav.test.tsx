import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { appNavItems } from "../../_lib/navigation";
import { AppNav } from "../app-nav";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

const { usePathname } = await import("next/navigation");

describe("AppNav", () => {
  it("renders a link for every nav item", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<AppNav />);

    for (const item of appNavItems) {
      // Each item appears in both desktop and mobile navs, so use getAllByRole
      const links = screen.getAllByRole("link", { name: new RegExp(item.label, "i") });
      expect(links.length).toBeGreaterThan(0);
    }
  });

  it("marks the active route with aria-current='page'", () => {
    vi.mocked(usePathname).mockReturnValue("/players");
    render(<AppNav />);

    const activeLinks = screen.getAllByRole("link", { current: "page" });
    expect(activeLinks.length).toBeGreaterThan(0);
    for (const link of activeLinks) {
      expect(link).toHaveAttribute("href", "/players");
    }
  });

  it("does not mark non-active routes with aria-current", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<AppNav />);

    // The home link should be current, the library link should not
    const libraryLinks = screen.getAllByRole("link", { name: /library/i });
    for (const link of libraryLinks) {
      expect(link).not.toHaveAttribute("aria-current", "page");
    }
  });

  it("renders both desktop and mobile navs", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<AppNav />);

    expect(screen.getByRole("navigation", { name: /desktop/i })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /mobile/i })).toBeInTheDocument();
  });

  it("can render only the mobile nav when desktop is disabled", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<AppNav includeDesktop={false} />);

    expect(screen.queryByRole("navigation", { name: /desktop/i })).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /mobile/i })).toBeInTheDocument();
  });
});
