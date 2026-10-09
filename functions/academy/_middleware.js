// Guards every request under /academy/ — pages, project files, anything you drop in.
// An unsigned visitor is redirected to the login page; nothing under /academy/
// is ever served without a valid session cookie.

import { verifySession, readCookie, COOKIE_NAME } from '../../lib/academy-auth.js';

export async function onRequest(context) {
  const { request, env, next } = context;

  if (!env.ACADEMY_SECRET) {
    return new Response('Course access is not configured.', { status: 500 });
  }

  const session = await verifySession(readCookie(request, COOKIE_NAME), env.ACADEMY_SECRET);

  if (!session) {
    const url = new URL(request.url);
    return Response.redirect(`${url.origin}/course-login.html`, 302);
  }

  const response = await next();
  const copy = new Response(response.body, response);
  copy.headers.set('Cache-Control', 'no-store, private');
  copy.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return copy;
}
