import { NextRequest } from 'next/server';

export function getCorsHeaders(request: NextRequest): HeadersInit {
  const origin = request.headers.get('origin') || '';
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://qontrek.com'
  ];

  // Allow Vercel preview deployments
  const isVercelPreview = origin.includes('vercel.app');
  const isAllowed = allowedOrigins.includes(origin) || isVercelPreview;

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export async function handleCorsPrelight(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}
