# single file query time speed test

import time
from PythonClient.multirotor.wind_control.openfoam_csv_reader import FoamCSVReader

foam_data_root = "../foam_data/chicago/constant_wind"
filename = "17ms_50s.csv"
foam_reader = FoamCSVReader(foam_data_root, filename)

# foam_reader.save_df_to_csv("10ms_1_preprocessed.csv")

load_start = time.time()
point = [60, 0, 50]
print("wind speed at point " + str(point) + " is " + str(foam_reader.get_spacial_temporal_velocity(point)))
print("Time taken to query:", time.time() - load_start, "seconds")
#
# print("preprocessed version")
# preprocess_foam_reader = FoamCSVReader(foam_data_root, "10ms_1_preprocessed.csv")
# load_start = time.time()
# print("wind speed at point " + str(point) + " is " + str(
#     preprocess_foam_reader.get_spacial_temporal_velocity(point)))
# print("Time taken to query:", time.time() - load_start, "seconds")

# foam_reader.validate_data()
