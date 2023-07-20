# One main monitor that fetches the data for multi-monitor performance
from PythonClient.multirotor.airsim_application import AirSimApplication


class MonitorDataDistributor(AirSimApplication):
	def __init__(self,):
		super().__init__()
		self.alive = True

	def update(self):
		pass


if __name__ == "__main__":
	pass
