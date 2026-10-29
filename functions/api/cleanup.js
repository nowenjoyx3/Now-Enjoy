// Admin-only: deletes files in R2 that no video / playlist row uses
// (left behind by failed uploads or failed deletes). Files newer than 1 hour are never touched,
// because an upload that is still being saved looks the same as a leftover.
import { cfg, json, requireAdmin } from '../_lib/auth.js';

const PREFIXES = ['videos/', 'thumbs/', 'covers/', 'audios/'];
const GRACE_MS = 60 * 60 * 1000;

async function readRows(url, headers, table, columns) {
  const out = [];
  for (let offset = 0; ; offset += 1000) {
    const r = await fetch(`${url}/rest/v1/${table}?select=${columns}&order=id&limit=1000&offset=${offset}`, { headers });
    if (!r.ok) throw new Error(`Could not read ${table} (${r.status}).`);
    const page = await r.json();
    out.push(...page);
    if (page.length < 1000) return out;
  }
}

export async function onRequestPost({ request, env }) {
  if (!env.MEDIA) return json({ error: 'R2 bucket is not connected (binding MEDIA is missing).' }, 500);
  const gate = await requireAdmin(env, request);
  if (gate.error) return gate.error;

  const { url, key } = cfg(env);
  const headers = { apikey: key, Authorization: `Bearer ${gate.token}` };

  try {
    const used = new Set();
    const add = k => { if (k) used.add(k); };
    for (const v of await readRows(url, headers, 'videos', 'video_key,thumb_key')) { add(v.video_key); add(v.thumb_key); }
    for (const p of await readRows(url, headers, 'playlists', 'cover_key')) add(p.cover_key);

    // Dub audios: if their table cannot be read, the audios/ folder is skipped (nothing is deleted there).
    let audiosKnown = true;
    try { for (const a of await readRows(url, headers, 'video_audios', 'audio_key')) add(a.audio_key); }
    catch (_) { audiosKnown = false; }

    const stale = [];
    for (const prefix of PREFIXES) {
      if (prefix === 'audios/' && !audiosKnown) continue;
      let cursor;
      do {
        const page = await env.MEDIA.list({ prefix, cursor, limit: 1000 });
        for (const o of page.objects) {
          if (used.has(o.key)) continue;
          if (Date.now() - new Date(o.uploaded).getTime() < GRACE_MS) continue;
          stale.push(o.key);
        }
        cursor = page.truncated ? page.cursor : undefined;
      } while (cursor);
    }

    // Safety: database looks empty but R2 has files -> something is wrong, delete nothing.
    if (used.size === 0 && stale.length > 0 && new URL(request.url).searchParams.get('force') !== '1') {
      return json({ error: 'Database returned no rows; cleanup skipped for safety.' }, 409);
    }

    for (let i = 0; i < stale.length; i += 1000) await env.MEDIA.delete(stale.slice(i, i + 1000));
    return json({ ok: true, deleted: stale.length });
  } catch (err) {
    return json({ error: 'Cleanup failed: ' + ((err && err.message) || 'unknown') }, 500);
  }
}
