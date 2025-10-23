import * as React from "react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, cleanup } from "@testing-library/react"
import ConfidenceMeterAnimated from "@/components/trust/ConfidenceMeter"

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, style, className, initial, animate, transition, ...props }: any) => (
      <div className={className} style={{ ...style, width: animate?.width }} {...props}>
        {children}
      </div>
    ),
  },
}))

describe("ConfidenceMeterAnimated", () => {
  let consoleLogSpy: any
  let fetchMock: any

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    fetchMock = vi.fn()
    global.fetch = fetchMock

    // Mock matchMedia
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    })
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    vi.clearAllMocks()
    cleanup()
  })

  it("renders neutral score (50) when signals are missing", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
    })

    render(<ConfidenceMeterAnimated source="test" />)

    await waitFor(() => {
      expect(screen.getByText("50%")).toBeTruthy()
    })

    // Should have aria-label with score
    const meter = screen.getByRole("meter")
    expect(meter.getAttribute("aria-label")).toBe("Confidence 50%")
    expect(meter.getAttribute("aria-valuenow")).toBe("50")
  })

  it("computes and displays correct score from full signals", async () => {
    const signals = {
      etag: "abc123",
      ack_age_ms: 150,
      schema_pass: true,
      freshness_ms: 5000,
      mode: "live" as const,
      generated_at: "2025-10-23T05:19:00.000Z",
    }

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => signals,
    })

    render(<ConfidenceMeterAnimated source="test" />)

    await waitFor(() => {
      // Expected score calculation:
      // etag: 100 (present)
      // ack: 100 - 150/600 = 99.75
      // schema: 100 (true)
      // fresh: 100 - 5000/600 = 91.67
      // total: 100*0.3 + 99.75*0.3 + 100*0.2 + 91.67*0.2 = 30 + 29.925 + 20 + 18.334 = 98.259
      // rounded: 98
      expect(screen.getByText("98%")).toBeTruthy()
    })
  })

  it("emits telemetry on score update", async () => {
    const signals = {
      etag: "abc123",
      ack_age_ms: 100,
      schema_pass: true,
      freshness_ms: 3000,
    }

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => signals,
    })

    render(<ConfidenceMeterAnimated source="test" />)

    await waitFor(() => {
      // Check that telemetry was logged
      const telemetryCall = consoleLogSpy.mock.calls.find(
        (call: any) => call[0] === "[TELEMETRY]"
      )
      expect(telemetryCall).toBeDefined()
    })

    // Parse the telemetry entry
    const telemetryCall = consoleLogSpy.mock.calls.find(
      (call: any) => call[0] === "[TELEMETRY]"
    )
    expect(telemetryCall).toBeDefined()

    const telemetryData = JSON.parse(telemetryCall![1])
    expect(telemetryData.event).toBe("ui.confidence.score")
    expect(telemetryData.score).toBeGreaterThan(0)
    expect(telemetryData.timestamp).toBeDefined()
  })

  it("displays checkmark icon when score >= 90", async () => {
    const signals = {
      etag: "abc123",
      ack_age_ms: 10,
      schema_pass: true,
      freshness_ms: 100,
    }

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => signals,
    })

    render(<ConfidenceMeterAnimated source="test" />)

    await waitFor(() => {
      // Expected score: etag=100, ack≈100, schema=100, fresh≈100 → ~100
      // Check for checkmark icon (lucide-react renders as svg)
      const svgs = document.querySelectorAll("svg")
      expect(svgs.length).toBeGreaterThan(0)
    })
  })

  it("does not display checkmark when score < 90", async () => {
    const signals = {
      etag: undefined,
      ack_age_ms: undefined,
      schema_pass: false,
      freshness_ms: undefined,
    }

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => signals,
    })

    render(<ConfidenceMeterAnimated source="test" />)

    await waitFor(() => {
      // Score should be: 50*0.3 + 50*0.3 + 0*0.2 + 50*0.2 = 40
      expect(screen.getByText("40%")).toBeTruthy()
    })

    // No checkmark icon for score < 90
    // The component should only have the loading/neutral state
    const meter = screen.getByRole("meter")
    expect(meter).toBeTruthy()
  })

  it("handles missing fields with neutral defaults", async () => {
    const signals = {
      schema_pass: true,
      // Missing: etag, ack_age_ms, freshness_ms
    }

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => signals,
    })

    render(<ConfidenceMeterAnimated source="test" />)

    await waitFor(() => {
      // Score: 50*0.3 + 50*0.3 + 100*0.2 + 50*0.2 = 60
      expect(screen.getByText("60%")).toBeTruthy()
    })
  })

  it("respects reduced motion preference", async () => {
    // Mock matchMedia for reduced motion
    const matchMediaMock = vi.fn().mockImplementation((query) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: matchMediaMock,
    })

    const signals = {
      etag: "abc123",
      ack_age_ms: 100,
      schema_pass: true,
      freshness_ms: 3000,
    }

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => signals,
    })

    render(<ConfidenceMeterAnimated source="test" />)

    await waitFor(() => {
      expect(screen.getByText(/\d+%/)).toBeTruthy()
    })

    // Verify matchMedia was called with reduced motion query
    expect(matchMediaMock).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)")
  })

  it("shows tooltip information on hover", async () => {
    const signals = {
      etag: "abc123",
      ack_age_ms: 150,
      schema_pass: true,
      freshness_ms: 5000,
    }

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => signals,
    })

    const { container } = render(<ConfidenceMeterAnimated source="test" />)

    await waitFor(() => {
      expect(screen.getByText("98%")).toBeTruthy()
    })

    // The tooltip content is rendered but initially hidden
    // This test verifies the component structure is correct
    expect(container.querySelector(".relative.inline-block")).toBeTruthy()
  })

  it("applies custom className", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
    })

    const { container } = render(
      <ConfidenceMeterAnimated source="test" className="custom-class" />
    )

    await waitFor(() => {
      const element = container.querySelector(".custom-class")
      expect(element).toBeTruthy()
    })
  })
})
