// ─────────────────────────────────────────────────────────────
//  Aikya Task Portal — Supabase Client
//  Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
// ─────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '❌ Supabase credentials missing!\n' +
    'Create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.\n' +
    'See .env.example for the template.'
  );
}

// Main client — persists session in localStorage
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession:   true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// Ephemeral client — used by admin to create new users without
// overwriting the current admin session.
export function createEphemeralClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession:   false,
      autoRefreshToken: false,
      storageKey:       `aikya-ephemeral-${Date.now()}`,
    },
  });
}
