import { createClient } from '@supabase/supabase-js';

// Voltando para o padrão de variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Atenção: Variáveis do Supabase não encontradas. Verifique o seu .env ou as configurações da Vercel.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
