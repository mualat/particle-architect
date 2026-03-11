/// <reference types="@cloudflare/workers-types" />

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
