// ─────────────────────────────────────────────────────────────
//  Aikya Task Portal — API Client
//  All calls go to /api/*.php on the same Hostinger domain.
//  PHP sessions handle authentication (cookies sent automatically).
// ─────────────────────────────────────────────────────────────

const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { error: text }; }

  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

// For multipart file uploads — don't set Content-Type (browser sets it with boundary)
async function uploadFile(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/upload.php`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { error: text }; }
  if (!res.ok) throw new Error(json.error || `Upload failed (${res.status})`);
  return json;
}

export const api = {
  // ── Auth ────────────────────────────────────────────────────
  auth: {
    me:     ()                => request('/auth.php?action=me'),
    login:  (email, password) => request('/auth.php?action=login',  { method: 'POST', body: JSON.stringify({ email, password }) }),
    logout: ()                => request('/auth.php?action=logout', { method: 'POST' }),
  },

  // ── Users (admin management) ─────────────────────────────────
  users: {
    list:   ()         => request('/users.php'),
    create: (payload)  => request('/users.php',         { method: 'POST',   body: JSON.stringify(payload) }),
    update: (id, data) => request(`/users.php?id=${id}`, { method: 'PUT',    body: JSON.stringify(data)    }),
    remove: (id)       => request(`/users.php?id=${id}`, { method: 'DELETE'                                }),
    // Self-service
    updateSelf:     (data) => request('/users.php?action=self',     { method: 'PUT', body: JSON.stringify(data) }),
    changePassword: (data) => request('/users.php?action=password', { method: 'PUT', body: JSON.stringify(data) }),
  },

  // ── Tasks ────────────────────────────────────────────────────
  tasks: {
    list:   (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/tasks.php${qs ? '?' + qs : ''}`);
    },
    get:    (id)          => request(`/tasks.php?id=${id}`),
    create: (data)        => request('/tasks.php',        { method: 'POST',   body: JSON.stringify(data) }),
    update: (id, data)    => request(`/tasks.php?id=${id}`, { method: 'PUT',  body: JSON.stringify(data) }),
    remove: (id)          => request(`/tasks.php?id=${id}`, { method: 'DELETE' }),
  },

  // ── Notes ────────────────────────────────────────────────────
  notes: {
    list:   (taskId) => request(`/notes.php?task_id=${taskId}`),
    add:    (data)   => request('/notes.php', { method: 'POST',   body: JSON.stringify(data) }),
    remove: (id)     => request(`/notes.php?id=${id}`, { method: 'DELETE' }),
  },

  // ── File uploads ─────────────────────────────────────────────
  upload: (file) => uploadFile(file),

  // ── Attendance ───────────────────────────────────────────────
  attendance: {
    today:    ()       => request('/attendance.php?action=today'),
    allToday: ()       => request('/attendance.php?action=all_today'),
    history:  (params) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/attendance.php${qs ? '?' + qs : ''}`);
    },
    checkIn:  (data)   => request('/attendance.php?action=checkin',  { method: 'POST', body: JSON.stringify(data) }),
    checkOut: (data)   => request('/attendance.php?action=checkout', { method: 'POST', body: JSON.stringify(data) }),
    adjust:   (id, data) => request(`/attendance.php?id=${id}`,      { method: 'PUT',  body: JSON.stringify(data) }),
  },

  // ── Holidays ──────────────────────────────────────────────────
  holidays: {
    list:   (year)   => request(`/holidays.php?year=${year}`),
    add:    (data)   => request('/holidays.php', { method: 'POST',   body: JSON.stringify(data) }),
    remove: (id)     => request(`/holidays.php?id=${id}`, { method: 'DELETE' }),
  },
};

