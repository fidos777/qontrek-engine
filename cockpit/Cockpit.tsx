import TrustChartTile from "@/cockpit/components/tiles/TrustChartTile";
import DocTrackerTile from "@/cockpit/components/tiles/DocTrackerTile";

export default function Cockpit() {
  return (
    <main className="p-6 grid grid-cols-2 gap-6">
      <TrustChartTile />
      <DocTrackerTile />
    </main>
  );
}

