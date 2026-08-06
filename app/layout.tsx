import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/lib/Themecontext";
import { AuthProvider } from "@/lib/Authcontext";
import { THEMES, THEME_ORDER, toCssVars } from "@/lib/Themes";

export const metadata: Metadata = {
  title: "doME — a hybrid to-do journal",
  description: "A local-first, doME-journal styled to-do list with streaks and a focus timer.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: THEMES.peony.navy,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // lets the app use safe-area insets on notch/home-indicator devices
};

// Pre-computed once at build/render time directly from lib/themes.ts — this is
// the ONLY place theme hex values get serialized outside of themes.ts itself.
const VARS_BY_THEME = Object.fromEntries(
  THEME_ORDER.map((id) => [id, toCssVars(THEMES[id])])
);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/*
          Runs before Next hydrates anything (strategy="beforeInteractive" is
          injected into <head> and blocks the parser), so the correct theme's
          CSS vars are already set on :root before the first pixel paints.
          Without this, every screen — including the loading splash — would
          render with the default theme for a frame or two before snapping
          to whatever the person actually picked. Falls back to peony if
          nothing's saved yet or storage is unavailable.
        */}
        <Script id="dome-theme-init" strategy="beforeInteractive">
          {`(function(){try{var VARS=${JSON.stringify(VARS_BY_THEME)};var id=localStorage.getItem("dome_theme");var t=VARS[id]||VARS.peony;var r=document.documentElement.style;for(var k in t){r.setProperty(k,t[k]);}}catch(e){}})();`}
        </Script>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}