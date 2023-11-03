# For research graph only, not for backend
# Load ulg file and export drone position(x, y, z) to csv file, same format as RWDS

import pyulog
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D


log_dir = "./report/gazebo"

filename_wo_ext = "gazebo10ms_x_wind_RQ3p2"
filename = filename_wo_ext + ".ulg"

log = pyulog.ULog(log_dir + "\\" + filename)

drone_pos = []
# print drone positions
for i in range(len(log.data_list)):
    print(i, log.data_list[i].name)
    if log.data_list[i].name == 'vehicle_local_position':
        x = log.data_list[i].data['x']
        # add 15 to x
        #x = [x[i] + 15 for i in range(len(x))]
        y = log.data_list[i].data['y']
        z = log.data_list[i].data['z']
        # verfiy the data length
        if not len(x) == len(y) == len(z):
            print("Error: data length mismatch!")
            length = min(len(x), len(y), len(z))
            x = x[:length]
            y = y[:length]
            z = z[:length]
            print("Data length has been changed to ", length)
        drone_pos = [[x[i], y[i], z[i]] for i in range(len(x))]
        break

# save to csv
import csv
with open(log_dir + "\\" + filename_wo_ext + ".csv", "w", newline='') as f:
    writer = csv.writer(f)
    writer.writerows(drone_pos)


