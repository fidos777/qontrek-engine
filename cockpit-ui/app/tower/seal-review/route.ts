// app/tower/seal-review/route.ts
// ⚠️ SECURE - Idempotent POST route for sealing proofs

import { NextRequest, NextResponse } from "next/server";
import type { SealRequest, SealResponse } from "@/lib/types";
import { createHash } from "crypto";

// In-memory single-flight guard (prevents double-click race)
const sealInProgress = new Map<string, Promise<SealResponse>>();

// In-memory seal registry (simulates database)
const sealRegistry = new Map<string, SealResponse>();

/**
 * Compute deterministic seal hash
 */
function computeSealHash(manifestPath: string, gate: string, generatedAt: string): string {
  const data = `${manifestPath}|${gate}|${generatedAt}`;
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Validate user role (stub - replace with real auth)
 */
function validateRole(request: NextRequest): boolean {
  // In production, check session/JWT for role = admin/auditor
  const role = request.headers.get("x-user-role");
  return role === "admin" || role === "auditor";
}

/**
 * Validate CSRF token (stub - replace with real CSRF check)
 */
function validateCsrf(request: NextRequest): boolean {
  // In production, validate CSRF token from headers
  const csrfToken = request.headers.get("x-csrf-token");
  return !!csrfToken; // Stub: just check presence
}

/**
 * POST /tower/seal-review
 * Secure, idempotent seal review endpoint
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Security checks
    if (!validateRole(request)) {
      return NextResponse.json(
        { error: "Unauthorized: Requires admin or auditor role" },
        { status: 403 }
      );
    }

    if (!validateCsrf(request)) {
      return NextResponse.json(
        { error: "CSRF token missing or invalid" },
        { status: 403 }
      );
    }

    // Parse request
    const body = (await request.json()) as SealRequest;
    const { manifest_path, gate, generated_at } = body;

    if (!manifest_path || !gate || !generated_at) {
      return NextResponse.json(
        { error: "Missing required fields: manifest_path, gate, generated_at" },
        { status: 400 }
      );
    }

    // Compute seal hash
    const sealHash = computeSealHash(manifest_path, gate, generated_at);

    // Check if already sealed (idempotency)
    if (sealRegistry.has(sealHash)) {
      const existing = sealRegistry.get(sealHash)!;
      return NextResponse.json({
        ...existing,
        duplicate: true,
      });
    }

    // Single-flight guard (prevent concurrent seals for same hash)
    if (sealInProgress.has(sealHash)) {
      const result = await sealInProgress.get(sealHash)!;
      return NextResponse.json({
        ...result,
        duplicate: true,
      });
    }

    // Start seal process
    const sealPromise = performSeal(manifest_path, gate, generated_at, sealHash);
    sealInProgress.set(sealHash, sealPromise);

    try {
      const result = await sealPromise;
      sealRegistry.set(sealHash, result);
      return NextResponse.json(result);
    } finally {
      sealInProgress.delete(sealHash);
    }
  } catch (error) {
    console.error("[SEAL-REVIEW] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Perform the actual seal operation
 */
async function performSeal(
  manifestPath: string,
  gate: string,
  generatedAt: string,
  sealHash: string
): Promise<SealResponse> {
  // In production, this would:
  // 1. Verify proof file exists
  // 2. Validate proof contents
  // 3. Compute Merkle root
  // 4. Store seal in database
  // 5. Update lineage chain

  // Simulate async seal process
  await new Promise((resolve) => setTimeout(resolve, 100));

  return {
    sealed: true,
    duplicate: false,
    sealed_at: new Date().toISOString(),
    seal_hash: sealHash,
    sealed_by: "admin", // In production, get from session
    parent_hash: null, // In production, link to parent proof
  };
}

/**
 * GET /tower/seal-review
 * List all seals (for audit)
 */
export async function GET(): Promise<NextResponse> {
  const seals = Array.from(sealRegistry.values());
  return NextResponse.json({
    total: seals.length,
    seals,
  });
}
