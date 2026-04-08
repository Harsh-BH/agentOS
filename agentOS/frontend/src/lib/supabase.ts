import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function createClient() {
  // During build / SSR with missing env vars, return a stub-safe client
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a minimal stub that won't crash at build time.
    // At runtime in the browser, env vars will be present.
    return createBrowserClient(
      "https://placeholder.supabase.co",
      "placeholder-anon-key",
    );
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = createClient();
