# DroneReqValidator

DroneReqValidator (DRV) is a complete Drone simulation ecosystem that automatically generates realistic environments, monitors Drone activities against predefined safety parameters, and generates detailed acceptance test reports for effective debugging and analysis of Drone software applications. 

## Demo

- [Demo Video Available Here](https://www.youtube.com/watch?v=Fd9ft55gbO8)


## System requirement
- Windows 10/11
- Unreal engine 5.0 (optional)
- Python 3.10
- node.js
- npm


## Usage

DroneReqValidator has 3 main components:
1. Unreal application
2. Python backend
3. React frontend

To use the DroneReqValidator, follow these steps:


## 1. Unreal application
There are two ways to open the unreal application, editor mode and executable mode,
editor mode allows real time adjustment to the environment but requires unreal engine.
The executable mode does not require unreal engine. 
### Editor mode

you need to download the content and extract it to the game folder.

1. Download the "Content.rar" from 
https://sluedu-my.sharepoint.com/:f:/g/personal/ankit_agrawal_1_slu_edu/ElbD1q-O8fBFgGDqov6Mh5EBsJ90YyPj2fzsIznTP6AX-w?e=XZaPiX

using password: DroneWorld

2. Extract it to the project folder in `unreal_app/editor_mode`.
![img.png](img.png)

it contains all the large files that are not allowed to be uploaded to github.

If you do not download the patch, the unreal editor will not be able to load the project.

### Executable mode 
1. Download the "0.4.0.rar" from
https://sluedu-my.sharepoint.com/:f:/g/personal/ankit_agrawal_1_slu_edu/ElbD1q-O8fBFgGDqov6Mh5EBsJ90YyPj2fzsIznTP6AX-w?e=XZaPiX
2. Extract it
3. Run the "Blocks.exe" file


## 2. Python backend

To prepare the environment and start the Python backend, follow these steps:

1. Open the terminal and navigate to the project repository.

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
pip install -r requirements.txt
```

5. Start the server by running the following command:

```powershell
python ./PythonClient/server/simulation_server.py
```


GitHub Copilot: To make the section more professional, you can consider the following:

1. Use a clear and concise language that is easy to understand.
2. Provide more detailed instructions on how to prepare the environment and start the server.
3. Include any necessary command line arguments or configuration options.
4. Provide troubleshooting tips for common issues that users may encounter.

Here is an example of how you can improve the section:

## 2. Python backend

To prepare the environment and start the Python backend, follow these steps:

1. Open the terminal and navigate to the project repository.

2. Create a virtual environment by running the following command:

```
python -m venv venv
```

3. Activate the virtual environment by running the following command:

```
source venv/bin/activate
```

4. Install the necessary dependencies by running the following command:

```
pip install -r requirements.txt
```

5. Start the server by running the following command:

```
python ./PythonClient/server/simulation_server.py
```

This will start the Python backend server and allow it to communicate with the Unreal application.

Note that the server is running on port 5000, however, in order for simulation to work, you need to start the Unreal application first.




## 3. React frontend

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
