import {
  Cartesian2,
  Cartesian3,
  Cartographic,
  Color,
  HeightReference,
  JulianDate,
  Math as CesiumMath,
  VerticalOrigin,
} from "cesium";
import PropTypes from "prop-types";
import { useEffect } from "react";
import { Entity } from "resium";
import { useMainJson } from "../../contexts/MainJsonContext";

const RegionDragAndDrop = ({ viewerReady, viewerRef }) => {
  const { syncRegionLocation, envJson } = useMainJson();

  useEffect(() => {
    if (!viewerReady) return;
    const viewer = viewerRef.current.cesiumElement;
    const canvas = viewer.canvas;

    // Custom time display in the Cesium animation widget
    viewer.animation.viewModel.timeFormatter = (date) => {
      const d = JulianDate.toDate(date);
      const pad = (n) => String(n).padStart(2, "0");
      return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    canvas.setAttribute("tabindex", "0");

    const onDragOver = (e) => {
      e.preventDefault();
      canvas.style.border = "2px dashed #f6e05e";
    };

    const onDrop = (e) => {
      e.preventDefault();
      canvas.style.border = "";

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const dragData = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (dragData.type !== "region") return;

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

      syncRegionLocation(latitude, longitude, buildingHeight, dragData.src);
    };

    canvas.addEventListener("dragover", onDragOver);
    canvas.addEventListener("drop", onDrop);

    return () => {
      canvas.removeEventListener("dragover", onDragOver);
      canvas.removeEventListener("drop", onDrop);
    };
  }, [syncRegionLocation, viewerReady, viewerRef]);

  return (
    <Entity
      position={Cartesian3.fromDegrees(
        envJson.Origin.longitude,
        envJson.Origin.latitude,
        envJson.Origin.height,
      )}
      billboard={{
        image: envJson.getOriginImage(),
        scale: 0.5,
        heightReference: HeightReference.NONE,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      }}
      ellipse={{
        semiMinorAxis: envJson.Origin.radius * 1609.34,
        semiMajorAxis: envJson.Origin.radius * 1609.34,
        material: Color.TRANSPARENT,
        outline: true,
        outlineColor: Color.YELLOW,
        outlineWidth: 4,
        height: envJson.Origin.height,
        extrudedHeight: envJson.Origin.height + 7,
        heightReference: HeightReference.NONE,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      }}
      label={{
        text: "Simulation Origin",
        font: "13pt Poppins, sans-serif",
        showBackground: true,
        backgroundColor: Color.fromCssColorString("#f6e05e").withAlpha(0.9),
        backgroundPadding: new Cartesian2(6, 4),
        fillColor: Color.BLACK,
        heightReference: HeightReference.NONE,
        verticalOrigin: VerticalOrigin.TOP,
        pixelOffset: new Cartesian2(0, 20),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      }}
    />
  );
};

RegionDragAndDrop.propTypes = {
  viewerReady: PropTypes.bool.isRequired,
  viewerRef: PropTypes.object.isRequired,
};

export default RegionDragAndDrop;
