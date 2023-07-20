from time import sleep
import numpy
from PythonClient.multirotor.monitor.abstract.single_drone_mission_monitor import SingleDroneMissionMonitor
from numpy import concatenate
from scipy.spatial import ConvexHull

from PythonClient.multirotor.util.geo.geo_util import GeoUtil


class NoFlyZoneMonitor(SingleDroneMissionMonitor):
    def __init__(self, mission, zone_polyhedra=None):
        super().__init__(mission)
        if zone_polyhedra is None:
            self.zone_polyhedra_cartesian = self.default_cartesian_zones()
        else:
            if self.input_zone_polyhedra_is_valid(zone_polyhedra):
                print("DEBUG input zone polyhedra is valid")
                self.zone_polyhedra_cartesian = self.convert_to_cartesian(zone_polyhedra)
                self.zone_polyhedra_geo = zone_polyhedra
            else:
                print("Invalid zone polyhedra input, using default zones")
                self.zone_polyhedra_cartesian = self.default_cartesian_zones()
                self.append_fail_to_log(f"{self.target_drone};Invalid zone polyhedra input, using default zones")
        self.zone_polyhedra_hulls = self.make_poly_hulls()

    @staticmethod
    def default_cartesian_zones():
        return [
            [
                [1, -10, 0],
                [1, 10, 0],
                [5, -10, 0],
                [5, 10, 0],
                [1, -10, 999],
                [1, 10, 999],
                [5, -10, 999],
                [5, 10, 999],
            ],
            [
                [-1, -10, 0],
                [-1, 10, 0],
                [-5, -10, 0],
                [-5, 10, 0],
                [-1, -10, 999],
                [-1, 10, 999],
                [-5, -10, 999],
                [-5, 10, 999],
            ]
        ]

    def convert_to_cartesian(self, zone_polyhedra):
        """
        Convert a list of geo points to cartesian points based on the origin of the simulation
        :param zone_polyhedra: list of geo points
        :return: list of cartesian points
        """
        geo_zone = []
        for zone in zone_polyhedra:
            geo_point = []
            for point in zone:
                geo_point.append(GeoUtil.geo_to_cartesian_coordinates(point[0], point[1], point[2], self.cesium_origin))
            geo_zone.append(geo_point)
        print("Debug: NoFlyZoneMonitor: cartesian zone = ", geo_zone)
        return geo_zone

    def start(self):
        self.append_info_to_log(f"{self.target_drone};NoFlyZoneMonitor started")
        violation_flag = False
        while self.mission.state != self.mission.State.END:
            # point = self.get_current_abs_point()
            geo_point = self.get_current_geo_point()
            # print(f"DEBUG: NoFlyZoneMonitor: current geo position [{geo_point[0]},{geo_point[1]},{geo_point[2]}]")
            if self.is_in_zone(geo_point):
                violation_flag = True
            sleep(1)
        if violation_flag:
            self.append_fail_to_log(f"{self.target_drone};NoFlyZoneMonitor ended with violation")
        else:
            self.append_pass_to_log(f"{self.target_drone};Mission finished, NoFlyZoneMonitor ended without violation")
        self.save_report()

    def get_current_abs_point(self):
        current_position = self.client.simGetObjectPose(
            object_name=self.target_drone).position
        x = current_position.x_val
        y = current_position.y_val
        z = current_position.z_val
        return [x, y, z]

    def get_current_geo_point(self):
        data = self.client.getGpsData(vehicle_name=self.target_drone)
        return [data.gnss.geo_point.latitude, data.gnss.geo_point.longitude, data.gnss.geo_point.altitude]

    def is_in_zone(self, point):
        for hull in self.zone_polyhedra_hulls:
            new_hull = ConvexHull(concatenate((hull.points, [point])))
            if numpy.array_equal(new_hull.vertices, hull.vertices):
                self.append_fail_to_log(f"{self.target_drone}; entered no-fly zone, "
                                        f"current geo position "
                                        f"[{round(point[0], 6)},{round(point[1], 6)},{round(point[2], 6)}]")
                return True
        return False

    def make_poly_hulls(self):
        try:
            hulls = []
            for zone in self.zone_polyhedra_cartesian:
                # invert z axis
                zone = [[point[0], point[1], point[2]] for point in zone]
                hulls.append(ConvexHull(points=numpy.array(zone)))
            self.append_info_to_log(f"{self.target_drone};NoFlyZoneMonitor created no-fly polyhedra zones, "
                                    f"{self.zone_polyhedra_cartesian}")
            return hulls
        except Exception as e:
            self.append_fail_to_log(f"{self.target_drone};Failed to create no-fly zones, not a valid 3D space,"
                                    f"{type(e).__name__}, using empty zones")
            print("Error: NoFlyZoneMonitor failed to create polyhedra hulls: ", type(e).__name__)
            return []

    @staticmethod
    def input_zone_polyhedra_is_valid(zone_polyhedra):
        if not isinstance(zone_polyhedra, list):
            return False
        for zone in zone_polyhedra:
            if not isinstance(zone, list):
                return False
            if len(zone) < 4:
                return False
            for point in zone:
                if not isinstance(point, list):
                    return False
                if len(point) != 3:
                    return False
        return True
