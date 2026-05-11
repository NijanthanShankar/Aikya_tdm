import { supabase, createEphemeralClient } from '../lib/supabase';

// ── Helpers ────────────────────────────────────────────────────
function getISTDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function throwIf(error) {
  if (error) throw new Error(error.message);
}

const ROLE_COLORS = {
  admin: '#7c3aed', manager: '#0891b2', member: '#059669',
  socialmanager: '#db2777', telecaller: '#d97706',
  videoeditor: '#9333ea', webmanager: '#0284c7',
};

function buildUser(p) {
  return {
    id: p.id, name: p.name, email: p.email, role: p.role,
    color: p.color, avatar: p.avatar, phone: p.phone || '',
    department: p.department || '', avatarUrl: p.avatar_url || '',
  };
}

function makeAvatar(name = '') {
  const w = name.trim().split(' ');
  return ((w[0]?.[0] || '') + (w[1]?.[0] || '')).toUpperCase();
}

function formatTask(row) {
  return {
    id: row.id, title: row.title, description: row.description || '',
    assignedTo: row.assigned_to,
    assigneeName:   row.assignee?.name  || null,
    assigneeAvatar: row.assignee?.avatar || null,
    assigneeColor:  row.assignee?.color  || '#7c3aed',
    assigneeEmail:  row.assignee?.email  || null,
    dueDate: row.due_date, priority: row.priority, status: row.status,
    createdBy: row.created_by, creatorName: row.creator?.name || null,
    notesCount: Array.isArray(row.notes_count) ? (row.notes_count[0]?.count ?? 0) : 0,
    createdAt: row.created_at, updatedAt: row.updated_at || row.created_at,
  };
}

function formatRecord(row) {
  return {
    id: row.id, userId: row.user_id, date: row.date,
    checkinTime: row.checkin_time, checkoutTime: row.checkout_time,
    checkinLat: row.checkin_lat, checkinLng: row.checkin_lng,
    checkoutLat: row.checkout_lat, checkoutLng: row.checkout_lng,
    checkinLocation: row.checkin_location || '',
    checkoutLocation: row.checkout_location || '',
    workHours: row.work_hours, status: row.status, notes: row.notes,
    userName:   row.user?.name   || null,
    userAvatar: row.user?.avatar || null,
    userColor:  row.user?.color  || '#7c3aed',
  };
}

