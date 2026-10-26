// Shared helpers for the Pages Functions (this file is not a route).
// Only the PUBLISHABLE Supabase key is used here, which is safe to keep in code.
const DEFAULT_URL = 'https://jipfmbcrkxsgvifobcpp.supabase.co';
const DEFAULT_KEY = 'sb_publishable_BwnGaqHr14PPORWcKCKGMg_AxKprHpm';

export const cfg = env => ({
  url: env.SUPABASE_URL || DEFAULT_URL,
  key: env.SUPABASE_PUBLISHABLE_KEY || DEFAULT_KEY
});

export const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
});

// Token comes from the Authorization header. Only the media route also accepts ?t= (images/video tags cannot send headers).
export function bearer(request, allowQuery = false) {
  const m = (request.headers.get('Authorization') || '').match(/^Bearer\s+(.+)$/i);
  if (m) return m[1];
  return allowQuery ? (new URL(request.url).searchParams.get('t') || '') : '';
}

// Asks Supabase if this token is a real, logged-in user.
export async function getUser(env, token) {
  if (!token) return null;
  const { url, key } = cfg(env);
  const r = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` } });
  if (!r.ok) return null;
  const u = await r.json();
  return u && u.id ? u : null;
}

// Logged in AND profiles.is_admin = true, otherwise returns an error Response.
export async function requireAdmin(env, request) {
  const token = bearer(request);
  const user = await getUser(env, token);
  if (!user) return { error: json({ error: 'Please login again.' }, 401) };
  const { url, key } = cfg(env);
  const r = await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=is_admin`, {
    headers: { apikey: key, Authorization: `Bearer ${token}` }
  });
  const rows = r.ok ? await r.json() : [];
  if (!rows[0] || rows[0].is_admin !== true) return { error: json({ error: 'Admin only.' }, 403) };
  return { user, token };
}
