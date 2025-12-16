import Link from "next/link";
import Card from "@/components/shared/Card";
import Badge from "@/components/shared/Badge";
import { VERTICALS } from "@/lib/constants";

export default function VerticalsPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-6">Industry Verticals</h1>
      <p className="text-xl text-slate-600 mb-12">
        KuasaTurbo supports multiple industries with specialized workflows.
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {VERTICALS.map((vertical) => (
          <Link key={vertical.slug} href={`/verticals/${vertical.slug}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-2xl font-bold">{vertical.name}</h2>
                <Badge variant={vertical.status === "available" ? "success" : "default"}>
                  {vertical.status === "available" ? "Available" : "Coming Soon"}
                </Badge>
              </div>
              <p className="text-slate-600">{vertical.description}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-16 bg-slate-100 rounded-xl p-8">
        <h2 className="text-2xl font-bold mb-4">Need a Custom Vertical?</h2>
        <p className="text-slate-700 mb-4">
          We can build custom workflows for your specific industry. Contact our team to discuss your requirements.
        </p>
        <Link href="/partners" className="text-primary font-medium hover:underline">
          Learn about partnerships →
        </Link>
      </div>
    </div>
  );
}
