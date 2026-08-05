import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Single shared client for the whole app. Auth (AuthContext), theme sync
// (ThemeContext) and data sync (supabaseSync) should all import this instead
// of calling createClient() themselves — multiple clients means multiple
// competing session listeners against the same localStorage key.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});