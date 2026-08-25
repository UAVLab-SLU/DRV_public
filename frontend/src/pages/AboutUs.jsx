import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import FlightIcon from "@mui/icons-material/Flight";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useThemeTokens } from "../theme/palette";

const FEATURES = [
  {
    icon: <ScienceOutlinedIcon />,
    color: "#a78bfa",
    bg: "rgba(124,58,237,0.12)",
    title: "Revolutionary Testing",
    body: "DroneWorld replaces costly field testing with high-fidelity simulation, letting teams validate sUAS behaviour before any real-world flight.",
  },
  {
    icon: <PublicOutlinedIcon />,
    color: "#2dd4bf",
    bg: "rgba(13,148,136,0.12)",
    title: "Simulation Ecosystem",
    body: "Generate realistic 3D environments — adverse weather, wireless interference, dynamic obstacles — fully configurable from the browser.",
  },
  {
    icon: <BarChartOutlinedIcon />,
    color: "#fb923c",
    bg: "rgba(249,115,22,0.12)",
    title: "Automated Analysis",
    body: "Monitor sUAS activity against predefined safety parameters and produce detailed acceptance test reports with actionable debugging insights.",
  },
  {
    icon: <ShieldOutlinedIcon />,
    color: "#4ade80",
    bg: "rgba(34,197,94,0.12)",
    title: "Safety & Reliability",
    body: "Ensure your sUAS meets the highest safety standards through rigorous simulation of operational scenarios before real-world deployment.",
  },
];

const STATS = [
  { value: "Dr. Ankit Agrawal", label: "Project Client" },
  { value: "OSS-SLU Team",      label: "Development Team" },
  { value: "MIT License",       label: "Open Source" },
  { value: "Since 2023",        label: "Active Development" },
];

export default function AboutUs() {
  const tokens = useThemeTokens();

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 128px)",
        backgroundColor: tokens.surface.base,
        py: { xs: 6, md: 10 },
      }}
    >
      <Container maxWidth="lg">

        {/* ── Hero ─────────────────────────────────────── */}
        <Box sx={{ textAlign: "center", mb: { xs: 6, md: 10 } }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              mb: 3,
              px: 2,
              py: 0.75,
              borderRadius: 10,
              border: "1px solid rgba(59,130,246,0.35)",
              bgcolor: "rgba(59,130,246,0.08)",
            }}
          >
            <FlightIcon
              sx={{ color: tokens.brand.soft, fontSize: "0.9rem", transform: "rotate(45deg)" }}
            />
            <Typography variant="caption" sx={{ color: tokens.brand.soft, fontWeight: 700 }}>
              About DroneWorld
            </Typography>
          </Box>

          <Typography
            component="h1"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "2rem", md: "2.8rem" },
              color: tokens.text.primary,
              lineHeight: 1.2,
              mb: 2.5,
            }}
          >
            Advanced sUAS Testing Platform
          </Typography>

          <Typography
            sx={{
              color: tokens.text.secondary,
              fontSize: { xs: "1rem", md: "1.1rem" },
              maxWidth: 680,
              mx: "auto",
              lineHeight: 1.8,
            }}
          >
            Developed by Dr.&nbsp;Ankit Agrawal and the OSS-SLU team, DroneWorld enables teams to
            configure detailed test scenarios, generate realistic 3D simulation environments, and
            produce comprehensive safety compliance reports — all from the browser.
          </Typography>
        </Box>

        {/* ── Feature cards ────────────────────────────── */}
        <Grid container spacing={3} sx={{ mb: { xs: 6, md: 8 } }}>
          {FEATURES.map((f) => (
            <Grid key={f.title} size={{ xs: 12, sm: 6 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: "100%",
                  borderRadius: 2,
                  border: "1px solid rgba(255,255,255,0.08)",
                  backgroundColor: "#161e2e",
                  transition: "border-color 200ms",
                  "&:hover": { borderColor: "rgba(255,255,255,0.18)" },
                }}
              >
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 46,
                      height: 46,
                      borderRadius: 2,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: f.bg,
                      color: f.color,
                      flexShrink: 0,
                    }}
                  >
                    {f.icon}
                  </Box>
                  <Box>
                    <Typography
                      sx={{ fontWeight: 700, color: tokens.text.primary, mb: 0.75, fontSize: "1rem" }}
                    >
                      {f.title}
                    </Typography>
                    <Typography
                      sx={{ color: tokens.text.secondary, fontSize: "0.9rem", lineHeight: 1.7 }}
                    >
                      {f.body}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* ── Stats strip ──────────────────────────────── */}
        <Paper
          elevation={0}
          sx={{
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "#161e2e",
            borderRadius: 2,
            py: { xs: 4, md: 5 },
            px: { xs: 2, md: 6 },
          }}
        >
          <Grid container>
            {STATS.map((s, i) => (
              <Grid key={s.label} size={{ xs: 6, md: 3 }}>
                <Box
                  sx={{
                    textAlign: "center",
                    py: 1,
                    px: { xs: 1, md: 2 },
                    borderRight:
                      i < STATS.length - 1
                        ? { md: "1px solid rgba(255,255,255,0.08)" }
                        : "none",
                    borderBottom:
                      i < 2 ? { xs: "1px solid rgba(255,255,255,0.08)", md: "none" } : "none",
                    pb: { xs: i < 2 ? 2 : 0, md: 0 },
                    pt: { xs: i >= 2 ? 2 : 0, md: 0 },
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: "0.85rem", md: "1rem" },
                      color: tokens.brand.soft,
                      mb: 0.5,
                    }}
                  >
                    {s.value}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: tokens.text.secondary, letterSpacing: "0.04em", display: "block" }}
                  >
                    {s.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* ── Open-source note ─────────────────────────── */}
        <Box sx={{ mt: { xs: 5, md: 7 }, textAlign: "center", maxWidth: 680, mx: "auto" }}>
          <Divider sx={{ mb: 4, borderColor: "rgba(255,255,255,0.08)" }} />
          <Typography variant="overline" sx={{ color: tokens.brand.soft, display: "block", mb: 1.5 }}>
            Open Source
          </Typography>
          <Typography sx={{ color: tokens.text.secondary, lineHeight: 1.8, fontSize: "0.9rem" }}>
            DroneWorld is released under the MIT License and actively maintained by the OSS-SLU
            community. Contributions, issue reports, and feature requests are welcome on GitHub.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
