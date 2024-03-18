# DroneWorld Installation for macOS

## Unreal Engine Application

Unfortuantely, Unreal Engine is not compatable with macOS.

## Backend

To prepare the environment and start the backend, follow these steps:

1. Open the terminal and navigate to the project repository.
```powershell
cd backend 
```

2. Create a virtual environment by running the following command:

```powershell
python -m venv venv
```

3. Activate the virtual environment by running the following command:

```powershell
source venv/bin/activate
```

4. Install the necessary dependencies by running the following command:

```powershell
pip3 install -r requirements.txt
```

5. Start the server by running the following command:

```powershell
python ./PythonClient/server/simulation_server.py
```

This will start the backend server and allow it to communicate with the Unreal application.

## Frontend

1. Open the terminal and navigate to the "frontend" folder in the project repository by running the following command:
``` powershell
cd frontend
```
2. Install the necessary dependencies by running the following command:

``` powershell
npm install
```
3. Start the frontend server by running the following command:

```powershell
npm run start
```
This will start the frontend server and allow you to access the user interface in your web browser.

## Manual AirSim Folder Input

Follow these steps to manually create an AirSim folder in your Documents folder, which is required for testing the report-dashboard and landing page:

1. **Open Finder (macOS):** Navigate to your file management application.

2. **Locate Your Documents Folder:** Navigate to your Documents folder.

3. **Create the AirSim Folder:** Once you are in the Documents folder, right-click on an empty space and select "New" > "Folder." Name the folder "AirSim."



