import CircleIcon from "@mui/icons-material/Circle";
import FlightIcon from "@mui/icons-material/Flight";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import TravelExploreOutlinedIcon from "@mui/icons-material/TravelExploreOutlined";
import VideogameAssetOutlinedIcon from "@mui/icons-material/VideogameAssetOutlined";
import { AppBar, Box, Button, Divider, IconButton, Tooltip, Toolbar, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { customTheme } from "../css/commonStyles";
import { stylePrimitives, useThemeTokens } from "../theme/palette";

const NAV_LINKS = [
  { label: "Home", to: "/", icon: <HomeOutlinedIcon fontSize="small" /> },
  { label: "Configuration", to: "/simulation", icon: <TravelExploreOutlinedIcon fontSize="small" /> },
  { label: "Simulator", to: "/simulator", icon: <VideogameAssetOutlinedIcon fontSize="small" /> },
  { label: "Reports", to: "/report-dashboard", icon: <AssessmentOutlinedIcon fontSize="small" /> },
  { label: "About", to: "/aboutus", icon: <InfoOutlinedIcon fontSize="small" /> },
];

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

const navBtnSx = {
  color: customTheme.foreground.reverse,
  textTransform: "none",
  px: 1.5,
  py: 0.75,
  borderRadius: 0.5,
  fontWeight: 600,
  "&:hover": { backgroundColor: stylePrimitives.opacity.navHover },
};

const activeNavBtnSx = {
  ...navBtnSx,
  backgroundColor: stylePrimitives.opacity.navActive,
  borderBottom: "2px solid",
  borderBottomColor: "primary.light",
};

export default function Navbar() {
  const location = useLocation();
  const tokens = useThemeTokens();
  const [healthStatus, setHealthStatus] = useState("unknown");

  useEffect(() => {
    let ignore = false;
    let timeout;

    const check = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/health`);
        if (!ignore) {
          setHealthStatus(res.ok ? "online" : "degraded");
        }
      } catch {
        if (!ignore) setHealthStatus("unreachable");
      }
      if (!ignore) timeout = setTimeout(check, 30_000);
    };

    check();
    return () => {
      ignore = true;
      clearTimeout(timeout);
    };
  }, []);

  const statusColor =
    healthStatus === "online"
      ? tokens.status.success
      : healthStatus === "degraded"
        ? tokens.status.warning
        : healthStatus === "unreachable"
          ? tokens.status.error
          : tokens.status.info;

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: tokens.brand.primary,
        borderBottom: `1px solid ${tokens.brand.secondary}`,
      }}
    >
      <Toolbar
        sx={{
          width: "100%",
          maxWidth: 1280,
          mx: "auto",
          py: 0.5,
          gap: 2,
        }}
      >
        {/* Brand */}
        <Box
          component={Link}
          to="/"
          aria-label="DroneWorld home"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <FlightIcon
            sx={{
              color: tokens.brand.soft,
              fontSize: "1.6rem",
              transform: "rotate(45deg)",
            }}
          />
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: tokens.brand.secondary }} />
          <Typography
            sx={{
              color: customTheme.foreground.reverse,
              fontWeight: 800,
              fontSize: "1.2rem",
              letterSpacing: "-0.01em",
              lineHeight: 1.1,
            }}
          >
            DroneWorld
          </Typography>
        </Box>

        {/* Nav links */}
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: { xs: "flex-start", md: "center" },
            gap: 0.5,
          }}
        >
          {NAV_LINKS.map(({ label, to, icon }) => (
            <Button
              key={to}
              component={Link}
              to={to}
              aria-current={location.pathname === to ? "page" : undefined}
              startIcon={icon}
              sx={location.pathname === to ? activeNavBtnSx : navBtnSx}
            >
              {label}
            </Button>
          ))}
        </Box>

        {/* Backend health indicator */}
        <Tooltip
          title={`Backend: ${healthStatus}`}
          placement="bottom"
          arrow
        >
          <IconButton
            aria-label={`backend status: ${healthStatus}`}
            size="small"
            sx={{
              color: customTheme.foreground.reverse,
              border: `1px solid ${stylePrimitives.opacity.dividerStrong}`,
            }}
          >
            <CircleIcon
              sx={{
                fontSize: "0.75rem",
                color: statusColor,
                animation:
                  healthStatus === "online"
                    ? "statusPulse 1.4s ease-in-out infinite"
                    : "none",
                "@keyframes statusPulse": {
                  "0%": { transform: "scale(1)", opacity: 1 },
                  "50%": { transform: "scale(0.8)", opacity: 0.6 },
                  "100%": { transform: "scale(1)", opacity: 1 },
                },
              }}
            />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}
