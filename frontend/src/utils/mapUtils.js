export function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

export function distanceInMetersBetweenEarthCoords(lat1, lon1, lat2, lon2) {
  const earthRadiusKm = 6371;
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c * 1000;
}

export const findRectangleWidth = (rectangle) => {
  return distanceInMetersBetweenEarthCoords(
    (rectangle.north + rectangle.south) / 2,
    rectangle.west,
    (rectangle.north + rectangle.south) / 2,
    rectangle.east,
  );
};

export const findRectangleLength = (rectangle) => {
  return distanceInMetersBetweenEarthCoords(
    rectangle.north,
    (rectangle.west + rectangle.east) / 2,
    rectangle.south,
    (rectangle.west + rectangle.east) / 2,
  );
};

export function metersToLatitude(meters) {
  return meters / 111000;
}

export function metersToLongitude(meters, latitude) {
  const latitudeInRadians = degreesToRadians(latitude);
  return meters / (111000 * Math.cos(latitudeInRadians));
}

export function updateRectangle(centerLon, centerLat, length, width) {
  const halfWidthInDegrees = metersToLongitude(width / 2, centerLat);
  const halfLengthInDegrees = metersToLatitude(length / 2);
  return {
    west: degreesToRadians(centerLon - halfWidthInDegrees),
    south: degreesToRadians(centerLat - halfLengthInDegrees),
    east: degreesToRadians(centerLon + halfWidthInDegrees),
    north: degreesToRadians(centerLat + halfLengthInDegrees),
  };
}

export function findRectangleCorners(centerLon, centerLat, length, width) {
  const halfWidthInDegrees = metersToLongitude(width / 2, centerLat);
  const halfLengthInDegrees = metersToLatitude(length / 2);
  const lon1 = centerLon - halfWidthInDegrees;
  const lon2 = centerLon + halfWidthInDegrees;
  const lat1 = centerLat - halfLengthInDegrees;
  const lat2 = centerLat + halfLengthInDegrees;
  return {
    lat1: lat2, long1: lon1,
    lat2: lat2, long2: lon2,
    lat3: lat1, long3: lon2,
    lat4: lat1, long4: lon1,
  };
}

export function roundCoordinate(value, maxDecimalPlaces = 5) {
  if (typeof value !== "number" || Number.isNaN(value)) return value;
  return parseFloat(value.toFixed(maxDecimalPlaces));
}
