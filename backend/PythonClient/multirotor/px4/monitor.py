from PythonClient import airsim

client = airsim.MultirotorClient()
client.confirmConnection()
print(client.getMultirotorState(vehicle_name="Drone 1"))