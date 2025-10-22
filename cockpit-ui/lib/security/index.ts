// lib/security/index.ts
// Security utilities exports

export { signEvent, signProof, getCanonicalEvent } from "./signEvent";
export type { SignedEvent } from "./signEvent";

export { verifyEvent, verifyEventChain } from "./verifyEvent";
export type { VerificationResult } from "./verifyEvent";
