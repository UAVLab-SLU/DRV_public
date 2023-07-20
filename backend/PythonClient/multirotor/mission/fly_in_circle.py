import PythonClient.airsim as airsim
import math
import time
from PythonClient.multirotor.mission.abstract.abstract_mission import GenericMission


class FlyInCircle(GenericMission):
    """
    Fly in a circle in the diameter of the radius parameter.
    """

    def __init__(self, target_drone="Default", radius=15, altitude=30, speed=6, iterations=1, center=(1, 0)):
        """
        Default constructor.
        :param target_drone: "Default"
        :param radius: 5 radius of the circle
        :param altitude: 10 altitude of the circle
        :param speed: 2 speed of the drone
        :param iterations: 1 number of times to repeat the circle
        :param center: (1,0) center of the circle relative to the drone
        """
        super().__init__(target_drone)
        self.climbed = False
        self.previous_diff = None
        self.previous_sign = None
        self.quarter = None
        self.previous_angle = None
        self.start_angle = None
        self.state = self.State.IDLE
        self.target = target_drone
        self.radius = radius
        self.altitude = altitude
        self.speed = speed
        self.iterations = iterations
        self.snapshots = 0
        self.snapshot_delta = None
        self.next_snapshot = None
        self.z = None
        self.snapshot_index = 0
        self.takeoff = False  # whether we did a take-off

        if self.snapshots is not None and self.snapshots > 0:
            self.snapshot_delta = 360 / self.snapshots

        if self.iterations <= 0:
            self.iterations = 1

        if len(center) != 2:
            raise Exception("Expecting '[x,y]' for the center direction vector")

        # center is just a direction vector, so normalize it to compute the actual circle_center_x,circle_center_y locations.
        circle_center_x = float(center[0])
        circle_center_y = float(center[1])
        length = math.sqrt((circle_center_x * circle_center_x) + (circle_center_y * circle_center_y))
        circle_center_x /= length
        circle_center_y /= length
        circle_center_x *= self.radius
        circle_center_y *= self.radius
        self.original_position = self.client.getMultirotorState(vehicle_name=self.target_drone).kinematics_estimated.position
        self.center = self.original_position
        self.center.x_val += circle_center_x
        self.center.y_val += circle_center_y

    def start(self):
        self.state = "running"
        start_time = time.localtime()
        # self.client.takeoffAsync().join()
        start = self.client.getMultirotorState(vehicle_name=self.target_drone).kinematics_estimated.position
        z = -self.altitude

        self.append_info_to_log(
            self.target_drone + ";climbing to position: {},{},{}".format(round(start.x_val, 2), round(start.y_val, 2),
                                                                         round(z, 2)))
        self.original_position = self.client.getMultirotorState(vehicle_name=self.target_drone).kinematics_estimated.position
        self.client.moveToPositionAsync(start.x_val, start.y_val, z, self.speed, vehicle_name=self.target_drone).join()
        self.climbed = True
        self.z = z

        self.append_info_to_log(self.target_drone + ";ramping up to speed...")
        count = 0
        # self.next_snapshot = None

        # ramp up time
        # ramp_time = self.radius / 10
        # start_time = time.time()

        while count < self.iterations:
            # if self.snapshots > 0 and not (self.snapshot_index < self.snapshots):
            #     break
            # # ramp up to full speed in smooth increments, so we don't start too aggressively.
            # now = time.time()
            # speed = self.speed
            # diff = now - start_time
            # if diff < ramp_time:
            #     speed = self.speed * diff / ramp_time
            # elif ramp_time > 0:
            #     self.append_info_to_log(self.target_drone + ";reached full speed...")
            #     ramp_time = 0

            lookahead_angle = self.speed / self.radius

            # compute current angle
            pos = self.client.getMultirotorState(vehicle_name=self.target_drone).kinematics_estimated.position
            dx = pos.x_val - self.center.x_val
            dy = pos.y_val - self.center.y_val
            # actual_radius = math.sqrt((dx * dx) + (dy * dy))
            angle_to_center = math.atan2(dy, dx)

            camera_heading = (angle_to_center - math.pi) * 180 / math.pi

            # compute lookahead
            lookahead_x = self.center.x_val + self.radius * math.cos(angle_to_center + lookahead_angle)
            lookahead_y = self.center.y_val + self.radius * math.sin(angle_to_center + lookahead_angle)

            vx = lookahead_x - pos.x_val
            vy = lookahead_y - pos.y_val

            if self.track_orbits(angle_to_center * 180 / math.pi):
                count += 1
                self.append_info_to_log(self.target_drone + ";completed {} orbits".format(count))

            # self.camera_heading = camera_heading
            self.client.moveByVelocityZAsync(vx, vy, z, duration=0.1,
                                             yaw_mode=airsim.YawMode(False, camera_heading),
                                             vehicle_name=self.target_drone).join()

        # self.client.moveToPositionAsync(start.x_val, start.y_val, z, 2).join()

        self.state = self.State.END
        end_time = time.localtime()
        # get total flight time in seconds
        self.flight_time_in_seconds = round(time.mktime(end_time) - time.mktime(start_time), 2)
        self.append_info_to_log(self.target_drone + ";Task finished")
        self.save_report()

    def track_orbits(self, angle):
        # tracking # of completed orbits is surprisingly tricky to get right in order to handle random wobbles
        # about the starting point.  So we watch for complete 1/2 orbits to avoid that problem.
        if angle < 0:
            angle += 360

        if self.start_angle is None:
            self.start_angle = angle
            # if self.snapshot_delta:
            #     next_snapshot = angle + self.snapshot_delta
            return False

        # now we just have to watch for a smooth crossing from negative diff to positive diff
        if self.previous_angle is None:
            self.previous_angle = angle
            return False

            # ignore the click over from 360 back to 0
        if self.previous_angle > 350 and angle < 10:
            if self.snapshot_delta and self.next_snapshot >= 360:
                self.next_snapshot -= 360
            return False

        # diff = self.previous_angle - angle
        crossing = False
        self.previous_angle = angle

        # if self.snapshot_delta and angle > self.next_snapshot:
        #     print("Taking snapshot at angle {}".format(angle))
        #     self.take_snapshot()
        #     self.next_snapshot += self.snapshot_delta

        diff = abs(angle - self.start_angle)
        if diff > 45:
            self.quarter = True

        if self.quarter and self.previous_diff is not None and diff != self.previous_diff:
            # watch direction this diff is moving if it switches from shrinking to growing
            # then we passed the starting point.
            direction = self.sign(self.previous_diff - diff)
            if self.previous_sign is None:
                self.previous_sign = direction
            elif self.previous_sign > 0 > direction:
                if diff < 45:
                    self.quarter = False
                    if self.snapshots <= self.snapshot_index + 1:
                        crossing = True
            self.previous_sign = direction
        self.previous_diff = diff

        return crossing

    def take_snapshot(self):
        pass
        # # first hold our current position so drone doesn't try and keep flying while we take the picture.
        # pos = self.client.getMultirotorState().kinematics_estimated.position
        # self.client.moveToPositionAsync(pos.x_val, pos.y_val, self.z, 0.5, 10, airsim.DrivetrainType.MaxDegreeOfFreedom,
        #                                 airsim.YawMode(False, self.camera_heading)).join()
        # responses = self.client.simGetImages(
        #     [airsim.ImageRequest(1, airsim.ImageType.Scene)])  # scene vision image in png format
        # response = responses[0]
        # filename = "photo_" + str(self.snapshot_index)
        # self.snapshot_index += 1
        # airsim.write_file(os.path.normpath(filename + '.png'), response.image_data_uint8)
        # print("Saved snapshot: {}".format(filename))
        # self.start_time = time.time()  # cause smooth ramp up to happen again after photo is taken.

    @staticmethod
    def sign(s):
        if s < 0:
            return -1
        return 1


if __name__ == "__main__":
    mission = FlyInCircle()
    mission.start()
