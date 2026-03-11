import type { PagesFunction } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

// Handle OPTIONS request for CORS
export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, { headers: corsHeaders });
};

// GET /api/formations/check - Check if formation exists
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const name = url.searchParams.get('name');
    if (!name) {
      return jsonResponse({ error: 'Name parameter required' }, 400);
    }

    const existing = await env.DB.prepare(
      'SELECT id FROM formations WHERE name = ?'
    ).bind(name.toUpperCase()).first();

    return jsonResponse({ exists: !!existing });
  } catch (error) {
    console.error('Error checking formation:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
};
