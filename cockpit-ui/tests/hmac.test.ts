// tests/hmac.test.ts
// HMAC Lineage Verification Tests

import { describe, it, expect, beforeEach } from "vitest";
import { signEvent, signProof, SignedEvent } from "@/lib/security/signEvent";
import { verifyEvent, verifyEventChain } from "@/lib/security/verifyEvent";

describe("HMAC Lineage Verification", () => {
  beforeEach(() => {
    // Set consistent env for tests
    process.env.TOWER_SHARED_KEY = "test-shared-key";
    process.env.ATLAS_NODE_ID = "test-node";
  });

  describe("Event Signing", () => {
    it("should sign an event with HMAC-SHA256", () => {
      const signed = signEvent("test.event", { foo: "bar" });

      expect(signed.type).toBe("test.event");
      expect(signed.payload).toEqual({ foo: "bar" });
      expect(signed.signature).toMatch(/^[a-f0-9]{64}$/); // SHA256 hex
      expect(signed.node_id).toBe("test-node");
      expect(typeof signed.timestamp).toBe("number");
    });

    it("should include prev_signature for lineage chain", () => {
      const first = signEvent("event.1", { data: 1 });
      const second = signEvent("event.2", { data: 2 }, first.signature);

      expect(second.prev_signature).toBe(first.signature);
      expect(second.signature).not.toBe(first.signature);
    });

    it("should sign proof artifacts", () => {
      const signed = signProof("cfo_forecast.json", "W/abc123", "ForecastV1");

      expect(signed.type).toBe("proof.signed");
      expect(signed.payload.ref).toBe("cfo_forecast.json");
      expect(signed.payload.etag).toBe("W/abc123");
      expect(signed.payload.schema).toBe("ForecastV1");
      expect(signed.signature).toBeTruthy();
    });
  });

  describe("Event Verification", () => {
    it("should verify valid signed event", () => {
      const signed = signEvent("test.event", { foo: "bar" });
      const result = verifyEvent(signed);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject event with wrong signature", () => {
      const signed = signEvent("test.event", { foo: "bar" });
      const tampered = { ...signed, signature: "deadbeef" + signed.signature.slice(8) };

      const result = verifyEvent(tampered);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("signature_mismatch");
    });

    it("should reject event with tampered payload", () => {
      const signed = signEvent("test.event", { foo: "bar" });
      const tampered = { ...signed, payload: { foo: "baz" } };

      const result = verifyEvent(tampered);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("signature_mismatch");
    });

    it("should reject expired events", () => {
      const signed = signEvent("test.event", { foo: "bar" });
      const old = { ...signed, timestamp: Date.now() - 400000 }; // 6+ minutes ago

      const result = verifyEvent(old, { maxAgeSec: 300 });

      expect(result.valid).toBe(false);
      expect(result.error).toBe("timestamp_expired");
      expect(result.timestamp_drift_ms).toBeGreaterThan(300000);
    });

    it("should reject future-dated events", () => {
      const signed = signEvent("test.event", { foo: "bar" });
      const future = { ...signed, timestamp: Date.now() + 120000 }; // 2 minutes ahead

      const result = verifyEvent(future);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("timestamp_future");
    });

    it("should enforce node allowlist", () => {
      const signed = signEvent("test.event", { foo: "bar" });

      const resultAllowed = verifyEvent(signed, { allowedNodes: ["test-node", "other-node"] });
      expect(resultAllowed.valid).toBe(true);

      const resultDenied = verifyEvent(signed, { allowedNodes: ["other-node"] });
      expect(resultDenied.valid).toBe(false);
      expect(resultDenied.error).toBe("node_not_allowed");
    });
  });

  describe("Event Chain Verification", () => {
    it("should verify valid event chain", () => {
      const first = signEvent("event.1", { data: 1 });
      const second = signEvent("event.2", { data: 2 }, first.signature);
      const third = signEvent("event.3", { data: 3 }, second.signature);

      const result = verifyEventChain([first, second, third]);

      expect(result.valid).toBe(true);
    });

    it("should verify chain even when events are unordered", async () => {
      // Need slight delay to ensure timestamp ordering
      const first = signEvent("event.1", { data: 1 });
      await new Promise((r) => setTimeout(r, 10));
      const second = signEvent("event.2", { data: 2 }, first.signature);
      await new Promise((r) => setTimeout(r, 10));
      const third = signEvent("event.3", { data: 3 }, second.signature);

      // Submit out of order
      const result = verifyEventChain([third, first, second]);

      expect(result.valid).toBe(true);
    });

    it("should detect broken lineage chain", () => {
      const first = signEvent("event.1", { data: 1 });
      const second = signEvent("event.2", { data: 2 }, first.signature);
      const third = signEvent("event.3", { data: 3 }, "wrong-prev-sig");

      const result = verifyEventChain([first, second, third]);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("lineage_break");
    });

    it("should detect tampered event in chain", () => {
      const first = signEvent("event.1", { data: 1 });
      const second = signEvent("event.2", { data: 2 }, first.signature);
      const tamperedSecond = { ...second, payload: { data: 999 } };
      const third = signEvent("event.3", { data: 3 }, second.signature);

      const result = verifyEventChain([first, tamperedSecond, third]);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("chain_break_at_1");
    });

    it("should accept empty chain", () => {
      const result = verifyEventChain([]);
      expect(result.valid).toBe(true);
    });
  });
});
