# How to use

## System requirements
Windows 10 

Python 3.10
## prepare the environment
```
python -m venv venv
pip install -r requirements.txt 
```

## Start the server
```
python ./PythonClient/server/simulation_server.py
```

now the server is running on port 5000, however inorder for simulation to work, 
you need to start the DroneWorld application.

# 2. Start DroneWorld application
DroneWorld application is a Unreal game that is used to simulate the drones.
Download the application from [here](https://github.com/UAVLab-SLU/DroneWorldGenerator/releases)


Monitoring scripts for airsim drones are in PythonClient\multirotor\monitor
Mission scripts for airsim drones are in PythonClient\multirotor\mission