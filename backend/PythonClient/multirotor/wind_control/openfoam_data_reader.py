import os.path
import time
import Ofpp
import numpy as np


class FoamReader:
    """
    Read OpenFOAM raw data
    """
    def __init__(self, path):
        """
        :param path: str, path to the root directory of the OpenFOAM data
        """
        self.foam_data_root = os.path.abspath(path)
        self.mesh = self.read_mesh()
        self.equilibrium_wind_speed = None

    def set_foam_data_root(self, path):
        self.foam_data_root = os.path.abspath(path)

    def preprocess_equilibrium_wind_speed(self, time_step):
        """
        Calculate the equilibrium wind speed at the given time step
        :return: equilibrium wind speed 3d matrix at the given time step
        """

        velocity = self.read_U_ofpp(time_step)

        x_range = 160 * 2
        y_range = 160 * 2
        z_range = 50 * 2

        velocity_matrix = np.zeros((x_range, y_range, z_range, 3))

        for i in range(-x_range, x_range):
            for j in range(-y_range, y_range):
                for k in range(-z_range, z_range):
                    x = i / 2
                    y = j / 2
                    z = k / 2
                    point = [x, y, z]
                    velocity_matrix[i][j][k] = self.get_spacial_temporal_velocity(time_step, point)

        return velocity_matrix

    def read_U_ofpp(self, time_step):
        path_to_u = self.foam_data_root + "/" + str(time_step) + "/U"
        u = Ofpp.parse_internal_field(path_to_u)
        return u

    def read_internal_field(self):
        bf = Ofpp.parse_boundary_field(self.foam_data_root + "/1/U")
        return bf

    def read_mesh(self):
        mesh = Ofpp.FoamMesh(self.foam_data_root)
        return mesh


    def get_spacial_temporal_velocity(self, raw_point, time_step, precision=0.2):
        """
        Get the velocity at a point in space and time
        :param time_step:
        :param point: any 3d point, not necessarily a point in the mesh
        :return: velocity at the point, none if the point is not in the mesh and not close to any point in the mesh
        """

        cell_faces = self.mesh.cell_faces
        points = self.mesh.points
        u = self.read_U_ofpp(time_step)
        point = self.round_point(raw_point)

        point_index = np.argwhere(np.all(points == point, axis=1))
        if point_index.size > 0:  # found
            print(str(points[point_index]) + "found at points index" + str(point_index))
        else:  # not found
            print("exact point not found")
            # Find the closest point
            min_distance = precision
            point_index = self.approximate_closest_point(point, points, min_distance)

        # find the cell that contains the point
        cell_index = None
        for cell in cell_faces:
            if point_index in cell:
                cell_index = cell
                break

        if cell_index is None or len(cell_index) == 0:
            print("cell_index is None at point" + str(point))
            return None
            # likely to be a boundary point

        else:
            # find U values for the first index of the cell
            print("cell_index" + str(cell_index))
            u_value = u[cell_index[0]]
            if u_value is None:
                print("u_value is None at point" + str(point))
                return None
            return u_value

    def greedy_get_spacial_temporal_velocity(self, raw_point, time_step):
        """
        Assumes ideal mesh where all points are equidistant, integer per unit distance, and no points are missing
        :param raw_point: any 3d point, not necessarily a point in the mesh
        :param time_step: time step
        :return: velocity at the point, none if the point is not in the mesh
        """
        cell_faces = self.mesh.cell_faces
        points = self.box_mesh_point_preprocess(self.mesh.points)
        u = self.read_U_ofpp(time_step)
        point = self.integer_point(raw_point)

        point_index = np.argwhere(np.all(points == point, axis=1))

        if point_index.size > 0:  # found
            print(str(points[point_index]) + "found at points index" + str(point_index))

            # find the cell that contains the point
            cell_index = self.find_subarray_index(cell_faces, point_index)
            if cell_index == -1:
                print("cell_index is None at point" + str(point))
                return None
                # likely to be a boundary point
            return u[cell_index]


        else:  # not found
            print("exact point not found")
            return None

    @staticmethod
    def find_subarray_index(arr, x):
        """
        Find the index of the subarray in a 2d array
        :param arr: 2d array
        :param x: subarray element
        :return: index of the subarray containing x
        """
        arr = np.array(arr)
        indices = np.where(arr == x)

        if len(indices[0]) == 0:
            return -1  # Return -1 to indicate x was not found
        else:
            row_index, col_index = indices[0][0], indices[1][0]
            return row_index


    def prepare_spacial_temporal_velocity(self):
        """
        Prepare the spacial-temporal velocity matrix from the OpenFOAM data
        :return: size t*[x*y*z] matrix
        """
        pass

    def approximate_wind_speed(self, point, time_step):
        """
        Approximate the wind speed at a point in space
        :param point: point in space
        :param time_step: time step
        :return: wind speed at the point
        """
        # approx_point = [self.round_off_half(point[0]), self.round_off_half(point[1]), self.round_off_half(point[2])]
        return self.get_spacial_temporal_velocity(time_step, point)

    # @staticmethod
    # def round_off_half(number):
    #     """Round a number to the closest half integer."""
    #     return round(number * 2) / 2

    @staticmethod
    def approximate_closest_point(target, array, min_distance):
        """
        Approximate the closest point to the given point
        :param target: target point
        :param array: list of points
        :param min_distance: minimum distance to be considered
        :return: exact closest point index in the list of points
        """
        closest_index = None
        for i, p in enumerate(array):
            distance = ((p[0] - target[0]) ** 2 + (p[1] - target[1]) ** 2 + (p[2] - target[2]) ** 2) ** 0.5
            if distance < min_distance:
                min_distance = distance
                closest_index = i

        if closest_index is not None:
            # The closest point has been found
            print("closest point found at index", str(closest_index), "value", str(array[closest_index]))
            return closest_index
        else:
            print("closest point not found")
            return None

    @staticmethod
    def round_point(point):
        return [round(point[0], 2), round(point[1], 2), round(point[2], 2)]

    @staticmethod
    def integer_point(point):
        return [int(point[0]), int(point[1]), int(point[2])]

    @staticmethod
    def box_mesh_point_preprocess(points, width=241, height=241, depth=41):
        """
        Preprocess the points in the mesh, only keep the points that form a box
        :param points: raw points
        :param width: width of the box
        :param height: height of the box
        :param depth: depth of the box
        :return: that form a box
        """
        return points[:width * height * depth]


