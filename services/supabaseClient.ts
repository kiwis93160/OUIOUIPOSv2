import { createClient } from '@supabase/supabase-js';

type SupabaseEnv = {
  url: string;
  anonKey: string;
};

const getSupabaseEnv = (): SupabaseEnv => {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (!url) {
    throw new Error('VITE_SUPABASE_URL is not defined. Please configure your Supabase environment variables.');
  }

  if (!anonKey) {
    throw new Error('VITE_SUPABASE_ANON_KEY is not defined. Please configure your Supabase environment variables.');
  }

  return { url, anonKey };
};

const { url, anonKey } = getSupabaseEnv();

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: false,
  },
});
