// Shared session helpers for the Academy course gate.
// Lives outside functions/ so Pages does not turn it into a route.

const enc = new TextEncoder();

function b64url(bytes) {
  let s = '';
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str) {
  return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
}

export function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmac(data, secret) {
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

// Returns "<payload>.<signature>"
export async function signSession(payload, secret) {
  const body = b64url(enc.encode(JSON.stringify(payload)));
  return body + '.' + (await hmac(body, secret));
}

// Returns the payload object, or null if missing / tampered / expired.
export async function verifySession(token, secret) {
  if (!token || typeof token !== 'string') return null;
  const dot = token.lastIndexOf('.');
  if (dot < 1) return null;

  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = await hmac(body, secret);
  if (!timingSafeEqual(expected, sig)) return null;

  try {
    const data = JSON.parse(b64urlDecode(body));
    if (!data.exp || Date.now() > data.exp) return null;
    return data;
  } catch (_) {
    return null;
  }
}

export function readCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return rest.join('=');
  }
  return null;
}

// Parses ACADEMY_STUDENTS and returns the record for a submitted code, or null.
export function matchStudent(studentsJson, submittedCode) {
  let students;
  try {
    students = JSON.parse(studentsJson);
  } catch (_) {
    return null;
  }
  const submitted = String(submittedCode || '').trim().toUpperCase();
  if (!submitted) return null;

  let matchedKey = null;
  // Walk every entry so response timing does not reveal which codes exist.
  for (const key of Object.keys(students)) {
    if (timingSafeEqual(key.toUpperCase(), submitted)) matchedKey = key;
  }
  if (!matchedKey) return null;
  return { code: matchedKey, student: students[matchedKey] };
}

export function lookupStudent(studentsJson, code) {
  try {
    const students = JSON.parse(studentsJson);
    return students[code] || null;
  } catch (_) {
    return null;
  }
}

export const SESSION_DAYS = 30;
export const COOKIE_NAME = 'ta_course';
