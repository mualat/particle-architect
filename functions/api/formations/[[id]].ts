import type { PagesFunction } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
}

export interface Formation {
  id: string;
  name: string;
  code: string;
  publisher: string;
  ip: string;
  timestamp: number;
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

// GET /api/formations/:id - Get specific formation
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;

  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const id = params.id as string;
    
    if (!id) {
      return jsonResponse({ error: 'Formation ID required' }, 400);
    }

    const formation = await env.DB.prepare(
      'SELECT * FROM formations WHERE id = ?'
    ).bind(id).first();

    if (!formation) {
      return jsonResponse({ error: 'Formation not found' }, 404);
    }

    // Remove IP from response for privacy
    const { ip, ...safeFormation } = formation as Formation;

    return jsonResponse(safeFormation);
  } catch (error) {
    console.error('Error getting formation:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
};
