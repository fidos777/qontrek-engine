export const config = {
  matcher: [
    '/dashboard/:path*',
    '/demo/:path*',
    '/gates/:path*',
  ],
};

export function middleware() {
  // Prevent static rendering or caching
  return new Response(null, { status: 200 });
}

