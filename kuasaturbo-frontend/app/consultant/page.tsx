import Card from "@/components/shared/Card";
import Button from "@/components/shared/Button";

export default function ConsultantPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-6">Consultant Program</h1>
      <p className="text-xl text-slate-600 mb-12">
        Help businesses implement KuasaTurbo and earn recurring revenue.
      </p>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <Card>
          <h2 className="text-2xl font-bold mb-4">What You Do</h2>
          <ul className="space-y-3 text-slate-700">
            <li>• Onboard new clients to KuasaTurbo</li>
            <li>• Configure workflows for their business</li>
            <li>• Train their team on platform usage</li>
            <li>• Provide ongoing support and optimization</li>
          </ul>
        </Card>

        <Card>
          <h2 className="text-2xl font-bold mb-4">What You Get</h2>
          <ul className="space-y-3 text-slate-700">
            <li>• 20% commission on client credit purchases</li>
            <li>• Recurring revenue from active clients</li>
            <li>• Consultant dashboard and tools</li>
            <li>• Priority support from our team</li>
          </ul>
        </Card>
      </div>

      <Card className="bg-primary/5 mb-12">
        <h2 className="text-2xl font-bold mb-4">Ideal For</h2>
        <div className="grid md:grid-cols-3 gap-6 text-slate-700">
          <div>
            <strong>Digital Agencies</strong>
            <p className="mt-2">Add AI services to your offering</p>
          </div>
          <div>
            <strong>Business Consultants</strong>
            <p className="mt-2">Help clients automate workflows</p>
          </div>
          <div>
            <strong>Tech Freelancers</strong>
            <p className="mt-2">Build recurring income stream</p>
          </div>
        </div>
      </Card>

      <div className="text-center">
        <Button variant="primary">Apply as Consultant</Button>
      </div>
    </div>
  );
}
