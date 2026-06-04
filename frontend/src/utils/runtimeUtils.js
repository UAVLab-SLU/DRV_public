export const runtimeMode = import.meta.env.MODE ?? "development";

export function isDevelopmentRuntime() {
  return runtimeMode === "development";
}
