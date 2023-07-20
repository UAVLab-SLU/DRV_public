# plot actual position and wind vector as information of that position
import os
from matplotlib import pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
from stl import mesh

html_file_name = "points.html"


class PlotWithMesh:
    def __init__(self,
                 mesh_file_name,
                 trace_1_csv_filename,
                 trace_2_csv_filename,
                 plan_path_csv_filename,
                 wind_vector_list_csv_filename):
        """
        Experiment helper class to plot the 3D path with environment mesh, airsim path, cfd path, plan path
        and wind vector list
        constructor only reads the csv files and create the mesh, the plotting is done by the plot_3d_with_mesh method
        :param mesh_file_name: file name of the environment mesh
        :param trace_1_csv_filename: file name of the airsim path
        :param trace_2_csv_filename: file name of the cfd path
        :param plan_path_csv_filename: file name of the plan path
        :param wind_vector_list_csv_filename: file name of the wind vector list
        """
        if mesh_file_name is not None:
            self.env_mesh = self.create_mesh(mesh_file_name)
        else:
            self.env_mesh = None
        if trace_1_csv_filename is None:
            self.airsim_path = None
        else:
            self.airsim_path = self.read_list_from_csv(trace_1_csv_filename)
        self.cfd_path = self.read_list_from_csv(trace_2_csv_filename)
        self.plan_path = self.read_list_from_csv(plan_path_csv_filename)
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

        # plot airsim path
        if self.airsim_path is not None:
            airsim_path_x = [point[0] for point in self.airsim_path]
            airsim_path_y = [-point[1] for point in self.airsim_path]  # y is negative in airsim
            airsim_path_z = [-point[2] for point in self.airsim_path]  # z is negative in airsim
            ax.plot(airsim_path_x, airsim_path_y, airsim_path_z,
                    marker='',
                    linewidth=1,
                    dashes=[6, 2],
                    color='blue',
                    label='Airsim')
            # label the points

        # plot cfd path
        cfd_path_x = [point[0] for point in self.cfd_path]
        cfd_path_y = [-point[1] for point in self.cfd_path]  # y is negative in airsim
        cfd_path_z = [-point[2] for point in self.cfd_path]  # z is negative in airsim
        # use different color for cfd path
        ax.plot(cfd_path_x, cfd_path_y, cfd_path_z,
                marker='',
                linewidth=1,
                color='red',
                zorder=20,
                label='RWDS')

        # # add wind vector on cfd path for each 2 points
        # for i in range(0, len(self.cfd_path), 1):
        #     q = plt.quiver(cfd_path_x[i], cfd_path_y[i], cfd_path_z[i],
        #                   self.wind_vector_list[i][0], self.wind_vector_list[i][1], self.wind_vector_list[i][2],
        #                   length=1, color='purple', normalize=False, arrow_length_ratio=0.3)
        # if q is not None:
        #     q.set_label('RWDS wind vector')

        # plot plan path
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

        # ax.legend(handlelength=2, fontsize=12)
        # ax.set_title(title)

        # Set the initial view perspective, top down view, focus on the (100, 50, 10) point
        ax.view_init(elev=horizontal_angle, azim=vertical_angle)

        # remove padding
        plt.tight_layout()

        # set image size
        fig.set_size_inches(7, 7)

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
        plot_name = "plot.png"
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


