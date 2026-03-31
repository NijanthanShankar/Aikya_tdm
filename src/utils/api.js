// ─────────────────────────────────────────────────────────────
//  AgencyHub — API Client
//  All calls go to /api/*.php on the same Hostinger domain.
//  PHP sessions handle authentication (cookies sent automatically).
// ─────────────────────────────────────────────────────────────

const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include', // send session cookie
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { error: text }; }

  if (!res.ok) {
    throw new Error(json.error || `Request failed (${res.status})`);
  }
  return json;
}

// ── Auth ──────────────────────────────────────────────────────

export const api = {
  auth: {
    me:     ()                  => request('/auth.php?action=me'),
    login:  (email, password)   => request('/auth.php?action=login',  { method: 'POST', body: JSON.stringify({ email, password }) }),
    logout: ()                  => request('/auth.php?action=logout', { method: 'POST' }),
  },

  // ── Users (admin only) ───────────────────────────────────────
  users: {
    list:   ()         => request('/users.php'),
    create: (payload)  => request('/users.php',         { method: 'POST',   body: JSON.stringify(payload) }),
    update: (id, data) => request(`/users.php?id=${id}`, { method: 'PUT',    body: JSON.stringify(data)    }),
    remove: (id)       => request(`/users.php?id=${id}`, { method: 'DELETE'                                }),
  },

  // ── Entries ───────────────────────────────────────────────────
  entries: {
    list:   (store)    => request(`/entries.php?store=${store}`),
    listAll:()         => request('/entries.php'),
    add:    (store, data) => request('/entries.php', { method: 'POST', body: JSON.stringify({ ...data, store }) }),
    remove: (id)       => request(`/entries.php?id=${id}`, { method: 'DELETE' }),
  },
};
