import matplotlib.pyplot as plt
import pandas as pd
from datetime import datetime


#timestamp = datetime.strptime("2022/12/10 15:20:20.209", "%Y/%m/%d %H:%M:%S.%f")

# Isolate the time in seconds from the datetime object
#seconds = timestamp.second

# Print the time in seconds to the screen
#print(seconds)

cpuCsv = "./data/cpu_data_5drones.csv"
gpuCsv = "./data/gpu_usage_5drones.csv"

gpuData = pd.read_csv(gpuCsv,encoding = "utf-16")
cpuData = pd.read_csv(cpuCsv,encoding = "utf-16")
#gpuData = pd.read_csv()
print(cpuData)
#print(gpuCsv)
#pyplot.plot(df["x"], df["y"])
for i in cpuData["time"]:
    print(i)
    i = datetime.strptime(i, "%m/%d/%Y %H:%M:%S.%f").second
plt.plot(cpuData["time"], cpuData["cpu_percentage"])

# Show the plot
plt.show()
