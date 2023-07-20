import os
from matplotlib import pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
from PythonClient.multirotor.wind_control.plot_trace_wind import PlotWithMesh
class PlotTwoTrace:
    def __init__(self,
                 trace_1_file_path,
                 trace_2_file_path,
                 plan_path_csv_filename,
                 wind_vector_list_csv_filename):
        """

        :param trace_1_file_path:
        :param trace_2_file_path:
        :param plan_path_csv_filename:
        :param wind_vector_list_csv_filename:
        """

        trace_1_file = PlotWithMesh.read_list_from_csv(trace_1_file_path)
        trace_2_file = PlotWithMesh.read_list_from_csv(trace_2_file_path)
