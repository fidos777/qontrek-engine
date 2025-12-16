import Card from "@/components/shared/Card";
import Button from "@/components/shared/Button";

export default function ResellerPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-6">Reseller Program</h1>
      <p className="text-xl text-slate-600 mb-12">
        White-label KuasaTurbo and sell to your customers under your brand.
      </p>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <Card>
          <h2 className="text-2xl font-bold mb-4">Reseller Benefits</h2>
          <ul className="space-y-3 text-slate-700">
            <li>• Buy credits in bulk at wholesale rates</li>
            <li>• Set your own pricing and margins</li>
            <li>• White-label dashboard (optional)</li>
            <li>• Dedicated account manager</li>
            <li>• Custom integrations available</li>
          </ul>
        </Card>

        <Card>
          <h2 className="text-2xl font-bold mb-4">Pricing Tiers</h2>
          <ul className="space-y-3 text-slate-700">
            <li>• Bronze: 1,000 credits/month - 15% discount</li>
            <li>• Silver: 5,000 credits/month - 25% discount</li>
            <li>• Gold: 20,000 credits/month - 35% discount</li>
            <li>• Platinum: Custom volume - Custom pricing</li>
          </ul>
        </Card>
      </div>

      <Card className="bg-primary/5 mb-12">
        <h2 className="text-2xl font-bold mb-4">Use Cases</h2>
        <div className="grid md:grid-cols-2 gap-6 text-slate-700">
          <div>
            <strong>SaaS Platforms</strong>
            <p className="mt-2">Embed AI features into your product</p>
          </div>
          <div>
            <strong>Marketing Agencies</strong>
            <p className="mt-2">Offer creative automation to clients</p>
          </div>
          <div>
            <strong>Industry Solutions</strong>
            <p className="mt-2">Build vertical-specific offerings</p>
          </div>
          <div>
            <strong>Enterprise IT</strong>
            <p className="mt-2">Deploy internally for departments</p>
          </div>
        </div>
      </Card>

      <div className="text-center">
        <Button variant="primary">Apply as Reseller</Button>
      </div>
    </div>
  );
}
