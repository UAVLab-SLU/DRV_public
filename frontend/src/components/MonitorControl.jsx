import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useMainJson } from "../contexts/MainJsonContext";
import { SimulationConfigurationModel } from "../model/SimulationConfigurationModel";
import { useThemeTokens } from "../theme/palette";

const BORDER = "1px solid rgba(255,255,255,0.08)";

const DEFAULT_MONITORS = {
  circular_deviation_monitor:  { enable: false, param: [15] },
  collision_monitor:           { enable: false, param: []   },
  unordered_waypoint_monitor:  { enable: false, param: [1]  },
  ordered_waypoint_monitor:    { enable: false, param: [1]  },
  point_deviation_monitor:     { enable: false, param: [15] },
  min_sep_dist_monitor:        { enable: false, param: [1, 1] },
  landspace_monitor:           { enable: false, param: []   },
  no_fly_zone_monitor:         { enable: false, param: [[]] },
  drift_monitor:               { enable: false, param: [1]  },
  battery_monitor:             { enable: false, param: [100, 20] },
};

const MONITOR_META = [
  {
    key: "collision_monitor",
    label: "Collision",
    desc: "Detect collisions with the environment or other drones.",
  },
  {
    key: "landspace_monitor",
    label: "Landing Zone",
    desc: "Verify drones land within designated safe landing areas.",
  },
  {
    key: "point_deviation_monitor",
    label: "Path Drift",
    desc: "Check whether drones deviate from their planned flight path.",
    params: [{ label: "Max deviation (m)", idx: 0, min: 0 }],
  },
  {
    key: "min_sep_dist_monitor",
    label: "Separation",
    desc: "Enforce minimum separation distance between drones.",
    params: [{ label: "Min horizontal separation (m)", idx: 0, min: 0 }],
  },
  {
    key: "battery_monitor",
    label: "Battery",
    desc: "Trigger an alert when battery drops below a threshold.",
    params: [
      { label: "Battery capacity (%)",   idx: 0, min: 0, max: 100 },
      { label: "Failure threshold (%)", idx: 1, min: 0, max: 100 },
    ],
  },
  {
    key: "unordered_waypoint_monitor",
    label: "Waypoints",
    desc: "Verify the drone reaches all required waypoints (any order).",
    params: [{ label: "Proximity threshold (m)", idx: 0, min: 0 }],
  },
  {
    key: "no_fly_zone_monitor",
    label: "Airspace",
    desc: "Detect incursions into restricted airspace zones.",
  },
];

