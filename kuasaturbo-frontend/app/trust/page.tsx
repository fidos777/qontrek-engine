import Card from "@/components/shared/Card";

export default function TrustPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-6">Trust & Security</h1>
      <p className="text-xl text-slate-600 mb-12">
        Your data security and privacy are our top priorities.
      </p>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <Card>
          <h2 className="text-2xl font-bold mb-4">Data Security</h2>
          <ul className="space-y-3 text-slate-700">
            <li>• End-to-end encryption for all data</li>
            <li>• SOC 2 Type II compliant infrastructure</li>
            <li>• Regular security audits and penetration testing</li>
            <li>• Data stored in Malaysian data centers</li>
            <li>• GDPR and PDPA compliant</li>
          </ul>
        </Card>

        <Card>
          <h2 className="text-2xl font-bold mb-4">Privacy Commitment</h2>
          <ul className="space-y-3 text-slate-700">
            <li>• Your data is never used to train AI models</li>
            <li>• No data sharing with third parties</li>
            <li>• Complete data deletion on request</li>
            <li>• Transparent data usage policies</li>
            <li>• Regular privacy impact assessments</li>
          </ul>
        </Card>
      </div>

      <Card className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Compliance & Certifications</h2>
        <div className="grid md:grid-cols-3 gap-6 text-slate-700">
          <div>
            <strong>ISO 27001</strong>
            <p className="mt-2">Information security management</p>
          </div>
          <div>
            <strong>PDPA</strong>
            <p className="mt-2">Malaysian data protection compliance</p>
          </div>
          <div>
            <strong>SOC 2 Type II</strong>
            <p className="mt-2">Security and availability controls</p>
          </div>
        </div>
      </Card>

      <Card className="bg-primary/5">
        <h2 className="text-2xl font-bold mb-4">Uptime & Reliability</h2>
        <div className="grid md:grid-cols-3 gap-6 text-slate-700">
          <div>
            <div className="text-3xl font-bold text-primary mb-2">99.9%</div>
            <p>Uptime SLA</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">&lt;200ms</div>
            <p>Average response time</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">24/7</div>
            <p>System monitoring</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
