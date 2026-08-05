"use client";

import { createContext, useContext, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { THEMES, THEME_ORDER, CSS_VAR_NAMES, type ThemeId, type ThemeTokens } from "./Themes";
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

function buildCssVars(tokens: ThemeTokens): CSSProperties {
  const style: Record<string, string> = {};
  (Object.keys(CSS_VAR_NAMES) as (keyof typeof CSS_VAR_NAMES)[]).forEach((key) => {
    style[CSS_VAR_NAMES[key]] = tokens[key];
  });
  return style as CSSProperties;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>("peony");

  // Load whatever was picked last time, on this device, before anything paints
  // with the wrong colors.
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored && stored in THEMES) setThemeId(stored as ThemeId);
  }, []);

  // When someone signs in, prefer their saved remote preference (e.g. they set
  // it on another device) over whatever's cached locally.
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
          localStorage.setItem(STORAGE_KEY, data.theme);
        }
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

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

  const cssVars = useMemo(() => buildCssVars(THEMES[themeId]), [themeId]);

  const value: ThemeContextValue = {
    themeId,
    C: THEMES[themeId],
    setTheme,
    themeOrder: THEME_ORDER,
    allThemes: THEMES,
  };

  return (
    <ThemeContext.Provider value={value}>
      <div style={{ ...cssVars, minHeight: "100%" }}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}