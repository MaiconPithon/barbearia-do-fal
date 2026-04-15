import { createClient } from '@supabase/supabase-js';

// Chaves novas da Barbearia do Fal (Projeto qhly...)
const supabaseUrl = "https://qhlyjvaqfkrjmsybrezs.supabase.co";
const supabaseAnonKey = "sb_publishable_CvdXC_CkwIAQ1MTqgAYAEw_LWs4-O4d";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Log para confirmar que o sistema está lendo o banco certo (pode ver no console do navegador)
console.log("Supabase inicializado com sucesso no projeto: qhly");
