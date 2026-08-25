import {
  Cartesian2,
  Cartesian3,
  Cartographic,
  Color,
  DistanceDisplayCondition,
  HeightReference,
  Math as CesiumMath,
  SceneMode,
  VerticalOrigin,
} from "cesium";
import PropTypes from "prop-types";
import { useCallback, useEffect, useState } from "react";
import { Entity } from "resium";
import { useMainJson } from "../../contexts/MainJsonContext";
import { imageUrls } from "../../utils/const";

/** Build a white-outlined drone billboard image for visibility on any background */
function createDroneImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const pad = 4;
      const w = img.width + pad * 2;
      const h = img.height + pad * 2;

      const alphaCanvas = document.createElement("canvas");
      alphaCanvas.width = img.width;
      alphaCanvas.height = img.height;
      const alphaCtx = alphaCanvas.getContext("2d");
      alphaCtx.drawImage(img, 0, 0);

      const outlineCanvas = document.createElement("canvas");
      outlineCanvas.width = w;
      outlineCanvas.height = h;
      const outCtx = outlineCanvas.getContext("2d");
      for (let dx = -pad; dx <= pad; dx++) {
        for (let dy = -pad; dy <= pad; dy++) {
          if (dx * dx + dy * dy <= pad * pad) outCtx.drawImage(alphaCanvas, pad + dx, pad + dy);
        }
      }
      outCtx.globalCompositeOperation = "source-in";
      outCtx.fillStyle = "#ffffff";
      outCtx.fillRect(0, 0, w, h);
      outCtx.globalCompositeOperation = "source-over";
      outCtx.drawImage(img, pad, pad);

      resolve(outlineCanvas.toDataURL());
    };
    img.src = src;
  });
}

const DroneDragAndDrop = ({ viewerReady, viewerRef }) => {
  const { syncDroneLocation, mainJson } = useMainJson();
  const [labelVisible, setLabelVisible] = useState(false);
  const [droneImage, setDroneImage] = useState(null);

  useEffect(() => {
    createDroneImage(imageUrls.drone_thick_orange).then(setDroneImage);
  }, []);

  const checkCameraHeight = useCallback(() => {
    if (!viewerRef.current) return;
    const viewer = viewerRef.current.cesiumElement;
    if (viewer.scene.mode === SceneMode.SCENE3D) {
      setLabelVisible(viewer.camera.positionCartographic.height < 3000);
    }
  }, [viewerRef]);

  useEffect(() => {
    if (!viewerReady) return;
    const viewer = viewerRef.current.cesiumElement;
    const canvas = viewer.canvas;
    canvas.setAttribute("tabindex", "0");

    const onDragOver = (e) => {
      e.preventDefault();
      canvas.style.border = "2px dashed #f97316";
    };

    const onDrop = (e) => {
      e.preventDefault();
      canvas.style.border = "";

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const dragData = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (dragData.type !== "drone") return;

      const canvasPos = new Cartesian2(x, y);
      const cartesian = viewer.scene.pickPosition(canvasPos);
      if (!cartesian) return;

      const carto = Cartographic.fromCartesian(cartesian);
      const latitude = CesiumMath.toDegrees(carto.latitude);
      const longitude = CesiumMath.toDegrees(carto.longitude);

      const ray = viewer.camera.getPickRay(canvasPos);
      const intersection = viewer.scene.pickFromRay(ray, []);
      const buildingHeight = intersection?.position
        ? Cartographic.fromCartesian(intersection.position).height
        : 0;

      syncDroneLocation(latitude, longitude, buildingHeight, dragData.index);
    };

    canvas.addEventListener("dragover", onDragOver);
    canvas.addEventListener("drop", onDrop);
    viewer.camera.moveEnd.addEventListener(checkCameraHeight);

    return () => {
      canvas.removeEventListener("dragover", onDragOver);
      canvas.removeEventListener("drop", onDrop);
      viewer.camera.moveEnd.removeEventListener(checkCameraHeight);
    };
  }, [checkCameraHeight, syncDroneLocation, viewerReady, viewerRef]);

  if (!droneImage) return null;

  return (
    <>
      {mainJson.getAllDrones().map((drone, index) => {
        if (!drone.X || !drone.Y) return null;
        const position = Cartesian3.fromDegrees(drone.Y, drone.X, drone.Z ?? 0);
        const color = Color.fromCssColorString(drone.color || "#F97316");
        const displayName = drone.Name ?? drone.droneName ?? `Drone ${index + 1}`;
        return (
          <Entity
            key={drone.id ?? displayName + index}
            position={position}
            billboard={{
              image: droneImage,
              scale: labelVisible ? 1.0 : 0.75,
              color,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            }}
            label={{
              text: displayName,
              font: "13pt Poppins, sans-serif",
              showBackground: true,
              backgroundColor: Color.fromCssColorString("#0d1520").withAlpha(0.85),
              backgroundPadding: new Cartesian2(6, 4),
              fillColor: Color.WHITE,
              heightReference: HeightReference.NONE,
              verticalOrigin: VerticalOrigin.TOP,
              pixelOffset: new Cartesian2(0, -55),
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
              distanceDisplayCondition: new DistanceDisplayCondition(0.0, 5000.0),
            }}
          />
        );
      })}
    </>
  );
};

DroneDragAndDrop.propTypes = {
  viewerReady: PropTypes.bool.isRequired,
  viewerRef: PropTypes.object.isRequired,
};

export default DroneDragAndDrop;
