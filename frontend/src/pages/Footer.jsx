import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { useThemeTokens } from "../theme/palette";

export default function Footer() {
  const tokens = useThemeTokens();

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: tokens.brand.primary,
        borderTop: `1px solid ${tokens.brand.secondary}`,
        py: 2,
        px: 3,
      }}
    >
      <Box
        sx={{
          maxWidth: 1280,
          mx: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Link
          href="https://oss-slu.github.io/projects/droneworld/about/"
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
          sx={{ color: tokens.text.secondary, fontSize: "0.875rem" }}
        >
          Documentation
        </Link>

        <Divider orientation="vertical" flexItem sx={{ borderColor: tokens.brand.secondary }} />

        <Link
          href="https://github.com/oss-slu/DroneWorld/"
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
          sx={{ color: tokens.text.secondary, fontSize: "0.875rem" }}
        >
          GitHub
        </Link>

        <Divider orientation="vertical" flexItem sx={{ borderColor: tokens.brand.secondary }} />

        <Typography
          sx={{ color: tokens.text.muted, fontSize: "0.875rem" }}
        >
          &copy; 2024 DroneWorld &mdash; Built by OSS-SLU
        </Typography>
      </Box>
    </Box>
  );
}
