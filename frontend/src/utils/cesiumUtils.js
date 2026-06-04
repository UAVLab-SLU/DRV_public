const GOOGLE_3D_TILESET_ASSET_ID = 2275207;

/**
 * Returns an IonResource for the Google 3D Tiles tileset.
 * Always enabled when a valid Ion access token is present.
 */
export const createGoogle3DTilesetUrl = ({
  cesiumAccessToken,
  fromAssetId,
  assetId = GOOGLE_3D_TILESET_ASSET_ID,
}) => {
  if (typeof cesiumAccessToken !== "string" || cesiumAccessToken.trim() === "") {
    console.warn("[Cesium] No Ion access token — Google 3D Tiles will not load.");
    return null;
  }

  const resource = fromAssetId(assetId);

  if (resource && typeof resource.catch === "function") {
    return resource.catch((error) => {
      console.error("[Cesium] Failed to load Google 3D tileset:", error);
      return null;
    });
  }

  return resource;
};
