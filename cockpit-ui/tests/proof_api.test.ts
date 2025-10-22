import { describe, it, expect, beforeAll } from "vitest";
import { GET } from "@/app/api/proof/route";
import { promises as fs } from "fs";
import { join } from "path";

describe("Proof API - ETag & Caching", () => {
  const testProofPath = join(process.cwd(), "..", "proof", "test_proof.json");
  const testContent = JSON.stringify({ test: "data", timestamp: Date.now() });

  beforeAll(async () => {
    // Create test proof file
    await fs.mkdir(join(process.cwd(), "..", "proof"), { recursive: true });
    await fs.writeFile(testProofPath, testContent);
  });

  it("should return 400 for invalid ref (path traversal)", async () => {
    const req = new Request("http://localhost/api/proof?ref=../../etc/passwd");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("invalid_ref");
  });

  it("should return 404 for non-existent file", async () => {
    const req = new Request("http://localhost/api/proof?ref=nonexistent.json");
    const res = await GET(req);
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("not_found");
  });

  it("should return 200 with ETag and Cache-Control headers", async () => {
    const req = new Request("http://localhost/api/proof?ref=test_proof.json");
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("ETag")).toBeTruthy();
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=60");
    expect(res.headers.get("Content-Type")).toBe("application/json; charset=utf-8");
  });

  it("should return 304 when If-None-Match matches ETag", async () => {
    // First request to get ETag
    const req1 = new Request("http://localhost/api/proof?ref=test_proof.json");
    const res1 = await GET(req1);
    const etag = res1.headers.get("ETag");

    // Second request with If-None-Match
    const req2 = new Request("http://localhost/api/proof?ref=test_proof.json", {
      headers: { "If-None-Match": etag! },
    });
    const res2 = await GET(req2);
    expect(res2.status).toBe(304);
  });

  it("should return 413 for files larger than 1MB", async () => {
    const largePath = join(process.cwd(), "..", "proof", "large_proof.json");
    // Create a file larger than 1MB
    const largeContent = JSON.stringify({ data: "x".repeat(1_100_000) });
    await fs.writeFile(largePath, largeContent);

    const req = new Request("http://localhost/api/proof?ref=large_proof.json");
    const res = await GET(req);
    expect(res.status).toBe(413);
    const json = await res.json();
    expect(json.error).toBe("file_too_large");

    // Cleanup
    await fs.unlink(largePath);
  });
});
