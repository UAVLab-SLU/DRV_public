# plot actual position and wind vector as information of that position
import os
import time

from matplotlib import pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
from stl import mesh

html_file_name = "points.html"


class PlotWithMesh:
    def __init__(self,
                 mesh_file_name,
                 cfd_csv_filename,
                 airsim_csv_filename,
                 gazebo_csv_filename,
                 plan_path_csv_filename,
                 wind_vector_list_csv_filename):
        """
        Experiment helper class to plot the 3D path with environment mesh, airsim path, cfd path, plan path
        and wind vector list
        constructor only reads the csv files and create the mesh, the plotting is done by the plot_3d_with_mesh method
        :param mesh_file_name: file name of the environment mesh
        :param cfd_csv_filename: file name of the cfd path
        :param airsim_csv_filename: file name of the airsim path
        :param gazebo_csv_filename: file name of the gazebo path
        :param plan_path_csv_filename: file name of the plan path
        :param wind_vector_list_csv_filename: file name of the wind vector list
        """
        if mesh_file_name is not None:
            self.env_mesh = self.create_mesh(mesh_file_name)
        else:
            self.env_mesh = None
        if cfd_csv_filename is None:
            self.path1 = None
        else:
            self.path1 = self.read_list_from_csv(cfd_csv_filename)

        if airsim_csv_filename is None:
            self.path2 = None
        else:
            self.path2 = self.read_list_from_csv(airsim_csv_filename)

        if gazebo_csv_filename is None:
            self.path3 = None
        else:
            self.path3 = self.read_list_from_csv(gazebo_csv_filename)

        if plan_path_csv_filename is None:
            self.plan_path = None
        else:
            self.plan_path = self.read_list_from_csv(plan_path_csv_filename)

        if wind_vector_list_csv_filename is None:
            self.wind_vector_list = None
        else:
            self.wind_vector_list = self.read_list_from_csv(wind_vector_list_csv_filename)

    def plot_3d_with_mesh(self,
                          horizontal_angle,
                          vertical_angle,
                          x_range,
                          y_range,
                          z_range,
                          x_density,
                          y_density,
                          z_density,
                          title):
        """
        Plot the 3D path with environment mesh
        :param horizontal_angle: -180 to 180
        :param vertical_angle:  -90 to 90
        :param x_range: [min, max]
        :param y_range: [min, max]
        :param z_range: [min, max]
        :param x_density: number of points in x direction
        :param y_density: number of points in y direction
        :param z_density: number of points in z direction
        :param title: title of the plot
        """

        # Create a 3D plot
        fig = plt.figure()
        ax = fig.add_subplot(111, projection='3d')

        if self.path1 is not None:
            path1_x = [point[0] for point in self.path1]
            path1_y = [-point[1] for point in self.path1]  # y is negative in airsim
            path1_z = [-point[2] for point in self.path1]  # z is negative in airsim
            ax.plot(path1_x, path1_y, path1_z,
                    marker='',
                    linewidth=1,
                    color='red',
                    label='RWDS')

        if self.path2 is not None:
            path2_x = [point[0] for point in self.path2]
            path2_y = [-point[1] for point in self.path2]  # y is negative in airsim
            path3_z = [-point[2] for point in self.path2]  # z is negative in airsim
            ax.plot(path2_x, path2_y, path3_z,
                    marker='',
                    linewidth=1,
                    dashes=[6, 2],
                    color='blue',
                    zorder=20,
                    label='AirSim')

        if self.path3 is not None:
            path3_x = [point[0] for point in self.path3]
            path3_y = [-point[1] for point in self.path3]  # y is negative in airsim
            path3_z = [-point[2] for point in self.path3]  # z is negative in airsim

            ax.plot(path3_x, path3_y, path3_z,
                    marker='',
                    linewidth=1,
                    dashes=[3, 3],
                    color='purple',
                    zorder=20,
                    label='Gazebo')

        # # add wind vector on cfd path for each 2 points
        # for i in range(0, len(self.cfd_path), 1):
        #     q = plt.quiver(path2_x[i], path2_y[i], path3_z[i],
        #                   self.wind_vector_list[i][0], self.wind_vector_list[i][1], self.wind_vector_list[i][2],
        #                   length=1, color='purple', normalize=False, arrow_length_ratio=0.3)
        # if q is not None:
        #     q.set_label('RWDS wind vector')

        # plot plan path
        if self.plan_path is not None:

            plan_path_x = [point[0] for point in self.plan_path]
            plan_path_y = [-point[1] for point in self.plan_path]  # y is negative in airsim
            plan_path_z = [-point[2] for point in self.plan_path]  # z is negative in airsim

            # use different color for plan path
            ax.plot(plan_path_x, plan_path_y, plan_path_z,
                    marker='',
                    linewidth=1,
                    dashes=[1, 1],
                    color='green',
                    label='Planned Path')
            # mark start and end point
            ax.scatter(plan_path_x[0], plan_path_y[0], plan_path_z[0], marker='o', color='green', label='Start Point')
            ax.scatter(plan_path_x[-1], plan_path_y[-1], plan_path_z[-1], marker='o', color='red', label='End Point')

        # Plot environment mesh
        if self.env_mesh is not None:
            mesh_collection = Poly3DCollection(self.env_mesh.vectors, alpha=0.2)
            ax.add_collection3d(mesh_collection)
        # hide mesh outside the plot range

        # Draw wind direction arrow on yz plane
        wind_x = x_range[0]
        wind_y = (y_range[0] + y_range[1]) / 2
        wind_z = (z_range[0] + z_range[1]) / 2

        # q = ax.quiver(wind_x, wind_y, wind_z, 5, 0, 0, length=2, color='black', pivot='tail')
        #

        # dummy arrow for legend
        q = ax.quiver(0, 0, 0, 0, 0, 0, length=2, color='black', pivot='tail')
        q.set_label('Wind Direction')

        # if q is not None:
        #     q.set_label('Wind Direction')

        # ax.quiver(wind_x, wind_y, wind_z, 5, 0, 0, length=5, color='black', label='Wind Direction')

        # Set labels and title
        if x_density > 0:
            ax.set_xlabel('X')
        if y_density > 0:
            ax.set_ylabel('Y')
        if z_density > 0:
            ax.set_zlabel('Z')

        # Set x, y, z ranges
        ax.set_xlim(x_range[0], x_range[1])
        ax.set_ylim(y_range[0], y_range[1])
        ax.set_zlim(z_range[0], z_range[1])

        #ax.legend(handlelength=2, fontsize=12)
        # ax.set_title(title)

        # Set the initial view perspective, top down view, focus on the (100, 50, 10) point
        ax.view_init(elev=horizontal_angle, azim=vertical_angle)

        # remove padding
        plt.tight_layout()

        # set image size
        fig.set_size_inches(6, 6)

        # set scale 1:1:1
        ax.set_aspect('equal')

        if x_density > 0:
            ax.locator_params(nbins=x_density, axis='x')
        else:
            ax.xaxis.line.set_lw(0.)
            ax.set_xticks([])
        if y_density > 0:
            ax.locator_params(nbins=y_density, axis='y')
        else:
            ax.yaxis.line.set_lw(0.)
            ax.set_yticks([])
        if z_density > 0:
            ax.locator_params(nbins=z_density, axis='z')
        else:
            ax.zaxis.line.set_lw(0.)
            ax.set_zticks([])
        # Display the plot
        plt.show()

        # save
        time_str = time.strftime("%Y-%m-%d_%H-%M-%S", time.localtime())
        plot_name = time_str +  "_" + title + ".png"
        fig.savefig(plot_name, dpi=300)

    @staticmethod
    def create_mesh(file_name):
        """
        Create mesh from stl file
        :param file_name:  path of stl file
        :return: Mesh object in Mesh package
        """
        return mesh.Mesh.from_file(file_name)

    @staticmethod
    def read_list_from_csv(filename):
        """
        read csv file in the format of x,y,z, and return a list of [x,y,z], comma separated, rounded to 2 decimal places
        :param filename: csv file name or path
        :return: a list of [x,y,z], 2d list, 2 decimal places
        """
        with open(filename, 'r') as f:
            lines = f.readlines()
            value_list = []
            for line in lines:
                point = line.split(",")
                value_list.append([round(float(point[0]), 2), round(float(point[1]), 2), round(float(point[2]), 2)])
            return value_list


