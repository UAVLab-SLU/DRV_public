import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
from stl import mesh

# Drone path coordinates (x, y, z)
drone_path = [(0, 0, 0), (1, 1, 1), (2, 2, 2), (3, 3, 3)]

# Load the environment mesh from .stl file
env_mesh = mesh.Mesh.from_file('foam_data/block/blockEnv/extreamSimple.stl')

# Create a 3D plot
fig = plt.figure()
ax = fig.add_subplot(111, projection='3d')

# Plot drone path
drone_path_x = [point[0] for point in drone_path]
drone_path_y = [point[1] for point in drone_path]
drone_path_z = [point[2] for point in drone_path]
ax.plot(drone_path_x, drone_path_y, drone_path_z, marker='o')

# Plot environment mesh
mesh_collection = Poly3DCollection(env_mesh.vectors, alpha=0.1)
ax.add_collection3d(mesh_collection)

# Set labels and title
ax.set_xlabel('X')
ax.set_ylabel('Y')
ax.set_zlabel('Z')
ax.set_title('Drone Path with Environment Mesh')

# Set the initial view perspective
ax.view_init(elev=30, azim=-45)
# Set x, y, z ranges
ax.set_xlim(0, 100)
ax.set_ylim(-100, 160)
ax.set_zlim(0, 50)
# Display the plot
plt.show()
