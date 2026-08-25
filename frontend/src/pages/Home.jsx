import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useThemeTokens } from "../theme/palette";
import { UAV_DESCRIPTION } from "../utils/const";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
const STATUS_COLORS = { idle: "success", running: "info", error: "error" };

export default function Home() {
  const tokens = useThemeTokens();
  const [reqId, setReqId] = useState("");
  const [backendInfo, setBackendInfo] = useState({ numQueuedTasks: 0, backendStatus: "idle" });

  useEffect(() => {
    fetch(`${BASE_URL}/currentRunning`)
      .then((r) => r.text())
      .then((data) => {
        const [status, queueSize] = data.split(", ");
        if (status === "None") setBackendInfo({ numQueuedTasks: 0, backendStatus: "idle" });
        else if (status === "Running")
          setBackendInfo({ numQueuedTasks: parseInt(queueSize, 10), backendStatus: "running" });
      })
      .catch(() => setBackendInfo({ numQueuedTasks: -1, backendStatus: "error" }));
  }, []);

  const selected = UAV_DESCRIPTION[reqId];

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 128px)",
        background: tokens.surface.heroOverlay,
        py: { xs: 4, md: 8 },
      }}
    >
      <Container maxWidth="md">
        {/* Status badge */}
        <Stack direction="row" spacing={1} mb={4} alignItems="center">
          <Chip
            label={`Backend: ${backendInfo.backendStatus}`}
            color={STATUS_COLORS[backendInfo.backendStatus] ?? "default"}
            size="small"
            variant="outlined"
          />
          {backendInfo.numQueuedTasks > 0 && (
            <Chip
              label={`${backendInfo.numQueuedTasks} queued`}
              color="info"
              size="small"
              variant="outlined"
            />
          )}
        </Stack>

        <Typography
          component="h1"
          sx={{
            fontWeight: 800,
            fontSize: { xs: "1.8rem", md: "2.4rem" },
            color: tokens.text.primary,
            mb: 1,
          }}
        >
          Select a Test Requirement
        </Typography>
        <Typography sx={{ color: tokens.text.secondary, mb: 4 }}>
          Choose a UAV requirement identifier to pre-configure the simulation constraints.
        </Typography>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            border: `1px solid ${tokens.brand.secondary}`,
            backgroundColor: tokens.surface.elevated,
            borderRadius: 2,
          }}
        >
          <FormControl fullWidth>
            <InputLabel sx={{ color: tokens.text.secondary }}>Requirement ID</InputLabel>
            <Select
              value={reqId}
              label="Requirement ID"
              onChange={(e) => setReqId(e.target.value)}
              sx={{
                color: tokens.text.primary,
                "& .MuiOutlinedInput-notchedOutline": { borderColor: tokens.brand.secondary },
              }}
            >
              {Object.entries(UAV_DESCRIPTION).map(([id, { title }]) => (
                <MenuItem key={id} value={id}>
                  {id}: {title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selected && (
            <>
              <Divider sx={{ my: 3, borderColor: tokens.brand.secondary }} />
              <Typography
                variant="overline"
                sx={{ color: tokens.brand.soft, display: "block", mb: 0.5 }}
              >
                {reqId}
              </Typography>
              <Typography
                sx={{ fontWeight: 700, fontSize: "1.1rem", color: tokens.text.primary, mb: 1.5 }}
              >
                {selected.title}
              </Typography>
              <Typography sx={{ color: tokens.text.secondary, lineHeight: 1.7 }}>
                {selected.text}
              </Typography>
            </>
          )}

          <Box mt={4}>
            <Button
              component={Link}
              to="/simulation"
              state={{ req: reqId, descs: selected?.text ?? "", title: selected?.title ?? "" }}
              variant="contained"
              size="large"
              disabled={!reqId}
              startIcon={<FlightTakeoffIcon />}
              sx={{
                bgcolor: tokens.brand.secondary,
                "&:hover": { bgcolor: tokens.brand.strong },
                "&.Mui-disabled": { opacity: 0.4 },
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 1,
                width: { xs: "100%", sm: "auto" },
              }}
            >
              Configure Scenario
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
