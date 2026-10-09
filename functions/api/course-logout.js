// POST /api/course-logout — clears the session cookie.
import { COOKIE_NAME } from '../../lib/academy-auth.js';

export async function onRequest() {
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
    }
  });
}
