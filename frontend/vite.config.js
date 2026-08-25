import react from "@vitejs/plugin-react";
import { createReadStream, existsSync, readFileSync, statSync } from "fs";
import { extname, join, resolve } from "path";
import { defineConfig, loadEnv } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

const CESIUM_MIME = {
  ".js":    "application/javascript",
  ".mjs":   "application/javascript",
  ".json":  "application/json",
  ".wasm":  "application/wasm",
  ".css":   "text/css",
  ".png":   "image/png",
  ".jpg":   "image/jpeg",
  ".jpeg":  "image/jpeg",
  ".svg":   "image/svg+xml",
  ".woff":  "font/woff",
  ".woff2": "font/woff2",
  ".gif":   "image/gif",
  ".glb":   "model/gltf-binary",
  ".ktx2":  "image/ktx2",
};

function readCesiumTokenFromFile() {
  const candidates = [
    process.env.CESIUM_TOKEN_FILE,
    resolve(process.cwd(), "../credentials/frontend-cesium-token.json"),
    "/credentials/frontend-cesium-token.json",
  ].filter(Boolean);

  for (const file of candidates) {
    try {
      if (!existsSync(file)) continue;
      const cfg = JSON.parse(readFileSync(file, "utf8"));
      const token = typeof cfg.token === "string" ? cfg.token.trim() : "";
      if (token) return token;
    } catch {
      // try next candidate
    }
  }
  return null;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isDev = mode === "development";

  const cesiumToken =
    readCesiumTokenFromFile() ??
    env.VITE_CESIUM_ION_ACCESS_TOKEN ??
    env.REACT_APP_CESIUM_ION_ACCESS_TOKEN ??
    "";

  if (isDev) {
    console.log(
      cesiumToken
        ? "[vite] Cesium Ion token loaded."
        : "[vite] WARNING: No Cesium Ion token found — terrain will not load.",
    );
  }

  const apiTarget = env.VITE_API_URL ?? env.REACT_APP_API_URL ?? "http://localhost:5000";

  return {
    define: {
      CESIUM_BASE_URL: JSON.stringify("/cesium"),
      __CESIUM_ION_TOKEN__: JSON.stringify(cesiumToken),
    },

    plugins: [
      react(),

      // Copy Cesium static assets into dist/ for production builds
      viteStaticCopy({
        targets: [
          { src: "node_modules/cesium/Build/Cesium/Assets",     dest: "cesium" },
          { src: "node_modules/cesium/Build/Cesium/Workers",    dest: "cesium" },
          { src: "node_modules/cesium/Build/Cesium/ThirdParty", dest: "cesium" },
          { src: "node_modules/cesium/Build/Cesium/Widgets",    dest: "cesium" },
        ],
      }),

      // Dev-only: serve Cesium static files at /cesium/* with correct MIME types.
      // Without this, browser rejects worker .js and .wasm files → no terrain.
      isDev && {
        name: "cesium-dev-assets",
        configureServer(server) {
          const cesiumBase = resolve("node_modules/cesium/Build/Cesium");

          server.middlewares.use("/cesium", (req, res, next) => {
            const safePath = (req.url ?? "/").split("?")[0].replace(/^\/+/, "");
            const filePath = join(cesiumBase, safePath);

            // Ensure the resolved path stays within cesiumBase (no path traversal)
            if (!filePath.startsWith(cesiumBase)) return next();

            let stat;
            try { stat = statSync(filePath); } catch { return next(); }
            if (!stat.isFile()) return next();

            const mime = CESIUM_MIME[extname(filePath).toLowerCase()] ?? "application/octet-stream";
            res.setHeader("Content-Type", mime);
            res.setHeader("Cache-Control", "public, max-age=86400, immutable");
            res.setHeader("Cross-Origin-Resource-Policy", "same-site");
            createReadStream(filePath).pipe(res);
          });
        },
      },
    ].filter(Boolean),

    server: {
      host: "0.0.0.0",
      port: 3000,
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true },
      },
    },

    build: {
      chunkSizeWarningLimit: 4000,
    },
  };
});
