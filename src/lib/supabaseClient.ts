import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Custom Supabase client: reads VITE_PROD_BANCO_URL / VITE_PROD_BANCO_KEY first,
// falls back to the Lovable-managed defaults for local preview.
const SUPABASE_URL =
  import.meta.env.VITE_PROD_BANCO_URL ||
  import.meta.env.VITE_SUPABASE_URL;

const SUPABASE_KEY =
  import.meta.env.VITE_PROD_BANCO_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
