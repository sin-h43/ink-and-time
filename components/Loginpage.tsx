"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/Authcontext";
import { useTheme } from "@/lib/Themecontext";

const HAND = "'Patrick Hand', cursive";
const DISPLAY = "'Caveat', cursive";

/* A small hand-drawn "G" mark and Apple glyph, kept as inline SVG so we don't
   pull in brand icon packs. */
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.94v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.94A9 9 0 0 0 0 9c0 1.45.35 2.83.94 4.03l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .94 4.97l3.01 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  );
}
function AppleMark() {
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" fill="currentColor">
      <path d="M13.1 9.5c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.6.8-3.3.8-.7 0-1.7-.8-2.9-.7-1.5 0-2.8.9-3.6 2.2-1.5 2.7-.4 6.6 1.1 8.8.7 1.1 1.6 2.3 2.7 2.2 1.1 0 1.5-.7 2.8-.7s1.7.7 2.9.7c1.2 0 1.9-1.1 2.7-2.2.8-1.2 1.2-2.4 1.2-2.4-.1 0-2.2-.8-2.3-3.6zM10.8 2.4c.6-.8 1.1-1.9 1-3-.9.1-2 .6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2-.5 2.7-1.3z" />
    </svg>
  );
}

function Divider() {
  const { C } = useTheme();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
      <div style={{ flex: 1, height: 1, background: C.line }} />
      <span style={{ fontFamily: HAND, fontSize: 13, color: C.inkSoft }}>or</span>
      <div style={{ flex: 1, height: 1, background: C.line }} />
    </div>
  );
}

export default function LoginPage() {
  const { C } = useTheme();
  const { signInWithPassword, signUpWithPassword, signInWithGoogle, signInWithApple, sendPasswordReset } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await signInWithPassword(email, password);
        if (error) setError(error);
      } else if (mode === "signup") {
        if (!name.trim()) { setError("Tell us what to call you."); return; }
        const { error } = await signUpWithPassword(email, password, name.trim());
        if (error) setError(error);
        else setInfo("Almost there — check your email to confirm your account.");
      } else {
        const { error } = await sendPasswordReset(email);
        if (error) setError(error);
        else setInfo("Password reset link sent — check your inbox.");
      }
    } finally {
      setBusy(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 10,
    border: `1.5px solid ${C.line}`,
    background: C.paper,
    fontFamily: HAND,
    fontSize: 16,
    color: C.ink,
    outline: "none",
    marginBottom: 12,
  };

  const oauthButtonStyle: React.CSSProperties = {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "10px 0",
    borderRadius: 10,
    border: `1.5px solid ${C.line}`,
    background: C.paper,
    color: C.ink,
    fontFamily: HAND,
    fontSize: 15,
    cursor: "pointer",
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: C.page,
        backgroundImage: `linear-gradient(${C.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${C.gridLine} 1px, transparent 1px)`,
        backgroundSize: "22px 22px",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: C.paper,
          border: `1.5px solid ${C.line}`,
          borderRadius: 16,
          padding: "32px 28px",
          boxShadow: "0 8px 24px rgba(46,43,36,0.08)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 40, fontWeight: 700, color: C.navy, lineHeight: 1 }}>do·me</div>
          <div style={{ fontFamily: HAND, fontSize: 14, color: C.inkSoft, marginTop: 4 }}>
            {mode === "signup" ? "Start your journal" : mode === "reset" ? "Reset your password" : "Welcome back"}
          </div>
        </div>

        {mode !== "reset" && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <button type="button" onClick={signInWithGoogle} style={oauthButtonStyle}>
                <GoogleMark /> Google
              </button>
              <button type="button" onClick={signInWithApple} style={oauthButtonStyle}>
                <AppleMark /> Apple
              </button>
            </div>
            <Divider />
          </>
        )}

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What should we call you?"
              style={inputStyle}
              autoComplete="name"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            style={inputStyle}
            autoComplete="email"
            required
          />
          {mode !== "reset" && (
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              style={inputStyle}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              minLength={6}
              required
            />
          )}

          {error && (
            <div style={{ fontFamily: HAND, fontSize: 14, color: C.pink4, marginBottom: 10 }}>{error}</div>
          )}
          {info && (
            <div style={{ fontFamily: HAND, fontSize: 14, color: C.navySoft, marginBottom: 10 }}>{info}</div>
          )}

          <button
            type="submit"
            disabled={busy}
            style={{
              width: "100%",
              padding: "11px 0",
              borderRadius: 10,
              border: "none",
              background: C.pink2,
              color: C.paper,
              fontFamily: HAND,
              fontSize: 17,
              cursor: busy ? "default" : "pointer",
              opacity: busy ? 0.7 : 1,
              marginBottom: 14,
            }}
          >
            {busy ? "One sec…" : mode === "signup" ? "Create account" : mode === "reset" ? "Send reset link" : "Sign in"}
          </button>
        </form>

        <div style={{ textAlign: "center", fontFamily: HAND, fontSize: 14, color: C.inkSoft }}>
          {mode === "signin" && (
            <>
              <button type="button" onClick={() => { setMode("reset"); setError(null); setInfo(null); }} style={{ background: "none", border: "none", color: C.navySoft, cursor: "pointer", fontFamily: HAND, fontSize: 14, textDecoration: "underline" }}>
                Forgot password?
              </button>
              <div style={{ marginTop: 8 }}>
                New here?{" "}
                <button type="button" onClick={() => { setMode("signup"); setError(null); setInfo(null); }} style={{ background: "none", border: "none", color: C.pink3, cursor: "pointer", fontFamily: HAND, fontSize: 14, textDecoration: "underline" }}>
                  Create an account
                </button>
              </div>
            </>
          )}
          {mode === "signup" && (
            <>
              Already have an account?{" "}
              <button type="button" onClick={() => { setMode("signin"); setError(null); setInfo(null); }} style={{ background: "none", border: "none", color: C.pink3, cursor: "pointer", fontFamily: HAND, fontSize: 14, textDecoration: "underline" }}>
                Sign in
              </button>
            </>
          )}
          {mode === "reset" && (
            <button type="button" onClick={() => { setMode("signin"); setError(null); setInfo(null); }} style={{ background: "none", border: "none", color: C.pink3, cursor: "pointer", fontFamily: HAND, fontSize: 14, textDecoration: "underline" }}>
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}