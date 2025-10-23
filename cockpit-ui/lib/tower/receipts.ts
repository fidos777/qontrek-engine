import { writeFile, readFile, readdir } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';

export interface TowerReceipt {
  receiptId: string;
  manifestHash: string;
  echoRoot: string;
  uploadedAt: string;
  verifiedAt?: string;
  status: 'pending' | 'received' | 'verified' | 'rejected';
  manifest: {
    version: string;
    files: Array<{ path: string; sha256: string }>;
    merkleRoot: string;
  };
  signatures: {
    factorySignature: string;
    towerSignature: string;
    towerKid: string;
  };
  errors?: string[];
}

/**
 * Generate unique receipt ID
 */
export function generateReceiptId(): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `rcpt_${timestamp}_${random}`;
}

/**
 * Store Tower receipt to filesystem
 */
export async function storeReceipt(receipt: TowerReceipt): Promise<void> {
  const receiptPath = join(
    process.cwd(),
    '..',
    'proof',
    'tower_receipts',
    `${receipt.receiptId}.json`
  );

  await writeFile(receiptPath, JSON.stringify(receipt, null, 2), 'utf-8');
}

/**
 * Retrieve Tower receipt by ID
 */
export async function getReceipt(receiptId: string): Promise<TowerReceipt | null> {
  try {
    const receiptPath = join(
      process.cwd(),
      '..',
      'proof',
      'tower_receipts',
      `${receiptId}.json`
    );

    const content = await readFile(receiptPath, 'utf-8');
    return JSON.parse(content) as TowerReceipt;
  } catch (error) {
    return null;
  }
}

/**
 * List all receipts (for dashboard)
 */
export async function listReceipts(limit = 50): Promise<TowerReceipt[]> {
  try {
    const receiptsDir = join(process.cwd(), '..', 'proof', 'tower_receipts');
    const files = await readdir(receiptsDir);

    const receiptFiles = files
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse()
      .slice(0, limit);

    const receipts = await Promise.all(
      receiptFiles.map(async (file) => {
        const content = await readFile(join(receiptsDir, file), 'utf-8');
        return JSON.parse(content) as TowerReceipt;
      })
    );

    return receipts;
  } catch (error) {
    return [];
  }
}

/**
 * Update receipt status
 */
export async function updateReceiptStatus(
  receiptId: string,
  status: TowerReceipt['status'],
  errors?: string[]
): Promise<TowerReceipt | null> {
  const receipt = await getReceipt(receiptId);
  if (!receipt) return null;

  receipt.status = status;
  if (status === 'verified') {
    receipt.verifiedAt = new Date().toISOString();
  }
  if (errors) {
    receipt.errors = errors;
  }

  await storeReceipt(receipt);
  return receipt;
}

/**
 * Emit tower_receipt_v1.json for CI consumption
 */
export async function emitTowerReceiptProof(receipt: TowerReceipt): Promise<void> {
  const proofPath = join(
    process.cwd(),
    '..',
    'proof',
    'tower_receipt_v1.json'
  );

  const proof = {
    schema: 'tower_receipt_v1',
    receiptId: receipt.receiptId,
    status: receipt.status,
    echoRoot: receipt.echoRoot,
    verifiedAt: receipt.verifiedAt,
    manifestHash: receipt.manifestHash,
    generatedAt: new Date().toISOString(),
  };

  await writeFile(proofPath, JSON.stringify(proof, null, 2), 'utf-8');
}