function formatLeave(row) {
  return {
    id: row.id, userId: row.user_id,
    userName:       row.user?.name       || 'Unknown',
    userAvatar:     row.user?.avatar     || '??',
    userColor:      row.user?.color      || '#7c3aed',
    department:     row.user?.department || '',
    leaveType: row.leave_type, fromDate: row.from_date,
    toDate: row.to_date, numDays: parseFloat(row.num_days),
    reason: row.reason, status: row.status,
    approvedBy:     row.approved_by,
    approvedByName: row.approver?.name || null,
    adminNote: row.admin_note || '',
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

const LEAVE_QUOTAS = {
  casual: 12, sick: 12, earned: 15,
  half_day: 24, wfh: 24, compensatory: 6, other: 6,
};

// ── TASK select fragment ───────────────────────────────────────
const TASK_SELECT = `*, assignee:users!assigned_to(name,avatar,color,email), creator:users!created_by(name), notes_count:notes(count)`;

// ── LEAVE select fragment ──────────────────────────────────────
const LEAVE_SELECT = `*, user:users!user_id(name,avatar,color,department), approver:users!approved_by(name)`;

// ─────────────────────────────────────────────────────────────
export const api = {
  // ── Auth ────────────────────────────────────────────────────
  auth: {
    me: async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return { user: null };
      const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single();
      return { user: profile ? buildUser(profile) : null };
    },
    login: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      const { data: profile, error: pe } = await supabase.from('users').select('*').eq('id', data.user.id).single();
      if (pe || !profile) throw new Error('Profile not found. Contact admin.');
      return { user: buildUser(profile) };
    },
    logout: async () => { await supabase.auth.signOut(); return { success: true }; },
  },

  // ── Users ────────────────────────────────────────────────────
  users: {
    list: async () => {
      const { data, error } = await supabase.from('users').select('id,name,email,role,color,avatar,phone,department,avatar_url,created_at').order('created_at');
      throwIf(error);
      return { users: data.map(u => ({ ...u, avatarUrl: u.avatar_url })) };
    },
    create: async (payload) => {
      const { name, email, password, role = 'member', department = '', phone = '' } = payload;
      const ephemeral = createEphemeralClient();
      const { data: authData, error: authErr } = await ephemeral.auth.signUp({ email, password });
      if (authErr) throw new Error(authErr.message);
      const userId = authData.user?.id;
      if (!userId) throw new Error('Failed to create auth user. Disable email confirmation in Supabase Auth settings.');
      const profile = { id: userId, name, email: email.toLowerCase(), role, color: ROLE_COLORS[role] || '#7c3aed', avatar: makeAvatar(name), phone, department, avatar_url: '' };
      const { data, error } = await supabase.from('users').insert(profile).select().single();
      throwIf(error);
      return { user: { ...data, avatarUrl: '' } };
    },
    update: async (id, data) => {
      const updates = {};
      if (data.name)       { updates.name = data.name; updates.avatar = makeAvatar(data.name); }
      if (data.email)      updates.email = data.email.toLowerCase();
      if (data.role)       { updates.role = data.role; updates.color = ROLE_COLORS[data.role] || '#7c3aed'; }
      if (data.phone       !== undefined) updates.phone = data.phone;
      if (data.department  !== undefined) updates.department = data.department;
      const { data: profile, error } = await supabase.from('users').update(updates).eq('id', id).select().single();
      throwIf(error);
      return { success: true, user: { ...profile, avatarUrl: profile.avatar_url } };
    },
    remove: async (id) => {
      const { error } = await supabase.from('users').delete().eq('id', id);
      throwIf(error);
      return { success: true };
    },
    updateSelf: async (data) => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Not authenticated');
      const updates = {};
      if (data.name)       { updates.name = data.name; updates.avatar = makeAvatar(data.name); }
      if (data.email)      updates.email = data.email.toLowerCase();
      if (data.phone       !== undefined) updates.phone = data.phone;
      if (data.department  !== undefined) updates.department = data.department;
      if (data.avatarUrl   !== undefined) updates.avatar_url = data.avatarUrl;
      const { data: profile, error } = await supabase.from('users').update(updates).eq('id', authUser.id).select().single();
      throwIf(error);
      return { success: true, user: buildUser(profile) };
    },
    changePassword: async ({ currentPassword, newPassword }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
      if (signInErr) throw new Error('Current password is incorrect.');
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      throwIf(error);
      return { success: true };
    },
  },

  // ── Tasks ────────────────────────────────────────────────────
  tasks: {
    list: async (params = {}) => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('users').select('role').eq('id', authUser.id).single();
      let q = supabase.from('tasks').select(TASK_SELECT).order('created_at', { ascending: false });
      if (profile?.role !== 'admin') q = q.eq('assigned_to', authUser.id);
      if (params.status)      q = q.eq('status', params.status);
      if (params.priority)    q = q.eq('priority', params.priority);
      if (params.assigned_to) q = q.eq('assigned_to', params.assigned_to);
      if (params.search) {
        q = q.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`);
      }
      const { data, error } = await q;
      throwIf(error);
      return { tasks: data.map(formatTask) };
    },
    get: async (id) => {
      const { data, error } = await supabase.from('tasks').select(TASK_SELECT).eq('id', id).single();
      throwIf(error);
      return { task: formatTask(data) };
    },
    create: async (payload) => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const row = {
        title:       payload.title,
        description: payload.description || '',
        assigned_to: payload.assignedTo  || null,
        due_date:    payload.dueDate     || null,
        priority:    payload.priority    || 'medium',
        status:      payload.status      || 'pending',
        created_by:  authUser.id,
      };
      const { data, error } = await supabase.from('tasks').insert(row).select(TASK_SELECT).single();
      throwIf(error);
      return { task: formatTask(data) };
    },
    update: async (id, payload) => {
      const updates = {};
      if (payload.title       !== undefined) updates.title       = payload.title;
      if (payload.description !== undefined) updates.description = payload.description;
      if (payload.assignedTo  !== undefined) updates.assigned_to = payload.assignedTo || null;
      if (payload.dueDate     !== undefined) updates.due_date    = payload.dueDate    || null;
      if (payload.priority    !== undefined) updates.priority    = payload.priority;
      if (payload.status      !== undefined) updates.status      = payload.status;
      const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select(TASK_SELECT).single();
      throwIf(error);
      return { task: formatTask(data) };
    },
    remove: async (id) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      throwIf(error);
      return { success: true };
    },
  },

  // ── Notes ────────────────────────────────────────────────────
  notes: {
    list: async (taskId) => {
      const { data, error } = await supabase.from('notes')
        .select('*, user:users(name,avatar,color)')
        .eq('task_id', taskId).order('created_at');
      throwIf(error);
      return {
        notes: data.map(n => ({
          id: n.id, taskId: n.task_id, userId: n.user_id,
          text: n.note_text, attachments: n.attachments || [],
          createdAt: n.created_at,
          userName:   n.user?.name   || 'Unknown',
          userAvatar: n.user?.avatar || '??',
          userColor:  n.user?.color  || '#7c3aed',
        })),
      };
    },
    add: async ({ taskId, text, attachments = [] }) => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('notes')
        .insert({ task_id: taskId, user_id: authUser.id, note_text: text, attachments })
        .select('*, user:users(name,avatar,color)').single();
      throwIf(error);
      return {
        note: {
          id: data.id, taskId: data.task_id, userId: data.user_id,
          text: data.note_text, attachments: data.attachments || [],
          createdAt: data.created_at,
          userName:   data.user?.name   || 'Unknown',
          userAvatar: data.user?.avatar || '??',
          userColor:  data.user?.color  || '#7c3aed',
        },
      };
    },
    remove: async (id) => {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      throwIf(error);
      return { success: true };
    },
  },

  // ── File upload (Supabase Storage) ───────────────────────────
  upload: async (file) => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const path = `uploads/${authUser.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('attachments').upload(path, file);
    throwIf(error);
    const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(path);
    return { url: urlData.publicUrl };
  },

  // ── Attendance ───────────────────────────────────────────────
  attendance: {
    today: async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const today = getISTDate();
      const { data, error } = await supabase.from('attendance')
        .select('*, user:users(name,avatar,color)')
        .eq('user_id', authUser.id).eq('date', today).maybeSingle();
      throwIf(error);
      return { record: data ? formatRecord(data) : null };
    },
    allToday: async () => {
      const today = getISTDate();
      const { data, error } = await supabase.from('attendance')
        .select('*, user:users(name,avatar,color)').eq('date', today);
      throwIf(error);
      return { records: data.map(formatRecord) };
    },
    history: async (params = {}) => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('users').select('role').eq('id', authUser.id).single();
      let q = supabase.from('attendance').select('*, user:users(name,avatar,color)').order('date', { ascending: false });
      if (profile?.role !== 'admin') q = q.eq('user_id', authUser.id);
      if (params.user_id) q = q.eq('user_id', params.user_id);
      if (params.month) {
        const [y, m] = params.month.split('-');
        const start = `${y}-${m}-01`;
        const d = new Date(parseInt(y), parseInt(m), 1);
        const end = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
        q = q.gte('date', start).lt('date', end);
      }
      const { data, error } = await q;
      throwIf(error);
      return { records: data.map(formatRecord) };
    },
    checkIn: async ({ lat, lng, location }) => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const today = getISTDate();
      const now   = new Date().toISOString();
      const { data, error } = await supabase.from('attendance').insert({
        user_id: authUser.id, date: today,
        checkin_time: now, status: 'present',
        checkin_lat: lat, checkin_lng: lng, checkin_location: location || '',
      }).select('*, user:users(name,avatar,color)').single();
      throwIf(error);
      return { record: formatRecord(data) };
    },
    checkOut: async ({ lat, lng, location }) => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const today = getISTDate();
      // Fetch existing to calc work hours
      const { data: existing } = await supabase.from('attendance').select('*').eq('user_id', authUser.id).eq('date', today).single();
      const checkoutNow  = new Date();
      const checkinDate  = new Date(existing.checkin_time);
      const workHours    = parseFloat(((checkoutNow - checkinDate) / 3600000).toFixed(2));
      const { data, error } = await supabase.from('attendance').update({
        checkout_time: checkoutNow.toISOString(),
        checkout_lat: lat, checkout_lng: lng,
        checkout_location: location || '', work_hours: workHours,
      }).eq('user_id', authUser.id).eq('date', today).select('*, user:users(name,avatar,color)').single();
      throwIf(error);
      return { record: formatRecord(data) };
    },
    adjust: async (id, payload) => {
      const updates = {};
      if (payload.checkinTime)       updates.checkin_time      = payload.checkinTime;
      if (payload.checkoutTime)      updates.checkout_time     = payload.checkoutTime;
      if (payload.checkinLocation)   updates.checkin_location  = payload.checkinLocation;
      if (payload.checkoutLocation)  updates.checkout_location = payload.checkoutLocation;
      if (payload.status)            updates.status            = payload.status;
      if (payload.notes !== undefined) updates.notes = payload.notes;
      if (updates.checkin_time && updates.checkout_time) {
        const diff = (new Date(updates.checkout_time) - new Date(updates.checkin_time)) / 3600000;
        updates.work_hours = parseFloat(diff.toFixed(2));
      }
      const { data, error } = await supabase.from('attendance').update(updates).eq('id', id).select('*, user:users(name,avatar,color)').single();
      throwIf(error);
      return { record: formatRecord(data) };
    },
  },

  // ── Holidays ─────────────────────────────────────────────────
  holidays: {
    list: async (year) => {
      const start = `${year}-01-01`, end = `${year}-12-31`;
      const { data, error } = await supabase.from('holidays').select('*').gte('holiday_date', start).lte('holiday_date', end).order('holiday_date');
      throwIf(error);
      return { holidays: data.map(h => ({ id: h.id, date: h.holiday_date, name: h.name, createdAt: h.created_at })) };
    },
    add: async ({ date, name }) => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('holidays').insert({ holiday_date: date, name, created_by: authUser.id }).select().single();
      throwIf(error);
      return { holiday: { id: data.id, date: data.holiday_date, name: data.name, createdAt: data.created_at } };
    },
    remove: async (id) => {
      const { error } = await supabase.from('holidays').delete().eq('id', id);
      throwIf(error);
      return { success: true };
    },
  },

  // ── Leave Management ─────────────────────────────────────────
  leave: {
    list: async (year) => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('leaves').select(LEAVE_SELECT)
        .eq('user_id', authUser.id)
        .gte('from_date', `${year}-01-01`).lte('from_date', `${year}-12-31`)
        .order('created_at', { ascending: false });
      throwIf(error);
      return { leaves: data.map(formatLeave) };
    },
    listAll: async (params = {}) => {
      let q = supabase.from('leaves').select(LEAVE_SELECT).order('created_at', { ascending: false });
      if (params.status)  q = q.eq('status', params.status);
      if (params.user_id) q = q.eq('user_id', params.user_id);
      if (params.month) {
        q = q.or(`from_date.gte.${params.month}-01,to_date.gte.${params.month}-01`);
      }
      const { data, error } = await q;
      throwIf(error);
      return { leaves: data.map(formatLeave) };
    },
    balance: async (year, userId) => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('users').select('role').eq('id', authUser.id).single();
      const targetId = (profile?.role === 'admin' && userId) ? userId : authUser.id;
      const { data, error } = await supabase.from('leaves').select('leave_type,num_days')
        .eq('user_id', targetId).eq('status', 'approved')
        .gte('from_date', `${year}-01-01`).lte('from_date', `${year}-12-31`);
      throwIf(error);
      const usedMap = {};
      data.forEach(r => { usedMap[r.leave_type] = (usedMap[r.leave_type] || 0) + parseFloat(r.num_days); });
      const balance = Object.entries(LEAVE_QUOTAS).map(([type, total]) => ({
        type, total, used: usedMap[type] || 0, remaining: Math.max(0, total - (usedMap[type] || 0)),
      }));
      return { balance, year };
    },
    apply: async (payload) => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      let { leaveType, fromDate, toDate, reason } = payload;
      let numDays = ((new Date(toDate) - new Date(fromDate)) / 86400000) + 1;
      if (leaveType === 'half_day') { numDays = 0.5; toDate = fromDate; }
      const { data, error } = await supabase.from('leaves')
        .insert({ user_id: authUser.id, leave_type: leaveType, from_date: fromDate, to_date: toDate, num_days: numDays, reason, status: 'pending' })
        .select(LEAVE_SELECT).single();
      throwIf(error);
      return { leave: formatLeave(data) };
    },
    update: async (id, payload) => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('users').select('role').eq('id', authUser.id).single();
      const updates = { status: payload.status, updated_at: new Date().toISOString() };
      if (profile?.role === 'admin') {
        updates.approved_by = authUser.id;
        if (payload.adminNote !== undefined) updates.admin_note = payload.adminNote;
      }
      const { data, error } = await supabase.from('leaves').update(updates).eq('id', id).select(LEAVE_SELECT).single();
      throwIf(error);
      return { leave: formatLeave(data) };
    },
    remove: async (id) => {
      const { error } = await supabase.from('leaves').delete().eq('id', id);
      throwIf(error);
      return { success: true };
    },
  },

  // ── Entries ──────────────────────────────────────────────────
  entries: {
    listAll: async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('users').select('role').eq('id', authUser.id).single();
      let q = supabase.from('entries').select('*').order('created_at', { ascending: false });
      if (profile?.role !== 'admin') q = q.eq('user_id', authUser.id);
      const { data, error } = await q;
      throwIf(error);
      return { entries: data.map(e => ({ ...e.data, id: e.id, userId: e.user_id, store: e.store, createdAt: e.created_at })) };
    },
    list: async (store) => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('users').select('role').eq('id', authUser.id).single();
      let q = supabase.from('entries').select('*').eq('store', store).order('created_at', { ascending: false });
      if (profile?.role !== 'admin') q = q.eq('user_id', authUser.id);
      const { data, error } = await q;
      throwIf(error);
      return { entries: data.map(e => ({ ...e.data, id: e.id, userId: e.user_id, store: e.store, createdAt: e.created_at })) };
    },
    add: async (store, entryData) => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const payload = { ...entryData };
      delete payload.store; delete payload.userId; delete payload.id; delete payload.createdAt;
      const { data, error } = await supabase.from('entries').insert({ user_id: authUser.id, store, data: payload }).select().single();
      throwIf(error);
      return { entry: { ...data.data, id: data.id, userId: data.user_id, store: data.store, createdAt: data.created_at } };
    },
    remove: async (id) => {
      const { error } = await supabase.from('entries').delete().eq('id', id);
      throwIf(error);
      return { success: true };
    },
  },
};
