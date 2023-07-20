from PythonClient.multirotor.mission.fly_to_points import FlyToPoints
from PythonClient.multirotor.wind_control.airsim_wind_controller import AirSimWindController
import threading


class BlockSShape(FlyToPoints):
    """
    !!! Only designed for one drone and only for the block environment. !!!
    This mission is to fly in an S-shaped path that travels to the left of the origin
    around 3 boxes and returns to the origin by the same path.
    """

    def __init__(self, target_drone="Drone 1", speed=4):
        self.points = [
            [0, 0, -10],
            [0, -80, -10],
            [55, -80, -10],
            [55, -35, -10],
            [100, -35, -10],
            [100, -80, -10],
            [100, -35, -10],
            [55, -35, -10],
            [55, -80, -10],
            [0, -80, -10],
            [0, 0, -10]
        ]

        super().__init__(target_drone, speed, self.points)
        self.report_dir += 'BlockSShape'


if __name__ == "__main__":
    wind_controller = AirSimWindController(openfoam_data_root="foam_data/block/test_blockEnv")
    mission = BlockSShape()
    from PythonClient import airsim

    wind_vector = airsim.Vector3r(17, 0, 0)
    mission.client.simSetWind(wind_vector)
    mission.start()
