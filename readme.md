# DroneReqValidator
The DroneReqValidator (DRV) contains three components, the unreal application, the python backend and the react frontend.

start each component in the following order:
1. Unreal application
2. Python backend
3. React frontend

## System requirement
- Windows 10/11
- Unreal engine 5.0 (optional)
- Python 3.10
- node.js
- npm


# 1. Unreal application
There are two ways to open the unreal application, editor mode and executable mode,
editor mode allows real time adjustment to the environment but requires unreal engine.
The executable mode does not require unreal engine. 
## Editor mode

you need to download the content and extract it to the game folder.

1. Download the "Content.rar" from 
https://sluedu-my.sharepoint.com/:f:/g/personal/ankit_agrawal_1_slu_edu/ElbD1q-O8fBFgGDqov6Mh5EBsJ90YyPj2fzsIznTP6AX-w?e=XZaPiX

using password: DroneWorld

2. Extract it to the project folder in `unreal_app/editor_mode`.
![img.png](img.png)

it contains all the large files that are not allowed to be uploaded to github.

If you do not download the patch, the unreal editor will not be able to load the project.

## Executable mode 
1. Download the "0.4.0.rar" from
https://sluedu-my.sharepoint.com/:f:/g/personal/ankit_agrawal_1_slu_edu/ElbD1q-O8fBFgGDqov6Mh5EBsJ90YyPj2fzsIznTP6AX-w?e=XZaPiX
2. Extract it
3. Run the "Blocks.exe" file


# 2. Python backend
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


# 3. React frontend


```powershell
cd frontend
npm install
npm run start
```