"use client";

import { useEffect, useState } from "react";
import { X, LogOut, Palette, Bell, Database, User as UserIcon, Check, Download, Trash2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/Authcontext";
import { useTheme } from "@/lib/Themecontext";
import { supabase } from "@/lib/supabaseClient";
import { db } from "@/lib/db";
import type { ThemeId } from "@/lib/Themes";

const HAND = "'Patrick Hand', cursive";
const DISPLAY = "'Caveat', cursive";

const NOTIF_KEY = "dome_notif_prefs";
type NotifPrefs = { dailyReminder: boolean; streakAlerts: boolean };
const DEFAULT_NOTIFS: NotifPrefs = { dailyReminder: true, streakAlerts: true };

function loadNotifPrefs(): NotifPrefs {
  if (typeof window === "undefined") return DEFAULT_NOTIFS;
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    return raw ? { ...DEFAULT_NOTIFS, ...JSON.parse(raw) } : DEFAULT_NOTIFS;
  } catch {
    return DEFAULT_NOTIFS;
  }
}

function initials(nameOrEmail: string) {
  const base = nameOrEmail.trim();
  if (!base) return "?";
  const parts = base.split(/[\s@.]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  const { C } = useTheme();
  return (
    <button
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      style={{
        width: 40, height: 22, borderRadius: 999, border: "none", cursor: "pointer", padding: 2,
        background: checked ? C.pink2 : C.lineSoft, display: "flex", justifyContent: checked ? "flex-end" : "flex-start",
        transition: "background 0.2s ease",
      }}
    >
      <span style={{ width: 18, height: 18, borderRadius: "50%", background: C.paper, display: "block", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }} />
    </button>
  );
}

function SectionHeading({ icon, text }: { icon: ReactNode2; text: string }) {
  const { C } = useTheme();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10, marginTop: 22 }}>
      {icon}
      <span style={{ fontFamily: DISPLAY, fontSize: 19, fontWeight: 700, color: C.navy }}>{text}</span>
    </div>
  );
}
type ReactNode2 = React.ReactNode;

