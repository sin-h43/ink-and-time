"use client";

import { useEffect, useRef, useState } from "react";

/**
 * App tokens (mirrors `C`/HAND/DISPLAY in doMEApp.tsx)
 * Re-mapped to support the exact pixel-art styling from the references.
 */
const C = {
  paper: "#FFFFFF", // Strict white for the inner bar
  page: "#FEFCF6",
  ink: "#000000",   // Pure black for pixel outlines
  gridLine: "rgba(190, 175, 140, 0.16)",
  // Neon pinks for the exact dithered loading bar fill
  pinkDither1: "#FF007F", 
  pinkDither2: "#FF66B2",
};

/* --------------------------------------------------------------------------
 * Pixel cat — Accurately mapped to the Pop Cat meme references.
 * C: Cream, T: Tan (left), B: Brown (right), P: Ear pink, M: Closed mouth pink,
 * D: Open mouth dark red, R: Open mouth tongue red, K: Black outline
 * ------------------------------------------------------------------------*/
const CAT_PALETTE: Record<string, string> = {
  K: "#000000", 
  C: "#F3E1C6", 
  T: "#DFA777", 
  B: "#856046", 
  P: "#F7A5B7", 
  M: "#F5749B", 
  E: "#333333", 
  D: "#5A0616", 
  R: "#CC323A", 
};

// 26x24 Grid optimized for the exact closed-mouth smug expression
const CAT_CLOSED = [
  ".......KKK..............",
  "......KPPPK........KK...",
  ".....KPPPPPK......KBK...",
  "....KTPPPPPK.....KBBK...",
  "...KTTPPPPPK...KKBBBK...",
  "..KTTTPPPPPKKKKKBBBBK...",
  ".KTTTTPPPPKKCCCCCKBBK...",
  ".KTTTTTPPKCCCCCCCCKBK...",
  "KTTTTTTTKCCCCCCCCCCK....",
  "KTTTTTTCKCCCCCCCCCCCK...",
  "KTTTTTCCCCCCCCCCCCCCK...",
  "KTTCCTCCCCCCCCCCCCCCK...",
  "KCCCCCCCCCCCCCCCCCCCK...",
  "KCCCCCCCCCCCCCCCCCCCK...",
  "KCCCKKKCCCCCCCKKKCCCK...",
  "KCCCEEEKCCCCCCEEEKCCK...",
  "KCCCKKKCCCCCCCKKKCCCK...",
  "KCCCCCCCCCPPCCCCCCCCK...",
  "KCCCCCCMMMMMMMMCCCCCK...",
  "KCCCCCMCCCCCCCMMCCCCK...",
  "KCCCCCCCCCCCCCCCCCCCK...",
  ".KCCCCCCCCCCCCCCCCCK....",
  "..KCCCCCCCCCCCCCCCK.....",
  "...KKKKKKKKKKKKKKK......",
];

// Open mouth frame — swaps the lower face for the massive O-shape
const CAT_OPEN = [
  ".......KKK..............",
  "......KPPPK........KK...",
  ".....KPPPPPK......KBK...",
  "....KTPPPPPK.....KBBK...",
  "...KTTPPPPPK...KKBBBK...",
  "..KTTTPPPPPKKKKKBBBBK...",
  ".KTTTTPPPPKKCCCCCKBBK...",
  ".KTTTTTPPKCCCCCCCCKBK...",
  "KTTTTTTTKCCCCCCCCCCK....",
  "KTTTTTTCKCCCCCCCCCCCK...",
  "KTTTTTCCCCCCCCCCCCCCK...",
  "KTTCCTCCCCCCCCCCCCCCK...",
  "KCCCKKKCCCCCCCKKKCCCK...",
  "KCCCEEEKCCCCCCEEEKCCK...",
  "KCCCKKKCCCCCCCKKKCCCK...",
  "KCCCCCCCCCCCCCCCCCCCK...",
  "KCCCCCKKKKKKKKKCCCCCK...",
  "KCCCCKDDDDDDDDDKCCCCK...",
  "KCCCKDDDDDDDDDDDKCCCK...",
  "KCCCKDDDDDDDDDDDKCCCK...",
  "KCCCCKRRRRRRRRRKCCCCK...",
  ".KCCCCKKKKKKKKKCCCCK....",
  "..KCCCCCCCCCCCCCCCK.....",
  "...KKKKKKKKKKKKKKK......",
];

