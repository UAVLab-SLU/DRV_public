# prints the position of the multirotor every second

from PythonClient import airsim
import time
import threading

client = airsim.MultirotorClient()
client.confirmConnection()


def print_position():
    while True:
        position = client.getMultirotorState().kinematics_estimated.position
        print("x={}, y={}, z={}".format(position.x_val, position.y_val, position.z_val))
        time.sleep(1)


print_position()
