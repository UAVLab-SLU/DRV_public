# PX4 equavalent of Fly_to_points.py
from PythonClient.multirotor.px4.abstract.px4_airsim_application import PX4AirSimApplication
import asyncio
from mavsdk import System
from mavsdk.offboard import (OffboardError, PositionNedYaw)


class Fly_to_points(PX4AirSimApplication):

    def __init__(self):
        super().__init__()
        self.drone = None

    def connect(self):
        self.drone = System(mavsdk_server_address="127.0.0.1", port=50051)
        await self.drone.connect(system_address="tcp://127.0.0.1:14580")
        print("Waiting for drone to connect...")
        async for state in self.drone.core.connection_state():
            if state.is_connected:
                print(f"-- Connected to drone!")
                break

    def start(self):
        # arm and fly to points
        print("-- Arming")
        await self.drone.action.arm()

        print("-- Setting initial setpoint")
        await self.drone.offboard.set_position_ned(PositionNedYaw(0.0, 0.0, 0.0, 0.0))

        print("-- Starting offboard")
        try:
            await self.drone.offboard.start()
        except OffboardError as error:
            print(f"Starting offboard mode failed \
                    with error code: {error._result.result}")
            print("-- Disarming")
            await self.drone.action.disarm()
            return

        print("-- Takeoff: Go 0m North, 0m East, -10m Down \
                within local coordinate system")
        await self.drone.offboard.set_position_ned(
            PositionNedYaw(0.0, 0.0, -10.0, 0.0))
        await asyncio.sleep(10)

        print("-- Go 0m North, 85m East, -10m Down \
                within local coordinate system, turn to face East")
        await self.drone.offboard.set_position_ned(
            PositionNedYaw(0.0, 85.0, -10.0, 0))
        await asyncio.sleep(10)

    def get_ned(self):
        # get current position
        return self.drone.telemetry.position()