const CELL = 3;
const GRID_W = 24;

function PixelCat({ chewing }: { chewing: boolean }) {
  const grid = chewing ? CAT_OPEN : CAT_CLOSED;
  const h = grid.length;
  return (
    <svg 
      width={GRID_W * CELL} 
      height={h * CELL} 
      viewBox={`0 0 ${GRID_W * CELL} ${h * CELL}`} 
      shapeRendering="crispEdges"
      style={{ imageRendering: "pixelated" }}
    >
      {grid.map((row, r) =>
        row.split("").map((ch, c) => {
          if (ch === ".") return null;
          return <rect key={`${r}-${c}`} x={c * CELL} y={r * CELL} width={CELL} height={CELL} fill={CAT_PALETTE[ch]} />;
        })
      )}
    </svg>
  );
}

/* --------------------------------------------------------------------------
 * Pixel loading bar — Rebuilt to map the solid thick black border and 
 * true 2-tone neon dither pattern from the reference image.
 * ------------------------------------------------------------------------*/
function PixelLoadingBar({ progress }: { progress: number }) {
  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div style={{
        border: `4px solid ${C.ink}`, 
        background: C.paper, 
        height: 28, 
        width: "100%",
        position: "relative", 
        overflow: "hidden",
        imageRendering: "pixelated",
      }}>
        <div style={{
          height: "100%", 
          width: `${progress}%`,
          backgroundColor: C.pinkDither1,
          backgroundImage: `repeating-conic-gradient(${C.pinkDither2} 0% 25%, ${C.pinkDither1} 0% 50%)`,
          backgroundSize: "6px 6px", // Tight dither mapping
          transition: "width 0.15s linear",
        }} />
      </div>
    </div>
  );
}

/* ------------------------------ Loading screen ---------------------------- */
export default function LoadingScreen({
  duration = 2200,
  progress: controlledProgress,
  label = "LOADING",
  onDone,
}: {
  duration?: number;
  progress?: number;
  label?: string;
  onDone?: () => void;
}) {
  const [autoProgress, setAutoProgress] = useState(0);
  const [chewing, setChewing] = useState(false);
  const doneFired = useRef(false);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  const isControlled = controlledProgress !== undefined;
  const progress = isControlled ? Math.max(0, Math.min(100, controlledProgress as number)) : autoProgress;

  useEffect(() => {
    if (isControlled) return;
    startRef.current = null;
    const tick = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const elapsed = t - startRef.current;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setAutoProgress(pct);
      if (pct < 100) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [duration, isControlled]);

  // Chewing animation interval mapping
  useEffect(() => {
    const id = setInterval(() => setChewing((v) => !v), 220);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (progress >= 100 && !doneFired.current) {
      doneFired.current = true;
      const t = setTimeout(() => onDone?.(), 350);
      return () => clearTimeout(t);
    }
  }, [progress, onDone]);

  // Keep the cat's horizontal travel clamped inside the bar trajectory
  const catLeft = 5 + progress * 0.85;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 26,
      background: C.page,
      backgroundImage: `linear-gradient(${C.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${C.gridLine} 1px, transparent 1px)`,
      backgroundSize: "22px 22px",
    }}>
      <style>{`
        @keyframes lscat-bob { 0%, 100% { transform: translate(-50%, 0); } 50% { transform: translate(-50%, -6px); } }
      `}</style>

      <div style={{ position: "relative", width: 280 }}>
        {/* Cat tracks along the top edge of the bar */}
        <div style={{
          position: "absolute", left: `${catLeft}%`, bottom: "100%", marginBottom: -2,
          animation: "lscat-bob 0.8s ease-in-out infinite", transition: "left 0.15s linear",
        }}>
          <PixelCat chewing={chewing} />
        </div>

        <PixelLoadingBar progress={progress} />

        {/* Replaced handwritten font with strict pixel typography */}
        <div style={{
          marginTop: 18, 
          textAlign: "center", 
          fontFamily: "'Press Start 2P', 'Courier New', monospace", 
          fontSize: 18, 
          fontWeight: "bold",
          color: C.ink,
          textTransform: "uppercase", 
          letterSpacing: 2,
          imageRendering: "pixelated",
        }}>
          {label} {".".repeat(1 + Math.floor(progress / 34))}
        </div>
      </div>
    </div>
  );
}