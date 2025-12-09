import Card from "@/components/shared/Card";
import Button from "@/components/shared/Button";

export default function CreditsPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-6">Credit System</h1>
      <p className="text-xl text-slate-600 mb-12">
        Understand how credits work and how to maximize your usage.
      </p>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <Card>
          <h2 className="text-2xl font-bold mb-4">How Credits Work</h2>
          <ul className="space-y-3 text-slate-700">
            <li>• Each task consumes a base amount of credits</li>
            <li>• Model selection applies a multiplier</li>
            <li>• Credits are deducted after successful execution</li>
            <li>• Failed tasks don't consume credits</li>
            <li>• Credits never expire</li>
          </ul>
        </Card>

        <Card>
          <h2 className="text-2xl font-bold mb-4">Top Up Options</h2>
          <ul className="space-y-3 text-slate-700">
            <li>• Buy credits anytime via dashboard</li>
            <li>• Bulk purchases get bonus credits</li>
            <li>• Enterprise plans available</li>
            <li>• Reseller programs for agencies</li>
          </ul>
        </Card>
      </div>

      <Card className="bg-primary/5">
        <h2 className="text-2xl font-bold mb-4">Credit Calculation Example</h2>
        <div className="space-y-4 text-slate-700">
          <div>
            <strong>Task:</strong> Car Visualizer (5 credits base)
          </div>
          <div>
            <strong>Model:</strong> GPT-4o (1.5x multiplier)
          </div>
          <div className="text-xl font-bold text-primary">
            Total: 5 × 1.5 = 7.5 credits (rounded to 8)
          </div>
        </div>
      </Card>

      <div className="text-center mt-12">
        <Button variant="primary">Buy Credits Now</Button>
      </div>
    </div>
  );
}
