/**
 * Voltek Library
 * Snapshot management and impact tracking
 */

export {
  getSnapshot,
  getPrevSnapshot,
  updateSnapshot,
  initializeSnapshot,
  resetSnapshots,
} from "./snapshotStore";

export type { Snapshot } from "./snapshotStore";

export {
  useImpactSummary,
  useImportCompletedListener,
  dispatchImportCompleted,
} from "./useImpactSummary";
