from PythonClient.multirotor.mission.abstract.scripted_mission import ScriptedMission


class RiverSearchAndRescue(ScriptedMission):
    def steps(self):
        yield "climb to 60 m", lambda: self.move(0, 0, 60)
        yield "turn counterclockwise 90 degrees", lambda: self.turn_counterclockwise(90)
        yield "move above river", lambda: self.move(0, -362, 60)
        yield "camera down 90 degrees", lambda: self.camera_down(90)
        yield "turn counterclockwise 10 degrees", lambda: self.turn_counterclockwise(10)
        yield "search river at reduced speed", lambda: self.move(276, -362, 60, self.speed / 2)
