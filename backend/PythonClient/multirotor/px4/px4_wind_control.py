import time

import PythonClient.multirotor.airsim_application

air_sim = PythonClient.multirotor.airsim_application.AirSimApplication()
for _ in range(100):
    air_sim.client.simPause(True)
    time.sleep(0.1)
    air_sim.client.simPause(False)
    time.sleep(0.1)