def tall_building_p1():
    """
    compare all 3 paths, airsim, RWDS, gazebo
    """
    airsim_dir_name = "rq1_const_17_ds5_AIRSIM"
    cfd_dir_name = "rq1_const_17_ds5_CFD"
    gazebo_dir_name = "gazebo"

    cfd_path_filename = "report" + os.sep + cfd_dir_name + os.sep + "actual_path.csv"
    airsim_path_filename = "report" + os.sep + airsim_dir_name + os.sep + "actual_path.csv"
    gazebo_path_filename = "report" + os.sep + gazebo_dir_name + os.sep + "gazebo10ms_x_wind_RQ1p1.csv"
    plan_path_filename = "report" + os.sep + cfd_dir_name + os.sep + "plan_path.csv"

    # for tall building
    plotter = PlotWithMesh(mesh_file_name=TALL_BUILDING_MESH_FILE_NAME,
                           cfd_csv_filename=cfd_path_filename,
                           airsim_csv_filename=airsim_path_filename,
                           gazebo_csv_filename=gazebo_path_filename,
                           plan_path_csv_filename=plan_path_filename,
                           wind_vector_list_csv_filename=None)
    title = "tall buildings p1"
    plotter.plot_3d_with_mesh(horizontal_angle=90,
                              vertical_angle=-90,
                              x_range=(-30, 30),
                              y_range=(-90, 5),
                              z_range=(0, 90),
                              x_density=5,
                              y_density=5,
                              z_density=0,
                              title=title)


