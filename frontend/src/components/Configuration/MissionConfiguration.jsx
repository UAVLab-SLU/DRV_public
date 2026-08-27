import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useEffect } from "react";
import { tabEnums } from "../../constants/simConfig";
import { useMainJson } from "../../contexts/MainJsonContext";
import { SimulationConfigurationModel } from "../../model/SimulationConfigurationModel";
import { useThemeTokens } from "../../theme/palette";
import { imageUrls } from "../../utils/const";
import DroneConfiguration from "./DroneConfiguration";

const BORDER = "1px solid rgba(255,255,255,0.08)";

const buildDefaultDrone = (idx, env) => {
  const isDroneLume = env?.SceneMode === "dronelume";
  return ({
  id: idx,
  droneName: `Drone ${idx + 1}`,
  Name: `Drone ${idx + 1}`,
  FlightController: "SimpleFlight",
  droneType: "MultiRotor",
  droneModel: "DJI",
  VehicleType: "SimpleFlight",
  DefaultVehicleState: "Armed",
  EnableCollisions: true,
  AllowAPIAlways: true,
  EnableTrace: false,
  X: isDroneLume ? idx * 5 : env?.Origin?.latitude ?? env?.Origin?.Latitude ?? 0,
  Y: isDroneLume ? 0 : env?.Origin?.longitude ?? env?.Origin?.Longitude ?? 0,
  Z: isDroneLume ? 200 : env?.Origin?.height ?? env?.Origin?.Height ?? 0,
  CoordinateFrame: isDroneLume ? "dronelume_cartesian" : "geographic",
  Pitch: 0, Roll: 0, Yaw: 0,
  Sensors: null,
  Mission: { name: "fly_to_points", param: [] },
  color: "#F97316",
  });
};

export default function MissionConfiguration() {
  const { mainJson, setMainJson, envJson, setActiveScreen } = useMainJson();
  const tokens = useThemeTokens();
  const drones = mainJson.getAllDrones();
  const isDroneLume = envJson.SceneMode === "dronelume";

  useEffect(() => {
    if (mainJson.getAllDrones().length === 0) {
      mainJson.addNewDrone(buildDefaultDrone(0, envJson));
      setMainJson(SimulationConfigurationModel.getReactStateBasedUpdate(mainJson));
    } else if (isDroneLume) {
      let changed = false;
      mainJson.getAllDrones().forEach((drone, index) => {
        if (drone.CoordinateFrame !== "dronelume_cartesian") {
          mainJson.updateDroneBasedOnIndex(index, {
            ...drone,
            X: index * 5,
            Y: 0,
            Z: 200,
            CoordinateFrame: "dronelume_cartesian",
          });
          changed = true;
        }
      });
      if (changed) setMainJson(SimulationConfigurationModel.getReactStateBasedUpdate(mainJson));
    }
    setActiveScreen?.(tabEnums.DRONES);
  }, []);

  const addDrone = () => {
    const d = buildDefaultDrone(drones.length, envJson);
    if (!isDroneLume) d.X += 0.0001 * drones.length;
    mainJson.addNewDrone(d);
    setMainJson(SimulationConfigurationModel.getReactStateBasedUpdate(mainJson));
  };

  const removeDrone = (idx) => {
    if (drones.length <= 1) return;
    mainJson.deleteDroneBasedOnIndex(idx);
    setMainJson(SimulationConfigurationModel.getReactStateBasedUpdate(mainJson));
  };

  const updateDrone = (idx, data) => {
    const currentDrone = mainJson.getDroneBasedOnIndex(idx);
    mainJson.updateDroneBasedOnIndex(idx, { ...(currentDrone ?? {}), ...data });
    setMainJson(SimulationConfigurationModel.getReactStateBasedUpdate(mainJson));
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="overline" sx={{ color: tokens.brand.soft }}>
          sUAS Configuration ({drones.length})
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addDrone}
          disabled={drones.length >= 10 || (isDroneLume && drones.length >= 1)}
          sx={{
            borderColor: "rgba(255,255,255,0.15)",
            color: tokens.text.primary,
            textTransform: "none",
            fontSize: "0.75rem",
            "&:hover": { borderColor: "rgba(255,255,255,0.35)" },
          }}
        >
          Add Drone
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 2, fontSize: "0.8rem" }}>
        {isDroneLume
          ? "The first Mission drone defines the InitDSL system under test. Set its home using relative Cartesian meters from the DroneLume world center."
          : "Drag the drone icon onto the 3D map to place its home location."}
      </Alert>

      {drones.map((drone, idx) => (
        <Accordion
          key={drone.id ?? idx}
          defaultExpanded={idx === 0}
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
                {drone.droneName ?? drone.Name}
              </Typography>

              {!isDroneLume && <Tooltip title="Drag onto map to set home location">
                <Box
                  component="img"
                  src={imageUrls.drone_icon}
                  alt="drag"
                  draggable
                  onDragStart={(e) => {
                    e.stopPropagation();
                    e.dataTransfer.setData(
                      "text/plain",
                      JSON.stringify({ type: "drone", index: idx }),
                    );
                  }}
                  onClick={(e) => e.stopPropagation()}
                  sx={{ width: 28, cursor: "grab", opacity: 0.85, "&:active": { cursor: "grabbing" } }}
                />
              </Tooltip>}

              {drones.length > 1 && (
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); removeDrone(idx); }}
                  sx={{ color: tokens.status.error, p: 0.5 }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          </AccordionSummary>

          <AccordionDetails sx={{ p: 2, backgroundColor: "#161e2e" }}>
            <DroneConfiguration
              id={idx}
              droneObject={drone}
              isDroneLume={isDroneLume}
              onUpdate={(data) => updateDrone(idx, data)}
            />
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
