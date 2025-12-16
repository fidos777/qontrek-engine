import Link from "next/link";
import Button from "../shared/Button";

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold text-primary">
            KuasaTurbo
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-slate-700 hover:text-primary">
              Home
            </Link>
            <Link href="/pricing" className="text-slate-700 hover:text-primary">
              Pricing
            </Link>
            <Link href="/verticals" className="text-slate-700 hover:text-primary">
              Verticals
            </Link>
            <Link href="/docs" className="text-slate-700 hover:text-primary">
              Docs
            </Link>
            <Link href="/playground" className="text-slate-700 hover:text-primary">
              Playground
            </Link>
            <Link href="/api-access">
              <Button variant="primary">Get API Access</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
