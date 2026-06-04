import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { tabEnums } from "../constants/simConfig";
import { useMainJson } from "../contexts/MainJsonContext";
import { EnvironmentModel } from "../model/EnvironmentModel";
import { SadeModel } from "../model/SadeModel";
import { useThemeTokens } from "../theme/palette";
import { imageUrls } from "../utils/const";

const WIND_DIRECTIONS = ["N", "S", "E", "W", "NE", "SE", "SW", "NW"];
const WIND_TYPES = ["Constant Wind", "Turbulent Wind"];
const ORIGINS = [
  { label: "Chicago O\u2019Hare Airport", value: "Chicago O\u2019Hare Airport", lat: 41.980381, lon: -87.934524, height: 200 },
  { label: "Specify Region", value: "Specify Region", lat: 0, lon: 0, height: 0 },
];

const PANEL_SX = {
  backgroundColor: "#161e2e",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 1.5,
  p: 2,
  mb: 2,
};

export default function EnvironmentConfiguration() {
  const { envJson, setEnvJson, setActiveScreen } = useMainJson();
  const tokens = useThemeTokens();

  const [windDir, setWindDir] = useState(envJson.Wind?.[0]?.Direction ?? "NE");
  const [windVelocity, setWindVelocity] = useState(envJson.Wind?.[0]?.Velocity ?? 5);
  const [windType, setWindType] = useState(envJson.Wind?.[0]?.Type ?? "Constant Wind");
  const [time, setTime] = useState(
    envJson.time ? dayjs(envJson.time) : dayjs("2020-01-01 10:00"),
  );

  useEffect(() => {
    setActiveScreen?.(tabEnums.ENV_REGION);
  }, [setActiveScreen]);

  const commitWind = useCallback(
    (dir, vel, type) => {
      envJson.Wind = [{ Direction: dir, Velocity: vel, Type: type }];
      setEnvJson(EnvironmentModel.getReactStateBasedUpdate(envJson));
    },
    [envJson, setEnvJson],
  );

  const handleOriginChange = (val) => {
    const origin = ORIGINS.find((o) => o.value === val) ?? ORIGINS[1];
    envJson.setOriginName(origin.value);
    envJson.setOriginLatitude(origin.lat);
    envJson.setOriginLongitude(origin.lon);
    envJson.setOriginHeight(origin.height);
    envJson.UseGeo = true;
    setEnvJson(EnvironmentModel.getReactStateBasedUpdate(envJson));
  };

  const handleTimeChange = (val) => {
    setTime(val);
    envJson.time = val;
    envJson.TimeOfDay = dayjs(val).format("HH:mm:ss");
    setEnvJson(EnvironmentModel.getReactStateBasedUpdate(envJson));
  };

  const handleAddSadeZone = () => {
    const sade = new SadeModel(`Zone ${envJson.getSadesCount() + 1}`);
    envJson.addNewSade(sade);
    envJson.activeSadeZoneIndex = envJson.getSadesCount() - 1;
    setEnvJson(EnvironmentModel.getReactStateBasedUpdate(envJson));
    setActiveScreen?.(tabEnums.ENV_SADEZONE);
  };

  const handleDeleteSadeZone = (idx) => {
    envJson.deleteSadeBasedOnIndex(idx);
    envJson.activeSadeZoneIndex = null;
    setEnvJson(EnvironmentModel.getReactStateBasedUpdate(envJson));
  };

  const labelSx = { color: tokens.text.secondary, mb: 0.5, display: "block" };

  return (
    <Box>
      {/* ── Origin ─────────────────────────────────────── */}
      <Box sx={PANEL_SX}>
        <Typography variant="overline" sx={labelSx}>
          Simulation Origin
        </Typography>

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Location</InputLabel>
          <Select
            label="Location"
            value={envJson.Origin.name || ""}
            onChange={(e) => handleOriginChange(e.target.value)}
          >
            {ORIGINS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {envJson.Origin.name === "Specify Region" && (
          <Alert severity="info" sx={{ mb: 1.5, fontSize: "0.8rem" }}>
            Drag the origin icon onto the 3D map to place it.
          </Alert>
        )}

        {envJson.Origin.latitude !== 0 && (
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
            {[
              `Lat: ${envJson.Origin.latitude.toFixed(5)}`,
              `Lon: ${envJson.Origin.longitude.toFixed(5)}`,
              `Alt: ${Math.round(envJson.Origin.height)} m`,
            ].map((label) => (
              <Chip
                key={label}
                label={label}
                size="small"
                variant="outlined"
                sx={{
                  color: tokens.text.secondary,
                  borderColor: "rgba(255,255,255,0.15)",
                  fontSize: "0.73rem",
                }}
              />
            ))}
          </Box>
        )}

        {envJson.Origin.name === "Specify Region" && (
          <Tooltip title="Drag this icon onto the 3D map to set the origin">
            <Box
              sx={{
                mt: 1.5,
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                px: 1.5,
                py: 0.75,
                border: "1px dashed rgba(255,255,255,0.2)",
                borderRadius: 1,
                cursor: "grab",
                "&:active": { cursor: "grabbing" },
              }}
              draggable
              onDragStart={(e) =>
                e.dataTransfer.setData(
                  "text/plain",
                  JSON.stringify({ type: "region", src: imageUrls.location_orange }),
                )
              }
            >
              <DragIndicatorIcon sx={{ color: tokens.text.muted, fontSize: "1rem" }} />
              <Box component="img" src={imageUrls.location_orange} alt="origin" sx={{ width: 22, height: 22 }} />
              <Typography variant="caption" sx={{ color: tokens.text.secondary }}>
                Origin Marker
              </Typography>
            </Box>
          </Tooltip>
        )}
      </Box>

      {/* ── Wind ───────────────────────────────────────── */}
      <Box sx={PANEL_SX}>
        <Typography variant="overline" sx={labelSx}>
          Wind
        </Typography>
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Direction</InputLabel>
              <Select
                label="Direction"
                value={windDir}
                onChange={(e) => { setWindDir(e.target.value); commitWind(e.target.value, windVelocity, windType); }}
              >
                {WIND_DIRECTIONS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField
              label="Velocity (m/s)"
              type="number"
              size="small"
              fullWidth
              value={windVelocity}
              inputProps={{ min: 0, max: 50, step: 0.5 }}
              onChange={(e) => {
                const v = Math.min(50, Math.max(0, parseFloat(e.target.value) || 0));
                setWindVelocity(v);
                commitWind(windDir, v, windType);
              }}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Wind Type</InputLabel>
              <Select
                label="Wind Type"
                value={windType}
                onChange={(e) => { setWindType(e.target.value); commitWind(windDir, windVelocity, e.target.value); }}
              >
                {WIND_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* ── Time of Day ────────────────────────────────── */}
      <Box sx={PANEL_SX}>
        <Typography variant="overline" sx={labelSx}>
          Time of Day
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <TimePicker
            label="Simulation time"
            value={time}
            onChange={handleTimeChange}
            ampm={false}
            slotProps={{ textField: { size: "small", fullWidth: true } }}
          />
        </LocalizationProvider>
      </Box>

      {/* ── Safe Zones ─────────────────────────────────── */}
      <Box sx={PANEL_SX}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
          <Typography variant="overline" sx={{ color: tokens.text.secondary }}>
            Safe Zones
          </Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddSadeZone}
            sx={{
              borderColor: "rgba(255,255,255,0.15)",
              color: tokens.text.primary,
              textTransform: "none",
              fontSize: "0.75rem",
              "&:hover": { borderColor: "rgba(255,255,255,0.35)" },
            }}
          >
            Add Zone
          </Button>
        </Box>

        {envJson.getAllSades().length === 0 ? (
          <Typography variant="caption" sx={{ color: tokens.text.muted }}>
            No safe zones. Click &ldquo;Add Zone&rdquo;, then Shift&nbsp;+&nbsp;drag on the map.
          </Typography>
        ) : (
          envJson.getAllSades().map((sade, idx) => (
            <Box
              key={sade.id ?? idx}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                py: 0.75,
                px: 1,
                mb: 0.5,
                borderRadius: 1,
                border: `1px solid ${envJson.activeSadeZoneIndex === idx ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.08)"}`,
                backgroundColor: envJson.activeSadeZoneIndex === idx ? "rgba(59,130,246,0.08)" : "transparent",
                cursor: "pointer",
              }}
              onClick={() => {
                envJson.activeSadeZoneIndex = idx;
                setEnvJson(EnvironmentModel.getReactStateBasedUpdate(envJson));
              }}
            >
              <Typography sx={{ flex: 1, color: tokens.text.primary, fontSize: "0.875rem" }}>
                {sade.name}
              </Typography>
              {sade.length > 0 && (
                <Typography variant="caption" sx={{ color: tokens.text.muted }}>
                  {sade.length.toFixed(0)}m × {sade.width.toFixed(0)}m
                </Typography>
              )}
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); handleDeleteSadeZone(idx); }}
                sx={{ color: tokens.status.error, p: 0.5 }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          ))
        )}
      </Box>

      {/* ── Fuzzy Testing ──────────────────────────────── */}
      <Box sx={PANEL_SX}>
        <Typography variant="overline" sx={labelSx}>
          Fuzzy Testing
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={envJson.enableFuzzy}
              size="small"
              onChange={(e) => {
                envJson.enableFuzzy = e.target.checked;
                setEnvJson(EnvironmentModel.getReactStateBasedUpdate(envJson));
              }}
            />
          }
          label={
            <Typography variant="body2" sx={{ color: tokens.text.secondary }}>
              {envJson.enableFuzzy ? "Enabled" : "Disabled"} — generates randomised test variations
            </Typography>
          }
        />
      </Box>
    </Box>
  );
}