export default function ProfileButton() {
  const { user, signOut } = useAuth();
  const { C, themeId, setTheme, themeOrder, allThemes } = useTheme();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotifPrefs>(DEFAULT_NOTIFS);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setNotifs(loadNotifPrefs());
  }, []);

  const updateNotifs = (patch: Partial<NotifPrefs>) => {
    const next = { ...notifs, ...patch };
    setNotifs(next);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(next));
    if (user) {
      // Cast to any to avoid overly strict generated types for the profiles table
      supabase.from("profiles").upsert({
        id: user.id,
        notif_daily_reminder: next.dailyReminder,
        notif_streak_alerts: next.streakAlerts,
      } as any).then(({ error }) => { if (error) console.error("[Profile] notif save failed:", error); });
    }
  };

  const displayName = (user?.user_metadata?.full_name as string) || user?.email || "";
  const avatarLabel = initials(displayName);

  const handleExport = async () => {
    const [tasks, doodles, days] = await Promise.all([
      db.tasks.toArray(),
      db.doodles.toArray(),
      db.days.toArray(),
    ]);
    const payload = { exportedAt: new Date().toISOString(), tasks, doodles, days };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dome-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetLocal = async () => {
    setBusy(true);
    try {
      await Promise.all([db.tasks.clear(), db.doodles.clear(), db.days.clear()]);
      window.location.reload();
    } finally {
      setBusy(false);
      setConfirmingReset(false);
    }
  };

  const handleDeleteAccount = async () => {
    // Deleting an auth user requires the Supabase service-role key, which must
    // never live in the browser. Wire this to a server route (e.g.
    // app/api/account/delete/route.ts using supabase-js with the service key)
    // that verifies the caller's session then calls supabase.auth.admin.deleteUser.
    // For now this signs the person out and flags what's left to do.
    setBusy(true);
    try {
      await signOut();
    } finally {
      setBusy(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open profile and settings"
        style={{
          width: 40, height: 40, borderRadius: "50%", border: `2px solid ${C.navy}`, background: C.pink1,
          color: C.navy, fontFamily: HAND, fontSize: 15, cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}
      >
        {avatarLabel}
      </button>

      {open && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(46,43,36,0.35)", display: "flex", justifyContent: "flex-end", zIndex: 60 }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 380, height: "100%", background: C.paper, borderLeft: `1.5px solid ${C.line}`,
              padding: "22px 22px 32px", overflowY: "auto", boxShadow: "-8px 0 24px rgba(46,43,36,0.12)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 700, color: C.navy }}>Profile & settings</div>
              <button onClick={() => setOpen(false)} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: C.inkSoft }}>
                <X size={20} />
              </button>
            </div>

            {/* Account */}
            <SectionHeading icon={<UserIcon size={16} color={C.navySoft} />} text="Account" />
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0" }}>
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: C.pink1, color: C.navy, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: HAND, fontSize: 17, flexShrink: 0 }}>
                {avatarLabel}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: HAND, fontSize: 16, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {displayName || "Signed in"}
                </div>
                <div style={{ fontFamily: HAND, fontSize: 13, color: C.inkSoft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.email}
                </div>
              </div>
            </div>

            {/* Appearance */}
            <SectionHeading icon={<Palette size={16} color={C.navySoft} />} text="Appearance" />
            <div style={{ fontFamily: HAND, fontSize: 14, color: C.inkSoft, marginBottom: 10 }}>Color theme</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {themeOrder.map((id: ThemeId) => {
                const t = allThemes[id];
                const active = id === themeId;
                return (
                  <button
                    key={id}
                    onClick={() => setTheme(id)}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "10px 6px",
                      borderRadius: 10, border: `1.5px solid ${active ? t.pink3 : C.lineSoft}`,
                      background: active ? t.pink0 : C.page, cursor: "pointer", position: "relative",
                    }}
                  >
                    {active && (
                      <span style={{ position: "absolute", top: 4, right: 4, color: t.pink4 }}>
                        <Check size={12} />
                      </span>
                    )}
                    <div style={{ display: "flex", width: "100%", height: 16, borderRadius: 5, overflow: "hidden" }}>
                      {[t.pink0, t.pink1, t.pink2, t.pink3, t.pink4].map((c, i) => (
                        <div key={i} style={{ flex: 1, background: c }} />
                      ))}
                    </div>
                    <span style={{ fontFamily: HAND, fontSize: 12.5, color: C.ink }}>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Notifications */}
            <SectionHeading icon={<Bell size={16} color={C.navySoft} />} text="Notifications" />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
              <span style={{ fontFamily: HAND, fontSize: 15, color: C.ink }}>Daily reminder</span>
              <Toggle checked={notifs.dailyReminder} onChange={(v) => updateNotifs({ dailyReminder: v })} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
              <span style={{ fontFamily: HAND, fontSize: 15, color: C.ink }}>Streak alerts</span>
              <Toggle checked={notifs.streakAlerts} onChange={(v) => updateNotifs({ streakAlerts: v })} />
            </div>

            {/* Data */}
            <SectionHeading icon={<Database size={16} color={C.navySoft} />} text="Your data" />
            <button
              onClick={handleExport}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 12px", borderRadius: 9, border: `1.5px solid ${C.lineSoft}`, background: C.page, color: C.ink, fontFamily: HAND, fontSize: 15, cursor: "pointer", marginBottom: 8 }}
            >
              <Download size={16} /> Export my data (JSON)
            </button>

            {!confirmingReset ? (
              <button
                onClick={() => setConfirmingReset(true)}
                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 12px", borderRadius: 9, border: `1.5px solid ${C.lineSoft}`, background: C.page, color: C.pink3, fontFamily: HAND, fontSize: 15, cursor: "pointer" }}
              >
                <Trash2 size={16} /> Reset local data
              </button>
            ) : (
              <div style={{ padding: 12, borderRadius: 9, border: `1.5px solid ${C.pink1}`, background: C.pink0 }}>
                <div style={{ display: "flex", gap: 6, fontFamily: HAND, fontSize: 14, color: C.ink, marginBottom: 10 }}>
                  <AlertTriangle size={16} color={C.pink4} style={{ flexShrink: 0, marginTop: 1 }} />
                  This clears all tasks, doodles, and day notes stored on this device. It can't be undone.
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button disabled={busy} onClick={handleResetLocal} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: C.pink3, color: C.paper, fontFamily: HAND, fontSize: 14, cursor: "pointer" }}>
                    Yes, reset
                  </button>
                  <button onClick={() => setConfirmingReset(false)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1.5px solid ${C.line}`, background: C.paper, color: C.ink, fontFamily: HAND, fontSize: 14, cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Session / danger zone */}
            <SectionHeading icon={<LogOut size={16} color={C.navySoft} />} text="Session" />
            <button
              onClick={signOut}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 12px", borderRadius: 9, border: `1.5px solid ${C.lineSoft}`, background: C.page, color: C.ink, fontFamily: HAND, fontSize: 15, cursor: "pointer", marginBottom: 8 }}
            >
              <LogOut size={16} /> Sign out
            </button>

            {!confirmingDelete ? (
              <button
                onClick={() => setConfirmingDelete(true)}
                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 12px", borderRadius: 9, border: `1.5px solid ${C.pink1}`, background: C.paper, color: C.pink4, fontFamily: HAND, fontSize: 15, cursor: "pointer" }}
              >
                <Trash2 size={16} /> Delete account
              </button>
            ) : (
              <div style={{ padding: 12, borderRadius: 9, border: `1.5px solid ${C.pink1}`, background: C.pink0 }}>
                <div style={{ fontFamily: HAND, fontSize: 14, color: C.ink, marginBottom: 10 }}>
                  Account deletion needs a server-side step (an admin API call) that isn't wired up yet.
                  For now this signs you out — ping the team to finish account deletion.
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button disabled={busy} onClick={handleDeleteAccount} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: C.pink3, color: C.paper, fontFamily: HAND, fontSize: 14, cursor: "pointer" }}>
                    Sign out anyway
                  </button>
                  <button onClick={() => setConfirmingDelete(false)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1.5px solid ${C.line}`, background: C.paper, color: C.ink, fontFamily: HAND, fontSize: 14, cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}