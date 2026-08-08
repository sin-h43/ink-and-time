import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Minimal hand-written Database type matching db.md. Without this generic,
// @supabase/supabase-js v2's strict typing resolves .from(table).upsert()'s
// row type to `never` for any table it can't verify against a schema —
// that's the exact "not assignable to parameter of type 'never[]'" error.
// Swap this for `supabase gen types typescript` output later if you want
// full codegen coverage (views, functions, etc.) — this covers what the
// app actually writes today.
export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string;
          local_id: string;
          date: string;
          title: string;
          time: string | null;
          completed: boolean;
          importance: string;
          updated_at: number;
          deleted_at: number | null;
          user_id: string;
        };
        Insert: {
          id?: string;
          local_id: string;
          date: string;
          title: string;
          time?: string | null;
          completed?: boolean;
          importance: string;
          updated_at: number;
          deleted_at?: number | null;
          user_id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
      };
      doodles: {
        Row: {
          id: string;
          local_id: string;
          date: string;
          icon_id: string;
          label: string;
          updated_at: number;
          deleted_at: number | null;
          user_id: string;
        };
        Insert: {
          id?: string;
          local_id: string;
          date: string;
          icon_id: string;
          label: string;
          updated_at: number;
          deleted_at?: number | null;
          user_id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["doodles"]["Insert"]>;
      };
      days: {
        Row: {
          id: string;
          date: string;
          mood: number | null;
          shade_id: string | null;
          updated_at: number;
          user_id: string;
        };
        Insert: {
          id?: string;
          date: string;
          mood?: number | null;
          shade_id?: string | null;
          updated_at: number;
          user_id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["days"]["Insert"]>;
      };
    };
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __supabase: ReturnType<typeof createClient<Database>> | undefined;
}

export const supabase =
  globalThis.__supabase ??
  createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__supabase = supabase;
}