import Card from "@/components/shared/Card";
import Button from "@/components/shared/Button";
import Link from "next/link";

export default function PartnersPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-6">Partnership Opportunities</h1>
      <p className="text-xl text-slate-600 mb-12">
        Grow your business with KuasaTurbo. Multiple partnership models available.
      </p>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <Card>
          <h2 className="text-2xl font-bold mb-4">Consultant</h2>
          <p className="text-slate-600 mb-6">
            Help businesses implement and optimize KuasaTurbo workflows.
          </p>
          <ul className="space-y-2 text-slate-700 mb-6">
            <li>• 20% commission</li>
            <li>• Recurring revenue</li>
            <li>• Training provided</li>
          </ul>
          <Link href="/consultant">
            <Button variant="secondary" className="w-full">Learn More</Button>
          </Link>
        </Card>

        <Card>
          <h2 className="text-2xl font-bold mb-4">Reseller</h2>
          <p className="text-slate-600 mb-6">
            White-label and resell KuasaTurbo under your brand.
          </p>
          <ul className="space-y-2 text-slate-700 mb-6">
            <li>• Wholesale pricing</li>
            <li>• Set your margins</li>
            <li>• White-label option</li>
          </ul>
          <Link href="/reseller">
            <Button variant="secondary" className="w-full">Learn More</Button>
          </Link>
        </Card>

        <Card>
          <h2 className="text-2xl font-bold mb-4">Technology</h2>
          <p className="text-slate-600 mb-6">
            Integrate KuasaTurbo into your platform or product.
          </p>
          <ul className="space-y-2 text-slate-700 mb-6">
            <li>• API access</li>
            <li>• Custom integrations</li>
            <li>• Technical support</li>
          </ul>
          <Link href="/api-access">
            <Button variant="secondary" className="w-full">Learn More</Button>
          </Link>
        </Card>
      </div>

      <Card className="bg-primary/5">
        <h2 className="text-2xl font-bold mb-4">Why Partner with KuasaTurbo?</h2>
        <div className="grid md:grid-cols-2 gap-6 text-slate-700">
          <div>
            <strong>Growing Market</strong>
            <p className="mt-2">Malaysian SMEs are rapidly adopting AI automation</p>
          </div>
          <div>
            <strong>Proven Platform</strong>
            <p className="mt-2">Battle-tested with automotive, F&B, and more</p>
          </div>
          <div>
            <strong>Fair Economics</strong>
            <p className="mt-2">Transparent pricing and generous partner margins</p>
          </div>
          <div>
            <strong>Full Support</strong>
            <p className="mt-2">Dedicated partner success team</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
