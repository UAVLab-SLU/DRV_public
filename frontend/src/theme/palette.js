import { useTheme } from "@mui/material/styles";
import { isDevelopmentRuntime } from "../utils/runtimeUtils";

export const ColorMode = {
  LIGHT: "light",
  DARK: "dark",
};

const paletteTokens = {
  [ColorMode.DARK]: {
    mode: ColorMode.DARK,
    brand: {
      primary:   "#0b0f18",  // navbar / page chrome
      secondary: "#3b82f6",  // Tailwind blue-500 — vivid accent
      strong:    "#2563eb",  // blue-600 — hover / pressed
      soft:      "#93c5fd",  // blue-300 — overlines, labels, icons
    },
    surface: {
      canvas:   "#080b12",   // deepest bg
      base:     "#0f1420",   // page background
      elevated: "#161e2e",   // cards / panels (clearly distinct from base)
      muted:    "#1e2a3e",   // accordion headers, raised rows
      subtle:   "#111827",   // slight variation for section bgs
      input:    "#19243a",   // text inputs and selects
      heroOverlay:
        "linear-gradient(160deg, #080b12 0%, #0d1525 55%, #111e35 100%)",
      glassStrong:
        "linear-gradient(to bottom, rgba(8,11,18,0.97) 0%, rgba(13,21,37,0.85) 100%)",
      glassSoft:
        "linear-gradient(to bottom, rgba(8,11,18,0.92) 0%, rgba(13,21,37,0.7) 100%)",
    },
    text: {
      primary:   "#f1f5f9",  // slate-100 — near-white, maximum readability
      secondary: "#94a3b8",  // slate-400 — clear hierarchy below primary
      muted:     "#4b6280",  // disabled / hints
      onBrand:   "#ffffff",
      inverse:   "#0f1420",
    },
    status: {
      success: "#22c55e",    // green-500
      warning: "#f59e0b",    // amber-500
      error:   "#ef4444",    // red-500
      info:    "#38bdf8",    // sky-400
    },
    accents: {
      skyBlue:  "#93c5fd",   // blue-300
      teal:     "#2dd4bf",   // teal-400
      indigo:   "#818cf8",   // indigo-400
      gold:     "#fbbf24",   // amber-400
      slate:    "#94a3b8",   // slate-400
      coolGray: "#cbd5e1",   // slate-300
      steel:    "#64748b",   // slate-500
    },
  },

  [ColorMode.LIGHT]: {
    mode: ColorMode.LIGHT,
    brand: {
      primary:   "#1e293b",
      secondary: "#2563eb",
      strong:    "#1d4ed8",
      soft:      "#3b82f6",
    },
    surface: {
      canvas:   "#e2e8f0",
      base:     "#ffffff",
      elevated: "#f8fafc",
      muted:    "#f1f5f9",
      subtle:   "#f8fafc",
      input:    "#ffffff",
      heroOverlay:
        "linear-gradient(160deg, #f8fafc 0%, #eff6ff 55%, #dbeafe 100%)",
      glassStrong:
        "linear-gradient(to bottom, rgba(255,255,255,0.97) 0%, rgba(239,246,255,0.88) 100%)",
      glassSoft:
        "linear-gradient(to bottom, rgba(255,255,255,0.92) 0%, rgba(239,246,255,0.72) 100%)",
    },
    text: {
      primary:   "#0f172a",
      secondary: "#475569",
      muted:     "#94a3b8",
      onBrand:   "#ffffff",
      inverse:   "#ffffff",
    },
    status: {
      success: "#16a34a",
      warning: "#d97706",
      error:   "#dc2626",
      info:    "#0284c7",
    },
    accents: {
      skyBlue:  "#3b82f6",
      teal:     "#0d9488",
      indigo:   "#4f46e5",
      gold:     "#d97706",
      slate:    "#64748b",
      coolGray: "#475569",
      steel:    "#334155",
    },
  },
};

export const shouldRespectSystemColorMode = false;
export const fallbackColorMode = ColorMode.DARK;
export const defaultColorMode = shouldRespectSystemColorMode ? "system" : fallbackColorMode;

if (isDevelopmentRuntime()) {
  console.log(`[Theme] defaultColorMode: ${defaultColorMode}`);
}

function resolveColorMode(mode) {
  return mode === ColorMode.LIGHT ? ColorMode.LIGHT : ColorMode.DARK;
}

export function getPaletteTokens(mode = fallbackColorMode) {
  return paletteTokens[resolveColorMode(mode)];
}

export function getThemeTokens(theme) {
  const themeMode = theme?.palette?.mode;
  return theme?.palette?.drv ?? getPaletteTokens(themeMode);
}

export function useThemeTokens() {
  return getThemeTokens(useTheme());
}

export const stylePrimitives = {
  blur: { heavy: "blur(12px)" },
  opacity: {
    dividerStrong: "rgba(255,255,255,0.15)",
    dividerSoft:   "rgba(255,255,255,0.07)",
    panelBackdrop: "rgba(0,0,0,0.35)",
    navActive:     "rgba(59,130,246,0.18)",
    navHover:      "rgba(255,255,255,0.06)",
  },
  border: {
    default: "1px solid rgba(255,255,255,0.08)",
    accent:  "1px solid rgba(59,130,246,0.35)",
    subtle:  "1px solid rgba(255,255,255,0.05)",
  },
};
