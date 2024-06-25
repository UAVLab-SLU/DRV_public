# DroneReqValidator

DroneReqValidator (DRV) is a complete Drone simulation ecosystem that automatically generates realistic environments, monitors Drone activities against predefined safety parameters, and generates detailed acceptance test reports for effective debugging and analysis of Drone software applications. 

# DroneWis

DroneWis is a CFD-based wind simulation component that is integrated with DroneReqValidator. It is used to automatically simulate the wind flow in the environment.

## DRV + DroneWis

Instruction for ASE 2024 reviewers:

Use the docker compose.yaml file to run the complete system. 
```bash
docker-compose up
```
Then download DRV_1.0.0 from the [link](https://sluedu-my.sharepoint.com/:f:/g/personal/ankit_agrawal_1_slu_edu/ElbD1q-O8fBFgGDqov6Mh5EBsJ90YyPj2fzsIznTP6AX-w?e=XZaPiX)

Unzip and run the Blocks.exe file to start the simulation.

now you can interface the ecosystem using the UI at http://localhost:3000


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
#### [Windows](docs/windowsinstallation.md)
#### [macOS](docs/macinstallation.md)

## Citation

If you use this project in your research, please cite our paper:
1. **DroneReqValidator: Facilitating High Fidelity Simulation Testing for Uncrewed Aerial Systems Developers** 
```bibtex
@inproceedings{zhang2023dronereqvalidator, title={DroneReqValidator: Facilitating High Fidelity Simulation Testing for Uncrewed Aerial Systems Developers}, 
author={Zhang, Bohan and Shivalingaiah, Yashaswini and Agrawal, Ankit}, 
booktitle={2023 38th IEEE/ACM International Conference on Automated Software Engineering (ASE)}, 
pages={2082--2085}, year={2023},
 organization={IEEE} }
```

2. **A Requirements-Driven Platform for Validating Field Operations of Small Uncrewed Aerial Vehicles** 

```bibtex
@inproceedings{agrawal2023requirements,
          title={A Requirements-Driven Platform for Validating Field Operations of Small Uncrewed Aerial Vehicles},
          author={Agrawal, Ankit and Zhang, Bohan and Shivalingaiah, Yashaswini and Vierhauser, Michael and Cleland-Huang, Jane},
          booktitle={2023 IEEE 31st International Requirements Engineering Conference (RE)},
          pages={29--40},
          year={2023},
          organization={IEEE}
        }
```

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
