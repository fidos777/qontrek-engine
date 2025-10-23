import crypto from 'crypto';

/**
 * Tower signing key configuration
 * In production, these should be loaded from secure key management
 */
export interface SigningKey {
  kid: string;
  algorithm: 'HMAC-SHA256' | 'RSA-SHA256';
  secret?: string;
  privateKey?: string;
  publicKey?: string;
  createdAt: string;
  rotatesAt: string;
  status: 'active' | 'rotating' | 'retired';
}

/**
 * Get active signing key
 * For now, uses HMAC with env-based secret
 */
export function getActiveSigningKey(): SigningKey {
  const secret = process.env.TOWER_SIGNING_SECRET || 'dev-tower-secret-change-in-production';
  const now = new Date();
  const rotatesAt = new Date(now);
  rotatesAt.setDate(rotatesAt.getDate() + 90); // 90-day rotation

  return {
    kid: process.env.TOWER_KEY_ID || 'tower-key-001',
    algorithm: 'HMAC-SHA256',
    secret,
    createdAt: now.toISOString(),
    rotatesAt: rotatesAt.toISOString(),
    status: 'active',
  };
}

/**
 * Sign payload with Tower key
 */
export function signPayload(payload: Record<string, any>, key: SigningKey): string {
  const canonical = JSON.stringify(payload, Object.keys(payload).sort());

  if (key.algorithm === 'HMAC-SHA256' && key.secret) {
    return crypto
      .createHmac('sha256', key.secret)
      .update(canonical)
      .digest('hex');
  }

  throw new Error(`Unsupported signing algorithm: ${key.algorithm}`);
}

/**
 * Verify signature
 */
export function verifySignature(
  payload: Record<string, any>,
  signature: string,
  key: SigningKey
): boolean {
  try {
    const expectedSignature = signPayload(payload, key);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    return false;
  }
}

/**
 * Co-sign a payload (Tower + Factory)
 */
export function coSign(
  payload: Record<string, any>,
  factorySignature: string,
  towerKey: SigningKey
): {
  factorySignature: string;
  towerSignature: string;
  towerKid: string;
  signedAt: string;
} {
  const towerSignature = signPayload(payload, towerKey);

  return {
    factorySignature,
    towerSignature,
    towerKid: towerKey.kid,
    signedAt: new Date().toISOString(),
  };
}
