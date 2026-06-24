/**
 * שרת אימות סיסמה — הסיסמה (PASS_W) נשמרת רק כ-Secret ב-Cloudflare, לא בקוד האתר.
 */

function corsHeaders(request, env) {
  const allowed = env.ALLOWED_ORIGIN || '*';
  const origin = request.headers.get('Origin') || '';
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };

  if (allowed === '*' || origin === allowed || origin.startsWith(allowed.replace(/\/$/, ''))) {
    headers['Access-Control-Allow-Origin'] = origin || allowed;
  }

  return headers;
}

function json(data, status, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

/** השוואה בטוחה — מונעת ניחוש לפי זמן תגובה */
function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const aa = enc.encode(a);
  const bb = enc.encode(b);
  if (aa.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < aa.length; i++) diff |= aa[i] ^ bb[i];
  return diff === 0;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === '/verify' && request.method === 'POST') {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ ok: false, error: 'bad_request' }, 400, cors);
      }

      const input = String(body.password ?? '').trim();
      const expected = env.PASS_W ?? '';

      if (!expected) {
        return json({ ok: false, error: 'not_configured' }, 503, cors);
      }

      if (timingSafeEqual(input, expected)) {
        return json({ ok: true }, 200, cors);
      }

      return json({ ok: false, error: 'wrong_password' }, 401, cors);
    }

    if (url.pathname === '/health') {
      return json({ ok: true, gate: Boolean(env.PASS_W) }, 200, cors);
    }

    return json({ ok: false, error: 'not_found' }, 404, cors);
  },
};
