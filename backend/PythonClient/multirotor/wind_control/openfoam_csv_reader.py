import os.path
import threading
import time
import pandas as pd
import itertools


class FoamCSVReader:
    """
    Read OpenFOAM csv data, exported using paraView, data does not need to be preprocessed
    """

    def __init__(self, path, csv_filename):
        """
        instantiate a FoamCSVReader, read the csv file using pandas and preprocess the data,
        preprocess includes:
        1. casting float coordinates to integers
        2. removing duplicate rows
        3. sorting by coordinates in descending order
        :param path: str, path to the root directory of the OpenFOAM data
        :param csv_filename: str, name of the csv file
        """
        self.foam_data_root = os.path.abspath(path)
        self.csv_filename = csv_filename
        self.df = self.read_csv(csv_filename)
        #self.preprocess()

    def read_csv(self, filename):
        start_read = time.time()
        df = pd.read_csv(self.foam_data_root + os.sep + filename)
        print("read csv to memory time: " + str(time.time() - start_read))
        return df

    def validate_data(self):
        """
        Check if there are any duplicate rows or skipped rows
        super expensive, only use for debugging
        sometimes due to rounding precision, there are duplicate rows or skipped rows
        causing some points to be missing
        """
        # check if there are any duplicate rows
        df = self.df
        duplicate_rows = df.duplicated()
        if duplicate_rows.any():
            print("Duplicate rows found:")
            print(df[duplicate_rows])
        else:
            print("No duplicate rows found.")

        # Check for skipped rows
        # Create a reference DataFrame with all possible combinations of x, y, and z
        print("Checking for missing combinations...")
        all_combinations = list(
            itertools.product(df['Points:0'].unique(), df['Points:1'].unique(), df['Points:2'].unique()))
        reference_df = pd.DataFrame(all_combinations, columns=['Points:0', 'Points:1', 'Points:2'])

        # Compare the reference DataFrame with the original DataFrame
        missing_combinations = reference_df.merge(df, on=['Points:0', 'Points:1', 'Points:2'], how='left',
                                                  indicator=True)
        missing_combinations = missing_combinations[missing_combinations['_merge'] != 'both']

        if not missing_combinations.empty:
            print("Missing combinations found:")
            print(missing_combinations[['Points:0', 'Points:1', 'Points:2']])
            print("Total missing combinations: " + str(len(missing_combinations)))
        else:
            print("No missing combinations found.")




    def get_spacial_temporal_velocity(self, point):
        """
        Get the velocity at the current time step in self.df
        :param point: drone position, do not have to be integers
        :return: velocity at the current time step [u, v, w]
        """
        x = self.__approximate_integer(point[0])
        y = self.__approximate_integer(point[1])
        z = self.__approximate_integer(point[2])
        df = self.df
        col = df.loc[(df[df.columns[0]] == x) & (df[df.columns[1]] == y) & (df[df.columns[2]] == z)]
        if len(col) == 0:
            print("point not found in csv")
            return None

        return [col[df.columns[3]].values[0], col[df.columns[4]].values[0], col[df.columns[5]].values[0]]

    def get_spacial_temporal_velocity_next_time_step(self, point):
        """
        Init a new thread to load the next csv file in the sequence and
        Get the velocity at the next time step in current self.df
        :param point: drone position in openFoam coordinates. Do not have to be integers.
        :return: velocity at the next time step [u, v, w]
        """
        read_thread = self.load_next_df()
        if read_thread is None:
            return self.get_spacial_temporal_velocity(point)
        else:
            # next csv file do exist
            # wait for the next csv file to be loaded
            read_thread.join()
            return self.get_spacial_temporal_velocity(point)

    def load_next_df(self):
        """
        Load the next csv file in the sequence
        assumes that the next csv file was preprocessed using the same method as the current csv file
        :return: thread object
        """

        def read_csv_thread():
            """
            Read csv file helper function for threading
            :return:
            """
            self.df = self.read_csv(self.csv_filename)

        # Change the csv filename ex. 10ms_1.csv to 10ms_2.csv
        # Account for the case where the csv filename is 10ms_10.csv
        # In this case, the next csv filename should be 10ms_11.csv

        # Get the number after the underscore
        underscore_index = self.csv_filename.index("_")
        number = int(self.csv_filename[underscore_index + 1: -4])

        # Increment the number based on the current and next filenames
        next_number = number + 1
        next_filename = self.csv_filename[:underscore_index + 1] + str(next_number) + ".csv"

        if not os.path.isfile(self.foam_data_root + os.sep + next_filename):
            # If the next file does not exist, do nothing
            print("CSV file for next time step does not exist.")
            return None
        self.csv_filename = next_filename
        # do it in separate thread
        self.df = self.read_csv(self.csv_filename)
        read_thread = threading.Thread(target=read_csv_thread)
        read_thread.start()
        return read_thread

    def preprocess(self):
        """
        Preprocess current dataframe in memory
        1. remove all rows with 0 in columns 4, 5, 6. those are points inside the mesh
        2. cast columns 1, 2, 3 to nearest integer using manhattan distance
        3. remove all rows with duplicate values in columns 1, 2, 3
        4. sort the dataframe by columns 1, 2, 3
        """
        df = self.df

        # remove all rows with 0 in columns 4, 5, 6. those are points inside the mesh
        df = df[(df[df.columns[3]] != 0) & (df[df.columns[4]] != 0) & (df[df.columns[5]] != 0)]

        # cast columns 1, 2, 3 to nearest integer using manhattan distance
        df[df.columns[0]] = df[df.columns[0]].apply(self.__approximate_integer)
        df[df.columns[1]] = df[df.columns[1]].apply(self.__approximate_integer)
        df[df.columns[2]] = df[df.columns[2]].apply(self.__approximate_integer)

        # remove all rows with duplicate values in columns 1, 2, 3
        df = df.drop_duplicates(subset=[df.columns[0], df.columns[1], df.columns[2]], keep='first')

        # sort by columns 1, 2, 3
        self.df = df.sort_values(by=[df.columns[0], df.columns[1], df.columns[2]])

    @staticmethod
    def __approximate_integer(x):
        """
        Approximate a floating point number to the closest integer
        :param x: floating point number
        :return: the closest integer
        """
        if x - int(x) < 0.5:
            return int(x)
        else:
            return int(x) + 1

    def save_df_to_csv(self, filename):
        self.df.to_csv(self.foam_data_root + os.sep + filename, index=False)

    def preprocess_and_replace(self):
        """
        Preprocess the current csv file and replace the current csv file with the preprocessed one
        :return:
        """
        self.preprocess()
        self.save_df_to_csv(self.csv_filename)

    def populate_missing_points_in_sorted_df(self):
        """
        Populate missing points in the sorted dataframe
        Since all points are sorted, we can just iterate through the list, and check if the next point is missing
        The next point is missing if the difference between the next point and the current point is greater than 1
        we can find that by evaluating x first, then y, then z, since the dataframe is sorted by x, then y, then z
        """
        df = self.df
        for i in range(1, len(df)-1):
            point = df.iloc[i]
            velocity = [point[df.columns[3]], point[df.columns[4]], point[df.columns[5]]]
            next_point = df.iloc[i + 1]
            diff = [next_point[df.columns[0]] - point[df.columns[0]], next_point[df.columns[1]] - point[df.columns[1]], next_point[df.columns[2]] - point[df.columns[2]]]
            if diff[0] > 1 or diff[1] > 1 or diff[2] > 1:
                df.loc[len(df)] = [point[df.columns[0]] + 1, point[df.columns[1]] + 1, point[df.columns[2]] + 1, velocity[0], velocity[1], velocity[2]]
                print("Populated missing point at: " + str(point[df.columns[0]] + 1) + ", " + str(point[df.columns[1]] + 1) + ", " + str(point[df.columns[2]] + 1))
        self.df = df.sort_values(by=[df.columns[0], df.columns[1], df.columns[2]])







