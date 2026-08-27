import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { useMainJson } from "../../contexts/MainJsonContext";
import { SimulationConfigurationModel } from "../../model/SimulationConfigurationModel";
import { useThemeTokens } from "../../theme/palette";
import SensorConfiguration from "./SensorConfiguration";

const FLIGHT_PATHS = [
  { value: "fly_to_points", label: "Fly to Waypoints" },
  { value: "fly_in_circle", label: "Fly in Circle" },
];

const DRONE_TYPES = [
  { value: "MultiRotor", label: "Multi-Rotor" },
  { value: "FixedWing", label: "Fixed Wing" },
];

const DRONE_MODELS = {
  MultiRotor: [
    { value: "DJI", label: "DJI" },
    { value: "ParrotANAFI", label: "Parrot ANAFI" },
    { value: "VOXL_m500", label: "VOXL m500" },
    { value: "AureliaX6Pro", label: "Aurelia X6 Pro" },
    { value: "Crazyflie", label: "Crazyflie" },
  ],
  FixedWing: [
    { value: "SenseflyeBeeX", label: "Sensefly eBee X" },
    { value: "TrinityF90", label: "Trinity F90" },
  ],
};

export default function DroneConfiguration({ id, droneObject, isDroneLume = false, onUpdate }) {
  const { mainJson, setMainJson } = useMainJson();
  const tokens = useThemeTokens();

  const [drone, setDrone] = useState({
    Name: droneObject?.Name ?? droneObject?.droneName ?? `Drone ${id + 1}`,
    droneType: droneObject?.droneType ?? "MultiRotor",
    droneModel: droneObject?.droneModel ?? "DJI",
    X: droneObject?.X ?? 0,
    Y: droneObject?.Y ?? 0,
    Z: droneObject?.Z ?? 0,
    Mission: droneObject?.Mission ?? { name: "fly_to_points", param: [] },
    Sensors: droneObject?.Sensors ?? null,
  });

  // Sync external position updates (from map drag-drop)
  useEffect(() => {
    if (!droneObject) return;
    setDrone((prev) => ({
      ...prev,
      X: droneObject.X ?? prev.X,
      Y: droneObject.Y ?? prev.Y,
      Z: droneObject.Z ?? prev.Z,
    }));
  }, [droneObject?.X, droneObject?.Y, droneObject?.Z]);

  const commit = (update) => {
    const next = { ...drone, ...update };
    setDrone(next);
    const merged = { ...(droneObject ?? {}), ...next, id };
    mainJson.updateDroneBasedOnIndex(id, merged);
    setMainJson(SimulationConfigurationModel.getReactStateBasedUpdate(mainJson));
    onUpdate?.(next);
  };

  const inputSx = { "& input": { color: tokens.text.primary } };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Name */}
      <TextField
        label="Drone Name"
        size="small"
        fullWidth
        value={drone.Name}
        onChange={(e) => commit({ Name: e.target.value, droneName: e.target.value })}
        sx={inputSx}
      />

      <Grid container spacing={2}>
        {/* Mission type */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth size="small">
            <InputLabel sx={{ color: tokens.text.secondary }}>Mission</InputLabel>
            <Select
              label="Mission"
              value={drone.Mission.name}
              onChange={(e) => commit({ Mission: { ...drone.Mission, name: e.target.value } })}
              sx={{ color: tokens.text.primary }}
            >
              {FLIGHT_PATHS.map((fp) => (
                <MenuItem key={fp.value} value={fp.value}>
                  {fp.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Drone type */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth size="small">
            <InputLabel sx={{ color: tokens.text.secondary }}>Type</InputLabel>
            <Select
              label="Type"
              value={drone.droneType}
              onChange={(e) => commit({ droneType: e.target.value, droneModel: "" })}
              sx={{ color: tokens.text.primary }}
            >
              {DRONE_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Drone model */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth size="small">
            <InputLabel sx={{ color: tokens.text.secondary }}>Model</InputLabel>
            <Select
              label="Model"
              value={drone.droneModel}
              onChange={(e) => commit({ droneModel: e.target.value })}
              sx={{ color: tokens.text.primary }}
            >
              {(DRONE_MODELS[drone.droneType] ?? []).map((m) => (
                <MenuItem key={m.value} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Position */}
      <Typography variant="overline" sx={{ color: tokens.brand.soft, mt: 0.5 }}>
        {isDroneLume ? "Home Position (relative Cartesian)" : "Home Location"}
      </Typography>
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 4 }}>
          <Tooltip title={isDroneLume ? "X offset from world center in meters" : "Latitude (step = ~1m)"} placement="top">
            <TextField
              label={isDroneLume ? "X (m)" : "Latitude"}
              type="number"
              size="small"
              fullWidth
              value={drone.X}
              inputProps={{ step: isDroneLume ? 1 : 0.0001 }}
              onChange={(e) => commit({ X: parseFloat(e.target.value) || 0 })}
              sx={inputSx}
            />
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <Tooltip title={isDroneLume ? "Y offset from world center in meters" : "Longitude (step = ~1m)"} placement="top">
            <TextField
              label={isDroneLume ? "Y (m)" : "Longitude"}
              type="number"
              size="small"
              fullWidth
              value={drone.Y}
              inputProps={{ step: isDroneLume ? 1 : 0.0001 }}
              onChange={(e) => commit({ Y: parseFloat(e.target.value) || 0 })}
              sx={inputSx}
            />
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <Tooltip title={isDroneLume ? "Z offset from world center in meters" : "Height above ground (m)"} placement="top">
            <TextField
              label={isDroneLume ? "Z (m)" : "Height (m)"}
              type="number"
              size="small"
              fullWidth
              value={drone.Z}
              inputProps={{ step: 1 }}
              onChange={(e) => commit({ Z: parseFloat(e.target.value) || 0 })}
              sx={inputSx}
            />
          </Tooltip>
        </Grid>
      </Grid>

      {/* Sensors */}
      <SensorConfiguration
        setSensor={(s) => commit({ Sensors: s })}
        sensorJson={drone.Sensors}
      />
    </Box>
  );
}

DroneConfiguration.propTypes = {
  id: PropTypes.number.isRequired,
  droneObject: PropTypes.object,
  isDroneLume: PropTypes.bool,
  onUpdate: PropTypes.func,
};
