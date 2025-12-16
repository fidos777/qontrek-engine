import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-secondary text-white mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/pricing" className="hover:text-primary">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/credits" className="hover:text-primary">
                  Credits
                </Link>
              </li>
              <li>
                <Link href="/verticals" className="hover:text-primary">
                  Verticals
                </Link>
              </li>
              <li>
                <Link href="/playground" className="hover:text-primary">
                  Playground
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Partners</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/consultant" className="hover:text-primary">
                  Consultant
                </Link>
              </li>
              <li>
                <Link href="/reseller" className="hover:text-primary">
                  Reseller
                </Link>
              </li>
              <li>
                <Link href="/partners" className="hover:text-primary">
                  Partners
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/trust" className="hover:text-primary">
                  Trust
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-primary">
                  Docs
                </Link>
              </li>
              <li>
                <Link href="/api-access" className="hover:text-primary">
                  API Access
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">KuasaTurbo</h3>
            <p className="text-sm text-slate-300">
              AI Microservices untuk Malaysian Business
            </p>
          </div>
        </div>

        <div className="border-t border-slate-700 mt-8 pt-8 text-center text-sm text-slate-400">
          © 2025 KuasaTurbo. SME Cloud AI Empire.
        </div>
      </div>
    </footer>
  );
}
