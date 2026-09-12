import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.generated';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

// Keep the configuration screen usable without silently disabling query typing.
// Access to an unconfigured client fails locally, before any network request.
export const supabase: SupabaseClient<Database> = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseKey)
  : new Proxy({} as SupabaseClient<Database>, {
      get() { throw new Error('Supabase não configurado: verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'); },
    });