if __name__ == "__main__":
    # read actual position from csv

    report_dir_names = []
    # read all directories in report folder
    for root, dirs, files in os.walk("report"):
        for dir_name in dirs:
            report_dir_names.append(dir_name)

    tall_building_mesh_file_name = "foam_data/block/tallBuilding/threeBuildings_wo_ground.stl"
    chicago_mesh_file_name = "foam_data/chicago/UE_exported_chicago_small_slice.stl"
    two_buildings_mesh_file_name = "foam_data/block/twoB_takeoff/RQ3P1_wo_ground.stl"
    house_mesh_file_name = "foam_data/block/house/simpleHouse_wo_ground.stl"

    mesh_file_name = tall_building_mesh_file_name
    cfd_dir_name = "rq3_twoB_10_ds7_CONTINUOUS_CFD"
    # cfd_dir_name = report_dir_names[-5]
    airsim_dir_name = "rq3_twoB_10_ds7_AIRSIM"
    # airsim_dir_name = "2023-07-01_18-48-23_chicago_straight_takeoff_17_ds10_AIRSIM"
    # cfd_dir_name = "2023-07-01_18-46-57_chicago_straight_takeoff_17_ds10_CFD"
    # mesh_file_name = "foam_data/chicago/constant_wind/UE_exported_chicago_wo_ground_slice.stl"
    # airsim_dir_name = "2023-07-01_16-54-15_chicago_17_ds5_AIRSIM"
    # cfd_dir_name = "2023-07-01_16-54-15_chicago_17_ds5_CFD"
    airsim_path_filename = "report" + os.sep + airsim_dir_name + os.sep + "actual_path.csv"
    actual_path_filename = "report" + os.sep + cfd_dir_name + os.sep + "actual_path.csv"
    plan_path_filename = "report" + os.sep + cfd_dir_name + os.sep + "plan_path.csv"
    path_wind_vector_filename = "report" + os.sep + cfd_dir_name + os.sep + "path_wind_vector.csv"

    # # for shm comparison
    # plotter = PlotWithMesh(mesh_file_name=None,
    #                        trace_1_csv_filename=airsim_path_filename,
    #                        trace_2_csv_filename=actual_path_filename,
    #                        plan_path_csv_filename=plan_path_filename,
    #                        wind_vector_list_csv_filename=path_wind_vector_filename)
    # plotter.plot_3d_with_mesh(horizontal_angle=45,
    #                           vertical_angle=-45,
    #                           x_range=(-100, 100),
    #                           y_range=(-100, 100),
    #                           z_range=(0, 100),
    #                           x_density=5,
    #                           y_density=5,
    #                           z_density=5,
    #                           title=''
    #                           )

    # # for tall building
    # plotter = PlotWithMesh(mesh_file_name=mesh_file_name,
    #                        trace_1_csv_filename=None,
    #                        trace_2_csv_filename=actual_path_filename,
    #                        plan_path_csv_filename=plan_path_filename,
    #                        wind_vector_list_csv_filename=path_wind_vector_filename)
    # # title = "sUAS path comparison\nTall buildings +x 17m/s constant wind:
    # title = ""
    # # plotter.plot_3d_with_mesh(horizontal_angle=10,
    # #                           vertical_angle=45,
    # #                           x_range=(-40, 40),
    # #                           y_range=(-80, 0),
    # #                           z_range=(0, 60),
    # #                           x_density=0,
    # #                           y_density=5,
    # #                           z_density=5,
    # #                           title=title)
    #
    # plotter.plot_3d_with_mesh(horizontal_angle=90,
    #                           vertical_angle=-90,
    #                           x_range=(-30, 30),
    #                           y_range=(-90, 5),
    #                           z_range=(0, 90),
    #                           x_density=5,
    #                           y_density=5,
    #                           z_density=0,
    #                           title=title)

    # for chicago
    # plotter = PlotWithMesh(mesh_file_name=mesh_file_name,
    #                        airsim_csv_filename=None,
    #                        cfd_csv_filename=actual_path_filename,
    #                        plan_path_csv_filename=plan_path_filename,
    #                        wind_vector_list_csv_filename=path_wind_vector_filename)
    # title = "sUAS path comparison\nChicago +x 17m/s constant wind"
    # plotter.plot_3d_with_mesh(horizontal_angle=90,
    #                           vertical_angle=90,
    #                           x_range=(-90, 90),
    #                           y_range=(-90, 90),
    #                           z_range=(0, 90),
    #                           x_density=5,
    #                           y_density=5,
    #                           z_density=0,
    #                           title=title)
    #
    # plotter.plot_3d_with_mesh(horizontal_angle=25,
    #                           vertical_angle=80,
    #                           x_range=(-90, 90),
    #                           y_range=(-90, 90),
    #                           z_range=(0, 90),
    #                           x_density=5,
    #                           y_density=5,
    #                           z_density=5,
    #                           title=title)
    #
    # plotter.plot_3d_with_mesh(horizontal_angle=0,
    #                           vertical_angle=90,
    #                           x_range=(-25, 100),
    #                           y_range=(-25, 100),
    #                           z_range=(0, 100),
    #                           x_density=5,
    #                           y_density=0,
    #                           z_density=5,
    #                           title=title)

    # for straight takeoff
    plotter = PlotWithMesh(mesh_file_name=two_buildings_mesh_file_name,
                            trace_1_csv_filename=airsim_path_filename,
                            trace_2_csv_filename=actual_path_filename,
                            plan_path_csv_filename=plan_path_filename,
                            wind_vector_list_csv_filename=path_wind_vector_filename)

    #title = "sUAS path comparison\nChicago straight takeoff +x 17m/s constant wind"
    plotter.plot_3d_with_mesh(horizontal_angle=0,
                              vertical_angle=-90,
                              x_range=(-10, 10),
                              y_range=(-10, 10),
                              z_range=(0, 20),
                              x_density=3,
                              y_density=0,
                              z_density=3,
                              title='')

    # # for house inspection
    # plotter = PlotWithMesh(mesh_file_name=house_mesh_file_name,
    #                        trace_1_csv_filename=None,
    #                        trace_2_csv_filename=actual_path_filename,
    #                        plan_path_csv_filename=plan_path_filename,
    #                        wind_vector_list_csv_filename=path_wind_vector_filename)
    #
    # title = ''
    # plotter.plot_3d_with_mesh(horizontal_angle=20,
    #                           vertical_angle=70,
    #                           x_range=(-5, 40),
    #                           y_range=(-20, 20),
    #                           z_range=(0, 20),
    #                           x_density=3,
    #                           y_density=3,
    #                           z_density=3,
    #                           title=title)