if __name__ == "__main__":
    foam_data_root = "foam_data/block/blockEnv"
    start = time.time()
    foam_reader = FoamReader(foam_data_root)
    print("Time taken to load data:", time.time() - start, "seconds")
    start = time.time()
    point = [17.0951, 0.256701, 0.118524]
    #print("wind speed at point " + str(point) + " is " + str(foam_reader.get_spacial_temporal_velocity(point, 20)))
    print("wind speed at point " + str(point) + " is " + str(foam_reader.greedy_get_spacial_temporal_velocity(point, 20)))
    print("Time taken to query:", time.time() - start, "seconds")
    # time this function

    # for i in range(1, 10):
    #     # generate random int values from 0 to 100
    #     # x = np.random.randint(-100, 100)
    #     # y = np.random.randint(-100, 100)
    #     # z = np.random.randint(0, 20)

    # none_list = []
    # for x in range(-100, 100):
    #     for y in range(-100, 100):
    #         for z in range(0, 20):
    #             if foam_reader.get_spacial_temporal_velocity(100, [x, y, z]) is None:
    #                 none_list.append([x, y, z])
    # print(none_list)

    # start = time.time()
    # print("Velocity at point", [x, y, z], "at time step", i, "is:")
    # print(foam_reader.get_spacial_temporal_velocity(i, [x, y, z]))
    # print("Time taken:", time.time() - start, "seconds")
