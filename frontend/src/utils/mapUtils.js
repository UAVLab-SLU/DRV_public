import { Rectangle, Math as CesiumMath, Cartesian2 } from 'cesium';

function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

export function distanceInMetersBetweenEarthCoords(lat1, lon1, lat2, lon2) {
  console.log(lat1, lon1, lat2, lon2);
  var earthRadiusKm = 6371;

  var dLat = degreesToRadians(lat2 - lat1);
  var dLon = degreesToRadians(lon2 - lon1);

  lat1 = degreesToRadians(lat1);
  lat2 = degreesToRadians(lat2);

  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
  return meters / 111000; // One degree of latitude is approximately 111 km
}

export function metersToLongitude(meters, latitude) {
  // Convert latitude to radians for the cosine function
  const latitudeInRadians = degreesToRadians(latitude);
  // Longitude in degrees depends on latitude
  return meters / (111000 * Math.cos(latitudeInRadians));
}

export function updateRectangle(centerLon, centerLat, length, width) {
  const halfWidthInDegrees = metersToLongitude(width / 2, centerLat);
  const halfLengthInDegrees = metersToLatitude(length / 2);

  return new Rectangle(
    centerLon - halfWidthInDegrees,
    centerLat - halfLengthInDegrees,
    centerLon + halfWidthInDegrees,
    centerLat + halfLengthInDegrees,
  );
}

export function updateRectangleByNewCenter(newLon, newLat, length, width) {
  const halfWidthInDegrees = metersToLongitude(width / 2, newLat);
  const halfLengthInDegrees = metersToLatitude(length / 2);

  return new Rectangle(
    newLon - halfWidthInDegrees, // west
    newLat - halfLengthInDegrees, // south
    newLon + halfWidthInDegrees, // east
    newLat + halfLengthInDegrees, // north
  );
}

export function computeCircle(radius) {
  const positions = [];
  for (let i = 0; i < 360; i++) {
    const radians = CesiumMath.toRadians(i);
    positions.push(new Cartesian2(radius * Math.cos(radians), radius * Math.sin(radians)));
  }
  return positions;
}
