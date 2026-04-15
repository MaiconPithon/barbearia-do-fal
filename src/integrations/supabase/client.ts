import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://qhlyjvaqfkrjmsybrezs.supabase.co";
const supabaseAnonKey = "sb_publishable_CvdXC_CkwIAQ1MTqgAYAEw_LWs4-O4d";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
