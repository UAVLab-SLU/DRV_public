# How to use

## System requirements
Windows 10 

Python 3.10

## Dev Set-up

### prepare the environment
Windows
```
python -m venv venv
venv\Scripts\activate.bat
pip install -r requirements.txt 
```

### Start the server
```
python ./PythonClient/server/simulation_server.py
```






## Run Monitors inside Docker
build the docker image
```
docker build -t airsim_server .
```

run the docker image
```
docker run -p 5000:5000 -v C:\Users\{USERNAME}\Documents\AirSim:/root/Documents/AirSim -it airsim-server
```
`-v` binds the host directory to the container directory, so that the container can access the files in the host directory.

`-p` exposes/binds the port 5000 of the container to the port 5000 of the host machine. So that UE game can find it using localhost:5000



now the server is running on port 5000, however inorder for simulation to work, 
you need to start the DroneWorld application.

# 2. Start DroneWorld application
DroneWorld application is a Unreal game that is used to simulate the drones.
Download the application from [here](https://github.com/UAVLab-SLU/DroneWorldGenerator/releases)


Monitoring scripts for airsim drones are in PythonClient\multirotor\monitor
Mission scripts for airsim drones are in PythonClient\multirotor\mission



