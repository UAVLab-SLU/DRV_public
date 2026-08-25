import { Ion } from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { runtimeMode } from "./utils/runtimeUtils";

// Token injected by vite.config.js from the credentials file.
Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_ACCESS_TOKEN || "";

console.log(`[DroneWorld] running in ${runtimeMode} mode`);

if (!Ion.defaultAccessToken) {
  console.warn(
    "[DroneWorld] No Cesium Ion Access Token found. " +
      "Add it to credentials/frontend-cesium-token.json or set VITE_CESIUM_ION_ACCESS_TOKEN in .env. " +
      "Get one free at https://ion.cesium.com/tokens",
  );
} else {
  console.log("[DroneWorld] Cesium Ion token loaded.");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
