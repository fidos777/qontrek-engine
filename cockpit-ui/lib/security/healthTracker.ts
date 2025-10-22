// lib/security/healthTracker.ts
// Time-source hygiene and health metrics tracking

import fs from "fs";
import path from "path";

const HEALTH_PATH = path.join(process.cwd(), ".logs", "mcp", "health.json");

export interface HealthMetrics {
  clockSkewMs: number;
  clockSkewStatus: "ok" | "warn" | "fail";
  lastUpdated: number;
  sampleCount: number;
}

const CLOCK_SKEW_WARN_THRESHOLD = 30000; // 30 seconds
const CLOCK_SKEW_FAIL_THRESHOLD = 90000; // 90 seconds

/**
 * Ensure health directory exists
 */
function ensureHealthDir() {
  const dir = path.dirname(HEALTH_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Load health metrics from disk
 */
function loadHealth(): HealthMetrics {
  ensureHealthDir();

  if (!fs.existsSync(HEALTH_PATH)) {
    return {
      clockSkewMs: 0,
      clockSkewStatus: "ok",
      lastUpdated: Date.now(),
      sampleCount: 0,
    };
  }

  try {
    const data = fs.readFileSync(HEALTH_PATH, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to load health metrics:", error);
    return {
      clockSkewMs: 0,
      clockSkewStatus: "ok",
      lastUpdated: Date.now(),
      sampleCount: 0,
    };
  }
}

/**
 * Save health metrics to disk
 */
function saveHealth(metrics: HealthMetrics) {
  ensureHealthDir();

  try {
    fs.writeFileSync(HEALTH_PATH, JSON.stringify(metrics, null, 2));
  } catch (error) {
    console.error("Failed to save health metrics:", error);
  }
}

/**
 * Compute clock skew status based on absolute skew value
 */
function getClockSkewStatus(skewMs: number): "ok" | "warn" | "fail" {
  const absSkew = Math.abs(skewMs);

  if (absSkew >= CLOCK_SKEW_FAIL_THRESHOLD) {
    return "fail";
  } else if (absSkew >= CLOCK_SKEW_WARN_THRESHOLD) {
    return "warn";
  }

  return "ok";
}

/**
 * Record a clock skew measurement
 * @param skewMs Clock skew in milliseconds (positive = event ahead, negative = event behind)
 */
export function recordClockSkew(skewMs: number) {
  const health = loadHealth();

  // Update with exponential moving average (alpha = 0.3)
  const alpha = 0.3;
  const newSkew = health.sampleCount === 0
    ? skewMs
    : health.clockSkewMs * (1 - alpha) + skewMs * alpha;

  const updated: HealthMetrics = {
    clockSkewMs: Math.round(newSkew),
    clockSkewStatus: getClockSkewStatus(newSkew),
    lastUpdated: Date.now(),
    sampleCount: health.sampleCount + 1,
  };

  saveHealth(updated);
}

/**
 * Get current health metrics for governance reporting
 */
export function getHealthMetrics(): HealthMetrics {
  return loadHealth();
}

/**
 * Reset health metrics (for testing)
 */
export function resetHealth() {
  saveHealth({
    clockSkewMs: 0,
    clockSkewStatus: "ok",
    lastUpdated: Date.now(),
    sampleCount: 0,
  });
}
