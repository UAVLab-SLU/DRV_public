# DroneWorld Installation for Windows

## Unreal Engine Application



## Python Backend

To prepare the environment and start the Python backend, follow these steps:

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
source venv/Scripts/activate
```

4. Install the necessary dependencies by running the following command:

```powershell
pip install -r requirements.txt
```

5. Start the server by running the following command:

```powershell
python ./PythonClient/server/simulation_server.py
```

This will start the Python backend server and allow it to communicate with the Unreal application.

## React frontend

1. Open the terminal and navigate to the "frontend" folder in the project repository by running the following command:
``` powershell
cd frontend
```
2. Install the necessary dependencies by running the following command:

``` powershell
npm install --force
```
3. Start the frontend server by running the following command:

```powershell
npm run start
```
This will start the frontend server and allow you to access the user interface in your web browser.
