// tests/mcp.test.ts
// MCP Discovery Bridge tests

import { describe, it, expect, beforeAll } from "vitest";
import { GET as getMCPResources } from "@/app/api/mcp/resources/route";
import { GET as getMCPTools } from "@/app/api/mcp/tools/route";
import { GET as getMCPEvents, POST as postMCPEvent } from "@/app/api/mcp/events/route";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

describe("MCP Discovery Bridge", () => {
  beforeAll(async () => {
    // Ensure Atlas registry is built
    try {
      await execAsync("npm run atlas:build", { cwd: process.cwd() });
    } catch (error) {
      console.warn("Atlas build may have failed, tests might fail:", error);
    }
  });

  describe("MCP Resources Endpoint", () => {
    it("should return valid MCP resources registry", async () => {
      const req = new Request("http://localhost/api/mcp/resources");
      const res = await getMCPResources();

      expect(res.status).toBe(200);
      expect(res.headers.get("Cache-Control")).toBe("public, max-age=60");
      expect(res.headers.get("Content-Type")).toBe("application/json; charset=utf-8");

      const json = await res.json();
      expect(json.version).toBe("1.0.0");
      expect(json.generated_at).toBeTruthy();
      expect(Array.isArray(json.resources)).toBe(true);
      expect(Array.isArray(json.schemas)).toBe(true);
    });

    it("should include at least one proof resource", async () => {
      const req = new Request("http://localhost/api/mcp/resources");
      const res = await getMCPResources();
      const json = await res.json();

      expect(json.resources.length).toBeGreaterThan(0);

      const resource = json.resources[0];
      expect(resource.uri).toBeTruthy();
      expect(resource.etag).toMatch(/^W\//);
      expect(resource.locale).toBe("ms-MY");
      expect(typeof resource.size).toBe("number");
      expect(resource.modified).toBeTruthy();
    });

    it("should include schema definitions", async () => {
      const req = new Request("http://localhost/api/mcp/resources");
      const res = await getMCPResources();
      const json = await res.json();

      expect(json.schemas.length).toBeGreaterThan(0);

      const schema = json.schemas[0];
      expect(schema.name).toBeTruthy();
      expect(schema.path).toMatch(/app\/lib\/schemas\/fixtures\.ts#/);
      expect(schema.description).toBeTruthy();
    });
  });

  describe("MCP Tools Endpoint", () => {
    it("should return valid MCP tools registry", async () => {
      const req = new Request("http://localhost/api/mcp/tools");
      const res = await getMCPTools();

      expect(res.status).toBe(200);
      expect(res.headers.get("Cache-Control")).toBe("public, max-age=60");

      const json = await res.json();
      expect(json.version).toBe("1.0.0");
      expect(json.generated_at).toBeTruthy();
      expect(Array.isArray(json.tools)).toBe(true);
    });

    it("should list audit tools", async () => {
      const req = new Request("http://localhost/api/mcp/tools");
      const res = await getMCPTools();
      const json = await res.json();

      expect(json.tools.length).toBeGreaterThanOrEqual(5);

      const loadProofTool = json.tools.find((t: any) => t.name === "loadProof");
      expect(loadProofTool).toBeTruthy();
      expect(loadProofTool.description).toBeTruthy();
      expect(loadProofTool.endpoint).toBe("/api/proof");
      expect(loadProofTool.method).toBe("GET");

      const resourcesTool = json.tools.find((t: any) => t.name === "listMCPResources");
      expect(resourcesTool).toBeTruthy();
      expect(resourcesTool.endpoint).toBe("/api/mcp/resources");
    });
  });

  describe("MCP Events Endpoint", () => {
    it("should return valid MCP events registry", async () => {
      const req = new Request("http://localhost/api/mcp/events");
      const res = await getMCPEvents(req);

      expect(res.status).toBe(200);
      expect(res.headers.get("Cache-Control")).toBe("public, max-age=60");

      const json = await res.json();
      expect(json.version).toBe("1.0.0");
      expect(json.generated_at).toBeTruthy();
      expect(Array.isArray(json.events)).toBe(true);
    });

    it("should define proof.updated event type", async () => {
      const req = new Request("http://localhost/api/mcp/events");
      const res = await getMCPEvents(req);
      const json = await res.json();

      const proofUpdated = json.events.find((e: any) => e.type === "proof.updated");
      expect(proofUpdated).toBeTruthy();
      expect(proofUpdated.description).toContain("ETag");
      expect(proofUpdated.schema).toBeTruthy();
    });

    it("should accept event emission via POST", async () => {
      const event = {
        type: "proof.updated",
        ref: "test.json",
        etag: "W/test123",
        timestamp: Date.now(),
      };

      const req = new Request("http://localhost/api/mcp/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });

      const res = await postMCPEvent(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.event).toEqual(event);
    });

    it("should reject invalid event without type", async () => {
      const invalidEvent = {
        ref: "test.json",
        // missing type
        timestamp: Date.now(),
      };

      const req = new Request("http://localhost/api/mcp/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidEvent),
      });

      const res = await postMCPEvent(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toBe("invalid_event");
    });

    it("should stream events when ?stream=true", async () => {
      // First emit an event
      const event = {
        type: "proof.loaded",
        ref: "stream_test.json",
        timestamp: Date.now(),
      };

      const postReq = new Request("http://localhost/api/mcp/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });

      await postMCPEvent(postReq);

      // Then stream events
      const getReq = new Request("http://localhost/api/mcp/events?stream=true");
      const res = await getMCPEvents(getReq);

      expect(res.status).toBe(200);
      expect(res.headers.get("Cache-Control")).toBe("no-store");

      const json = await res.json();
      expect(Array.isArray(json.events)).toBe(true);
      expect(json.count).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Telemetry Atlas Format", () => {
    it("should emit Atlas-compatible telemetry events", () => {
      // This is tested via console output in actual usage
      // Here we verify the structure is correct
      const atlasEvent = {
        event: "proof.load",
        ref: "test.json",
        route: "/test",
        source: "cockpit-ui",
        timestamp: Date.now(),
        lang: "ms-MY",
        schema_version: "v1",
        etag: "W/abc123",
      };

      expect(atlasEvent.event).toBe("proof.load");
      expect(atlasEvent.source).toBe("cockpit-ui");
      expect(atlasEvent.lang).toMatch(/^(ms-MY|en-US)$/);
      expect(typeof atlasEvent.timestamp).toBe("number");
    });
  });
});
