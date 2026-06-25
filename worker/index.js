/**
 * שרת אימות סיסמה — PASS_W נשמר רק כ-Secret ב-Cloudflare.
 * מחזיר session token חתום (HMAC) + rate limiting.
 */

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_PASSWORD_LEN = 256;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX_ATTEMPTS = 12;

/** @type {Map<string, { count: number; resetAt: number }>} */
const rateByIp = new Map();

function corsHeaders(request, env) {
  const allowed = (env.ALLOWED_ORIGIN || '*').replace(/\/$/, '');
  const origin = request.headers.get('Origin') || '';
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };

  const okOrigin =
    allowed === '*' ||
    origin === allowed ||
    origin.startsWith(`${allowed}/`) ||
    origin.startsWith(allowed);

  if (okOrigin && origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  } else if (allowed === '*') {
    headers['Access-Control-Allow-Origin'] = '*';
  }

  return headers;
}

function json(data, status, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}

function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const aa = enc.encode(a);
  const bb = enc.encode(b);
  if (aa.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < aa.length; i++) diff |= aa[i] ^ bb[i];
  return diff === 0;
}

function clientIp(request) {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() || 'unknown';
}

function checkRateLimit(ip) {
  const now = Date.now();
  let entry = rateByIp.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_WINDOW_MS };
    rateByIp.set(ip, entry);
  }
  entry.count += 1;
  if (entry.count > RATE_MAX_ATTEMPTS) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfterSec: 0 };
}

function base64Url(bytes) {
  const bin = String.fromCharCode(...bytes);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmacSign(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return base64Url(new Uint8Array(sig));
}

async function createSessionToken(secret) {
  const exp = Date.now() + SESSION_TTL_MS;
  const nonce = crypto.randomUUID();
  const payload = `${exp}.${nonce}`;
  const sig = await hmacSign(secret, payload);
  return { token: `${payload}.${sig}`, expiresAt: exp };
}

async function verifySessionToken(secret, token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [expStr, nonce, sig] = parts;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  const payload = `${expStr}.${nonce}`;
  const expected = await hmacSign(secret, payload);
  return timingSafeEqual(sig, expected);
}

function sessionSecret(env) {
  return env.PASS_W || '';
}

async function parseJsonBody(request) {
  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (contentLength > 4096) return null;
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);
    const ip = clientIp(request);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === '/health' && request.method === 'GET') {
      return json({ ok: true, gate: Boolean(env.PASS_W), sessionTtlHours: 24 }, 200, cors);
    }

    if (url.pathname === '/session') {
      const secret = sessionSecret(env);
      if (!secret) {
        return json({ ok: false, error: 'not_configured' }, 503, cors);
      }

      let token = '';
      if (request.method === 'GET') {
        const auth = request.headers.get('Authorization') || '';
        token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
      } else if (request.method === 'POST') {
        const body = await parseJsonBody(request);
        token = String(body?.token ?? '').trim();
      } else {
        return json({ ok: false, error: 'method_not_allowed' }, 405, cors);
      }

      if (!token) {
        return json({ ok: false, error: 'missing_token' }, 401, cors);
      }

      const valid = await verifySessionToken(secret, token);
      if (!valid) {
        return json({ ok: false, error: 'invalid_session' }, 401, cors);
      }

      return json({ ok: true }, 200, cors);
    }

    if (url.pathname === '/verify' && request.method === 'POST') {
      const rate = checkRateLimit(ip);
      if (!rate.allowed) {
        return json(
          { ok: false, error: 'rate_limited', retryAfterSec: rate.retryAfterSec },
          429,
          { ...cors, 'Retry-After': String(rate.retryAfterSec) },
        );
      }

      const body = await parseJsonBody(request);
      if (!body) {
        return json({ ok: false, error: 'bad_request' }, 400, cors);
      }

      const input = String(body.password ?? '').trim();
      const expected = sessionSecret(env);

      if (!expected) {
        return json({ ok: false, error: 'not_configured' }, 503, cors);
      }

      if (!input || input.length > MAX_PASSWORD_LEN) {
        return json({ ok: false, error: 'bad_request' }, 400, cors);
      }

      if (timingSafeEqual(input, expected)) {
        const session = await createSessionToken(expected);
        return json({ ok: true, token: session.token, expiresAt: session.expiresAt }, 200, cors);
      }

      return json({ ok: false, error: 'wrong_password' }, 401, cors);
    }

    return json({ ok: false, error: 'not_found' }, 404, cors);
  },
};
