from dbm import _Database
import pymongo
#given airsim api

class Databse:

  def __init__(self):
    self.client = pymongo.MongoClient()
    self.db = self.client.airsim_db
    
    self.db.defaults.create_index('name', unique=True)
    self.db.reports.create_index('dates')

  def set_default(self, name, value):
    self.db.defaults.update_one({'name': name}, {'$set': {'value': value}}, upsert=True)
# Get drone status
def get_drone_status(self, name):

  # to get drone state
  drone = self.client.getMultirotorState(vehicle_name=name)
  
  status = drone.collision.has_collided

  self.db.drones.update_one({'name': name}, {'$set': {'status': status}})

# Set drone speed
def set_drone_speed(self, name, speed):

  #  set speed 
  self.client.moveByVelocityAsync(speed, 0, 0, duration=5, vehicle_name=name)
  
  self.db.drones.update_one({'name': name}, {'$set': {'speed': speed}})

# Query drones collection
for drone in self.db.drones.find():
  print(drone['name'], drone['status'], drone['speed'])

