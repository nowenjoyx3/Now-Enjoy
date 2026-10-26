// Admin-only upload into R2. Big files arrive in 8 MB chunks (multipart), so the 100 MB request limit is not a problem.
import { json, requireAdmin } from '../_lib/auth.js';

const TYPE_BY_EXT = { mp4: 'video/mp4', webm: 'video/webm', png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' };
const KEY_RE = /^(videos|thumbs|covers)\/[0-9a-f-]{36}\.(mp4|webm|png|jpg|webp|gif)$/;
const MAX_BODY = 16 * 1024 * 1024;

export async function onRequest({ request, env }) {
  if (!env.MEDIA) return json({ error: 'R2 bucket is not connected (binding MEDIA is missing).' }, 500);
  const gate = await requireAdmin(env, request);
  if (gate.error) return gate.error;

  const q = new URL(request.url).searchParams;
  const action = q.get('action');
  const key = q.get('key') || '';
  const m = KEY_RE.exec(key);
  if (!m) return json({ error: 'Invalid file name.' }, 400);
  const type = TYPE_BY_EXT[m[2]];
  if ((m[1] === 'videos') !== type.startsWith('video/')) return json({ error: 'File type does not match its folder.' }, 400);
  const is = method => request.method === method;
  const bodyLen = Number(request.headers.get('content-length') || 0);

  try {
    if (action === 'put' && is('PUT')) {
      if (!bodyLen || bodyLen > MAX_BODY) return json({ error: 'Invalid file size.' }, 413);
      await env.MEDIA.put(key, await request.arrayBuffer(), { httpMetadata: { contentType: type } });
      return json({ ok: true });
    }
    if (action === 'create' && is('POST')) {
      const up = await env.MEDIA.createMultipartUpload(key, { httpMetadata: { contentType: type } });
      return json({ uploadId: up.uploadId });
    }

    const uploadId = q.get('uploadId') || '';
    if (!uploadId) return json({ error: 'Missing uploadId.' }, 400);
    const up = env.MEDIA.resumeMultipartUpload(key, uploadId);

    if (action === 'part' && is('PUT')) {
      const n = Number(q.get('n'));
      if (!Number.isInteger(n) || n < 1 || n > 10000) return json({ error: 'Invalid part number.' }, 400);
      if (!bodyLen || bodyLen > MAX_BODY) return json({ error: 'Invalid chunk size.' }, 413);
      const part = await up.uploadPart(n, await request.arrayBuffer());
      return json({ partNumber: part.partNumber, etag: part.etag });
    }
    if (action === 'complete' && is('POST')) {
      const body = await request.json();
      const parts = (Array.isArray(body.parts) ? body.parts : []).map(p => ({ partNumber: Number(p.partNumber), etag: String(p.etag) }));
      if (!parts.length) return json({ error: 'No parts.' }, 400);
      await up.complete(parts);
      return json({ ok: true });
    }
    if (action === 'abort' && is('POST')) {
      await up.abort();
      return json({ ok: true });
    }
    return json({ error: 'Unknown action.' }, 400);
  } catch (err) {
    return json({ error: 'Storage error: ' + ((err && err.message) || 'unknown') }, 500);
  }
}
