-- ═══════════════════════════════════════════════════════════════
--  Aikya Task Portal — Supabase Schema
--  Run this in Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

-- ── Tables ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  role        TEXT NOT NULL DEFAULT 'member',
  color       TEXT DEFAULT '#7c3aed',
  avatar      TEXT DEFAULT '',
  phone       TEXT DEFAULT '',
  department  TEXT DEFAULT '',
  avatar_url  TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT DEFAULT '',
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_by  UUID REFERENCES public.users(id) ON DELETE SET NULL,
  due_date    DATE,
  priority    TEXT DEFAULT 'medium',
  status      TEXT DEFAULT 'pending',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notes (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id    UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  note_text  TEXT,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attendance (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  date              DATE NOT NULL,
  checkin_time      TIMESTAMPTZ NOT NULL,
  checkout_time     TIMESTAMPTZ,
  checkin_lat       TEXT,
  checkin_lng       TEXT,
  checkout_lat      TEXT,
  checkout_lng      TEXT,
  checkin_location  TEXT DEFAULT '',
  checkout_location TEXT DEFAULT '',
  work_hours        NUMERIC(5,2),
  status            TEXT DEFAULT 'present',
  notes             TEXT,
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS public.holidays (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  holiday_date DATE UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  created_by   UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.leaves (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  leave_type  TEXT DEFAULT 'casual',
  from_date   DATE NOT NULL,
  to_date     DATE NOT NULL,
  num_days    NUMERIC(4,1) DEFAULT 1,
  reason      TEXT NOT NULL,
  status      TEXT DEFAULT 'pending',
  approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  admin_note  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.entries (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  store      TEXT NOT NULL,
  data       JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── updated_at trigger ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at  BEFORE UPDATE ON public.tasks  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER leaves_updated_at BEFORE UPDATE ON public.leaves FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Row Level Security ─────────────────────────────────────────
ALTER TABLE public.users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries    ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION public.my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- USERS
CREATE POLICY "Read all users"          ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert users"      ON public.users FOR INSERT TO authenticated WITH CHECK (public.my_role() = 'admin');
CREATE POLICY "Admin or self update"    ON public.users FOR UPDATE TO authenticated USING (public.my_role() = 'admin' OR id = auth.uid());
CREATE POLICY "Admin delete users"      ON public.users FOR DELETE TO authenticated USING (public.my_role() = 'admin');

-- TASKS
CREATE POLICY "Admin all; member own tasks" ON public.tasks FOR SELECT TO authenticated USING (public.my_role() = 'admin' OR assigned_to = auth.uid());
CREATE POLICY "Admin create tasks"          ON public.tasks FOR INSERT TO authenticated WITH CHECK (public.my_role() = 'admin');
CREATE POLICY "Admin all; member update own" ON public.tasks FOR UPDATE TO authenticated USING (public.my_role() = 'admin' OR assigned_to = auth.uid());
CREATE POLICY "Admin delete tasks"          ON public.tasks FOR DELETE TO authenticated USING (public.my_role() = 'admin');

-- NOTES
CREATE POLICY "Read notes"         ON public.notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Add own notes"      ON public.notes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Delete own or admin" ON public.notes FOR DELETE TO authenticated USING (public.my_role() = 'admin' OR user_id = auth.uid());

-- ATTENDANCE
CREATE POLICY "Admin all; user own attendance" ON public.attendance FOR SELECT TO authenticated USING (public.my_role() = 'admin' OR user_id = auth.uid());
CREATE POLICY "Insert own attendance"          ON public.attendance FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin or user update"           ON public.attendance FOR UPDATE TO authenticated USING (public.my_role() = 'admin' OR user_id = auth.uid());

-- HOLIDAYS
CREATE POLICY "Read holidays"   ON public.holidays FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin add holiday" ON public.holidays FOR INSERT TO authenticated WITH CHECK (public.my_role() = 'admin');
CREATE POLICY "Admin delete holiday" ON public.holidays FOR DELETE TO authenticated USING (public.my_role() = 'admin');

-- LEAVES
CREATE POLICY "Admin all; user own leaves" ON public.leaves FOR SELECT TO authenticated USING (public.my_role() = 'admin' OR user_id = auth.uid());
CREATE POLICY "Apply own leave"            ON public.leaves FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin or user update leave" ON public.leaves FOR UPDATE TO authenticated USING (public.my_role() = 'admin' OR user_id = auth.uid());
CREATE POLICY "Admin or user delete leave" ON public.leaves FOR DELETE TO authenticated USING (public.my_role() = 'admin' OR user_id = auth.uid());

-- ENTRIES
CREATE POLICY "Admin all; user own entries" ON public.entries FOR SELECT TO authenticated USING (public.my_role() = 'admin' OR user_id = auth.uid());
CREATE POLICY "Add own entries"             ON public.entries FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin or owner delete"       ON public.entries FOR DELETE TO authenticated USING (public.my_role() = 'admin' OR user_id = auth.uid());

-- ══════════════════════════════════════════════════════════════
--  AFTER running this schema:
--  1. Go to Authentication → Settings → disable Email Confirmations
--  2. Go to Authentication → Users → Add user (your admin email + password)
--  3. Copy the generated UUID, then run:
--     INSERT INTO public.users (id, name, email, role, color, avatar)
--     VALUES ('<UUID>', 'Admin Name', 'admin@email.com', 'admin', '#7c3aed', 'AN');
--  4. Log in to the app — you can create more users from the admin panel.
-- ══════════════════════════════════════════════════════════════
