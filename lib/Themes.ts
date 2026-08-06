export type ThemeId = "peony" | "sage" | "lavender" | "sky" | "sand" | "mauve";

export interface ThemeTokens {
  id: ThemeId;
  label: string;
  paper: string;
  page: string;
  ink: string;
  inkSoft: string;
  navy: string;
  navySoft: string;
  line: string;
  lineSoft: string;
  gridLine: string;
  pink0: string;
  pink1: string;
  pink2: string;
  pink3: string;
  pink4: string;
  gold: string;
}

const NEUTRAL_LINE = "#D8D2C3";
const NEUTRAL_LINE_SOFT = "#E6DFCF";

export const THEMES: Record<ThemeId, ThemeTokens> = {
  peony: {
    id: "peony",
    label: "Peony pink",
    paper: "#FFFDF8",
    page: "#FEFCF6",
    ink: "#2E2B24",
    inkSoft: "#6B6558",
    navy: "#2B3A5C",
    navySoft: "#54628A",
    line: NEUTRAL_LINE,
    lineSoft: NEUTRAL_LINE_SOFT,
    gridLine: "rgba(190, 175, 140, 0.16)",
    pink0: "#F3D9DD",
    pink1: "#E8AEBB",
    pink2: "#D97690",
    pink3: "#B54F70",
    pink4: "#b53a62",
    gold: "#C69A55",
  },
  sage: {
    id: "sage",
    label: "Sage",
    paper: "#FFFEFA",
    page: "#FBFAF3",
    ink: "#2B2E27",
    inkSoft: "#666A5D",
    navy: "#3A4A34",
    navySoft: "#5E7256",
    line: NEUTRAL_LINE,
    lineSoft: NEUTRAL_LINE_SOFT,
    gridLine: "rgba(150, 170, 120, 0.16)",
    pink0: "#E7EEE1",
    pink1: "#C9DAB9",
    pink2: "#9FBE84",
    pink3: "#7A9C63",
    pink4: "#5F7F4B",
    gold: "#C6A855",
  },
  lavender: {
    id: "lavender",
    label: "Lavender",
    paper: "#FDFCFE",
    page: "#FAF8FC",
    ink: "#2C2A31",
    inkSoft: "#6B6572",
    navy: "#3D3260",
    navySoft: "#6A5C93",
    line: NEUTRAL_LINE,
    lineSoft: NEUTRAL_LINE_SOFT,
    gridLine: "rgba(160, 140, 190, 0.16)",
    pink0: "#EDE6F5",
    pink1: "#D3C2E8",
    pink2: "#B199D6",
    pink3: "#8F6FBE",
    pink4: "#6F4FA0",
    gold: "#C6A855",
  },
  sky: {
    id: "sky",
    label: "Sky",
    // Lightened from the original #FBFDFE / #F7FBFD per request — page now
    // sits closer to paper for a brighter overall wash, while staying a
    // touch darker than paper so cards still read as "lifted" above it.
    paper: "#FDFEFF",
    page: "#FAFDFE",
    ink: "#242C31",
    inkSoft: "#5F6C74",
    navy: "#1F4A66",
    navySoft: "#3F7594",
    line: NEUTRAL_LINE,
    lineSoft: NEUTRAL_LINE_SOFT,
    gridLine: "rgba(120, 165, 195, 0.16)",
    pink0: "#E2EEF6",
    pink1: "#B8D7EA",
    pink2: "#86B8DA",
    pink3: "#5C93C0",
    pink4: "#3E71A0",
    gold: "#C6A855",
  },
  sand: {
    id: "sand",
    label: "Sand",
    paper: "#FFFDFA",
    page: "#FCF9F3",
    ink: "#2E2823",
    inkSoft: "#6B5F52",
    navy: "#5C3B23",
    navySoft: "#8A6141",
    line: NEUTRAL_LINE,
    lineSoft: NEUTRAL_LINE_SOFT,
    gridLine: "rgba(190, 150, 100, 0.16)",
    pink0: "#F3E6D8",
    pink1: "#E6C6A3",
    pink2: "#D6A06C",
    pink3: "#BC7C45",
    pink4: "#9C5F30",
    gold: "#C69A55",
  },
  mauve: {
    id: "mauve",
    label: "Mauve",
    paper: "#FEFCFC",
    page: "#FBF7F7",
    ink: "#2C2726",
    inkSoft: "#685F5D",
    navy: "#4A3335",
    navySoft: "#7A5A5C",
    line: NEUTRAL_LINE,
    lineSoft: NEUTRAL_LINE_SOFT,
    gridLine: "rgba(160, 130, 128, 0.16)",
    pink0: "#EDE3E1",
    pink1: "#D6C1BD",
    pink2: "#B99793",
    pink3: "#977270",
    pink4: "#755352",
    gold: "#C6A855",
  },
};

export const THEME_ORDER: ThemeId[] = ["peony", "sage", "lavender", "sky", "sand", "mauve"];

// Maps each ThemeTokens field to the CSS custom property it drives.
// `page` -> --dome-page is the app's background, behind everything.
// `paper` -> --dome-paper is the card/input surface color sitting on top of it.
export const CSS_VAR_NAMES: Record<Exclude<keyof ThemeTokens, "id" | "label">, string> = {
  paper: "--dome-paper",
  page: "--dome-page",
  ink: "--dome-ink",
  inkSoft: "--dome-ink-soft",
  navy: "--dome-navy",
  navySoft: "--dome-navy-soft",
  line: "--dome-line",
  lineSoft: "--dome-line-soft",
  gridLine: "--dome-grid-line",
  pink0: "--dome-pink0",
  pink1: "--dome-pink1",
  pink2: "--dome-pink2",
  pink3: "--dome-pink3",
  pink4: "--dome-pink4",
  gold: "--dome-gold",
};

// Single source of truth for turning a theme into a CSS-var map. Used by both
// the server-rendered anti-flash script (layout.tsx) and the client-side
// ThemeContext, so there is exactly one place these get generated from —
// no hex values duplicated anywhere else in the app.
export function toCssVars(tokens: ThemeTokens): Record<string, string> {
  const out: Record<string, string> = {};
  (Object.keys(CSS_VAR_NAMES) as (keyof typeof CSS_VAR_NAMES)[]).forEach((key) => {
    out[CSS_VAR_NAMES[key]] = tokens[key];
  });
  return out;
}