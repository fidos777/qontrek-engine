import Link from "next/link";

export default function HomePage() {
  const dashboards = [
    { href: "/demo/g2", title: "Demo: G2 Payment Recovery", description: "Voltek demo with sample data" },
    { href: "/gates/g0", title: "Gate 0: Lead Qualification", description: "Lead qualification dashboard" },
    { href: "/gates/g2", title: "Gate 2: Payment Recovery", description: "Live payment recovery tracking" },
    { href: "/cfo", title: "CFO Dashboard", description: "Executive financial overview" },
    { href: "/dashboard/governance", title: "Governance Dashboard", description: "Tower federation status" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Qontrek Cockpit</h1>
          <p className="text-gray-400 text-lg">Governance-Aware Business Intelligence Platform</p>
        </div>

        <div className="grid gap-4">
          {dashboards.map((dash) => (
            <Link
              key={dash.href}
              href={dash.href}
              className="block p-6 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl border border-gray-700 hover:border-blue-500 transition-all"
            >
              <h2 className="text-xl font-semibold mb-1">{dash.title}</h2>
              <p className="text-gray-400">{dash.description}</p>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Tower Federation Certified · Trust Index Active</p>
          <p className="mt-2">© 2025 Qontrek Engine</p>
        </div>
      </div>
    </div>
  );
}
