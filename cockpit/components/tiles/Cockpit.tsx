import TrustChartTile from "./TrustChartTile";
import DocTrackerTile from "./DocTrackerTile";

export default function Cockpit() {
  return (
    <main className="p-6 grid grid-cols-2 gap-6">
      <TrustChartTile />
      <DocTrackerTile />
    </main>
  );
}

