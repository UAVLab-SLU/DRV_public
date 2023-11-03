# This script is used to preprocess all the csv files in the folder
import os
import time
from PythonClient.multirotor.wind_control.openfoam_csv_reader import FoamCSVReader

foam_data_root = "../foam_data/block/twoB_takeoff/low_res"
init_filename = "lowres_0.csv"
init_file_path = os.path.join(foam_data_root, init_filename)


def preprocess_all():
    # verify that the first file exists
    if not os.path.exists(init_file_path):
        print("File does not exist")
        return
    start = time.time()
    # preprocess the first file
    foam_reader = FoamCSVReader(foam_data_root, init_filename)
    foam_reader.preprocess_and_replace()
    file_count = 1
    while foam_reader.load_next_df() is not None:
        foam_reader.preprocess_and_replace()
        file_count += 1
        print("Preprocessed: " + foam_reader.csv_filename)

    print("Preprocessing complete, total number of files preprocessed: " + str(file_count))
    print("Total time taken: " + str(time.time() - start) + " seconds")


if __name__ == "__main__":
    preprocess_all()

# Results:
# total file size before preprocessing: ~10 GB
# total file size after preprocessing: ~3 GB

# expected output:
# Preprocessed: 10ms_98.csv
# read csv to memory time: 0.7993650436401367
# preprocess time: 2.406564474105835
# read csv to memory time: 2.6050822734832764
# Preprocessed: 10ms_99.csv
# CSV file for next time step does not exist.
# Preprocessing complete, total number of files preprocessed: 100
# Total time taken: 503.29718136787415 seconds


# for turbulent wind chicago data
# Preprocessing complete, total number of files preprocessed: 50
# Total time taken: 733.5744028091431 seconds
