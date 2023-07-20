from time import sleep
from time import time
import numpy as np
from PythonClient.multirotor.monitor.abstract.globa_monitor import GlobalMonitor


class MinSepDistMonitor(GlobalMonitor):
    def __init__(self, horizontal=1, lateral=0):
        super().__init__()
        self.violation_flag = False
        self.run = True
        self.lateral_distances = []
        self.horizontal_distance = []
        self.drone_name_table = []
        self.drone_number = len(self.all_drone_names)
        self.min_lateral_separation_distance = lateral
        self.min_horizontal_separation_distance = horizontal
        self.drone_positions = []
        self.start_time = None
        self.dt = 1

    def start(self):
        self.append_info_to_log(f"{self.all_drone_names}"
                                f";MinSepDistMonitor started, "
                                f"checking breach of lateral: {self.min_lateral_separation_distance} meters, "
                                f"horizontal : {self.min_horizontal_separation_distance} meters, "
                                f"for every {self.dt} seconds")
        self.start_time = time()
        self.create_drone_name_list()
        while self.run:
            self.drone_positions = self.get_drone_positions()
            self.horizontal_distance = self.get_horizontal_distance()
            self.lateral_distances = self.get_lateral_distance()
            self.check_breaches()
            sleep(self.dt)
        if self.violation_flag:
            self.append_fail_to_log(f"{self.all_drone_names};The minimum separation distance was breached")
        else:
            self.append_pass_to_log(f"{self.all_drone_names};The minimum separation distance was not breached")
        self.save_report()

    def stop(self):
        self.run = False

    def get_drone_positions(self):
        return [self.client.simGetObjectPose(i).position for i in self.all_drone_names]

    def get_horizontal_distance(self):
        # Create a matrix of horizontal distances between all the drones and the target drone named
        return np.array([[((self.drone_positions[i].x_val - self.drone_positions[j].x_val) ** 2 +
                           (self.drone_positions[i].y_val - self.drone_positions[j].y_val) ** 2) ** 0.5 for j in
                          range(self.drone_number)] for i in range(self.drone_number)])

    def get_lateral_distance(self):
        # Create a matrix of lateral distances between all the drones
        return np.array(
            [[abs(self.drone_positions[i].z_val - self.drone_positions[j].z_val) for j in range(self.drone_number)] for
             i in range(self.drone_number)])

    def check_breaches(self):
        # Check if any horizontal distance is less than the minimum horizontal separation distance
        if self.min_horizontal_separation_distance > 0 and np.any(
                self.horizontal_distance < self.min_horizontal_separation_distance):
            # Get the indices of drones that are breaching the minimum horizontal separation distance
            breaching_indices = np.where(self.horizontal_distance < self.min_horizontal_separation_distance)
            # print("Drones breaching the minimum horizontal separation distance:")
            for i in range(len(breaching_indices[0])):
                # skip when comparing with itself
                if breaching_indices[0][i] + 1 != breaching_indices[1][i] + 1:
                    self.violation_flag = True
                    self.append_fail_to_log(
                        f"{self.drone_name_table[breaching_indices[0][i]]} and "
                        f"{self.drone_name_table[breaching_indices[1][i]]};"
                        f"Horizontal breach at {round(time()-self.start_time)} seconds in the mission: "
                        f"current horizontal distance: "
                        f"{round(self.horizontal_distance[breaching_indices[0][i]][breaching_indices[1][i]],2)} meters")
            # take appropriate action
        # Check if any lateral distance is less than the minimum lateral separation distance
        # if self.min_lateral_separation_distance > 0 and np.any(
        #         self.lateral_distances < self.min_lateral_separation_distance):
        #     # Get the indices of drones that are breaching the minimum lateral separation distance
        #     breaching_indices = np.where(self.lateral_distances < self.min_lateral_separation_distance)
        #
        #     for i in range(len(breaching_indices[0])):
        #         if breaching_indices[0][i] + 1 != breaching_indices[1][i] + 1:
        #             self.violation_flag = True
        #             self.append_fail_to_log(
        #                 f"{self.current_time_string}: "
        #                 f"{self.drone_name_table[breaching_indices[0][i]]} and "
        #                 f"{self.drone_name_table[breaching_indices[1][i]]}; Lateral breach: "
        #                 f"current lateral distance: { round(self.lateral_distances[breaching_indices[0][i]][breaching_indices[1][i]],2)} meters")
            # take appropriate action
        # else:
        #     print("Drones are not breaching the minimum separation distance.")

    def create_drone_name_list(self):
        for i in self.all_drone_names:
            self.drone_name_table.append(i)
