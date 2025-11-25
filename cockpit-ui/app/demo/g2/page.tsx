"use client";

import ConfidenceMeterAnimated from "@/components/voltek/ConfidenceMeterAnimated";
import ProofFreshnessIndicator from "@/components/voltek/ProofFreshnessIndicator";
import GovernanceHeaderStrip from "@/components/voltek/GovernanceHeaderStrip";

export default function DemoG2Page() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Demo G2 Page</h1>
      <GovernanceHeaderStrip />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ConfidenceMeterAnimated />
        <ProofFreshnessIndicator />
      </div>
    </div>
  );
}
