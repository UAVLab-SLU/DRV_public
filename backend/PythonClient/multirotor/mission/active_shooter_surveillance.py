from PythonClient.multirotor.mission.abstract.scripted_mission import ScriptedMission


class ActiveShooterSurveillance(ScriptedMission):
    def steps(self):
        yield "camera at horizon", lambda: self.camera_down(0)
        yield "climb to 100 m", lambda: self.move(0, 0, 100)
        yield "back up with heading fixed", lambda: self.move(-140, 0, 100)
        yield "camera down 45 degrees", lambda: self.camera_down(45)
        yield "hold position", self.hover
        yield "observe for 30 seconds", lambda: self._cancelled.wait(30)
