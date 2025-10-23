import { NextRequest, NextResponse } from 'next/server';
import { getReceipt } from '@/lib/tower/receipts';

/**
 * GET /api/tower/ack/{receipt_id}
 *
 * Returns verified status and timestamp for a given receipt.
 *
 * Response:
 * {
 *   "receiptId": "rcpt_...",
 *   "status": "verified",
 *   "echoRoot": "...",
 *   "uploadedAt": "...",
 *   "verifiedAt": "...",
 *   "manifestHash": "..."
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { receipt_id: string } }
) {
  try {
    const { receipt_id } = params;

    if (!receipt_id) {
      return NextResponse.json(
        { error: 'Missing receipt_id parameter' },
        { status: 400 }
      );
    }

    const receipt = await getReceipt(receipt_id);

    if (!receipt) {
      return NextResponse.json(
        { error: 'Receipt not found' },
        { status: 404 }
      );
    }

    // Auto-verify received receipts after retrieval
    // In production, this would involve additional validation steps
    if (receipt.status === 'received') {
      receipt.status = 'verified';
      receipt.verifiedAt = new Date().toISOString();

      // Update stored receipt
      const { storeReceipt } = await import('@/lib/tower/receipts');
      await storeReceipt(receipt);
    }

    return NextResponse.json({
      receiptId: receipt.receiptId,
      status: receipt.status,
      echoRoot: receipt.echoRoot,
      uploadedAt: receipt.uploadedAt,
      verifiedAt: receipt.verifiedAt,
      manifestHash: receipt.manifestHash,
      errors: receipt.errors,
    });

  } catch (error) {
    console.error('Tower ack error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
