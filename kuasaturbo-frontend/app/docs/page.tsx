import Card from "@/components/shared/Card";
import Link from "next/link";

export default function DocsPage() {
  const sections = [
    {
      title: "Getting Started",
      links: [
        { name: "Quick Start Guide", href: "#" },
        { name: "Authentication", href: "#" },
        { name: "Your First Request", href: "#" },
      ],
    },
    {
      title: "API Reference",
      links: [
        { name: "Creative Tasks", href: "#" },
        { name: "Workflow Execution", href: "#" },
        { name: "Credit Management", href: "#" },
        { name: "Error Handling", href: "#" },
      ],
    },
    {
      title: "Verticals",
      links: [
        { name: "Automotive", href: "#" },
        { name: "F&B", href: "#" },
        { name: "Solar (Coming Soon)", href: "#" },
      ],
    },
    {
      title: "Integration Guides",
      links: [
        { name: "Node.js SDK", href: "#" },
        { name: "Python SDK", href: "#" },
        { name: "REST API", href: "#" },
        { name: "Webhooks", href: "#" },
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-6">Documentation</h1>
      <p className="text-xl text-slate-600 mb-12">
        Everything you need to integrate and use KuasaTurbo.
      </p>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {sections.map((section) => (
          <Card key={section.title}>
            <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
            <ul className="space-y-2">
              {section.links.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-primary hover:underline">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card className="bg-primary/5">
        <h2 className="text-2xl font-bold mb-4">API Example</h2>
        <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
          <code>{`POST /api/v1/creative/generate
{
  "task": "thumbnail",
  "style": "energetic",
  "inputs": {
    "brand_name": "AutoHub KL",
    "title": "Year End Sale",
    "subtitle": "Up to 30% off",
    "cta_text": "Shop Now"
  }
}`}</code>
        </pre>
      </Card>
    </div>
  );
}
