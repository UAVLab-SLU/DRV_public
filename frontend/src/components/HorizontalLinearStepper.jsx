import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import PropTypes from "prop-types";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { mapControls } from "../constants/map";
import { useMainJson } from "../contexts/MainJsonContext";
import { useThemeTokens } from "../theme/palette";
import CesiumMap from "./cesium/CesiumMap";
import ControlsDisplay from "./Configuration/ControlsDisplay";
import MissionConfiguration from "./Configuration/MissionConfiguration";
import EnvironmentConfiguration from "./EnvironmentConfiguration";
import MonitorControl from "./MonitorControl";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
const STEPS = ["Environment", "Mission", "Test Config"];

const BORDER = "1px solid rgba(255,255,255,0.08)";

export default function HorizontalLinearStepper({ desc, title }) {
  const navigate = useNavigate();
  const { mainJson, activeScreen } = useMainJson();
  const tokens = useThemeTokens();
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  function buildDronePayload() {
    return mainJson.getAllDrones().map((d) => {
      const { id, droneName, Sensors, ...rest } = d || {};
      const name = droneName ?? rest.Name;
      const sanitizedSensors = Sensors
        ? {
            ...Sensors,
            Barometer:   Sensors.Barometer   ? (({ Key, ...b }) => b)(Sensors.Barometer)   : undefined,
            Magnetometer:Sensors.Magnetometer? (({ Key, ...m }) => m)(Sensors.Magnetometer): undefined,
            GPS:         Sensors.GPS         ? (({ Key, ...g }) => g)(Sensors.GPS)         : undefined,
          }
        : undefined;
      return { ...rest, Name: name, Sensors: sanitizedSensors };
    });
  }

  function buildEnvPayload(env) {
    if (!env) return null;
    const origin = env.Origin ?? env._Origin ?? {};
    return {
      UseGeo: !!env.UseGeo,
      Origin: { Latitude: origin.Latitude ?? origin.latitude, Longitude: origin.Longitude ?? origin.longitude },
      ...(env.Wind     ? { Wind:      env.Wind      } : {}),
      ...(env.TimeOfDay? { TimeOfDay: env.TimeOfDay } : {}),
      ...(env.Sades    ? { Sades:     env.Sades     } : {}),
    };
  }

  async function submitTask() {
    const drones = buildDronePayload();
    if (!drones.length) { setSubmitError("No drones configured."); return; }
    const environment = buildEnvPayload(mainJson.environment);
    if (!environment) { setSubmitError("Environment not configured."); return; }

    const payload = {
      Drones: drones,
      environment,
      ...(mainJson.monitors  ? { monitors:  mainJson.monitors  } : {}),
      ...(mainJson.FuzzyTest ? { FuzzyTest: mainJson.FuzzyTest } : {}),
    };
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`${BASE_URL}/addTask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
      setSubmitSuccess(true);
      setTimeout(() => navigate("/report-dashboard"), 1500);
    } catch (err) {
      console.error("Submit failed:", err);
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const stepContent = [
    <EnvironmentConfiguration key="env" />,
    <MissionConfiguration key="mission" />,
    <MonitorControl key="monitors" />,
  ];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 64px)",
        backgroundColor: tokens.surface.base,
      }}
    >
      {/* ── Header bar ── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 3,
          py: 1,
          borderBottom: BORDER,
          backgroundColor: tokens.surface.canvas,
          flexShrink: 0,
          gap: 2,
          minHeight: 52,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="overline" sx={{ color: tokens.brand.soft, lineHeight: 1, display: "block" }}>
            {title || "Custom Scenario"}
          </Typography>
          <Typography sx={{ color: tokens.text.muted, fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {desc}
          </Typography>
        </Box>

        <Stepper
          activeStep={activeStep}
          sx={{
            flex: 2,
            "& .MuiStepLabel-label":            { color: tokens.text.muted,      fontSize: "0.78rem" },
            "& .MuiStepLabel-label.Mui-active":  { color: tokens.brand.soft,      fontWeight: 700 },
            "& .MuiStepLabel-label.Mui-completed":{ color: tokens.brand.secondary },
            "& .MuiStepIcon-root.Mui-active":    { color: tokens.brand.secondary },
            "& .MuiStepIcon-root.Mui-completed": { color: tokens.brand.secondary },
            "& .MuiStepConnector-line": { borderColor: "rgba(255,255,255,0.1)" },
          }}
        >
          {STEPS.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>

        <Tooltip title="Back to home">
          <IconButton onClick={() => navigate("/")} size="small" sx={{ color: tokens.text.muted }}>
            <HomeOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── Two-column body ── */}
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left: config panel */}
        <Box
          sx={{
            width: { xs: "100%", md: "44%" },
            display: "flex",
            flexDirection: "column",
            borderRight: BORDER,
            overflow: "hidden",
            backgroundColor: tokens.surface.base,
          }}
        >
          {/* Step tabs */}
          <Tabs
            value={activeStep}
            onChange={(_, v) => setActiveStep(v)}
            variant="fullWidth"
            sx={{
              minHeight: 40,
              borderBottom: BORDER,
              backgroundColor: tokens.surface.canvas,
              "& .MuiTab-root": {
                color: tokens.text.muted,
                fontWeight: 600,
                fontSize: "0.78rem",
                textTransform: "none",
                minHeight: 40,
                transition: "color 140ms",
                "&:hover": { color: tokens.text.secondary },
                "&.Mui-selected": { color: tokens.brand.soft },
              },
              "& .MuiTabs-indicator": { backgroundColor: tokens.brand.secondary, height: 2 },
            }}
          >
            {STEPS.map((label, i) => <Tab key={label} label={label} value={i} />)}
          </Tabs>

          {/* Step content */}
          <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
            {stepContent[activeStep]}
          </Box>

          {/* Nav buttons */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              p: 1.5,
              borderTop: BORDER,
              flexShrink: 0,
              gap: 1,
              backgroundColor: tokens.surface.canvas,
            }}
          >
            <Button
              variant="outlined"
              disabled={activeStep === 0}
              onClick={() => setActiveStep((s) => s - 1)}
              sx={{
                borderColor: "rgba(255,255,255,0.15)",
                color: tokens.text.primary,
                textTransform: "none",
                fontWeight: 600,
                "&:hover": { borderColor: "rgba(255,255,255,0.3)" },
              }}
            >
              Back
            </Button>

            <Box sx={{ flex: 1 }}>
              {submitError && (
                <Typography sx={{ color: tokens.status.error }} variant="caption">{submitError}</Typography>
              )}
              {submitSuccess && (
                <Typography sx={{ color: tokens.status.success }} variant="caption">
                  Task queued! Redirecting…
                </Typography>
              )}
            </Box>

            <Button
              variant="contained"
              onClick={activeStep === STEPS.length - 1 ? submitTask : () => setActiveStep((s) => s + 1)}
              disabled={submitting}
              sx={{
                bgcolor: tokens.brand.secondary,
                "&:hover": { bgcolor: tokens.brand.strong },
                textTransform: "none",
                fontWeight: 700,
              }}
            >
              {activeStep === STEPS.length - 1 ? (submitting ? "Submitting…" : "Run Simulation") : "Next"}
            </Button>
          </Box>
        </Box>

        {/* Right: Cesium map */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <ControlsDisplay mapControl={mapControls[activeScreen] ?? mapControls.default} />
          <Box sx={{ flex: 1 }}>
            <CesiumMap activeConfigStep={activeStep} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

HorizontalLinearStepper.propTypes = {
  desc: PropTypes.string,
  title: PropTypes.string,
};
