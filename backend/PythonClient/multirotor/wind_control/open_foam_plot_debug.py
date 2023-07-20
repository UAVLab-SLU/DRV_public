# reads openfoam data "points" and plot it, abandoned, too slow.

from matplotlib import pyplot as plt
import plotly.express as px
import time
from PythonClient.multirotor.wind_control.openfoam_data_reader import FoamReader
import pickle


def plot_3d_interactive(points):
    fig = plt.figure()
    ax = fig.add_subplot(111, projection='3d')

    x = [point[0] for point in points]
    y = [point[1] for point in points]
    z = [point[2] for point in points]
    ax.set_xlabel('X')
    ax.set_ylabel('Y')
    ax.set_zlabel('Z')
    fig = px.scatter_3d(title="points")
    fig.add_scatter3d(x=x, y=y, z=z, name="points",mode = 'markers',marker=dict(size=1,color='red'))

    # use time + points.html as the file name
    current_local_time = time.strftime("%Y-%m-%d %H-%M-%S", time.localtime())
    fig.write_html('points_'+ current_local_time + '.html')

    plt.close()


#foam_reader = FoamReader("foam_data/block/blockEnv")
#points = foam_reader.read_mesh().points
filename = "BlockSShape_1/wind_vector.pkl"
with open(filename, 'rb') as f:
    points = pickle.load(f)
# plot all point
plot_3d_interactive(points)