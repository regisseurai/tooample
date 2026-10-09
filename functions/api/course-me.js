// GET /api/course-me — returns the signed-in student and the modules they can see.
// The Stream video IDs live here (not in the page source) so they are only
// ever sent to an authenticated student.

import { verifySession, readCookie, lookupStudent, COOKIE_NAME } from '../../lib/academy-auth.js';

// ---------------------------------------------------------------------------
// COURSE CATALOGUE — edit this block as you record each module.
// `video` is the Cloudflare Stream video UID. Leave it empty ('') until the
// module is recorded; the page will show it as "Coming <date>".
// `files` are download links (R2, Dropbox, Drive — whatever you use).
// ---------------------------------------------------------------------------
const MODULES = [
  {
    id: 'm1',
    n: 1,
    title: 'Planning the shoot',
    blurb: 'Client brief, treatment, shot list, and how a shoot day is actually structured.',
    video: '',
    duration: '32 min',
    files: []
  },
  {
    id: 'm2',
    n: 2,
    title: 'Camera & lenses',
    blurb: 'Exposure, focal length choices, picture profiles, and what to buy next as your kit grows.',
    video: '',
    duration: '34 min',
    files: []
  },
  {
    id: 'm3',
    n: 3,
    title: 'Lighting',
    blurb: 'Natural light, one-light setups, and building a cinematic look without a big package.',
    video: '',
    duration: '30 min',
    files: []
  },
  {
    id: 'm4',
    n: 4,
    title: 'Camera movement',
    blurb: 'Handheld, gimbal and slider work — and when each one earns its place.',
    video: '',
    duration: '28 min',
    releases: '2026-10-28',
    files: []
  },
  {
    id: 'm5',
    n: 5,
    title: 'Storytelling — shooting for the edit',
    blurb: 'Coverage, sequencing, and getting the material the edit will need.',
    video: '',
    duration: '30 min',
    releases: '2026-11-04',
    files: []
  },
  {
    id: 'm6',
    n: 6,
    title: 'Editing in Premiere Pro — assembly',
    blurb: 'Project setup, selects, building the spine of the cut.',
    video: '',
    duration: '35 min',
    releases: '2026-11-11',
    files: []
  },
  {
    id: 'm7',
    n: 7,
    title: 'Editing in Premiere Pro — pacing & sound',
    blurb: 'Rhythm, music, sound design and delivery settings.',
    video: '',
    duration: '32 min',
    releases: '2026-11-18',
    files: []
  },
  {
    id: 'm8',
    n: 8,
    title: 'Colour grading in DaVinci Resolve',
    blurb: 'Node workflow, matching shots, and building a look that holds up.',
    video: '',
    duration: '38 min',
    releases: '2026-11-25',
    files: []
  },
  {
    id: 'm9',
    n: 9,
    title: 'Photo — Lightroom & Photoshop',
    blurb: 'Catalogue workflow, and retouching for portrait and commercial work.',
    video: '',
    duration: '30 min',
    releases: '2026-12-02',
    files: []
  },
  {
    id: 'm10',
    n: 10,
    title: 'AI-assisted post',
    blurb: 'Generative shots, extensions and clean-ups, cut into a real timeline.',
    video: '',
    duration: '33 min',
    releases: '2026-12-09',
    files: []
  }
];

export async function onRequestGet({ request, env }) {
  const session = await verifySession(readCookie(request, COOKIE_NAME), env.ACADEMY_SECRET);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Not signed in.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }

  const student = lookupStudent(env.ACADEMY_STUDENTS, session.c) || {};
  const unlocked = Array.isArray(student.unlocked) ? student.unlocked : [];

  const modules = MODULES.map(m => {
    const open = unlocked.includes(m.id) && !!m.video;
    return {
      id: m.id,
      n: m.n,
      title: m.title,
      blurb: m.blurb,
      duration: m.duration,
      releases: m.releases || null,
      unlocked: open,
      video: open ? m.video : null,
      files: open ? m.files : []
    };
  });

  return new Response(
    JSON.stringify({
      name: session.n,
      streamCustomer: env.STREAM_CUSTOMER_CODE || '',
      modules
    }),
    { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
  );
}
