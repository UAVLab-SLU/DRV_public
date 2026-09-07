# Use the official Python 3.10 image
FROM python:3.10-slim

# Install system-level dependencies required for the Python packages
RUN apt-get update && apt-get install -y \
    build-essential \
    libasound-dev \
    libportaudio2 \
    libportaudiocpp0 \
    portaudio19-dev \
    libjpeg-dev \
    zlib1g-dev \
    # libglx-mesa0 \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy dependency metadata first so source-only changes reuse this layer.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code after dependencies have been installed.
COPY . .

# Expose the port the backend will use
EXPOSE 5000

# Command to start the backend server  
CMD ["flask", "--app", "PythonClient.server.simulation_server", "run", "--host=0.0.0.0", "--port=5000", "--debug"]
