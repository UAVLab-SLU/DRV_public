import threading

from time import sleep

from PythonClient.multirotor.mission.fly_straight import FlyStraight
from PythonClient.multirotor.monitor.abstract.single_drone_mission_monitor import SingleDroneMissionMonitor


class CollisionMonitor(SingleDroneMissionMonitor):

    def __init__(self, mission):
        super().__init__(mission)

    def start(self):
        self.append_info_to_log(f"{self.target_drone};CollisionMonitor started")
        prev_collision = None
        time_interval = 3.0
        collided = False
        while self.mission.state != self.mission.State.END:
            collision_info = self.client.simGetCollisionInfo(self.target_drone)
            if collision_info.has_collided:
                if prev_collision is None or prev_collision != collision_info.object_name:
                    collision_abs_location = self.client.simGetObjectPose(object_name=self.target_drone).position
                    self.append_fail_to_log(
                        f"{self.target_drone};collided with {collision_info.object_name} at absolute position"
                        f"x = {collision_abs_location.x_val} meters, "
                        f"y = {collision_abs_location.y_val} meters, "
                        f"z = {collision_abs_location.z_val} meters]")
                    collided = True
                    self.save_image(collision_info.object_name)
                    prev_collision = collision_info.object_name
            sleep(time_interval)
        if not collided:
            self.append_pass_to_log(f"{self.target_drone};No collision detected")
        else:
            self.append_fail_to_log(f"{self.target_drone};Collision detected")
        self.save_report()

    def save_image(self, collision_object):
        # # will revisit, currently causing issue
        pass

        # requests = [airsim.ImageRequest("0", airsim.ImageType.DepthVis),  # depth visualization image
        #             airsim.ImageRequest("1", airsim.ImageType.DepthPerspective, True),
        #             # depth in perspective projection
        #             airsim.ImageRequest("1", airsim.ImageType.Scene),  # scene vision image in png format
        #             airsim.ImageRequest("1", airsim.ImageType.Scene, False,
        #                                 False)]  # scene vision image in uncompressed RGBA array
        # client = airsim.MultirotorClient()
        # responses = client.simGetImages(requests, vehicle_name=self.target_drone)
        #
        # graph_dir = self.get_graph_dir()
        # print("Saving images to %s" % graph_dir)
        # if not os.path.exists(graph_dir):
        #     os.makedirs(graph_dir)
        # for idx, response in enumerate(responses):
        #     filename = os.path.join(graph_dir, str(idx))
        #     if response.pixels_as_float:
        #         airsim.write_pfm(os.path.normpath(filename + collision_object + '.pfm'), airsim.get_pfm_array(response))
        #     else:
        #         airsim.write_file(os.path.normpath(filename + collision_object + '.png'), response.image_data_uint8)


if __name__ == "__main__":
    drone_speed = 14
    point = [10, 10, -0.5]
    mission = FlyStraight(destination=point, speed=drone_speed)
    monitor = CollisionMonitor(mission)
    thread1 = threading.Thread(target=mission.start)
    thread2 = threading.Thread(target=monitor.start)
    thread1.start()
    thread2.start()
