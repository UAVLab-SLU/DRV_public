import {
  Cartesian2,
  Cartesian3,
  Cartographic,
  Color,
  DistanceDisplayCondition,
  HeightReference,
  KeyboardEventModifier,
  Math as CesiumMath,
  Rectangle,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  VerticalOrigin,
} from "cesium";
import PropTypes from "prop-types";
import { useCallback, useEffect, useRef } from "react";
import { Entity } from "resium";
import { useMainJson } from "../../contexts/MainJsonContext";
import { EnvironmentModel } from "../../model/EnvironmentModel";
import { imageUrls } from "../../utils/const";
import { findRectangleLength, findRectangleWidth } from "../../utils/mapUtils";

const ZONE_HEIGHT_INCREASE = 200;

const DrawSadeZone = ({ viewerReady, viewerRef }) => {
  const { envJson, setEnvJson } = useMainJson();
  const envJsonRef = useRef(envJson);
  const mouseDownRef = useRef(false);
  const firstPointRef = useRef(null);
  const zoneHeightRef = useRef(0);
  const controlStateRef = useRef(null);

  useEffect(() => {
    envJsonRef.current = envJson;
  }, [envJson]);

  const updateSadeZone = useCallback(
    (rect) => {
      const env = envJsonRef.current;
      const idx = env.activeSadeZoneIndex;
      if (idx == null) return;
      const sade = env.getSadeBasedOnIndex(idx);
      sade.rectangle = rect;
      sade.length = findRectangleLength(rect);
      sade.width = findRectangleWidth(rect);
      sade.height = zoneHeightRef.current + ZONE_HEIGHT_INCREASE;
      sade.centerLat = CesiumMath.toDegrees((rect.north + rect.south) / 2);
      sade.centerLong = CesiumMath.toDegrees((rect.east + rect.west) / 2);
      env.updateSadeBasedOnIndex(idx, sade);
      setEnvJson(EnvironmentModel.getReactStateBasedUpdate(env));
    },
    [setEnvJson],
  );

  const lockMapControls = useCallback((viewer) => {
    const ctrl = viewer.scene.screenSpaceCameraController;
    if (controlStateRef.current == null) {
      controlStateRef.current = {
        enableRotate: ctrl.enableRotate,
        enableTranslate: ctrl.enableTranslate,
        enableZoom: ctrl.enableZoom,
        enableTilt: ctrl.enableTilt,
        enableLook: ctrl.enableLook,
      };
    }
    ctrl.enableRotate = false;
    ctrl.enableTranslate = false;
    ctrl.enableZoom = false;
    ctrl.enableTilt = false;
    ctrl.enableLook = false;
  }, []);

  const restoreMapControls = useCallback((viewer) => {
    if (controlStateRef.current == null) return;
    const ctrl = viewer.scene.screenSpaceCameraController;
    Object.assign(ctrl, controlStateRef.current);
    controlStateRef.current = null;
  }, []);

  // Shift key listeners (keyboard)
  useEffect(() => {
    if (!viewerReady) return;
    const viewer = viewerRef.current.cesiumElement;

    const onKeyDown = (e) => {
      if (e.key !== "Shift") return;
      if (envJsonRef.current.activeSadeZoneIndex == null) return;
      lockMapControls(viewer);
    };
    const onKeyUp = (e) => {
      if (e.key !== "Shift") return;
      restoreMapControls(viewer);
    };
    const onBlur = () => restoreMapControls(viewer);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      restoreMapControls(viewer);
    };
  }, [lockMapControls, restoreMapControls, viewerReady, viewerRef]);

  // Mouse event handler for drawing
  useEffect(() => {
    if (!viewerReady) return;
    const viewer = viewerRef.current.cesiumElement;
    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);

    handler.setInputAction((movement) => {
      if (envJsonRef.current.activeSadeZoneIndex == null) return;
      mouseDownRef.current = true;
      viewer.canvas.style.border = "2px dashed #90cdf4";
      lockMapControls(viewer);

      const cartesian = viewer.scene.pickPosition(movement.position);
      if (!cartesian) return;

      const ray = viewer.camera.getPickRay(movement.position);
      const intersection = viewer.scene.pickFromRay(ray, []);
      zoneHeightRef.current = intersection?.position
        ? Cartographic.fromCartesian(intersection.position).height
        : ZONE_HEIGHT_INCREASE;

      firstPointRef.current = Cartographic.fromCartesian(cartesian);
    }, ScreenSpaceEventType.LEFT_DOWN, KeyboardEventModifier.SHIFT);

    handler.setInputAction((movement) => {
      if (!mouseDownRef.current || !firstPointRef.current) return;
      lockMapControls(viewer);
      const cartesian = viewer.scene.pickPosition(movement.endPosition);
      if (!cartesian) return;
      const temp = Cartographic.fromCartesian(cartesian);
      const rect = new Rectangle(
        Math.min(temp.longitude, firstPointRef.current.longitude),
        Math.min(temp.latitude, firstPointRef.current.latitude),
        Math.max(temp.longitude, firstPointRef.current.longitude),
        Math.max(temp.latitude, firstPointRef.current.latitude),
      );
      updateSadeZone(rect);
    }, ScreenSpaceEventType.MOUSE_MOVE, KeyboardEventModifier.SHIFT);

    handler.setInputAction(() => {
      if (!mouseDownRef.current) return;
      viewer.canvas.style.border = "none";
      restoreMapControls(viewer);
      mouseDownRef.current = false;
      firstPointRef.current = null;

      const env = envJsonRef.current;
      const idx = env.activeSadeZoneIndex;
      env.activeSadeZoneIndex = null;
      const sade = env.getSadeBasedOnIndex(idx);
      if (sade?.updateVertices) sade.updateVertices();
      setEnvJson(EnvironmentModel.getReactStateBasedUpdate(env));
    }, ScreenSpaceEventType.LEFT_UP);

    return () => {
      handler.destroy();
      viewer.canvas.style.border = "none";
      mouseDownRef.current = false;
      firstPointRef.current = null;
      restoreMapControls(viewer);
    };
  }, [lockMapControls, restoreMapControls, setEnvJson, updateSadeZone, viewerReady, viewerRef]);

  return (
    <>
      {envJson.getAllSades().map((sade) => (
        <Entity key={sade.id ?? `${sade.name}-${sade.centerLong}-${sade.centerLat}`}>
          {sade.rectangle && (
            <>
              <Entity
                rectangle={{
                  coordinates: sade.rectangle,
                  extrudedHeight: sade.height,
                  extrudedHeightReference: HeightReference.RELATIVE_TO_TERRAIN,
                  material: Color.SEAGREEN.withAlpha(0.2),
                  outline: true,
                  outlineColor: Color.WHITE,
                  outlineWidth: 2,
                }}
              />
              {/* Length label (red) */}
              <Entity>
                <Entity
                  polyline={{
                    positions: [
                      Cartesian3.fromRadians(sade.rectangle.west, sade.rectangle.south, sade.height),
                      Cartesian3.fromRadians(sade.rectangle.west, sade.rectangle.north, sade.height),
                    ],
                    width: 2,
                    material: Color.RED,
                  }}
                />
                <Entity
                  position={Cartesian3.fromRadians(
                    sade.rectangle.west,
                    (sade.rectangle.south + sade.rectangle.north) / 2,
                    sade.height,
                  )}
                  label={{
                    text: `L: ${sade.length?.toFixed(1)} m`,
                    font: "11pt monospace",
                    fillColor: Color.WHITE,
                    backgroundColor: Color.CRIMSON.withAlpha(0.8),
                    showBackground: true,
                    backgroundPadding: new Cartesian2(6, 4),
                    pixelOffset: new Cartesian2(0, -10),
                    distanceDisplayCondition: new DistanceDisplayCondition(0.0, 3000.0),
                  }}
                />
              </Entity>
              {/* Width label (blue) */}
              <Entity
                polyline={{
                  positions: [
                    Cartesian3.fromRadians(sade.rectangle.west, sade.rectangle.south, sade.height),
                    Cartesian3.fromRadians(sade.rectangle.east, sade.rectangle.south, sade.height),
                  ],
                  width: 2,
                  material: Color.BLUE,
                }}
              >
                <Entity
                  position={Cartesian3.fromRadians(
                    (sade.rectangle.west + sade.rectangle.east) / 2,
                    sade.rectangle.south,
                    sade.height,
                  )}
                  label={{
                    text: `W: ${sade.width?.toFixed(1)} m`,
                    font: "11pt monospace",
                    fillColor: Color.WHITE,
                    backgroundColor: Color.BLUEVIOLET.withAlpha(0.8),
                    showBackground: true,
                    backgroundPadding: new Cartesian2(6, 4),
                    pixelOffset: new Cartesian2(0, -10),
                    distanceDisplayCondition: new DistanceDisplayCondition(0.0, 3000.0),
                  }}
                />
              </Entity>
            </>
          )}
          {sade.centerLong && sade.centerLat && (
            <Entity
              position={Cartesian3.fromDegrees(sade.centerLong, sade.centerLat, sade.height)}
              billboard={{ image: imageUrls.pin, scale: 0.4 }}
              label={{
                text: sade.name,
                font: "13pt Poppins, sans-serif",
                backgroundColor: Color.fromCssColorString("#0d1520").withAlpha(0.8),
                fillColor: Color.WHITE,
                showBackground: true,
                backgroundPadding: new Cartesian2(6, 4),
                verticalOrigin: VerticalOrigin.BOTTOM,
                pixelOffset: new Cartesian2(0, -15),
              }}
            />
          )}
        </Entity>
      ))}
    </>
  );
};

DrawSadeZone.propTypes = {
  viewerReady: PropTypes.bool.isRequired,
  viewerRef: PropTypes.object.isRequired,
};

export default DrawSadeZone;
