import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Minimal hand-written Database type matching db.md (+ a profiles table used
// by Themecontext.tsx for cross-device theme sync). Two things have to be
// exactly right for @supabase/supabase-js v2's generics to actually resolve
// row types instead of silently collapsing to `never`:
//   1. Every table needs Row / Insert / Update / Relationships — all four
//      are REQUIRED by GenericTable, not optional. Missing Relationships
//      alone is enough to break inference.
//   2. Each schema (here just "public") needs Tables / Views / Functions —
//      all three REQUIRED by GenericSchema. Omitting Views/Functions was
//      the actual cause of the "not assignable to type never" errors,
//      even with Tables fully filled in.
// Swap this for `supabase gen types typescript` output later if you want
// full codegen coverage — this covers what the app actually writes today.
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          theme: string | null;
          updated_at: number | null;
        };
        Insert: {
          id: string;
          theme?: string | null;
          updated_at?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
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