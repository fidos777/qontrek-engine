import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;

  // Bypass for Next.js internals
  if (
    p.startsWith('/_next') ||
    p.startsWith('/api') ||
    p.startsWith('/assets') ||
    p.startsWith('/favicon') ||
    p === '/robots.txt'
  ) {
    return NextResponse.next();
  }

  // Demo protection for gates routes (optional, can enable later)
  // Commented out for now
  /*
  const PROTECTED_PATHS = [/^\/gates(\/.*)?$/];
  const mustProtect = PROTECTED_PATHS.some((re) => re.test(p));

  if (mustProtect) {
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
        "WWW-Authenticate": 'Basic realm="Qontrek Gates"',
      },
    });
  }
  */

  return NextResponse.next();
}

export const config = {
  matcher: ['/gates/:path*'],
};
