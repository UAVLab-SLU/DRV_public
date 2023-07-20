import os
import time
from PythonClient.multirotor.wind_control.openfoam_csv_reader import FoamCSVReader

foam_data_root = "../foam_data/chicago/turb_wind/10ms50percent_flux"
init_filename = "10ms_0.csv"
init_file_path = os.path.join(foam_data_root, init_filename)
drone_position = [0, 0, 0]
number_of_files = 100


def simulate_continuous_read():
    # verify that the first file exists
    if not os.path.exists(init_file_path):
        print("File does not exist")
        return
    start = time.time()
    # read first file
    foam_reader = FoamCSVReader(foam_data_root, init_filename)
    file_count = 1
    average_query_time = 0
    for _ in range(number_of_files):
        single_query_start = time.time()
        speed_data = foam_reader.get_spacial_temporal_velocity_next_time_step(drone_position)
        file_count += 1
        query_time = time.time() - single_query_start
        average_query_time += query_time
        print("Time taken to query:", round(query_time, 4), "seconds", "wind speed at point " +
              str(drone_position) + " is " + str(speed_data))

    print("Preprocessing complete, total number of files preprocessed: " + str(file_count))
    print("Total time taken: " + str(time.time() - start) + " seconds")
    print("Average query time: " + str(average_query_time / number_of_files) + " seconds")


if __name__ == "__main__":
    simulate_continuous_read()

# Average query time: 0.5754936027526856 seconds
# during simulation, query time is slightly higher, around 0.7 seconds, but still acceptable
# this means that the preprocessing is successful, before preprocessing, the query time is around 2 seconds
# but this update time is still too slow, that's why we need PINN.
