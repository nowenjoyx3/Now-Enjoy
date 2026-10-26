// Serves files from the PRIVATE R2 bucket, only to logged-in users. Supports seeking in videos (Range requests).
import { bearer, getUser } from '../../_lib/auth.js';

const KEY_RE = /^(videos|thumbs|covers)\/[0-9a-f-]{36}\.(mp4|webm|png|jpg|webp|gif)$/;

export async function onRequestGet({ request, env, params }) {
  if (!env.MEDIA) return new Response('R2 bucket is not connected.', { status: 500 });
  const key = Array.isArray(params.path) ? params.path.join('/') : String(params.path || '');
  if (!KEY_RE.test(key)) return new Response('Not found', { status: 404 });

  const user = await getUser(env, bearer(request, true));
  if (!user) return new Response('Login required', { status: 401 });

  const obj = await env.MEDIA.get(key, { range: request.headers });
  if (!obj) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('accept-ranges', 'bytes');
  headers.set('cache-control', 'private, max-age=3600');
  headers.set('x-content-type-options', 'nosniff');

  let status = 200;
  if (obj.range) {
    let start, end;
    if ('suffix' in obj.range) { start = obj.size - obj.range.suffix; end = obj.size - 1; }
    else { start = obj.range.offset || 0; end = obj.range.length !== undefined ? start + obj.range.length - 1 : obj.size - 1; }
    headers.set('content-range', `bytes ${start}-${end}/${obj.size}`);
    headers.set('content-length', String(end - start + 1));
    status = 206;
  } else {
    headers.set('content-length', String(obj.size));
  }
  return new Response(obj.body, { status, headers });
}
