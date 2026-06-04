import FlightIcon from "@mui/icons-material/Flight";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { Link } from "react-router-dom";
import { useThemeTokens } from "../theme/palette";

export default function NotFound() {
  const tokens = useThemeTokens();

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 128px)",
        display: "flex",
        alignItems: "center",
        background: tokens.surface.heroOverlay,
      }}
    >
      <Container maxWidth="sm" sx={{ textAlign: "center", py: 8 }}>
        <FlightIcon
          sx={{
            fontSize: "5rem",
            color: tokens.brand.secondary,
            transform: "rotate(45deg)",
            mb: 3,
            opacity: 0.6,
          }}
        />
        <Typography
          component="h1"
          sx={{ fontWeight: 800, fontSize: "5rem", color: tokens.text.primary, lineHeight: 1 }}
        >
          404
        </Typography>
        <Typography
          sx={{ fontWeight: 700, fontSize: "1.4rem", color: tokens.text.primary, mt: 1, mb: 1.5 }}
        >
          Page Not Found
        </Typography>
        <Typography sx={{ color: tokens.text.secondary, mb: 4 }}>
          The page you are looking for does not exist. You may have mistyped the address or the page
          may have been moved.
        </Typography>
        <Button
          component={Link}
          to="/"
          variant="contained"
          sx={{
            bgcolor: tokens.brand.secondary,
            "&:hover": { bgcolor: tokens.brand.strong },
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 1,
            px: 4,
            py: 1.5,
          }}
        >
          Back to Homepage
        </Button>
      </Container>
    </Box>
  );
}
