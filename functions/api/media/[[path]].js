// Serves files from the R2 bucket to everyone (guests included).
// Handles Range requests by hand so videos can start and seek in every browser.
const KEY_RE = /^(videos|thumbs|covers)\/[0-9a-f-]{36}\.(mp4|webm|png|jpg|webp|gif)$/;
const TYPES = { mp4: 'video/mp4', webm: 'video/webm', png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' };

// "bytes=0-", "bytes=100-200", "bytes=-500"  ->  { start, end } | null (no range) | false (not satisfiable)
function parseRange(header, size) {
  const m = /^bytes=(\d*)-(\d*)$/.exec((header || '').trim());
  if (!m || (m[1] === '' && m[2] === '')) return null;
  let start, end;
  if (m[1] === '') {
    const n = Number(m[2]);
    if (n === 0) return false;
    start = Math.max(size - n, 0);
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1);
  }
  if (start >= size || start > end) return false;
  return { start, end };
}

async function serve({ request, env, params }, withBody) {
  if (!env.MEDIA) return new Response('R2 bucket is not connected.', { status: 500 });
  const key = Array.isArray(params.path) ? params.path.join('/') : String(params.path || '');
  const m = KEY_RE.exec(key);
  if (!m) return new Response('Not found', { status: 404 });

  const head = await env.MEDIA.head(key);
  if (!head) return new Response('Not found', { status: 404 });
  const size = head.size;

  const headers = new Headers({
    'content-type': TYPES[m[2]],
    'accept-ranges': 'bytes',
    'etag': head.httpEtag,
    'cache-control': 'public, max-age=3600',
    'x-content-type-options': 'nosniff'
  });

  const range = parseRange(request.headers.get('range'), size);
  if (range === false) {
    headers.set('content-range', `bytes */${size}`);
    return new Response(null, { status: 416, headers });
  }

  let status = 200, start = 0, end = size - 1;
  if (range) {
    ({ start, end } = range);
    status = 206;
    headers.set('content-range', `bytes ${start}-${end}/${size}`);
  }
  headers.set('content-length', String(end - start + 1));
  if (!withBody) return new Response(null, { status, headers });

  const obj = range
    ? await env.MEDIA.get(key, { range: { offset: start, length: end - start + 1 } })
    : await env.MEDIA.get(key);
  if (!obj) return new Response('Not found', { status: 404 });
  return new Response(obj.body, { status, headers });
}

export const onRequestGet = ctx => serve(ctx, true);
export const onRequestHead = ctx => serve(ctx, false);
