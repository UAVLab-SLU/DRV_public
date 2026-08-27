import LaunchOutlinedIcon from "@mui/icons-material/LaunchOutlined";
import VideogameAssetOutlinedIcon from "@mui/icons-material/VideogameAssetOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useThemeTokens } from "../theme/palette";

const PIXEL_STREAM_URL = import.meta.env.VITE_PIXELSTREAM_URL ?? "http://localhost:8888";

export default function Simulator() {
  const tokens = useThemeTokens();
  const [loaded, setLoaded] = useState(false);

  return (
    <Box
      component="main"
      sx={{
        minHeight: "calc(100vh - 132px)",
        px: { xs: 1.5, sm: 3 },
        py: { xs: 2, sm: 3 },
        backgroundColor: tokens.surface.base,
      }}
    >
      <Box sx={{ maxWidth: 1440, mx: "auto" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="overline" sx={{ color: tokens.brand.soft }}>
              Live environment
            </Typography>
            <Typography variant="h5" component="h1" sx={{ color: tokens.text.primary }}>
              Simulator
            </Typography>
            <Typography variant="body2" sx={{ color: tokens.text.secondary, mt: 0.5 }}>
              View and control the running Unreal simulation without leaving DroneWorld.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              icon={<VideogameAssetOutlinedIcon />}
              label={loaded ? "Player loaded" : "Connecting to player"}
              color={loaded ? "success" : "default"}
              variant="outlined"
            />
            <Button
              component="a"
              href={PIXEL_STREAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<LaunchOutlinedIcon />}
              variant="outlined"
            >
              Open separately
            </Button>
          </Box>
        </Box>

        <Box
          sx={{
            position: "relative",
            width: "100%",
            aspectRatio: "16 / 9",
            minHeight: { xs: 320, md: 600 },
            maxHeight: "calc(100vh - 245px)",
            overflow: "hidden",
            borderRadius: 2,
            border: `1px solid ${tokens.brand.secondary}`,
            backgroundColor: tokens.surface.canvas,
            boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
          }}
        >
          {!loaded && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                color: tokens.text.secondary,
              }}
            >
              <Typography variant="body2">
                Waiting for the Pixel Streaming player on port 8888...
              </Typography>
            </Box>
          )}
          <Box
            component="iframe"
            title="DRV Unreal Pixel Stream"
            src={PIXEL_STREAM_URL}
            onLoad={() => setLoaded(true)}
            allow="autoplay; fullscreen; gamepad; microphone"
            allowFullScreen
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              border: 0,
              backgroundColor: "#000",
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