def tall_building_p2():
    # turbulent wind 10ms +x, gazebo vs. RWDS
    cfd_dir_name = "rq1_turb_17_ds5_CONTINUOUS_CFD"
    gazebo_dir_name = "gazebo"

    cfd_path_filename = "report" + os.sep + cfd_dir_name + os.sep + "actual_path.csv"
    gazebo_path_filename = "report" + os.sep + gazebo_dir_name + os.sep + "gazebo10ms_x_wind_RQ1p2.csv"
    plan_path_filename = "report" + os.sep + cfd_dir_name + os.sep + "plan_path.csv"

    # for tall building
    plotter = PlotWithMesh(mesh_file_name=TALL_BUILDING_MESH_FILE_NAME,
                           cfd_csv_filename=cfd_path_filename,
                           airsim_csv_filename=None,
                           gazebo_csv_filename=gazebo_path_filename,
                           plan_path_csv_filename=plan_path_filename,
                           wind_vector_list_csv_filename=None)
    title = "tall buildings p2"
    plotter.plot_3d_with_mesh(horizontal_angle=90,
                              vertical_angle=-90,
                              x_range=(-30, 30),
                              y_range=(-90, 5),
                              z_range=(0, 90),
                              x_density=5,
                              y_density=5,
                              z_density=0,
                              title=title)


