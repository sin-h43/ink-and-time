"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { THEMES, THEME_ORDER, toCssVars, type ThemeId, type ThemeTokens } from "./Themes";
import { supabase } from "./Supabaseclient";

const STORAGE_KEY = "dome_theme";

interface ThemeContextValue {
  themeId: ThemeId;
  C: ThemeTokens;
  setTheme: (id: ThemeId) => void;
  themeOrder: ThemeId[];
  allThemes: Record<ThemeId, ThemeTokens>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyToRoot(tokens: ThemeTokens) {
  if (typeof document === "undefined") return;
  const vars = toCssVars(tokens);
  const root = document.documentElement.style;
  Object.entries(vars).forEach(([k, v]) => root.setProperty(k, v));
}

function readStoredThemeId(): ThemeId {
  if (typeof window === "undefined") return "peony";
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored && stored in THEMES ? (stored as ThemeId) : "peony";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // The blocking script in layout.tsx already painted the DOM with the right
  // theme before this component ever mounts. This lazy initializer just
  // brings React's state in sync with what's already on screen — it isn't
  // what prevents the flash, it just avoids a second, redundant one.
  const [themeId, setThemeId] = useState<ThemeId>(readStoredThemeId);

  // If someone signs in and has a different theme saved remotely (e.g. set
  // on another device), prefer that over what's cached on this device.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("theme")
          .eq("id", session.user.id)
          .maybeSingle();
        if (data?.theme && data.theme in THEMES) {
          setThemeId(data.theme as ThemeId);
        }
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Keep the DOM in sync whenever themeId changes for any reason (manual
  // pick, remote sync above, etc).
  useEffect(() => {
    applyToRoot(THEMES[themeId]);
  }, [themeId]);

  const setTheme = (id: ThemeId) => {
    setThemeId(id);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, id);
    // Best-effort remote save; silently no-ops when signed out or offline.
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from("profiles").upsert({ id: data.user.id, theme: id }).then(({ error }) => {
          if (error) console.error("[Theme] Failed to save theme to profile:", error);
        });
      }
    });
  };

  const value: ThemeContextValue = {
    themeId,
    C: THEMES[themeId],
    setTheme,
    themeOrder: THEME_ORDER,
    allThemes: THEMES,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}