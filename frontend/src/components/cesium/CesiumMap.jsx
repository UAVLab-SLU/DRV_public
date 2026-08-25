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
import { useCallback, useEffect, useRef, useState } from "react";
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
const DEFAULT_CAMERA_ORIGIN = Object.freeze({
  latitude: 41.980381,
  longitude: -87.934524,
});

const getCameraOrigin = (origin) => {
  const latitude = Number(origin?.latitude);
  const longitude = Number(origin?.longitude);
  const hasValidCoordinates =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    !(latitude === 0 && longitude === 0);

  return hasValidCoordinates ? { latitude, longitude } : DEFAULT_CAMERA_ORIGIN;
};

const CesiumMap = () => {
  const { envJson, setEnvJson, registerSetCameraByPosition } = useMainJson();
  const viewerRef = useRef(null);
  const hasSetInitialCameraViewRef = useRef(false);
  const [viewerReady, setViewerReady] = useState(false);
  const [google3DTilesetUrl, setGoogle3DTilesetUrl] = useState(null);
  const [mapLoadError, setMapLoadError] = useState(null);

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

  // Resolve the Ion resource before mounting the Resium tileset. This keeps a
  // failed endpoint request from becoming a silent null URL inside Resium.
  useEffect(() => {
    let cancelled = false;

    Promise.resolve(
      createGoogle3DTilesetUrl({
        cesiumAccessToken: Ion.defaultAccessToken,
        fromAssetId: IonResource.fromAssetId,
        assetId: GOOGLE_3D_TILES_ASSET_ID,
      }),
    )
      .then((resource) => {
        if (cancelled) return;
        if (resource == null) {
          setMapLoadError("Google Photorealistic 3D Tiles could not be resolved.");
          return;
        }
        setGoogle3DTilesetUrl(resource);
      })
      .catch((error) => {
        console.error("[Cesium] Google 3D Tiles load failed:", error);
        if (!cancelled) {
          setMapLoadError("Google Photorealistic 3D Tiles could not be loaded.");
        }
      });

    return () => { cancelled = true; };
  }, []);

  const [cameraPosition, setCameraPosition] = useState(() => {
    const origin = getCameraOrigin(envJson.Origin);
    return {
      destination: Cartesian3.fromDegrees(
        origin.longitude,
        origin.latitude,
        DEFAULT_CAMERA_HEIGHT,
      ),
      orientation: { heading: 0, pitch: -Math.PI / 2 },
    };
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
    ctrl.enableRotate = true;
    ctrl.enableTilt = true;
    return () => {
      ctrl.zoomFactor = 5.0;
      ctrl.inertiaZoom = 0.8;
    };
  }, [viewerReady]);

  // Keep middle-drag on the Cesium canvas instead of allowing the browser's
  // native autoscroll gesture to capture it.
  useEffect(() => {
    if (!viewerReady) return;
    const canvas = viewerRef.current.cesiumElement.canvas;
    const preventMiddleClickDefault = (event) => {
      if (event.button === 1) event.preventDefault();
    };
    canvas.addEventListener("mousedown", preventMiddleClickDefault, { passive: false });
    canvas.addEventListener("auxclick", preventMiddleClickDefault, { passive: false });
    return () => {
      canvas.removeEventListener("mousedown", preventMiddleClickDefault);
      canvas.removeEventListener("auxclick", preventMiddleClickDefault);
    };
  }, [viewerReady]);

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
    const origin = getCameraOrigin(envJson.Origin);
    setCameraByLongLat(
      origin.longitude,
      origin.latitude,
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
          <Cesium3DTileset
            url={google3DTilesetUrl}
            onError={(error) => {
              console.error("[Cesium] Google 3D Tiles render failed:", error);
              setMapLoadError("Google Photorealistic 3D Tiles could not be rendered.");
            }}
          />
        )}

        <DroneDragAndDrop viewerReady={viewerReady} viewerRef={viewerRef} />
        <RegionDragAndDrop viewerReady={viewerReady} viewerRef={viewerRef} />
        <DrawSadeZone viewerReady={viewerReady} viewerRef={viewerRef} />
        <TimeLineSetterCesiumComponent viewerReady={viewerReady} viewerRef={viewerRef} />
      </Viewer>

      {mapLoadError && (
        <Alert
          severity="error"
          sx={{ position: "absolute", top: 16, left: 16, right: 16, zIndex: 11 }}
        >
          {mapLoadError}
        </Alert>
      )}

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

export default CesiumMap;
