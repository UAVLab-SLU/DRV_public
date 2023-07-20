import matplotlib.pyplot as plt

# Make sure you have the data on CPU usage and time
cpu_usage = [50, 60, 70, 80, 90, 100]
time = [0, 1, 2, 3, 4, 5]

# Create the plot
plt.plot(time, cpu_usage)

# Add labels and title
plt.xlabel('Time (s)')
plt.ylabel('CPU Usage (%)')
plt.title('CPU Usage over Time')

# Show the plot
plt.show()