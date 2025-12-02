/**
 * Get the base URL for API calls
 * - Browser: returns '' (relative fetch)
 * - Vercel server/build: returns `https://${process.env.VERCEL_URL}`
 * - Local dev: returns 'http://localhost:3000'
 */
function getBaseUrl(): string {
  // Browser = OK to use relative path
  if (typeof window !== "undefined") return "";

  // Vercel production / preview
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Explicit override
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  // Local dev server
  return "http://localhost:3000";
}

export async function solarApi(action: string, params: any = {}) {
  const baseUrl = getBaseUrl();
  const apiUrl = `${baseUrl}/api/mcp/solar`;

  // SANITY CHECK — server must always have absolute URL
  if (typeof window === "undefined" && !apiUrl.startsWith("http")) {
    throw new Error(
      `❌ Server-side solarApi received non-absolute URL.\n` +
        `URL: "${apiUrl}"\n` +
        `Base URL: "${baseUrl}"\n` +
        `Make sure NEXT_PUBLIC_BASE_URL or VERCEL_URL is set in Vercel.`
    );
  }

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, params }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Solar API error");
  return data;
}
