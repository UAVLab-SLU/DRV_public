import { Button } from "@mui/material";
import { styled as muiStyled } from "@mui/material/styles";
import { getThemeTokens, stylePrimitives } from "../theme/palette";

// CSS-variable aliases — map semantic names to MUI's generated vars
export const customTheme = {
  background: {
    primary:     "var(--mui-palette-background-paper)",
    main:        "var(--mui-palette-background-paper)",
    secondary:   "var(--mui-palette-background-default)",
    reverse:     "var(--mui-palette-primary-main)",
    hover:       "var(--mui-palette-primary-light)",
    selected:    "var(--mui-palette-primary-dark)",
    accent:      "var(--mui-palette-primary-light)",
    transparent: "transparent",
    gradient:    "var(--drv-surface-hero-overlay)",
  },
  foreground: {
    primary:     "var(--mui-palette-text-primary)",
    main:        "var(--mui-palette-text-primary)",
    secondary:   "var(--mui-palette-text-secondary)",
    reverse:     "var(--mui-palette-primary-contrastText)",
    contrast:    "var(--mui-palette-background-default)",
    accent:      "var(--mui-palette-primary-light)",
    transparent: "transparent",
  },
};

export const StyledButton = muiStyled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadiusMd,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
  },
}));

export function StyledBackground(theme) {
  const tokens = getThemeTokens(theme);
  return {
    background: tokens.surface.heroOverlay,
    display: "flex",
    flexDirection: "column",
    flex: 1,
    justifyContent: "space-between",
  };
}

export const BlurredBgArea = {
  backdropFilter: stylePrimitives.blur.heavy,
  padding: "2rem",
  borderRadius: "0.5rem",
};
