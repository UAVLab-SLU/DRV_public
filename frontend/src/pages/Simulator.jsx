import BugReportOutlinedIcon from "@mui/icons-material/BugReportOutlined";
import LaunchOutlinedIcon from "@mui/icons-material/LaunchOutlined";
import PlayArrowOutlinedIcon from "@mui/icons-material/PlayArrowOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import StopOutlinedIcon from "@mui/icons-material/StopOutlined";
import VideogameAssetOutlinedIcon from "@mui/icons-material/VideogameAssetOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useState } from "react";
import { useThemeTokens } from "../theme/palette";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
const PIXEL_STREAM_URL = import.meta.env.VITE_PIXELSTREAM_URL ?? "http://localhost:8888";
const CONTROL_URL = import.meta.env.VITE_SIMULATOR_CONTROL_URL ?? "http://127.0.0.1:8890";

export default function Simulator() {
  const tokens = useThemeTokens();
  const [loaded, setLoaded] = useState(false);
  const [simulatorState, setSimulatorState] = useState(null);
  const [controlBusy, setControlBusy] = useState(false);
  const [controlError, setControlError] = useState("");
  const [simulateStateNotFound, setSimulateStateNotFound] = useState(false);

  const refreshStatus = useCallback(async () => {
    try {
      const response = await fetch(`${CONTROL_URL}/status`);
      if (!response.ok) throw new Error(`Control service returned HTTP ${response.status}`);
      setSimulatorState(await response.json());
      setControlError("");
    } catch (error) {
      setSimulatorState(null);
      setControlError(`Simulator controls are unavailable. ${error.message}`);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
    const interval = window.setInterval(refreshStatus, 5000);
    return () => window.clearInterval(interval);
  }, [refreshStatus]);

  const runControl = async (action) => {
    setControlBusy(true);
    setControlError("");
    try {
      const response = await fetch(`${CONTROL_URL}/${action}`, { method: "POST" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? `HTTP ${response.status}`);
      if (result.state) setSimulatorState(result.state);
      window.setTimeout(refreshStatus, action === "start" ? 1500 : 250);
    } catch (error) {
      setControlError(`Unable to ${action} Unreal. ${error.message}`);
    } finally {
      setControlBusy(false);
    }
  };

  const toggleStateNotFound = async () => {
    const enabled = !simulateStateNotFound;
    try {
      const response = await fetch(`${BASE_URL}/api/debug/unreal-state-not-found`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? `HTTP ${response.status}`);
      setSimulateStateNotFound(result.enabled);
    } catch (error) {
      setControlError(`Unable to update the Unreal state debug override. ${error.message}`);
    }
  };

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

          <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
            <Chip
              icon={<VideogameAssetOutlinedIcon />}
              label={simulatorState?.running ? "Unreal running" : "Unreal stopped"}
              color={simulatorState?.running ? "success" : "default"}
              variant="outlined"
            />
            <Button
              onClick={() => runControl("start")}
              disabled={controlBusy || simulatorState?.running === true}
              startIcon={controlBusy ? <CircularProgress size={16} /> : <PlayArrowOutlinedIcon />}
              variant="contained"
            >
              Start Unreal
            </Button>
            <Button
              onClick={() => runControl("stop")}
              disabled={controlBusy || simulatorState?.running !== true}
              startIcon={<StopOutlinedIcon />}
              color="error"
              variant="outlined"
            >
              Shut down
            </Button>
            <Button
              onClick={refreshStatus}
              disabled={controlBusy}
              startIcon={<RefreshOutlinedIcon />}
              variant="text"
            >
              Refresh
            </Button>
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
            <Tooltip title="Debug: make Unreal's state endpoint return 404">
              <IconButton
                aria-label="Toggle Unreal state endpoint 404 debug override"
                aria-pressed={simulateStateNotFound}
                onClick={toggleStateNotFound}
                size="small"
                sx={{ color: tokens.text.muted, opacity: simulateStateNotFound ? 0.9 : 0.35 }}
              >
                <BugReportOutlinedIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {controlError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {controlError} Start the application with <code>.\dev.ps1 full</code> to enable host controls.
          </Alert>
        )}

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
                {simulatorState?.running
                  ? "Waiting for the Pixel Streaming player on port 8888..."
                  : "Start Unreal to connect the Pixel Streaming player."}
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
