FROM ubuntu:20.04

WORKDIR /code

# Set noninteractive mode
ENV DEBIAN_FRONTEND=noninteractive

# Install Python3 and pip
RUN apt-get update && \
    apt-get install -y python3-pip

# Install system dependencies
RUN apt-get install -y \
    g++ \
    gcc \
    gfortran \
    liblapack-dev \
    libffi-dev \
    libssl-dev \
    python3-dev \
    build-essential \
    wget \
    libfreetype6-dev \
    libpng-dev \
    libportaudio2 \
    portaudio19-dev \
    libasound-dev \
    libjack-dev \
    libgl1-mesa-glx

# Set environment variables
ENV LANG C.UTF-8
ENV LC_ALL C.UTF-8

COPY requirements.txt /code
RUN pip3 install -r requirements.txt

COPY . .

# ENV POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
# ENV POSTGRES_DB=${POSTGRES_DB}
# ENV POSTGRES_USER=${POSTGRES_USER}
# ENV DB_HOST_FOR_BACKEND=${DB_HOST_FOR_BACKEND}
# ENV DB_PORT_FOR_BACKEND=${DB_PORT_FOR_BACKEND}

EXPOSE 5000

CMD ["python3", "PythonClient/server/simulation_server.py"]