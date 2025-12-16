import Card from "@/components/shared/Card";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";

export default function ApiAccessPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-center">Get API Access</h1>
        <p className="text-xl text-slate-600 mb-12 text-center">
          Start building with KuasaTurbo in minutes.
        </p>

        <Card className="mb-8">
          <form className="space-y-6">
            <Input
              label="Full Name"
              type="text"
              placeholder="Ahmad bin Abdullah"
              required
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="ahmad@company.com"
              required
            />
            <Input
              label="Company Name"
              type="text"
              placeholder="Your Company Sdn Bhd"
              required
            />
            <Input
              label="Phone Number"
              type="tel"
              placeholder="+60123456789"
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Use Case
              </label>
              <textarea
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                rows={4}
                placeholder="Tell us how you plan to use KuasaTurbo..."
                required
              />
            </div>

            <Button type="submit" variant="primary" className="w-full">
              Request API Access
            </Button>
          </form>
        </Card>

        <Card className="bg-slate-100">
          <h2 className="text-xl font-bold mb-4">What happens next?</h2>
          <ol className="space-y-3 text-slate-700">
            <li>1. We'll review your application within 24 hours</li>
            <li>2. You'll receive your API key via email</li>
            <li>3. Get 100 free credits to start testing</li>
            <li>4. Access full documentation and SDKs</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
