"use client";

/**
 * Example Integration: Impact Summary Modal
 *
 * This example shows how to integrate the Impact Summary modal
 * with import completion events.
 *
 * To use in your app:
 * 1. Import and use the hook in your parent component
 * 2. Render the modal
 * 3. Call dispatchImportCompleted() when imports finish
 */

import { useImpactSummary, useImportCompletedListener, dispatchImportCompleted } from "../../lib/voltek/useImpactSummary";
import { ImpactSummaryModal } from "./ImpactSummaryModal";
import { initializeSnapshot, updateSnapshot } from "../../lib/voltek/snapshotStore";
import type { Snapshot } from "../../lib/voltek/snapshotStore";

export function ImpactSummaryExample() {
  const impact = useImpactSummary();

  // Automatically open modal when import completes
  useImportCompletedListener(impact.openModal);

  // Simulate an import operation
  const handleSimulateImport = () => {
    // Create "before" snapshot
    initializeSnapshot({
      recovery_rate_7d: 0.32,
      success_rate: 0.95,
      trust_index: 92.5,
    });

    // Simulate import process
    setTimeout(() => {
      // Update to "after" snapshot
      const afterSnapshot: Snapshot = {
        recovery_rate_7d: 0.38, // +6%
        success_rate: 0.98, // +3%
        trust_index: 96.2, // +3.7 (triggers confetti!)
        timestamp: new Date().toISOString(),
      };
      updateSnapshot(afterSnapshot);

      // Trigger the import:completed event
      dispatchImportCompleted();
    }, 1000);
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Impact Summary Demo</h1>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">How it works:</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Click "Simulate Import" to trigger a mock import operation</li>
            <li>The system saves the current snapshot as "before"</li>
            <li>After 1 second, new data is imported</li>
            <li>The modal shows the KPI deltas with animations</li>
            <li>If trust_index increases by ≥3, you'll see confetti!</li>
          </ol>
        </div>

        <button
          onClick={handleSimulateImport}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg shadow-md transition-colors"
        >
          Simulate Import
        </button>

        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold mb-3">Integration Code:</h3>
          <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded overflow-x-auto">
{`// In your component:
import { useImpactSummary, useImportCompletedListener } from '@/lib/voltek/useImpactSummary';
import { ImpactSummaryModal } from '@/components/voltek/ImpactSummaryModal';

function MyApp() {
  const impact = useImpactSummary();
  useImportCompletedListener(impact.openModal);

  return (
    <>
      <YourContent />
      <ImpactSummaryModal
        isOpen={impact.isOpen}
        onClose={impact.closeModal}
        before={impact.beforeSnapshot}
        after={impact.afterSnapshot}
      />
    </>
  );
}

// When import completes:
import { dispatchImportCompleted } from '@/lib/voltek/useImpactSummary';
import { updateSnapshot } from '@/lib/voltek/snapshotStore';

async function handleImport() {
  // ... fetch new data
  updateSnapshot(newSnapshot);
  dispatchImportCompleted(); // This opens the modal
}`}
          </pre>
        </div>
      </div>

      <ImpactSummaryModal
        isOpen={impact.isOpen}
        onClose={impact.closeModal}
        before={impact.beforeSnapshot}
        after={impact.afterSnapshot}
      />
    </div>
  );
}
