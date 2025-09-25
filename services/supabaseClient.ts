import { createClient } from '@supabase/supabase-js';

type SupabaseEnv = {
  url: string;
  anonKey: string;
};

const normalizeSupabaseUrl = (rawUrl: string): string => {
  try {
    const parsed = new URL(rawUrl);
    const sanitizedPath = parsed.pathname.replace(/\/+$/, '');

    if (sanitizedPath && sanitizedPath !== '/') {
      const invalidSegment = sanitizedPath === '' ? '/' : sanitizedPath;
      throw new Error(
        `VITE_SUPABASE_URL must point to the project root (e.g. https://xxxx.supabase.co). Remove the path "${invalidSegment}" to avoid cross-origin errors.`,
      );
    }

    return parsed.origin;
  } catch (error) {
    const details = error instanceof Error ? ` ${error.message}` : '';
    throw new Error(`Invalid VITE_SUPABASE_URL provided.${details}`.trim());
  }
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

  return { url: normalizeSupabaseUrl(url), anonKey };
};

const { url, anonKey } = getSupabaseEnv();

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: false,
  },
});
