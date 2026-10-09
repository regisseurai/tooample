// POST /api/course-login — verifies a student access code, sets a signed session cookie.
//
// Required environment variables (Cloudflare Pages → Settings → Variables):
//   ACADEMY_SECRET   : long random string used to sign the session cookie
//   ACADEMY_STUDENTS : JSON map of access code -> student record, e.g.
//     {"NM-7F3A-K29B":{"name":"Nickel Massamba","email":"nickel@example.com","unlocked":["m1","m2","m3"]}}

import { signSession, matchStudent, SESSION_DAYS, COOKIE_NAME } from '../../lib/academy-auth.js';

const json = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra }
  });

export async function onRequestPost({ request, env }) {
  if (!env.ACADEMY_SECRET || !env.ACADEMY_STUDENTS) {
    return json({ error: 'Course access is not configured yet.' }, 500);
  }

  let code;
  try {
    ({ code } = await request.json());
  } catch (_) {
    return json({ error: 'Invalid request.' }, 400);
  }

  if (!code || typeof code !== 'string') {
    return json({ error: 'Please enter your access code.' }, 400);
  }

  const match = matchStudent(env.ACADEMY_STUDENTS, code);
  if (!match) {
    return json({ error: 'That code was not recognised.' }, 401);
  }

  const token = await signSession(
    {
      c: match.code,
      n: match.student.name || 'Student',
      exp: Date.now() + SESSION_DAYS * 86400000
    },
    env.ACADEMY_SECRET
  );

  return json({ ok: true }, 200, {
    'Set-Cookie':
      `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`
  });
}

// Anything other than POST
export async function onRequest() {
  return json({ error: 'Method not allowed.' }, 405);
}
