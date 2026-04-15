import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Hardcoded — Barbearia do Fal (projeto qhly)
const SUPABASE_URL = "https://qhlyjvaqfkrjmsybrezs.supabase.co";
const SUPABASE_KEY = "sb_publishable_CvdXC_CkwIAQ1MTqgAYAEw_LWs4-O4d";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
