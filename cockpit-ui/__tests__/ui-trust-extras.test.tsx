import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import React from "react";
import GovernanceHeaderStrip, { RateLimitMeterPie } from "@/components/trust/ui-trust-extras";

// Mock framer-motion to avoid animation complexities in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, animate, ...props }: any) => <div {...props}>{children}</div>,
    circle: ({ children, animate, initial, transition, ...props }: any) => <circle {...props}>{children}</circle>,
  },
  useReducedMotion: () => false,
}));

// ─────────────────────────────────────────────────────────────────────────────
// GovernanceHeaderStrip Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("GovernanceHeaderStrip", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders fallback data when API fails", async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error("API Error"));

    render(<GovernanceHeaderStrip />);

    await waitFor(() => {
      expect(screen.getByText("G13")).toBeInTheDocument();
    });

    // Check all expected badges are rendered
    expect(screen.getByText("G14")).toBeInTheDocument();
    expect(screen.getByText("G15")).toBeInTheDocument();
    expect(screen.getByText("G16")).toBeInTheDocument();
    expect(screen.getByText("G18")).toBeInTheDocument();
  });

  it("renders API data when fetch succeeds", async () => {
    const mockResponse = {
      gates: {
        G13: { name: "Custom Blueprint", status: "pass", score: 100 },
        G14: { name: "Custom Capability", status: "fail", score: 45 },
        G15: { name: "Custom Rollout", status: "partial", score: 70 },
        G16: { name: "Custom ROI", status: "pass", score: 95 },
        G18: { name: "Custom Observability", status: "pass", score: 90 },
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<GovernanceHeaderStrip />);

    await waitFor(() => {
      expect(screen.getByText("G13")).toBeInTheDocument();
    });

    // Verify all gates are rendered
    ["G13", "G14", "G15", "G16", "G18"].forEach((gate) => {
      expect(screen.getByText(gate)).toBeInTheDocument();
    });
  });

  it("applies correct color classes based on status", async () => {
    const mockResponse = {
      gates: {
        G13: { name: "Test", status: "pass" },
        G14: { name: "Test", status: "partial" },
        G15: { name: "Test", status: "fail" },
        G16: { name: "Test", status: "pass" },
        G18: { name: "Test", status: "pass" },
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<GovernanceHeaderStrip />);

    await waitFor(() => {
      const g13Badge = screen.getByText("G13");
      const g14Badge = screen.getByText("G14");
      const g15Badge = screen.getByText("G15");

      // Check color classes
      expect(g13Badge.closest("button")).toHaveClass("bg-green-100");
      expect(g14Badge.closest("button")).toHaveClass("bg-amber-100");
      expect(g15Badge.closest("button")).toHaveClass("bg-rose-100");
    });
  });

  it("shows tooltip on hover", async () => {
    const mockResponse = {
      gates: {
        G13: { name: "Blueprint", status: "pass", score: 98 },
        G14: { name: "Capability", status: "pass" },
        G15: { name: "Rollout", status: "pass" },
        G16: { name: "ROI", status: "pass" },
        G18: { name: "Observability", status: "pass" },
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<GovernanceHeaderStrip />);

    await waitFor(() => {
      expect(screen.getByText("G13")).toBeInTheDocument();
    });

    const badge = screen.getByText("G13");
    fireEvent.mouseEnter(badge);

    await waitFor(() => {
      expect(screen.getByText(/Blueprint/)).toBeInTheDocument();
      expect(screen.getByText(/Score: 98/)).toBeInTheDocument();
    });
  });

  it("has proper accessibility attributes", async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error("API Error"));

    render(<GovernanceHeaderStrip />);

    await waitFor(() => {
      expect(screen.getByText("G13")).toBeInTheDocument();
    });

    const nav = screen.getByRole("navigation");
    expect(nav).toHaveAttribute("aria-label", "Governance gate status badges");

    const badge = screen.getByText("G13").closest("button");
    expect(badge).toHaveAttribute("aria-label");
  });

  it("renders without console errors when API is unavailable", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

    render(<GovernanceHeaderStrip />);

    await waitFor(() => {
      expect(screen.getByText("G13")).toBeInTheDocument();
    });

    // No console errors should have been logged
    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// RateLimitMeterPie Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("RateLimitMeterPie", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders fallback data when API fails", async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error("API Error"));

    render(<RateLimitMeterPie />);

    await waitFor(() => {
      expect(screen.getByText(/Rate Limit/i)).toBeInTheDocument();
    });

    // Check for fallback values (127 usage shown as "127")
    expect(screen.getByText(/127/)).toBeInTheDocument();
  });

  it("renders API data when fetch succeeds", async () => {
    const mockResponse = {
      usage: 500,
      limit: 1000,
      remaining: 500,
      resetAt: new Date("2025-01-01T12:00:00Z").toISOString(),
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<RateLimitMeterPie />);

    await waitFor(() => {
      // Check for the combined usage/limit text
      expect(screen.getByText(/500 \/ 1,000/)).toBeInTheDocument();
    });
  });

  it("displays custom title when provided", async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error("API Error"));

    render(<RateLimitMeterPie title="Custom Rate Limit Title" />);

    await waitFor(() => {
      expect(screen.getByText("Custom Rate Limit Title")).toBeInTheDocument();
    });
  });

  it("shows warning badge when usage > 85%", async () => {
    const mockResponse = {
      usage: 900,
      limit: 1000,
      remaining: 100,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<RateLimitMeterPie />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/Warning:/i)).toBeInTheDocument();
    });
  });

  it("does not show warning badge when usage <= 85%", async () => {
    const mockResponse = {
      usage: 800,
      limit: 1000,
      remaining: 200,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<RateLimitMeterPie />);

    await waitFor(() => {
      // Wait for component to finish loading
      expect(screen.getByText(/Rate Limit/i)).toBeInTheDocument();
    });

    // Verify no alert is present
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("calculates usage percentage correctly", async () => {
    const mockResponse = {
      usage: 750,
      limit: 1000,
      remaining: 250,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<RateLimitMeterPie />);

    await waitFor(() => {
      expect(screen.getByText("75%")).toBeInTheDocument();
    });
  });

  it("renders without console errors when API is unavailable", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

    render(<RateLimitMeterPie />);

    await waitFor(() => {
      expect(screen.getByText(/Rate Limit/i)).toBeInTheDocument();
    });

    // No console errors should have been logged
    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("has proper accessibility for pie chart", async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error("API Error"));

    render(<RateLimitMeterPie />);

    await waitFor(() => {
      const pieChart = screen.getByRole("img");
      expect(pieChart).toHaveAttribute("aria-label");
      expect(pieChart.getAttribute("aria-label")).toContain("Rate limit usage");
    });
  });

  it("handles edge case of 0% usage", async () => {
    const mockResponse = {
      usage: 0,
      limit: 1000,
      remaining: 1000,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<RateLimitMeterPie />);

    await waitFor(() => {
      expect(screen.getByText("0%")).toBeInTheDocument();
    });
  });

  it("handles edge case of 100% usage", async () => {
    const mockResponse = {
      usage: 1000,
      limit: 1000,
      remaining: 0,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<RateLimitMeterPie />);

    await waitFor(() => {
      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("Integration: Both components rendered together", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("both components render without conflicts", async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes("governance")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            gates: {
              G13: { name: "Test", status: "pass" },
              G14: { name: "Test", status: "pass" },
              G15: { name: "Test", status: "pass" },
              G16: { name: "Test", status: "pass" },
              G18: { name: "Test", status: "pass" },
            },
          }),
        });
      }
      if (url.includes("rate-limit")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            usage: 500,
            limit: 1000,
            remaining: 500,
          }),
        });
      }
      return Promise.reject(new Error("Unknown endpoint"));
    });

    const { container } = render(
      <div>
        <GovernanceHeaderStrip />
        <RateLimitMeterPie />
      </div>
    );

    await waitFor(() => {
      expect(screen.getByText("G13")).toBeInTheDocument();
      expect(screen.getByText("Rate Limit")).toBeInTheDocument();
    });

    // Ensure no errors
    expect(container).toBeTruthy();
  });
});
