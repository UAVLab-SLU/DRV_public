from PythonClient.multirotor.mission.fly_to_points import FlyToPoints
from PythonClient.multirotor.util.geo.geo_util import GeoUtil


class FlyToPointsGeo(FlyToPoints):
    """
    Fly to points in geographic coordinates
    """

    def __init__(self, target_drone="Default", speed=2, geo_points=None):
        super().__init__()
        self.target_drone = target_drone
        self.speed = speed
        self.cesium_origin = self.get_cesium_origin()
        if geo_points is None:
            self.geo_points = [
                (self.cesium_origin[0] + 0.0001, self.cesium_origin[1], 0),
                (self.cesium_origin[0] + 0.0001, self.cesium_origin[1] + 0.0001, 1),
                (self.cesium_origin[0], self.cesium_origin[1] + 0.0001, 2),
                (self.cesium_origin[0], self.cesium_origin[1], 3)
            ]
            # default path, form a small square shape starting from the vertex and return to origin
        else:
            self.geo_points = geo_points

        self.points = self.get_cartesian_points(self.geo_points)

    def start(self):
        self.state = "running"
        self.fly(self.points)
        self.append_info_to_log("task over")
        self.stop()

    def get_cartesian_points(self, geo_points):
        """
        Get the Cartesian points to fly to from geographic coordinates
        """

        cartesian_points = []
        # Define center geolocation (Unreal Cesium Center (double check))
        lat_c = self.cesium_origin[0]
        long_c = self.cesium_origin[1]

        for geo_point in geo_points:
            # Define other geolocation (the geolocation we want to convert)
            lat_o = geo_point[0]  # latitude in degrees
            long_o = geo_point[1]  # longitude in degrees
            alt_o = geo_point[2]  # altitude in meters above the origin
            cartesian_points.append(GeoUtil.geo_to_cartesian_coordinates(lat_o, long_o, alt_o, self.cesium_origin))
            # print("Cartesian coordinates: ({:.2f}, {:.2f}, {:.2f})".format(x, y, z))
        return cartesian_points

if __name__ == "__main__":
    mission = FlyToPointsGeo()
    mission.start()