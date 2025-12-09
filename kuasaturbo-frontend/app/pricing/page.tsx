import Card from "@/components/shared/Card";
import Button from "@/components/shared/Button";
import Link from "next/link";

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      credits: 100,
      price: "RM 50",
      features: [
        "100 credits",
        "All creative tasks",
        "Basic support",
        "30 days validity",
      ],
    },
    {
      name: "Professional",
      credits: 500,
      price: "RM 200",
      features: [
        "500 credits",
        "All creative tasks",
        "Priority support",
        "90 days validity",
        "10% bonus credits",
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      credits: 2000,
      price: "RM 700",
      features: [
        "2000 credits",
        "All creative tasks",
        "Dedicated support",
        "180 days validity",
        "20% bonus credits",
        "Custom integrations",
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Simple, Credit-Based Pricing</h1>
        <p className="text-xl text-slate-600">
          Pay as you go. No monthly fees. Credits never expire.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-16">
        {plans.map((plan) => (
          <Card key={plan.name} className={plan.popular ? "border-2 border-primary" : ""}>
            {plan.popular && (
              <div className="text-primary font-bold text-sm mb-2">MOST POPULAR</div>
            )}
            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
            <div className="text-3xl font-bold text-primary mb-4">{plan.price}</div>
            <div className="text-slate-600 mb-6">{plan.credits} credits</div>
            <ul className="space-y-3 mb-6">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span className="text-slate-700">{feature}</span>
                </li>
              ))}
            </ul>
            <Link href="/api-access">
              <Button variant={plan.popular ? "primary" : "secondary"} className="w-full">
                Get Started
              </Button>
            </Link>
          </Card>
        ))}
      </div>

      <div className="bg-slate-100 rounded-xl p-8">
        <h2 className="text-2xl font-bold mb-4">Credit Usage</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold mb-2">Creative Tasks</h3>
            <ul className="space-y-2 text-slate-700">
              <li>• Thumbnail: 3 credits</li>
              <li>• Product Render: 4 credits</li>
              <li>• Story Infographic: 4 credits</li>
              <li>• Car Visualizer: 5 credits</li>
              <li>• Image Cleanup: 2 credits</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-2">Model Multipliers</h3>
            <ul className="space-y-2 text-slate-700">
              <li>• GPT-4o: 1.5x</li>
              <li>• Claude Sonnet: 1.3x</li>
              <li>• Gemini Flash: 1.0x</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
