import os
import time
from PythonClient.multirotor.wind_control.openfoam_csv_reader import FoamCSVReader
foam_data_root = "../foam_data/chicago/constant_wind"
init_filename = "10ms_30.csv"

drone_position = [1, 1, 0]


reader = FoamCSVReader(foam_data_root, init_filename)
reader.populate_missing_points_in_sorted_df()
reader.validate_data()

