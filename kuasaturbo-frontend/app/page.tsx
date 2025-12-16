import Link from "next/link";
import Button from "@/components/shared/Button";
import Card from "@/components/shared/Card";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      {/* Hero Section */}
      <section className="text-center mb-20">
        <h1 className="text-5xl font-bold mb-6 text-slate-900">
          AI Microservices untuk Malaysian Business
        </h1>
        <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
          Tak perlu hire developer. Tak perlu belajar coding. Pilih widget, pilih persona, tekan run.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/playground">
            <Button variant="primary">Try Playground</Button>
          </Link>
          <Link href="/pricing">
            <Button variant="secondary">View Pricing</Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-center mb-12">Kenapa KuasaTurbo?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <h3 className="text-xl font-bold mb-3">Fast & Simple</h3>
            <p className="text-slate-600">
              No coding required. Pilih task, upload image, dapat result dalam seconds.
            </p>
          </Card>
          <Card>
            <h3 className="text-xl font-bold mb-3">Multi-Vertical</h3>
            <p className="text-slate-600">
              Automotive, F&B, Solar, Property – satu platform untuk semua industry.
            </p>
          </Card>
          <Card>
            <h3 className="text-xl font-bold mb-3">Credit-Based</h3>
            <p className="text-slate-600">
              Pay as you go. Top up credits, guna bila perlu. No monthly commitment.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center bg-primary/5 rounded-2xl p-12">
        <h2 className="text-3xl font-bold mb-4">Ready to start?</h2>
        <p className="text-lg text-slate-600 mb-6">
          Get API access and start building today.
        </p>
        <Link href="/api-access">
          <Button variant="primary">Get Started</Button>
        </Link>
      </section>
    </div>
  );
}
