import pymongo
from pymongo import MongoClient 


##stores default based on Environment configuration

# Connect to MongoDB 
client = MongoClient('mongodb://localhost:27017/')
db = client['simulation_config']

# Default configuration
default_config = {
  "wind": {
    "direction": "N",
    "speed": 10
  },
  "origin": {
    "lat": 41.980381, 
    "lon": -87.934524,
    "height": 200
  },
  "timeOfDay": "10:00:00",
  "useGeo": True,
  "enableFuzzy": False
}

# Insert default config
default_collection = db['default_config']
default_id = default_collection.insert_one(default_config).inserted_id

print(f"Added default config with ID: {default_id}")

# Get default config
default_doc = default_collection.find_one({"_id": default_id})

print(f"Default config: {default_doc}")

# Update default config
updated_config = {
  "wind": {
    "direction": "NW",
    "speed": 15 
  }  
}

result = default_collection.update_one({"_id": default_id}, {"$set": updated_config})

print(f"{result.matched_count} document(s) matched the filter")  
print(f"{result.modified_count} document(s) was/were updated")

# Verify update
updated_doc = default_collection.find_one({"_id": default_id})

print(f"Updated default config: {updated_doc}")