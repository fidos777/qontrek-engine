/**
 * tests/ui_trust.test.tsx
 * UI Trust Fabric Tests - R1.4.2
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProofChipV2 from "@/app/components/ProofChipV2";
import ConfidenceMeter from "@/app/components/ConfidenceMeter";
import LineageTimelineTab from "@/app/components/LineageTimelineTab";
import GovernanceBadges from "@/app/components/GovernanceBadges";
import RateLimitMeter from "@/app/components/RateLimitMeter";

// Mock fetch
global.fetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  (global.fetch as any).mockResolvedValue({
    ok: true,
    json: async () => ({}),
  });
});

describe("ProofChipV2", () => {
  it("should render proof chip with ref name", () => {
    render(<ProofChipV2 refName="test_proof.json" status="verified" />);
    expect(screen.getByText("test_proof.json")).toBeInTheDocument();
  });

  it("should open modal on chip click", async () => {
    render(<ProofChipV2 refName="test_proof.json" status="verified" />);

    const chip = screen.getByRole("button", { name: /View proof test_proof\.json/i });
    fireEvent.click(chip);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Proof Details")).toBeInTheDocument();
    });
  });

  it("should emit telemetry on chip click", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    render(<ProofChipV2 refName="test_proof.json" status="verified" />);

    const chip = screen.getByRole("button", { name: /View proof test_proof\.json/i });
    fireEvent.click(chip);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/mcp/telemetry",
        expect.objectContaining({
          method: "POST",
        })
      );
    });
  });

  it("should display status badge with correct color", () => {
    const { container } = render(<ProofChipV2 refName="test" status="verified" />);
    const chip = container.querySelector("button");
    expect(chip?.className).toContain("emerald");
  });

  it("should show Details and Lineage tabs in modal", async () => {
    render(<ProofChipV2 refName="test_proof.json" status="verified" />);

    const chip = screen.getByRole("button", { name: /View proof test_proof\.json/i });
    fireEvent.click(chip);

    await waitFor(() => {
      expect(screen.getByText("Details")).toBeInTheDocument();
      expect(screen.getByText("Lineage Timeline")).toBeInTheDocument();
    });
  });

  it("should copy deep link on button click", async () => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    });

    render(<ProofChipV2 refName="test_proof.json" status="verified" />);

    const chip = screen.getByRole("button", { name: /View proof test_proof\.json/i });
    fireEvent.click(chip);

    await waitFor(() => {
      const copyButton = screen.getByText("Copy");
      fireEvent.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining("#proof:test_proof.json")
      );
    });
  });
});

describe("ConfidenceMeter", () => {
  beforeEach(() => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        etag: "W/test123",
        schema: { type: "object" },
        timestamp: new Date().toISOString(),
      }),
    });
  });

  it("should render confidence meter", () => {
    render(<ConfidenceMeter refName="test_proof.json" />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("should calculate confidence score within 300ms", async () => {
    const startTime = Date.now();

    render(<ConfidenceMeter refName="test_proof.json" />);

    await waitFor(
      () => {
        const progressBar = screen.getByRole("progressbar");
        expect(progressBar).toHaveAttribute("aria-valuenow");
      },
      { timeout: 300 }
    );

    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(300);
  });

  it("should display confidence factors", async () => {
    render(<ConfidenceMeter refName="test_proof.json" />);

    await waitFor(() => {
      expect(screen.getByText(/ETag/)).toBeInTheDocument();
      expect(screen.getByText(/ACK/)).toBeInTheDocument();
      expect(screen.getByText(/Schema/)).toBeInTheDocument();
      expect(screen.getByText(/Fresh/)).toBeInTheDocument();
    });
  });

  it("should update on proof.updated event", async () => {
    const { rerender } = render(<ConfidenceMeter refName="test_proof.json" />);

    await waitFor(() => {
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });

    // Dispatch custom event
    const event = new CustomEvent("proof.updated", {
      detail: { ref: "test_proof.json" },
    });
    window.dispatchEvent(event);

    rerender(<ConfidenceMeter refName="test_proof.json" />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});

describe("LineageTimelineTab", () => {
  beforeEach(() => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        source: { path: "/proof/test.json", timestamp: new Date().toISOString() },
        seal: { hmac: "a1b2c3d4e5f6g7h8", timestamp: new Date().toISOString() },
        etag: "W/test123",
      }),
    });
  });

  it("should render lineage timeline", async () => {
    render(<LineageTimelineTab refName="test_proof.json" />);

    await waitFor(() => {
      expect(screen.getByText("Proof Lineage Timeline")).toBeInTheDocument();
    });
  });

  it("should display all lineage stages", async () => {
    render(<LineageTimelineTab refName="test_proof.json" />);

    await waitFor(() => {
      expect(screen.getByText("Source")).toBeInTheDocument();
      expect(screen.getByText("Seal")).toBeInTheDocument();
      expect(screen.getByText("ETag")).toBeInTheDocument();
      expect(screen.getByText("ACK")).toBeInTheDocument();
    });
  });

  it("should color-code stages correctly", async () => {
    render(<LineageTimelineTab refName="test_proof.json" />);

    await waitFor(() => {
      const completedBadges = screen.getAllByText("completed");
      expect(completedBadges.length).toBeGreaterThan(0);
    });
  });
});

describe("GovernanceBadges", () => {
  beforeEach(() => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        g13: { status: "pass", message: "ProofChip v2 + HMAC check active" },
        g14: { status: "pass", message: "ACK & ETag freshness validated" },
        g15: { status: "pass", message: "Telemetry emit + badges operational" },
        g16: { status: "pass", message: "Panic 503 + Rate limit enabled" },
      }),
    });
  });

  it("should render all governance badges (G13-G16)", async () => {
    render(<GovernanceBadges />);

    await waitFor(() => {
      expect(screen.getByText("G13")).toBeInTheDocument();
      expect(screen.getByText("G14")).toBeInTheDocument();
      expect(screen.getByText("G15")).toBeInTheDocument();
      expect(screen.getByText("G16")).toBeInTheDocument();
    });
  });

  it("should display correct status icons", async () => {
    render(<GovernanceBadges />);

    await waitFor(() => {
      const badges = screen.getAllByRole("status");
      expect(badges.length).toBe(4);
    });
  });

  it("should refresh every 30 seconds", async () => {
    vi.useFakeTimers();

    render(<GovernanceBadges />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    vi.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    vi.useRealTimers();
  });
});

describe("RateLimitMeter", () => {
  beforeEach(() => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        current: 25,
        limit: 100,
        tenant: "default",
      }),
    });
  });

  it("should render rate limit meter", async () => {
    render(<RateLimitMeter />);

    await waitFor(() => {
      expect(screen.getByText("Rate Limit")).toBeInTheDocument();
    });
  });

  it("should display current and limit values", async () => {
    render(<RateLimitMeter />);

    await waitFor(() => {
      expect(screen.getByText("25")).toBeInTheDocument();
      expect(screen.getByText(/100 req\/min/)).toBeInTheDocument();
    });
  });

  it("should show tenant ID", async () => {
    render(<RateLimitMeter />);

    await waitFor(() => {
      expect(screen.getByText(/Tenant: default/)).toBeInTheDocument();
    });
  });
});

describe("Accessibility", () => {
  it("ProofChipV2 should be keyboard navigable", () => {
    render(<ProofChipV2 refName="test" status="verified" />);
    const chip = screen.getByRole("button");
    expect(chip).toHaveAttribute("tabIndex", "0");
  });

  it("ConfidenceMeter should have proper ARIA labels", async () => {
    render(<ConfidenceMeter refName="test" />);

    await waitFor(() => {
      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toHaveAttribute("aria-label");
      expect(progressBar).toHaveAttribute("aria-valuenow");
      expect(progressBar).toHaveAttribute("aria-valuemin", "0");
      expect(progressBar).toHaveAttribute("aria-valuemax", "100");
    });
  });

  it("Modal should have proper dialog role", async () => {
    render(<ProofChipV2 refName="test" status="verified" />);

    const chip = screen.getByRole("button");
    fireEvent.click(chip);

    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("aria-labelledby");
    });
  });
});