def tall_building_p3():
    # wind shear 10ms +x 10ms -y, gazebo vs. RWDS
    cfd_dir_name = "rq1_ws_10_ds4_CONTINUOUS_CFD"
    gazebo_dir_name = "gazebo"

    cfd_path_filename = "report" + os.sep + cfd_dir_name + os.sep + "actual_path.csv"
    gazebo_path_filename = "report" + os.sep + gazebo_dir_name + os.sep + "gazebo10ms_x_wind_RQ1p3.csv"
    plan_path_filename = "report" + os.sep + cfd_dir_name + os.sep + "plan_path.csv"

    # for tall building
    plotter = PlotWithMesh(mesh_file_name=TALL_BUILDING_MESH_FILE_NAME,
                           cfd_csv_filename=cfd_path_filename,
                           airsim_csv_filename=None,
                           gazebo_csv_filename=gazebo_path_filename,
                           plan_path_csv_filename=plan_path_filename,
                           wind_vector_list_csv_filename=None)
    title = "tall buildings p3"
    plotter.plot_3d_with_mesh(horizontal_angle=90,
                              vertical_angle=-90,
                              x_range=(-30, 30),
                              y_range=(-90, 5),
                              z_range=(0, 90),
                              x_density=5,
                              y_density=5,
                              z_density=0,
                              title=title)


def chicago_p1():
    cfd_dir_name = "rq2_shm_2_10_ds5_CONTINUOUS_CFD"
    airsim_dir_name = "rq3_twoB_10_ds7_AIRSIM"

    airsim_path_filename = "report" + os.sep + airsim_dir_name + os.sep + "actual_path.csv"
    actual_path_filename = "report" + os.sep + cfd_dir_name + os.sep + "actual_path.csv"
    plan_path_filename = "report" + os.sep + cfd_dir_name + os.sep + "plan_path.csv"
    path_wind_vector_filename = "report" + os.sep + cfd_dir_name + os.sep + "path_wind_vector.csv"

    plotter = PlotWithMesh(mesh_file_name=CHICAGO_MESH_FILE_NAME,
                           cfd_csv_filename=airsim_path_filename,
                           airsim_csv_filename=actual_path_filename,
                           gazebo_csv_filename=None,
                           plan_path_csv_filename=plan_path_filename,
                           wind_vector_list_csv_filename=path_wind_vector_filename)
    title = "sUAS path comparison\nChicago +x 17m/s constant wind"
    plotter.plot_3d_with_mesh(horizontal_angle=90,
                              vertical_angle=90,
                              x_range=(-90, 90),
                              y_range=(-90, 90),
                              z_range=(0, 90),
                              x_density=5,
                              y_density=5,
                              z_density=0,
                              title=title)

    plotter.plot_3d_with_mesh(horizontal_angle=25,
                              vertical_angle=80,
                              x_range=(-90, 90),
                              y_range=(-90, 90),
                              z_range=(0, 90),
                              x_density=5,
                              y_density=5,
                              z_density=5,
                              title=title)

    plotter.plot_3d_with_mesh(horizontal_angle=0,
                              vertical_angle=90,
                              x_range=(-25, 100),
                              y_range=(-25, 100),
                              z_range=(0, 100),
                              x_density=5,
                              y_density=0,
                              z_density=5,
                              title=title)


def smh_compare():
    # for shm comparison
    cfd_dir_name = "rq2_shm_2_10_ds5_CONTINUOUS_CFD"
    airsim_dir_name = "rq2_shm_5_10_ds5_CONTINUOUS_CFD"

    airsim_path_filename = "report" + os.sep + airsim_dir_name + os.sep + "actual_path.csv"
    actual_path_filename = "report" + os.sep + cfd_dir_name + os.sep + "actual_path.csv"
    plan_path_filename = "report" + os.sep + cfd_dir_name + os.sep + "plan_path.csv"
    path_wind_vector_filename = "report" + os.sep + cfd_dir_name + os.sep + "path_wind_vector.csv"

    plotter = PlotWithMesh(mesh_file_name=CHICAGO_MESH_FILE_NAME,
                           cfd_csv_filename=airsim_path_filename,
                           airsim_csv_filename=actual_path_filename,
                           gazebo_csv_filename=None,
                           plan_path_csv_filename=plan_path_filename,
                           wind_vector_list_csv_filename=path_wind_vector_filename)
    plotter.plot_3d_with_mesh(horizontal_angle=45,
                              vertical_angle=-45,
                              x_range=(-100, 100),
                              y_range=(-100, 100),
                              z_range=(0, 100),
                              x_density=5,
                              y_density=5,
                              z_density=5,
                              title=''
                              )


