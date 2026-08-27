import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import FlightIcon from "@mui/icons-material/Flight";
import GroupWorkIcon from "@mui/icons-material/GroupWork";
import InsertChartOutlinedIcon from "@mui/icons-material/InsertChartOutlined";
import LandscapeIcon from "@mui/icons-material/Landscape";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Link } from "react-router-dom";
import { stylePrimitives, useThemeTokens } from "./theme/palette";

const FEATURES = [
  {
    icon: <LandscapeIcon sx={{ fontSize: "1.6rem" }} />,
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.15)",
    title: "3D Environment Generation",
    body: "Create realistic terrains, cities, and landscapes for comprehensive drone testing using Google 3D Tiles.",
  },
  {
    icon: <ShowChartIcon sx={{ fontSize: "1.6rem" }} />,
    color: "#16a34a",
    bg: "rgba(22,163,74,0.15)",
    title: "Real-time Simulation",
    body: "Monitor and control multiple drones simultaneously with live data streaming and configurable test parameters.",
  },
  {
    icon: <GroupWorkIcon sx={{ fontSize: "1.6rem" }} />,
    color: "#4a90d9",
    bg: "rgba(74,144,217,0.15)",
    title: "Multi-drone Coordination",
    body: "Test swarm intelligence and formation flight patterns with advanced coordination scenarios.",
  },
  {
    icon: <InsertChartOutlinedIcon sx={{ fontSize: "1.6rem" }} />,
    color: "#f97316",
    bg: "rgba(249,115,22,0.15)",
    title: "Acceptance Test Reports",
    body: "Comprehensive reporting tools to evaluate drone performance and mission success against defined requirements.",
  },
];

export default function LandingPage() {
  const tokens = useThemeTokens();

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      {/* Hero */}
      <Box
        component="section"
        sx={{
          background: tokens.surface.heroOverlay,
          borderBottom: `1px solid ${tokens.brand.secondary}`,
          py: { xs: 10, md: 16 },
          textAlign: "center",
        }}
      >
        <Container maxWidth="md">
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              mb: 3,
              px: 2,
              py: 0.75,
              borderRadius: 10,
              border: `1px solid ${tokens.brand.secondary}`,
              backdropFilter: stylePrimitives.blur.heavy,
              backgroundColor: "rgba(74,144,217,0.1)",
            }}
          >
            <FlightIcon
              sx={{ color: tokens.brand.soft, fontSize: "1rem", transform: "rotate(45deg)" }}
            />
            <Typography variant="caption" sx={{ color: tokens.brand.soft, fontWeight: 600 }}>
              Drone Simulation Platform
            </Typography>
          </Box>

          <Typography
            component="h1"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "2rem", sm: "2.8rem", md: "3.5rem" },
              lineHeight: 1.15,
              color: tokens.text.primary,
              mb: 2.5,
            }}
          >
            Test Drone Missions in
            <br />
            <Box component="span" sx={{ color: tokens.brand.soft }}>
              3D Simulated Environments
            </Box>
          </Typography>

          <Typography
            variant="h6"
            sx={{
              color: tokens.text.secondary,
              fontWeight: 400,
              maxWidth: 640,
              mx: "auto",
              mb: 5,
              fontSize: { xs: "1rem", md: "1.1rem" },
            }}
          >
            Configure environments, deploy drones, define test constraints, and generate detailed
            acceptance reports — all in a single workflow.
          </Typography>

          <Stack direction="row" justifyContent="center" spacing={2} flexWrap="wrap">
            <Button
              component={Link}
              to="/llm"
              variant="contained"
              size="large"
              startIcon={<PlayCircleOutlineIcon />}
              sx={{
                bgcolor: tokens.brand.secondary,
                "&:hover": { bgcolor: tokens.brand.strong },
                textTransform: "none",
                fontWeight: 700,
                px: 3.5,
                borderRadius: 1,
              }}
            >
              Get Started
            </Button>
            <Button
              component={Link}
              to="/report-dashboard"
              variant="outlined"
              size="large"
              endIcon={<AssessmentOutlinedIcon />}
              sx={{
                color: tokens.text.primary,
                borderColor: tokens.brand.secondary,
                "&:hover": { borderColor: tokens.brand.soft, bgcolor: "rgba(74,144,217,0.08)" },
                textTransform: "none",
                fontWeight: 700,
                px: 3.5,
                borderRadius: 1,
              }}
            >
              View Reports
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Features grid */}
      <Box
        component="section"
        sx={{ py: { xs: 8, md: 12 }, backgroundColor: tokens.surface.canvas }}
      >
        <Container maxWidth="lg">
          <Typography
            component="h2"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "1.6rem", md: "2.2rem" },
              color: tokens.text.primary,
              textAlign: "center",
              mb: 1.5,
            }}
          >
            Powerful Simulation Features
          </Typography>
          <Typography
            sx={{ color: tokens.text.secondary, textAlign: "center", maxWidth: 600, mx: "auto", mb: 6 }}
          >
            Everything you need to develop, test, and validate drone operations in a safe, virtual
            environment.
          </Typography>

          <Grid container spacing={3}>
            {FEATURES.map((f) => (
              <Grid key={f.title} size={{ xs: 12, sm: 6 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    border: `1px solid ${tokens.brand.secondary}`,
                    backgroundColor: tokens.surface.elevated,
                    height: "100%",
                  }}
                >
                  <Stack direction="row" spacing={2}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: f.bg,
                        flexShrink: 0,
                        color: f.color,
                      }}
                    >
                      {f.icon}
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 700, color: tokens.text.primary, mb: 0.5 }}>
                        {f.title}
                      </Typography>
                      <Typography sx={{ color: tokens.text.secondary, fontSize: "0.9rem" }}>
                        {f.body}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA */}
      <Box
        component="section"
        sx={{
          py: { xs: 6, md: 8 },
          borderTop: `1px solid ${tokens.brand.secondary}`,
          backgroundColor: tokens.surface.subtle,
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems="center"
            justifyContent="space-between"
            spacing={3}
          >
            <Box>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: "1.3rem", md: "1.7rem" },
                  color: tokens.text.primary,
                }}
              >
                Ready to start simulating?
              </Typography>
              <Typography
                sx={{ color: tokens.brand.soft, fontWeight: 700, fontSize: { xs: "1.3rem", md: "1.7rem" } }}
              >
                Create your first test scenario today.
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                component={Link}
                to="/llm"
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  bgcolor: tokens.brand.secondary,
                  "&:hover": { bgcolor: tokens.brand.strong },
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 1,
                }}
              >
                Get Started
              </Button>
              <Button
                component="a"
                href="https://oss-slu.github.io/projects/droneworld/about/"
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
                sx={{
                  borderColor: tokens.brand.secondary,
                  color: tokens.text.primary,
                  "&:hover": { borderColor: tokens.brand.soft, bgcolor: "rgba(74,144,217,0.08)" },
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 1,
                }}
              >
                Documentation
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
