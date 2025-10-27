import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;

  // Bypass auth for Next.js internals and assets
  if (
    p.startsWith('/_next') ||
    p.startsWith('/api/healthz') ||
    p.startsWith('/assets') ||
    p.startsWith('/favicon') ||
    p === '/robots.txt'
  ) {
    return NextResponse.next();
  }

  // Demo protection
  const PROTECTED_PATHS = [/^\/demo(\/.*)?$/, /^\/g2$/];
  const mustProtect = PROTECTED_PATHS.some((re) => re.test(p));

  if (!mustProtect) return NextResponse.next();

  const authHeader = req.headers.get("authorization") || "";
  const [username, password] = Buffer.from(
    authHeader.replace(/^Basic\s+/i, ""),
    "base64"
  ).toString().split(":");

  if (
    username === process.env.DEMO_USER &&
    password === process.env.DEMO_PASS
  ) {
    return NextResponse.next();
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Voltek Demo"',
    },
  });
}

export const config = {
  matcher: ["/demo/:path*", "/g2"],
};
