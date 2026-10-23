import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

// Publishable key is safe for client use. Never place a service-role key here.
export const authConfigured = Boolean(url && key && /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url));
export const authClient: SupabaseClient | null = authConfigured
  ? createClient(url!, key!, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
    })
  : null;

export async function authenticatedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  if (!authClient) throw new Error('Bejelentkezés nincs konfigurálva.');
  const { data: { session }, error } = await authClient.auth.getSession();
  if (error || !session?.access_token) throw new Error('Jelentkezz be a mentéshez vagy élő méréshez.');
  const headers = new Headers(init.headers);
  headers.set('Authorization', 'Bearer ' + session.access_token);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    return await fetch(path, { ...init, headers, signal: controller.signal });
  } finally { clearTimeout(timer); }
}
