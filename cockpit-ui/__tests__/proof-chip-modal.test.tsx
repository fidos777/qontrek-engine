// __tests__/proof-chip-modal.test.tsx
// Tests for ProofChipV3 and ProofModalMini

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProofChipV3, ProofModalMini } from '@/components/trust/ProofChipV3';
import '@testing-library/jest-dom';

// Mock fetch API
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock Web Crypto API for SHA-256
const mockCrypto = {
  subtle: {
    digest: vi.fn((algorithm: string, data: BufferSource) => {
      // Return a mock hash (32 bytes = 64 hex chars)
      const mockHash = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        mockHash[i] = i;
      }
      return Promise.resolve(mockHash.buffer);
    }),
  },
};

Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true,
});

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

// Test fixture
const mockProofData = {
  summary: {
    total_recoverable: 1500000,
    total_pipeline: 25,
    avg_ticket: 60000,
  },
  details: {
    top_accounts: [
      { name: 'Acme Corp', amount: 500000 },
      { name: 'Beta Inc', amount: 300000 },
    ],
  },
};

describe('ProofChipV3 + ProofModalMini', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockProofData,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ProofChipV3', () => {
    it('renders chip with label', () => {
      render(
        <>
          <ProofModalMini />
          <ProofChipV3
            refName="pipeline.total"
            proofRef="/proof/g2_dashboard_v19.1.json#$.summary.total_recoverable"
            label="Total Recoverable"
          />
        </>
      );

      const chip = screen.getByRole('button', { name: /view proof for total recoverable/i });
      expect(chip).toBeInTheDocument();
      expect(chip).toHaveTextContent('Total Recoverable');
    });

    it('renders chip with default label when no label provided', () => {
      render(
        <>
          <ProofModalMini />
          <ProofChipV3
            refName="pipeline.total"
            proofRef="/proof/g2_dashboard_v19.1.json#$.summary.total_recoverable"
          />
        </>
      );

      const chip = screen.getByRole('button', { name: /view proof for pipeline.total/i });
      expect(chip).toBeInTheDocument();
      expect(chip).toHaveTextContent('Proof');
    });

    it('opens modal on click', async () => {
      render(
        <>
          <ProofModalMini />
          <ProofChipV3
            refName="pipeline.total"
            proofRef="/proof/g2_dashboard_v19.1.json#$.summary.total_recoverable"
            label="Total Recoverable"
          />
        </>
      );

      const chip = screen.getByRole('button', { name: /view proof for total recoverable/i });
      fireEvent.click(chip);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(screen.getByText(/Proof: pipeline.total/i)).toBeInTheDocument();
    });

    it('opens modal on Enter key', async () => {
      render(
        <>
          <ProofModalMini />
          <ProofChipV3
            refName="pipeline.total"
            proofRef="/proof/g2_dashboard_v19.1.json#$.summary.total_recoverable"
            label="Total Recoverable"
          />
        </>
      );

      const chip = screen.getByRole('button', { name: /view proof for total recoverable/i });
      fireEvent.keyDown(chip, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('opens modal on Space key', async () => {
      render(
        <>
          <ProofModalMini />
          <ProofChipV3
            refName="pipeline.total"
            proofRef="/proof/g2_dashboard_v19.1.json#$.summary.total_recoverable"
            label="Total Recoverable"
          />
        </>
      );

      const chip = screen.getByRole('button', { name: /view proof for total recoverable/i });
      fireEvent.keyDown(chip, { key: ' ' });

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('applies custom className', () => {
      render(
        <>
          <ProofModalMini />
          <ProofChipV3
            refName="test"
            proofRef="/proof/test.json#$.test"
            className="custom-class"
          />
        </>
      );

      const chip = screen.getByRole('button');
      expect(chip).toHaveClass('custom-class');
    });
  });

  describe('ProofModalMini', () => {
    it('fetches and displays proof data at correct JSONPath', async () => {
      render(
        <>
          <ProofModalMini />
          <ProofChipV3
            refName="pipeline.total"
            proofRef="/proof/g2_dashboard_v19.1.json#$.summary.total_recoverable"
            label="Total Recoverable"
          />
        </>
      );

      const chip = screen.getByRole('button');
      fireEvent.click(chip);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/proof/g2_dashboard_v19.1.json');
      });

      await waitFor(() => {
        expect(screen.getByText(/1500000/)).toBeInTheDocument();
      });

      expect(screen.getByText(/\$\.summary\.total_recoverable/)).toBeInTheDocument();
      expect(screen.getByText(/g2_dashboard_v19\.1\.json/)).toBeInTheDocument();
    });

    it('resolves nested JSONPath correctly', async () => {
      render(
        <>
          <ProofModalMini />
          <ProofChipV3
            refName="top.account"
            proofRef="/proof/g2_dashboard_v19.1.json#$.details.top_accounts[0].name"
            label="Top Account"
          />
        </>
      );

      const chip = screen.getByRole('button');
      fireEvent.click(chip);

      await waitFor(() => {
        expect(screen.getByText(/"Acme Corp"/)).toBeInTheDocument();
      });
    });

    it('closes modal on Escape key', async () => {
      render(
        <>
          <ProofModalMini />
          <ProofChipV3
            refName="test"
            proofRef="/proof/test.json#$.test"
          />
        </>
      );

      const chip = screen.getByRole('button');
      fireEvent.click(chip);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('closes modal on close button click', async () => {
      render(
        <>
          <ProofModalMini />
          <ProofChipV3
            refName="test"
            proofRef="/proof/test.json#$.test"
          />
        </>
      );

      const chip = screen.getByRole('button');
      fireEvent.click(chip);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /close modal/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('closes modal on backdrop click', async () => {
      render(
        <>
          <ProofModalMini />
          <ProofChipV3
            refName="test"
            proofRef="/proof/test.json#$.test"
          />
        </>
      );

      const chip = screen.getByRole('button');
      fireEvent.click(chip);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const backdrop = screen.getByRole('dialog').previousSibling as HTMLElement;
      fireEvent.click(backdrop);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('copies deep-link on copy button click', async () => {
      const proofRef = '/proof/g2_dashboard_v19.1.json#$.summary.total_recoverable';

      render(
        <>
          <ProofModalMini />
          <ProofChipV3
            refName="test"
            proofRef={proofRef}
          />
        </>
      );

      const chip = screen.getByRole('button');
      fireEvent.click(chip);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const copyButton = screen.getByRole('button', { name: /copy deep-link/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(proofRef);
      });

      expect(screen.getByText(/✓ Copied!/i)).toBeInTheDocument();
    });

    it('shows loading state while fetching', async () => {
      // Delay the fetch response
      mockFetch.mockReturnValue(
        new Promise(resolve =>
          setTimeout(() => resolve({ ok: true, json: async () => mockProofData }), 100)
        )
      );

      render(
        <>
          <ProofModalMini />
          <ProofChipV3
            refName="test"
            proofRef="/proof/test.json#$.test"
          />
        </>
      );

      const chip = screen.getByRole('button');
      fireEvent.click(chip);

      await waitFor(() => {
        expect(screen.getByText(/loading proof/i)).toBeInTheDocument();
      });
    });

    it('shows error on fetch failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      });

      render(
        <>
          <ProofModalMini />
          <ProofChipV3
            refName="test"
            proofRef="/proof/test.json#$.test"
          />
        </>
      );

      const chip = screen.getByRole('button');
      fireEvent.click(chip);

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument();
      });
    });

    it('shows error on invalid proofRef format', async () => {
      render(
        <>
          <ProofModalMini />
          <ProofChipV3
            refName="test"
            proofRef="invalid-format"
          />
        </>
      );

      const chip = screen.getByRole('button');
      fireEvent.click(chip);

      await waitFor(() => {
        expect(screen.getByText(/Invalid proofRef format/i)).toBeInTheDocument();
      });
    });

    it('shows error on invalid JSONPath', async () => {
      render(
        <>
          <ProofModalMini />
          <ProofChipV3
            refName="test"
            proofRef="/proof/test.json#$.nonexistent.path"
          />
        </>
      );

      const chip = screen.getByRole('button');
      fireEvent.click(chip);

      await waitFor(() => {
        expect(screen.getByText(/did not resolve to any value/i)).toBeInTheDocument();
      });
    });

    it('shows drift banner when hash mismatch detected (after 500ms debounce)', async () => {
      const expectedHash = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

      render(
        <>
          <ProofModalMini />
          <ProofChipV3
            refName="test"
            proofRef="/proof/test.json#$.summary.total_recoverable"
            expectedSha256={expectedHash}
          />
        </>
      );

      const chip = screen.getByRole('button');
      fireEvent.click(chip);

      // Should NOT show drift banner immediately
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Wait for debounce (500ms)
      await new Promise(resolve => setTimeout(resolve, 600));

      await waitFor(() => {
        expect(screen.getByText(/drift detected/i)).toBeInTheDocument();
      });

      expect(screen.getByText(new RegExp(expectedHash))).toBeInTheDocument();
    });

    it('does NOT show drift banner when hashes match', async () => {
      // The mock crypto always returns the same hash
      const mockHash = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';

      render(
        <>
          <ProofModalMini />
          <ProofChipV3
            refName="test"
            proofRef="/proof/test.json#$.summary.total_recoverable"
            expectedSha256={mockHash}
          />
        </>
      );

      const chip = screen.getByRole('button');
      fireEvent.click(chip);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 600));

      expect(screen.queryByText(/drift detected/i)).not.toBeInTheDocument();
    });

    it('returns focus to chip after modal closes', async () => {
      render(
        <>
          <ProofModalMini />
          <ProofChipV3
            refName="test"
            proofRef="/proof/test.json#$.test"
          />
        </>
      );

      const chip = screen.getByRole('button');
      fireEvent.click(chip);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /close modal/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Check that focus is returned to chip
      expect(document.activeElement).toBe(chip);
    });
  });

  describe('Accessibility', () => {
    it('chip has correct ARIA attributes', () => {
      render(
        <>
          <ProofModalMini />
          <ProofChipV3
            refName="test"
            proofRef="/proof/test.json#$.test"
            label="Test Label"
          />
        </>
      );

      const chip = screen.getByRole('button');
      expect(chip).toHaveAttribute('role', 'button');
      expect(chip).toHaveAttribute('tabIndex', '0');
      expect(chip).toHaveAttribute('aria-label', 'View proof for Test Label');
    });

    it('modal has correct ARIA attributes', async () => {
      render(
        <>
          <ProofModalMini />
          <ProofChipV3
            refName="test"
            proofRef="/proof/test.json#$.test"
          />
        </>
      );

      const chip = screen.getByRole('button');
      fireEvent.click(chip);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAttribute('aria-labelledby', 'proof-modal-title');
      });
    });

    it('drift banner has alert role', async () => {
      const expectedHash = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

      render(
        <>
          <ProofModalMini />
          <ProofChipV3
            refName="test"
            proofRef="/proof/test.json#$.summary.total_recoverable"
            expectedSha256={expectedHash}
          />
        </>
      );

      const chip = screen.getByRole('button');
      fireEvent.click(chip);

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 600));

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
      });
    });
  });

  describe('Telemetry', () => {
    it('logs ui.proof_chip.open event on modal open', async () => {
      const consoleSpy = vi.spyOn(console, 'log');

      render(
        <>
          <ProofModalMini />
          <ProofChipV3
            refName="pipeline.total"
            proofRef="/proof/g2_dashboard_v19.1.json#$.summary.total_recoverable"
          />
        </>
      );

      const chip = screen.getByRole('button');
      fireEvent.click(chip);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          '[TELEMETRY]',
          expect.stringContaining('ui.proof_chip.open')
        );
      });

      const telemetryCall = consoleSpy.mock.calls.find(
        call => call[0] === '[TELEMETRY]' && call[1].includes('ui.proof_chip.open')
      );

      expect(telemetryCall).toBeDefined();
      const eventData = JSON.parse(telemetryCall![1]);
      expect(eventData.event).toBe('ui.proof_chip.open');
      expect(eventData.refName).toBe('pipeline.total');
      expect(eventData.proofRef).toBe('/proof/g2_dashboard_v19.1.json#$.summary.total_recoverable');
      expect(eventData.timestamp).toBeDefined();

      consoleSpy.mockRestore();
    });

    it('logs ui.proof_chip.copy_deeplink event on copy', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const proofRef = '/proof/g2_dashboard_v19.1.json#$.summary.total_recoverable';

      render(
        <>
          <ProofModalMini />
          <ProofChipV3
            refName="test"
            proofRef={proofRef}
          />
        </>
      );

      const chip = screen.getByRole('button');
      fireEvent.click(chip);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const copyButton = screen.getByRole('button', { name: /copy deep-link/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          '[TELEMETRY]',
          expect.stringContaining('ui.proof_chip.copy_deeplink')
        );
      });

      const telemetryCall = consoleSpy.mock.calls.find(
        call => call[0] === '[TELEMETRY]' && call[1].includes('ui.proof_chip.copy_deeplink')
      );

      expect(telemetryCall).toBeDefined();
      const eventData = JSON.parse(telemetryCall![1]);
      expect(eventData.event).toBe('ui.proof_chip.copy_deeplink');
      expect(eventData.proofRef).toBe(proofRef);

      consoleSpy.mockRestore();
    });
  });
});
