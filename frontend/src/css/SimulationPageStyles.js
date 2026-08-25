import styled from "@emotion/styled";
import Accordion from "@mui/material/Accordion";
import Select from "@mui/material/Select";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

// Shared panel background for config sections
export const panelSx = (tokens) => ({
  backgroundColor: tokens.surface.elevated,
  border: `1px solid rgba(255,255,255,0.08)`,
  borderRadius: 1.5,
  p: 2,
  mb: 2,
});

export const StyledSelect = styled(Select)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  "& .MuiInputBase-input": { padding: "0.3em 0.5em", height: "1em" },
  "& .MuiSvgIcon-root": { color: theme.palette.text.secondary },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255,255,255,0.12)",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255,255,255,0.25)",
  },
}));

// ── Tabs ─────────────────────────────────────────────────────────────────────

export const StyledTab = styled(Tab)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontWeight: 600,
  fontSize: "0.8rem",
  textTransform: "none",
  minHeight: 40,
  transition: "background-color 180ms, color 180ms",
  borderBottom: "2px solid transparent",
  "&:hover": {
    color: theme.palette.text.primary,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  "&.Mui-selected": {
    color: "#93c5fd",            // blue-300 — bright and readable
    borderBottomColor: "#3b82f6",
  },
}));

export const StyledTabs = styled(Tabs)(({ theme }) => ({
  minHeight: 40,
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  "& .MuiTabs-indicator": {
    backgroundColor: "#3b82f6",
    height: 2,
  },
}));

// Legacy helpers kept for backward compatibility
export const AccordionStyled = styled(Accordion)(() => ({
  backgroundColor: "transparent",
  backgroundImage: "none",
  "&:before": { display: "none" },
}));

export const AccordionSummaryStyle = {
  backgroundColor: "rgba(255,255,255,0.04)",
  "&:hover": { backgroundColor: "rgba(255,255,255,0.07)" },
};

export const AccordionDetailsStyle = {
  backgroundColor: "transparent",
  pt: 2,
};

export const GridConfigStyle = {
  maxHeight: "75vh",
  overflowY: "auto",
};

export const ConfigInputStyle = {
  "& .MuiOutlinedInput-root": {
    "& .MuiInputBase-input": { padding: "0.3em 0.5em" },
  },
};

export const LoadingStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100%",
};
