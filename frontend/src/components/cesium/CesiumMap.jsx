import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import {
  Cartesian3,
  Cartographic,
  createWorldTerrainAsync,
  Ion,
  IonResource,
  sampleTerrainMostDetailed,
} from "cesium";
import PropTypes from "prop-types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Cesium3DTileset, Viewer } from "resium";
import { originTypes } from "../../constants/env";
import { useMainJson } from "../../contexts/MainJsonContext";
import { EnvironmentModel } from "../../model/EnvironmentModel";
import { createGoogle3DTilesetUrl } from "../../utils/cesiumUtils";
import DrawSadeZone from "./DrawSadeZone";
import DroneDragAndDrop from "./DroneDragAndDrop";
import RegionDragAndDrop from "./RegionDragAndDrop";
import TimeLineSetterCesiumComponent from "./TimeLineSetterCesiumComponent";

const DEFAULT_CAMERA_HEIGHT = 1200;
const SCROLL_ZOOM_FACTOR = 2;
const SCROLL_ZOOM_INERTIA = 0.6;
const GOOGLE_3D_TILES_ASSET_ID = 2275207;

const CesiumMap = ({ activeConfigStep }) => {
  const { envJson, setEnvJson, registerSetCameraByPosition } = useMainJson();
  const viewerRef = useRef(null);
  const hasSetInitialCameraViewRef = useRef(false);
  const [viewerReady, setViewerReady] = useState(false);

  // Resolve terrain Promise to an actual TerrainProvider before passing to Viewer.
  // Passing a Promise directly leaves the globe as a bare ellipsoid until re-render.
  const [terrainProvider, setTerrainProvider] = useState(null);
  useEffect(() => {
    let cancelled = false;
    createWorldTerrainAsync()
      .then((tp) => { if (!cancelled) setTerrainProvider(tp); })
      .catch((err) => console.error("[Cesium] Terrain load failed:", err));
    return () => { cancelled = true; };
  }, []);

  // Google 3D Photorealistic Tiles — enabled whenever a valid Ion token is present
  const google3DTilesetUrl = useMemo(
    () =>
      createGoogle3DTilesetUrl({
        cesiumAccessToken: Ion.defaultAccessToken,
        fromAssetId: IonResource.fromAssetId,
        assetId: GOOGLE_3D_TILES_ASSET_ID,
      }),
    [],
  );

  const [cameraPosition, setCameraPosition] = useState({
    destination: Cartesian3.fromDegrees(
      envJson.Origin.longitude,
      envJson.Origin.latitude,
      DEFAULT_CAMERA_HEIGHT,
    ),
    orientation: { heading: 0, pitch: -Math.PI / 2 },
  });

  const setCameraByLongLat = useCallback(
    (long, lat, altitude, pitch, heading) => {
      if (!viewerReady) return;
      const viewer = viewerRef.current.cesiumElement;
      const { camera } = viewer;
      setCameraPosition({
        destination: Cartesian3.fromDegrees(
          long,
          lat,
          altitude ?? Math.min(DEFAULT_CAMERA_HEIGHT, camera.positionCartographic.height),
        ),
        orientation: {
          heading: heading ?? camera.heading,
          pitch:   pitch   ?? camera.pitch,
        },
      });
    },
    [viewerReady],
  );

  useEffect(() => {
    registerSetCameraByPosition(setCameraByLongLat);
    return () => registerSetCameraByPosition(null);
  }, [registerSetCameraByPosition, setCameraByLongLat]);

  // Poll until Resium mounts the Viewer element
  useEffect(() => {
    const id = setInterval(() => {
      if (viewerRef.current?.cesiumElement) {
        setViewerReady(true);
        clearInterval(id);
      }
    }, 100);
    return () => clearInterval(id);
  }, []);

  // Recover from Cesium render errors
  useEffect(() => {
    if (!viewerReady) return;
    const viewer = viewerRef.current.cesiumElement;
    const remove = viewer.scene.renderError.addEventListener((_scene, err) => {
      console.warn("[Cesium] Render error (auto-recovering):", err?.message ?? err);
      viewer.useDefaultRenderLoop = true;
    });
    return remove;
  }, [viewerReady]);

  // Camera scroll feel
  useEffect(() => {
    if (!viewerReady) return;
    const ctrl = viewerRef.current.cesiumElement.scene.screenSpaceCameraController;
    ctrl.zoomFactor  = SCROLL_ZOOM_FACTOR;
    ctrl.inertiaZoom = SCROLL_ZOOM_INERTIA;
    return () => { ctrl.zoomFactor = 5.0; ctrl.inertiaZoom = 0.8; };
  }, [viewerReady]);

  // Prevent the browser's native autoscroll mode on middle-click.
  // Without this the browser captures all subsequent mouse events for its own
  // scroll cursor, so Cesium never receives the MOUSE_MOVE events it needs to
  // handle middle-drag (tilt in 3D, pan in 2D).
  useEffect(() => {
    if (!viewerReady) return;
    const canvas = viewerRef.current.cesiumElement.canvas;
    const block = (e) => { if (e.button === 1) e.preventDefault(); };
    canvas.addEventListener("mousedown", block, { passive: false });
    // auxclick fires on a completed middle-click — block it too so the browser
    // doesn't try to open links in new tabs when clicking on entities.
    canvas.addEventListener("auxclick", (e) => e.preventDefault());
    return () => canvas.removeEventListener("mousedown", block);
  }, [viewerReady]);

  // Lock tilt on mission step (top-down drone placement)
  useEffect(() => {
    if (!viewerReady) return;
    const ctrl = viewerRef.current.cesiumElement.scene.screenSpaceCameraController;
    ctrl.enableTilt = activeConfigStep !== 1;
  }, [activeConfigStep, viewerReady]);

  // Apply camera position: setView on first load, flyTo afterwards
  useEffect(() => {
    if (!viewerReady) return;
    const viewer = viewerRef.current.cesiumElement;
    if (!hasSetInitialCameraViewRef.current) {
      viewer.camera.setView({
        destination:  cameraPosition.destination,
        orientation: cameraPosition.orientation,
      });
      hasSetInitialCameraViewRef.current = true;
      return;
    }
    viewer.camera.flyTo({
      destination:  cameraPosition.destination,
      orientation: cameraPosition.orientation,
      duration: 2,
    });
  }, [cameraPosition, viewerReady]);

  // Auto-focus on origin whenever it changes
  useEffect(() => {
    setCameraByLongLat(
      envJson.Origin.longitude,
      envJson.Origin.latitude,
      DEFAULT_CAMERA_HEIGHT,
      -Math.PI / 2,
      0,
    );
  }, [envJson.Origin.latitude, envJson.Origin.longitude, setCameraByLongLat]);

  // Sample terrain height when user drags origin to a custom location
  const findHeight = useCallback(async () => {
    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer?.terrainProvider) return null;
    try {
      const pos = [Cartographic.fromDegrees(envJson.Origin.longitude, envJson.Origin.latitude)];
      await sampleTerrainMostDetailed(viewer.terrainProvider, pos);
      return pos[0].height;
    } catch { return null; }
  }, [envJson.Origin.longitude, envJson.Origin.latitude]);

  useEffect(() => {
    if (envJson.Origin.name !== originTypes.SpecifyRegion) return;
    findHeight().then((h) => {
      if (h == null) return;
      envJson.setOriginHeight(h);
      setEnvJson(EnvironmentModel.getReactStateBasedUpdate(envJson));
    });
  }, [envJson, setEnvJson, findHeight]);

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
      <Viewer
        ref={viewerRef}
        full
        infoBox={false}
        showRenderLoopErrors={false}
        terrainProvider={terrainProvider ?? undefined}
        style={{ position: "absolute", inset: 0 }}
      >
        {/* Google Photorealistic 3D Tiles (requires valid Ion token) */}
        {google3DTilesetUrl != null && (
          <Cesium3DTileset url={google3DTilesetUrl} />
        )}

        <DroneDragAndDrop viewerReady={viewerReady} viewerRef={viewerRef} />
        <RegionDragAndDrop viewerReady={viewerReady} viewerRef={viewerRef} />
        <DrawSadeZone viewerReady={viewerReady} viewerRef={viewerRef} />
        <TimeLineSetterCesiumComponent viewerReady={viewerReady} viewerRef={viewerRef} />
      </Viewer>

      {envJson.activeSadeZoneIndex != null && (
        <Box
          sx={{
            position: "absolute", top: 16, left: "50%",
            transform: "translateX(-50%)", zIndex: 10, pointerEvents: "none",
          }}
        >
          <Alert severity="warning" variant="filled">
            Hold Shift and drag on the map to draw the safe zone.
          </Alert>
        </Box>
      )}
    </Box>
  );
};

CesiumMap.propTypes = { activeConfigStep: PropTypes.number.isRequired };

export default CesiumMap;
