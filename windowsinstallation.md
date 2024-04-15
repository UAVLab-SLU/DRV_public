# DroneWorld Installation for Windows

## Unreal Engine Application
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
2. Run the "Blocks.exe" file

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