def straight_takeoff():
    cfd_dir_name = "rq3_twoB_10_ds7_CONTINUOUS_CFD"
    airsim_dir_name = "rq3_twoB_10_ds7_AIRSIM"
    gazebo_dir_name = "gazebo"

    airsim_path_filename = "report" + os.sep + airsim_dir_name + os.sep + "actual_path.csv"
    actual_path_filename = "report" + os.sep + cfd_dir_name + os.sep + "actual_path.csv"
    gazebo_path_filename = "report" + os.sep + gazebo_dir_name + os.sep + "gazebo10ms_x_wind_RQ3p1.csv"
    plan_path_filename = "report" + os.sep + cfd_dir_name + os.sep + "plan_path.csv"

    plotter = PlotWithMesh(mesh_file_name=TWO_BUILDING_MESH_FILE_NAME,
                           cfd_csv_filename=actual_path_filename,
                           airsim_csv_filename=airsim_path_filename,
                           gazebo_csv_filename=gazebo_path_filename,
                           plan_path_csv_filename=plan_path_filename,
                           wind_vector_list_csv_filename=None)
    title = "straight takeoff"
    plotter.plot_3d_with_mesh(horizontal_angle=0,
                              vertical_angle=-90,
                              x_range=(-10, 10),
                              y_range=(-10, 10),
                              z_range=(0, 20),
                              x_density=3,
                              y_density=0,
                              z_density=3,
                              title=title)


def house_inspection():
    cfd_dir_name = "rq3_house_10_ds4_CONTINUOUS_CFD"
    gazebo_dir_name = "gazebo"

    actual_path_filename = "report" + os.sep + cfd_dir_name + os.sep + "actual_path.csv"
    gazebo_path_filename = "report" + os.sep + gazebo_dir_name + os.sep + "gazebo10ms_x_wind_RQ3p2.csv"
    plan_path_filename = "report" + os.sep + cfd_dir_name + os.sep + "plan_path.csv"

    # for house inspection
    plotter = PlotWithMesh(mesh_file_name=HOUSE_MESH_FILE_NAME,
                           cfd_csv_filename=actual_path_filename,
                           airsim_csv_filename=None,
                           gazebo_csv_filename=gazebo_path_filename,
                           plan_path_csv_filename=plan_path_filename,
                           wind_vector_list_csv_filename=None)
    title = "house inspection"
    plotter.plot_3d_with_mesh(horizontal_angle=20,
                              vertical_angle=70,
                              x_range=(-5, 40),
                              y_range=(-20, 20),
                              z_range=(0, 20),
                              x_density=3,
                              y_density=3,
                              z_density=3,
                              title=title)


if __name__ == "__main__":
    # read actual position from csv

    report_dir_names = []
    # read all directories in report folder
    for root, dirs, files in os.walk("report"):
        for dir_name in dirs:
            report_dir_names.append(dir_name)

    TALL_BUILDING_MESH_FILE_NAME = "foam_data/block/tallBuilding/threeBuildings_wo_ground.stl"
    CHICAGO_MESH_FILE_NAME = "foam_data/chicago/UE_exported_chicago_small_slice.stl"
    TWO_BUILDING_MESH_FILE_NAME = "foam_data/block/twoB_takeoff/RQ3P1_wo_ground.stl"
    HOUSE_MESH_FILE_NAME = "foam_data/block/house/simpleHouse_wo_ground.stl"

    mesh_file_name = TALL_BUILDING_MESH_FILE_NAME

    tall_building_p1()
    tall_building_p2()
    tall_building_p3()

    # smh_compare()

    straight_takeoff()

    house_inspection()
