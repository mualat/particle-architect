import type { PagesFunction } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
  TURNSTILE_SECRET_KEY?: string;
}

export interface Formation {
  id: string;
  name: string;
  code: string;
  publisher: string;
  ip: string;
  timestamp: number;
  turnstileToken?: string;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

async function verifyTurnstileToken(
  token: string,
  secret: string,
  ip?: string
): Promise<boolean> {
  try {
    const formData = new FormData();
    formData.append('secret', secret);
    formData.append('response', token);
    if (ip) {
      formData.append('remoteip', ip);
    }

    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json() as { success: boolean; 'error-codes'?: string[] };
    return data.success === true;
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return false;
  }
}

// Handle OPTIONS request for CORS
export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, { headers: corsHeaders });
};

// GET /api/formations - List all formations
// POST /api/formations - Create new formation
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  try {
    // GET - List formations
    if (method === 'GET') {
      const search = url.searchParams.get('search') || '';
      const offset = parseInt(url.searchParams.get('offset') || '0', 10);
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 50);

      let query = 'SELECT * FROM formations';
      const params: (string | number)[] = [];

      if (search) {
        query += ' WHERE name LIKE ?';
        params.push(`%${search.toUpperCase()}%`);
      }

      query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const stmt = env.DB.prepare(query);
      const bindedStmt = params.length > 0 ? stmt.bind(...params) : stmt;

      const { results } = await bindedStmt.all();
      const safeResults = (results || []).map((r: any) => {
        const { ip, ...rest } = r;
        return rest;
      });

      return jsonResponse(safeResults);
    }

    // POST - Create formation
    if (method === 'POST') {
      const body = await request.json() as Partial<Formation>;

      // Validate required fields
      if (!body.name || !body.code || !body.publisher) {
        return jsonResponse(
          { error: 'Missing required fields: name, code, publisher' },
          400
        );
      }

      // Verify Turnstile token if secret key is configured
      const turnstileSecret = env.TURNSTILE_SECRET_KEY;
      if (turnstileSecret) {
        if (!body.turnstileToken) {
          return jsonResponse(
            { error: 'CAPTCHA verification required' },
            400
          );
        }

        const ip = request.headers.get('CF-Connecting-IP') || undefined;
        const turnstileValid = await verifyTurnstileToken(
          body.turnstileToken,
          turnstileSecret,
          ip
        );

        if (!turnstileValid) {
          return jsonResponse(
            { error: 'CAPTCHA verification failed' },
            403
          );
        }
      }

      // Validate name (alphanumeric and underscore only, uppercase)
      const nameRegex = /^[A-Z0-9_]+$/;
      if (!nameRegex.test(body.name)) {
        return jsonResponse(
          { error: 'Name must be uppercase alphanumeric with underscores only' },
          400
        );
      }

      // Validate code length
      if (body.code.length > 10000) {
        return jsonResponse(
          { error: 'Code too long (max 10000 characters)' },
          400
        );
      }

      // Check for forbidden patterns in code (XSS and Spam prevention)
      const forbiddenPatterns = [
        /\bdocument\b/, /\bwindow\b/, /\bfetch\b/,
        /\beval\s*\(/, /\bFunction\s*\(/, /\bimport\s*\(/,
        /\bglobalThis\b/, /\blocalStorage\b/, /\bsessionStorage\b/,
        // Detect URLs and Domains
        /https?:\/\//i, /www\.[a-z0-9-]+\.[a-z]+/i,
        // Detect IPv4 addresses
        /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
        // Detect obfuscated domains
        /\b[a-zA-Z0-9-]+\s*(?:\[dot\]|\(\.\)|\{dot\}|\sdot\s)\s*[a-zA-Z]{2,}/i,
        // Detect HTML tags (XSS prevention)
        /<\/?[a-zA-Z0-9-]+.*?>/,
        // Detect string decoding/encoding
        /\b(?:String\.fromCharCode|atob|btoa|unescape|decodeURI|decodeURIComponent)\b/,
        // Detect dynamic string construction in UI functions
        /(?:setInfo|addControl|annotate)\s*\([^;{}]*(?:\+|`|\$\{)[^;{}]*\)/,
        // Detect escape sequences in UI functions
        /(?:setInfo|addControl|annotate)\s*\([^;{}]*\\[ux][^;{}]*\)/i,
      ];

      for (const pattern of forbiddenPatterns) {
        if (pattern.test(body.code)) {
          return jsonResponse(
            { error: 'Code contains forbidden patterns' },
            400
          );
        }
      }

      // Check if formation with this name already exists
      const existing = await env.DB.prepare(
        'SELECT id FROM formations WHERE name = ?'
      ).bind(body.name).first();

      if (existing) {
        return jsonResponse(
          { error: 'Formation with this name already exists' },
          409
        );
      }

      // Insert formation
      const id = crypto.randomUUID();
      const timestamp = Date.now();

      await env.DB.prepare(
        `INSERT INTO formations (id, name, code, publisher, ip, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(
        id,
        body.name,
        body.code,
        body.publisher,
        request.headers.get('CF-Connecting-IP') || 'unknown',
        timestamp
      ).run();

      return jsonResponse(
        { id, name: body.name, code: body.code, publisher: body.publisher, timestamp },
        201
      );
    }

    return jsonResponse({ error: 'Method not allowed' }, 405);
  } catch (error) {
    console.error('Error handling request:', error);
    return jsonResponse(
      { error: 'Internal server error' },
      500
    );
  }
};
