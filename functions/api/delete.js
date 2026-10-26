// Admin-only delete: removes the database row AND the files from R2.
import { cfg, json, requireAdmin } from '../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  if (!env.MEDIA) return json({ error: 'R2 bucket is not connected (binding MEDIA is missing).' }, 500);
  const gate = await requireAdmin(env, request);
  if (gate.error) return gate.error;

  const body = await request.json().catch(() => ({}));
  const { table, id } = body;
  if (!['videos', 'playlists'].includes(table) || typeof id !== 'string' || !/^((vid|pl)_)?[0-9a-f-]{36}$/.test(id)) {
    return json({ error: 'Invalid request.' }, 400);
  }

  const { url, key } = cfg(env);
  const headers = { apikey: key, Authorization: `Bearer ${gate.token}` };
  const columns = table === 'videos' ? 'video_key,thumb_key' : 'cover_key';

  try {
    const found = await fetch(`${url}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&select=${columns}`, { headers });
    const rows = found.ok ? await found.json() : [];
    if (!rows[0]) return json({ error: 'Not found.' }, 404);

    // The database rule (RLS) also checks admin here, so this is a second lock.
    const del = await fetch(`${url}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { ...headers, Prefer: 'return=representation' }
    });
    const removed = del.ok ? await del.json() : [];
    if (!removed.length) return json({ error: 'Delete was not allowed.' }, 403);

    const keys = Object.values(rows[0]).filter(Boolean);
    if (keys.length) await env.MEDIA.delete(keys);
    return json({ ok: true });
  } catch (err) {
    return json({ error: 'Delete failed: ' + ((err && err.message) || 'unknown') }, 500);
  }
}
