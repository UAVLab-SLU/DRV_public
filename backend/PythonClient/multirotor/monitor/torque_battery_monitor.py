import threading
from time import sleep

from PythonClient.multirotor.mission.fly_to_points import FlyToPoints
from PythonClient.multirotor.monitor.abstract.single_drone_mission_monitor import SingleDroneMissionMonitor


class TorqueBatteryMonitor(SingleDroneMissionMonitor):
    def __init__(self, mission, min_battery_percentage=15):
        super().__init__(mission)
        self.min_charge = 0
        self.min_battery_percentage = min_battery_percentage
        self.passed = True
        self.mission = mission
        self.target = mission.target_drone

    def start(self):
        self.append_info_to_log(f"{self.target_drone};speed {self.mission.speed} m/s with wind {self.wind_speed_text}")
        while self.mission.state == self.mission.State.IDLE:
            pass
        while self.mission.state != self.mission.State.END:
            charge = self.get_current_battery_percentage()
            self.min_charge = min(charge,self.min_charge)
            print("DEBUG: charge percentage", charge)
            if charge < self.min_battery_percentage:
                self.passed = False
                self.append_fail_to_log(f"{self.target_drone};Battery is below {self.min_battery_percentage}%")
            sleep(1)

        self.stop()

    def stop(self):
        if self.passed:
            self.append_pass_to_log(f"{self.target_drone};Battery is always above {self.min_battery_percentage}%,"
                                    f"minimum charge was {round(self.min_charge,2)}%")
        else:
            self.append_fail_to_log(f"{self.target_drone};Battery was below {self.min_battery_percentage}%")

    def get_current_battery_percentage(self):
        rotor = self.client.getRotorStates(vehicle_name=self.target_drone).rotors
        # {
        # 'rotors': [   {   'speed': 473.6607360839844,
        #                       'thrust': 2.0897228717803955,
        #                       'torque_scaler': -0.027781091630458832},
        #                   {   'speed': 473.6607360839844,
        #                       'thrust': 2.0897228717803955,
        #                       'torque_scaler': -0.027781091630458832},
        #                   {   'speed': 473.6607360839844,
        #                       'thrust': 2.0897228717803955,
        #                       'torque_scaler': 0.027781091630458832},
        #                   {   'speed': 473.6607360839844,
        #                       'thrust': 2.0897228717803955,
        #                       'torque_scaler': 0.027781091630458832}],
        #     'timestamp': 1679626200908687872
        # }
        battery_remaining = self.calculate_power(
            thrust_values=[rotor[i]["thrust"] for i in range(len(rotor))],
            speed=self.mission.speed,
            torque_values=[rotor[i]["torque_scaler"] for i in range(len(rotor))],
            angular_velocity=0,
            battery_capacity=1000,
            time_step=1
        )

        return battery_remaining/1000


    @staticmethod
    def calculate_power(thrust_values, speed, torque_values, angular_velocity, battery_capacity, time_step):
        # Calculate total thrust
        total_thrust = sum(thrust_values)

        # Calculate total torque
        total_torque = sum(torque_values)

        # Calculate power required to maintain altitude and drone speed
        power_altitude_speed = total_thrust * speed

        # Calculate power required to overcome torque
        power_torque = total_torque * angular_velocity

        # Calculate total power required by the drone
        total_power = power_altitude_speed + power_torque

        # Calculate battery remaining during the simulation
        battery_remaining = battery_capacity - (total_power * time_step)

        return battery_remaining

if __name__ == "__main__":
    mission = FlyToPoints(target_drone="Drone 1")
    monitor = TorqueBatteryMonitor(mission)
    mission_thread = threading.Thread(target=mission.start)
    monitor_thread = threading.Thread(target=monitor.start)
    mission_thread.start()
    monitor_thread.start()