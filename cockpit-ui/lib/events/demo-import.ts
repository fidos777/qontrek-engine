/**
 * Demo: How to trigger governance updates
 *
 * Use this to simulate an import completion that updates governance badges
 */

import { emit } from './bus';
import { updateGovernanceScore, updateGovernance } from '../state/voltekStore';

export function simulateImportCompletion(newScore: number = 85) {
  // Update the store with new governance data
  updateGovernanceScore(newScore);

  // Optionally update badges
  // updateGovernance({ badges: [...] });

  // Emit the import:completed event
  emit('import:completed', { score: newScore });
}

// Example usage:
// import { simulateImportCompletion } from '@/lib/events/demo-import';
// simulateImportCompletion(92); // Updates score to 92 and triggers animations
