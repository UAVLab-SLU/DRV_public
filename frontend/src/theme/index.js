import { createTheme } from "@mui/material/styles";
import { isDevelopmentRuntime } from "../utils/runtimeUtils";
import { ColorMode, defaultColorMode, getPaletteTokens } from "./palette";

function buildPalette(mode) {
  const tokens = getPaletteTokens(mode);
  const { accents, brand, status, surface, text } = tokens;
  return {
    drv: tokens,
    mode,
    primary: {
      main:         brand.secondary,
      light:        brand.soft,
      dark:         brand.strong,
      contrastText: text.onBrand,
    },
    secondary: {
      main:         accents.teal,
      contrastText: text.primary,
    },
    background: {
      default: surface.base,
      paper:   surface.elevated,
    },
    text: {
      primary:   text.primary,
      secondary: text.secondary,
      disabled:  text.muted,
    },
    divider: "rgba(255,255,255,0.08)",
    success: { main: status.success },
    warning: { main: status.warning },
    error:   { main: status.error   },
    info:    { main: status.info    },
    // Extended palette slots
    skyBlue:  { main: accents.skyBlue  },
    teal:     { main: accents.teal     },
    indigo:   { main: accents.indigo   },
    gold:     { main: accents.gold     },
    slate:    { main: accents.slate    },
    coolGray: { main: accents.coolGray },
    steel:    { main: accents.steel    },
  };
}

export const globalTheme = createTheme({
  cssVariables: true,
  defaultColorScheme: defaultColorMode,
  colorSchemes: {
    light: { palette: buildPalette(ColorMode.LIGHT) },
    dark:  { palette: buildPalette(ColorMode.DARK)  },
  },
  shape: {
    borderRadius:   6,
    borderRadiusSm: 4,
    borderRadiusMd: 6,
    borderRadiusLg: 10,
    borderRadiusXl: 16,
  },
  typography: {
    fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    overline: {
      fontSize:      "0.7rem",
      fontWeight:    700,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
    },
    h3: { fontSize: "2.6rem", fontWeight: 700 },
    h5: { fontSize: "1.35rem", fontWeight: 600 },
    body2: { lineHeight: 1.65 },
    caption: { lineHeight: 1.5 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: "#0f1420" },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          transition: "all 140ms ease-in-out",
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          transition: "box-shadow 200ms ease-in-out",
        },
      },
    },
    MuiAccordion: {
      defaultProps: {
        slotProps: { transition: { unmountOnExit: false } },
      },
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: { fontSize: "0.9rem" },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiTooltip: {
      defaultProps: { arrow: true },
      styleOverrides: {
        tooltip: {
          fontSize: "0.78rem",
          backgroundColor: "#1e2a3e",
          border: "1px solid rgba(255,255,255,0.1)",
        },
        arrow: { color: "#1e2a3e" },
      },
    },
  },
});

if (isDevelopmentRuntime()) {
  console.log("Global theme initialized (dev mode)");
}
