import { useEffect, useState } from "react";

/* Tokens now point at the same CSS custom properties ThemeContext sets, so the
   splash screen matches whatever theme is active instead of always being pink. */
const C = {
  page: "var(--dome-page, #FEFCF6)",
  ink: "var(--dome-ink, #2E2B24)",
  inkSoft: "var(--dome-ink-soft, #6B6558)",
  navy: "var(--dome-navy, #2B3A5C)",
  line: "var(--dome-line, #DDD5C2)",
  lineSoft: "var(--dome-line-soft, #EBE4D4)",
  gridLine: "var(--dome-grid-line, rgba(190, 175, 140, 0.16))",
  pink0: "var(--dome-pink0, #F3D9DD)",
  pink1: "var(--dome-pink1, #E8AEBB)",
  pink2: "var(--dome-pink2, #D97690)",
  pink3: "var(--dome-pink3, #B54F70)",
  pink4: "var(--dome-pink4, #b53a62)",
};

const HAND = "'Patrick Hand', cursive";
const DISPLAY = "'Caveat', cursive";

const CAPTIONS = [
  "turning the page…",
  "sharpening the pencil…",
  "finding today's line…",
  "dotting the i's…",
];

const PEN_PATH = "M6 22 Q 34 6, 62 22 T 118 22 T 174 22 T 230 22 T 254 22";

export default function LoadingScreen() {
  const [captionIndex, setCaptionIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCaptionIndex((i) => (i + 1) % CAPTIONS.length);
    }, 1900);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: C.page,
        backgroundImage: `linear-gradient(${C.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${C.gridLine} 1px, transparent 1px)`,
        backgroundSize: "22px 22px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        zIndex: 9999,
      }}
    >
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Patrick+Hand&display=swap"
      />

      <style>{`
        @keyframes pen-draw {
          0%        { stroke-dashoffset: 340; }
          45%, 55%  { stroke-dashoffset: 0; }
          100%      { stroke-dashoffset: -340; }
        }
        @keyframes nib-move {
          0%   { offset-distance: 0%;   opacity: 0; }
          8%   { opacity: 1; }
          50%  { offset-distance: 100%; opacity: 1; }
          58%  { opacity: 0; }
          100% { offset-distance: 100%; opacity: 0; }
        }
        @keyframes caption-fade {
          0%, 100% { opacity: 0; transform: translateY(4px); }
          15%, 85% { opacity: 1; transform: translateY(0); }
        }
        @keyframes dot-breathe {
          0%, 100% { transform: scale(0.8); opacity: 0.35; }
          50%      { transform: scale(1.15); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .doME-pen, .doME-nib, .doME-caption, .doME-dot { animation: none !important; }
        }
      `}</style>

      <div
        style={{
          fontFamily: DISPLAY,
          fontSize: 44,
          fontWeight: 700,
          color: C.navy,
          letterSpacing: 1,
        }}
      >
        do·me
      </div>

      <svg width="260" height="40" viewBox="0 0 260 40" style={{ overflow: "visible" }}>
        <path
          className="doME-pen"
          d={PEN_PATH}
          fill="none"
          stroke={C.pink2}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="340"
          style={{ animation: "pen-draw 2.4s ease-in-out infinite" }}
        />
        <circle
          className="doME-nib"
          r="4.5"
          fill={C.pink4}
          style={{
            offsetPath: `path('${PEN_PATH}')`,
            animation: "nib-move 2.4s ease-in-out infinite",
          }}
        />
      </svg>

      <div style={{ height: 22, position: "relative", width: 240, textAlign: "center" }}>
        {CAPTIONS.map((c, i) => (
          <span
            key={c}
            className="doME-caption"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              fontFamily: HAND,
              fontSize: 16,
              color: C.inkSoft,
              animation: i === captionIndex ? "caption-fade 1.9s ease-in-out" : "none",
              opacity: i === captionIndex ? undefined : 0,
            }}
          >
            {c}
          </span>
        ))}
      </div>

      <div style={{ display: "flex", gap: 7 }}>
        {[C.pink1, C.pink2, C.pink3].map((clr, i) => (
          <span
            key={i}
            className="doME-dot"
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: clr,
              display: "inline-block",
              animation: `dot-breathe 1.2s ease-in-out ${i * 0.18}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}