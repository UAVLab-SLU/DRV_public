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
