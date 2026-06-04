from PythonClient.multirotor.monitor.abstract.single_drone_mission_monitor import SingleDroneMissionMonitor


class BatteryMonitor(SingleDroneMissionMonitor):
    def __init__(self, mission, battery_capacity=100, min_battery_percentage=15):
        super().__init__(mission)
        self.battery_capacity = battery_capacity
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
            if charge < self.min_battery_percentage:
                self.passed = False
                self.append_fail_to_log(f"{self.target_drone};Battery is below {self.min_battery_percentage}%")

        self.stop()

    def stop(self):
        if self.passed:
            self.append_pass_to_log(f"{self.target_drone};Battery is always above {self.min_battery_percentage}%")
        else:
            self.append_fail_to_log(f"{self.target_drone};Battery was below {self.min_battery_percentage}%")
        self.save_report()

    def get_current_battery_percentage(self):
        rotor_states = self.client.getRotorStates(vehicle_name=self.target_drone).rotors
        if not rotor_states:
            return 100

        total_thrust = sum(rotor["thrust"] for rotor in rotor_states)
        estimated_draw = total_thrust * max(getattr(self.mission, "speed", 0), 1)
        return max(0, self.battery_capacity - estimated_draw)

