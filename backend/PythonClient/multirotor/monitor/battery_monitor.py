from PythonClient.multirotor.monitor.abstract.single_drone_mission_monitor import SingleDroneMissionMonitor


class BatteryMonitor(SingleDroneMissionMonitor):
    def __init__(self, mission, min_battery_percentage=15):
        super().__init__(mission)
        self.min_battery_percentage = min_battery_percentage
        self.passed = True
        self.mission = mission
        self.target = mission.target_drone

    def start(self):
        self.append_info_to_log(f"{self.target_drone};speed {self.mission.speed} m/s with wind {self.wind_speed_text}")
        while self.mission.state == self.mission.IDLE:
            pass
        while self.mission.state != self.mission.END:
            charge = self.client.getTripStats().state_of_charge
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