export default function MonitorControl() {
  const { mainJson, setMainJson } = useMainJson();
  const tokens = useThemeTokens();
  const [monitors, setMonitors] = useState(
    mainJson.monitors && Object.keys(mainJson.monitors).length > 0
      ? mainJson.monitors
      : DEFAULT_MONITORS,
  );
  const [tab, setTab] = useState(0);

  const updateMonitor = (key, partial) => {
    const next = { ...monitors, [key]: { ...monitors[key], ...partial } };
    setMonitors(next);
    mainJson.monitors = next;
    setMainJson(SimulationConfigurationModel.getReactStateBasedUpdate(mainJson));
  };

  const updateParam = (key, idx, value) => {
    const params = [...(monitors[key]?.param ?? [])];
    params[idx] = parseFloat(value) || 0;
    updateMonitor(key, { param: params });
  };

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          mb: 2,
          borderBottom: BORDER,
          "& .MuiTab-root": {
            color: tokens.text.muted,
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.85rem",
            "&.Mui-selected": { color: tokens.brand.soft },
          },
          "& .MuiTabs-indicator": { backgroundColor: tokens.brand.secondary },
        }}
      >
        <Tab label="Test Monitors" value={0} />
        <Tab label="Fuzzy Config" value={1} />
      </Tabs>

      {/* ── Monitor accordions ──────────────────────────── */}
      {tab === 0 && (
        <Box>
          {MONITOR_META.map(({ key, label, desc, params }) => {
            const m = monitors[key] ?? { enable: false, param: [] };
            return (
              <Accordion
                key={key}
                elevation={0}
                disableGutters
                sx={{
                  backgroundColor: "#161e2e",
                  border: BORDER,
                  mb: 1,
                  borderRadius: "6px !important",
                  "&:before": { display: "none" },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ color: tokens.text.muted }} />}
                  sx={{
                    backgroundColor: "#1e2a3e",
                    borderRadius: "6px",
                    minHeight: 44,
                    "&.Mui-expanded": { minHeight: 44, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
                    "& .MuiAccordionSummary-content": { my: 0 },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", width: "100%", gap: 1.5 }}>
                    <Typography sx={{ flex: 1, color: tokens.text.primary, fontWeight: 600, fontSize: "0.875rem" }}>
                      {label}
                    </Typography>
                    <Chip
                      label={m.enable ? "On" : "Off"}
                      size="small"
                      color={m.enable ? "success" : "default"}
                      variant="outlined"
                      sx={{ fontSize: "0.7rem", height: 20 }}
                    />
                  </Box>
                </AccordionSummary>

                <AccordionDetails sx={{ p: 2, backgroundColor: "#161e2e" }}>
                  <Typography variant="body2" sx={{ color: tokens.text.secondary, mb: 1.5, lineHeight: 1.6 }}>
                    {desc}
                  </Typography>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={m.enable}
                        size="small"
                        onChange={(e) => updateMonitor(key, { enable: e.target.checked })}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ color: tokens.text.secondary }}>
                        {m.enable ? "Enabled" : "Disabled"}
                      </Typography>
                    }
                  />

                  {m.enable && params?.map(({ label: pLabel, idx, min, max }) => (
                    <Tooltip key={idx} title={pLabel} placement="top">
                      <TextField
                        label={pLabel}
                        type="number"
                        size="small"
                        value={m.param[idx] ?? 0}
                        inputProps={{ min, max, step: 0.5 }}
                        onChange={(e) => updateParam(key, idx, e.target.value)}
                        sx={{ mt: 1.5, mr: 1, width: 220 }}
                      />
                    </Tooltip>
                  ))}

                  {key === "no_fly_zone_monitor" && m.enable && (
                    <Alert severity="info" sx={{ mt: 1.5, fontSize: "0.8rem" }}>
                      No-fly zone polygon drawing is coming soon.
                    </Alert>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      )}

      {/* ── Fuzzy config tab ───────────────────────────── */}
      {tab === 1 && (
        <Box sx={{ p: 2, border: BORDER, borderRadius: 1.5, backgroundColor: "#161e2e" }}>
          <Typography variant="overline" sx={{ color: tokens.brand.soft, display: "block", mb: 2 }}>
            Fuzzy Test Parameters
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.text.secondary, mb: 2, lineHeight: 1.65 }}>
            Enable to auto-generate randomised test variations. Fuzzy testing must also be toggled
            on in the Environment step.
          </Typography>
          {[
            { key: "timeOfDayFuzzy",  label: "Time of Day",    desc: "Vary simulation time"              },
            { key: "positionFuzzy",   label: "Drone Position", desc: "Vary starting positions"           },
            { key: "windFuzzy",       label: "Wind",           desc: "Vary wind direction and velocity"  },
          ].map(({ key, label, desc }) => (
            <FormControlLabel
              key={key}
              sx={{ display: "flex", mb: 1.5, alignItems: "flex-start" }}
              control={<Switch size="small" sx={{ mt: 0.25 }} />}
              label={
                <Box sx={{ ml: 0.5 }}>
                  <Typography variant="body2" sx={{ color: tokens.text.primary, fontWeight: 600 }}>{label}</Typography>
                  <Typography variant="caption"  sx={{ color: tokens.text.muted }}>{desc}</Typography>
                </Box>
              }
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
