// declare module "./globals.css";

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "doME — a hybrid to-do journal",
  description: "A local-first, doME-journal styled to-do list with streaks and a focus timer.",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#2B3A5C",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
