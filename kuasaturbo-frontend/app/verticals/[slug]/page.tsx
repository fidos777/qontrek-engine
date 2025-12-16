import { notFound } from "next/navigation";
import Link from "next/link";
import Card from "@/components/shared/Card";
import Button from "@/components/shared/Button";
import Badge from "@/components/shared/Badge";
import { VERTICALS } from "@/lib/constants";

export default function VerticalDetailPage({ params }: { params: { slug: string } }) {
  const vertical = VERTICALS.find((v) => v.slug === params.slug);

  if (!vertical) {
    notFound();
  }

  // Mock workflows for each vertical
  const workflows: Record<string, Array<{ name: string; description: string }>> = {
    automotive: [
      { name: "Trade-In Evaluation", description: "Assess vehicle value for trade-in" },
      { name: "Loan Eligibility Check", description: "Calculate loan approval likelihood" },
      { name: "Lead Intake", description: "Capture and qualify customer leads" },
    ],
    fnb: [
      { name: "Menu Update", description: "Generate menu descriptions and pricing" },
      { name: "Promo Generator", description: "Create promotional content" },
    ],
    solar: [
      { name: "ROI Calculator", description: "Calculate solar installation returns" },
      { name: "Proposal Generator", description: "Generate customer proposals" },
    ],
    takaful: [
      { name: "Coverage Calculator", description: "Determine coverage needs" },
      { name: "Policy Comparison", description: "Compare policy options" },
    ],
    property: [
      { name: "Mortgage Calculator", description: "Calculate mortgage eligibility" },
      { name: "Property Valuation", description: "Estimate property value" },
    ],
  };

  const verticalWorkflows = workflows[vertical.slug] || [];

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-8">
        <Link href="/verticals" className="text-primary hover:underline mb-4 inline-block">
          ← Back to Verticals
        </Link>
        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-4xl font-bold">{vertical.name}</h1>
          <Badge variant={vertical.status === "available" ? "success" : "default"}>
            {vertical.status === "available" ? "Available" : "Coming Soon"}
          </Badge>
        </div>
        <p className="text-xl text-slate-600">{vertical.description}</p>
      </div>

      {vertical.status === "available" ? (
        <>
          <h2 className="text-2xl font-bold mb-6">Available Workflows</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {verticalWorkflows.map((workflow) => (
              <Card key={workflow.name}>
                <h3 className="text-xl font-bold mb-2">{workflow.name}</h3>
                <p className="text-slate-600">{workflow.description}</p>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Link href="/playground">
              <Button variant="primary">Try in Playground</Button>
            </Link>
          </div>
        </>
      ) : (
        <Card className="bg-slate-100 text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Coming Soon</h2>
          <p className="text-slate-600 mb-6">
            This vertical is under development. Join our waitlist to be notified when it launches.
          </p>
          <Button variant="secondary">Join Waitlist</Button>
        </Card>
      )}
    </div>
  );
}
