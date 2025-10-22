// tests/federation.test.ts
// Federation, Lineage & Tower Broadcast Tests

import { describe, it, expect } from "vitest";
import { GET as getFederation } from "@/app/api/mcp/federation/route";
import { verifyAtlasKey, checkRateLimit } from "@/app/api/mcp/middleware";
import { getRetryQueueStats } from "@/app/lib/event_bridge";

describe("Federation Registry & Discovery", () => {
  it("should return federation registry with nodes", async () => {
    const req = new Request("http://localhost/api/mcp/federation");
    const res = await getFederation();

    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.version).toBe("1.1.0");
    expect(Array.isArray(json.nodes)).toBe(true);
    expect(json.nodes.length).toBeGreaterThan(0);

    const node = json.nodes[0];
    expect(node.id).toBe("atlas-local");
    expect(node.type).toBe("client");
    expect(Array.isArray(node.capabilities)).toBe(true);
    expect(node.capabilities).toContain("discover");
    expect(node.capabilities).toContain("emit");
    expect(node.capabilities).toContain("consume");
  });

  it("should include runtime information", async () => {
    const req = new Request("http://localhost/api/mcp/federation");
    const res = await getFederation();
    const json = await res.json();

    expect(json.runtime).toBeTruthy();
    expect(typeof json.runtime.uptime_ms).toBe("number");
    expect(typeof json.runtime.pid).toBe("number");
    expect(json.runtime.node_env).toBeTruthy();
    expect(json.runtime.timestamp).toBeTruthy();
  });

  it("should include federation protocol info", async () => {
    const req = new Request("http://localhost/api/mcp/federation");
    const res = await getFederation();
    const json = await res.json();

    expect(json.federation).toBeTruthy();
    expect(json.federation.protocol).toBe("atlas-v1.1");
    expect(json.federation.authentication).toBe("hmac-sha256");
    expect(json.federation.sync_interval_ms).toBe(60000);
    expect(json.federation.retry_policy).toBeTruthy();
  });
});

describe("Security & Multi-Tenancy", () => {
  it("should verify valid X-Atlas-Key", () => {
    process.env.TOWER_SHARED_KEY = "test-key";

    const req = new Request("http://localhost/api/mcp/resources", {
      headers: { "X-Atlas-Key": "test-key" },
    });

    const ctx = verifyAtlasKey(req);

    expect(ctx.authenticated).toBe(true);
    expect(ctx.nodeId).toBe("tower-node");
    expect(ctx.tenant).toBe("qontrek");
  });

  it("should reject invalid X-Atlas-Key", () => {
    process.env.TOWER_SHARED_KEY = "test-key";
    process.env.NODE_ENV = "production"; // Disable dev bypass

    const req = new Request("http://localhost/api/mcp/resources", {
      headers: { "X-Atlas-Key": "wrong-key" },
    });

    const ctx = verifyAtlasKey(req);

    expect(ctx.authenticated).toBe(false);
  });

  it("should allow unauthenticated in development", () => {
    process.env.NODE_ENV = "development";

    const req = new Request("http://localhost/api/mcp/resources");

    const ctx = verifyAtlasKey(req);

    expect(ctx.authenticated).toBe(true);
    expect(ctx.nodeId).toBe("dev-node");
  });

  it("should enforce rate limits per tenant", () => {
    const allowed1 = checkRateLimit("tenant1", 3);
    expect(allowed1).toBe(true);

    const allowed2 = checkRateLimit("tenant1", 3);
    expect(allowed2).toBe(true);

    const allowed3 = checkRateLimit("tenant1", 3);
    expect(allowed3).toBe(true);

    const blocked = checkRateLimit("tenant1", 3);
    expect(blocked).toBe(false);
  });

  it("should isolate rate limits by tenant", () => {
    const allowed1 = checkRateLimit("tenant-a", 2);
    expect(allowed1).toBe(true);

    const allowed2 = checkRateLimit("tenant-b", 2);
    expect(allowed2).toBe(true);

    expect(checkRateLimit("tenant-a", 2)).toBe(true);
    expect(checkRateLimit("tenant-b", 2)).toBe(true);

    expect(checkRateLimit("tenant-a", 2)).toBe(false);
    expect(checkRateLimit("tenant-b", 2)).toBe(false);
  });
});

describe("Event Bridge Stability", () => {
  it("should track retry queue stats", () => {
    const stats = getRetryQueueStats();

    expect(stats).toHaveProperty("size");
    expect(stats).toHaveProperty("events");
    expect(Array.isArray(stats.events)).toBe(true);
  });
});
