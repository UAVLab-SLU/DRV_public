# DroneReqValidator

DroneReqValidator (DRV) is a complete Drone simulation ecosystem that automatically generates realistic environments, monitors Drone activities against predefined safety parameters, and generates detailed acceptance test reports for effective debugging and analysis of Drone software applications. 

## Running Docker for frontend alone

Front end is build in React JS framework where it have its on wn docker file that builds on node:lts-buster base image. following are the commands to build and run the docker image.

```{shell}
# assuming you are the root directory of project
cd frontend

# now you have chnaged the directory to frontend and run below command to build image
docker build -t drv-frontend:latest .

# run below commmand to run image
docker run -p 3000:3000 drv-frontend:latest
```

NOTE: Please install docker daemon before running the above commands and post the run dont close the terminal as it keeps the image up and shows you the logs, if you want to run the image in background please use following run command.

```{shell}
# run below command to run the image in detached mode
docker run -d -p 3000:3000 drv-frontend:latest
```

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

To use the DroneReqValidator, follow the steps based on which OS you are working with:
#### [Windows](windowsinstallation.md)
#### [macOS](macinstallation.md)

## Contributing

We welcome contributions to this project. To contribute, please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them with a descriptive message.
4. Push your changes to your fork.
5. Submit a pull request to the main repository.
6. We will review your changes and merge them if they align with the project's goals.

## License
This project is licensed under the MIT  license. See the LICENSE file for more information.
