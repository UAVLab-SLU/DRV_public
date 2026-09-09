"""Per-drone camera recording, independent of simulator-local recording folders."""
from pathlib import Path
import tempfile
import threading
import time

from PythonClient import airsim


class MissionRecorder:
    def __init__(self, drone, camera, fps=5):
        self.drone = drone
        self.camera = camera
        self.fps = fps
        self.directory = Path(tempfile.mkdtemp(prefix="drv-recording-"))
        self.path = self.directory / "recording.mp4"
        self._stop = threading.Event()
        self._ready = threading.Event()
        self.error = None
        self.thread = threading.Thread(target=self._record, daemon=True)

    def start(self):
        self.thread.start()
        if not self._ready.wait(15):
            raise RuntimeError("Camera recording did not start within 15 seconds")
        if self.error:
            raise RuntimeError("Unable to start camera recording") from self.error

    def _record(self):
        writer = None
        try:
            import cv2
            import numpy as np

            # RPC clients are thread-local; flight commands use a different client.
            client = airsim.MultirotorClient(timeout_value=5)
            started = time.monotonic()
            frames = 0
            while not self._stop.is_set():
                data = client.simGetImage(self.camera, airsim.ImageType.Scene, vehicle_name=self.drone)
                frame = cv2.imdecode(np.frombuffer(data, dtype=np.uint8), cv2.IMREAD_COLOR) if data else None
                if frame is None:
                    raise RuntimeError("Camera returned an empty or invalid image")
                if writer is None:
                    height, width = frame.shape[:2]
                    writer = cv2.VideoWriter(str(self.path), cv2.VideoWriter_fourcc(*"mp4v"),
                                             self.fps, (width, height))
                    if not writer.isOpened():
                        raise RuntimeError("Unable to open MP4 video encoder")
                elif frame.shape[:2] != (height, width):
                    frame = cv2.resize(frame, (width, height))
                # Duplicate frames after slow RPC responses to preserve elapsed time.
                target_frames = int((time.monotonic() - started) * self.fps) + 1
                while frames < target_frames:
                    writer.write(frame)
                    frames += 1
                self._ready.set()
                self._stop.wait(max(0, started + frames / self.fps - time.monotonic()))
        except Exception as error:
            self.error = error
        finally:
            if writer is not None:
                writer.release()
            self._ready.set()

    def stop(self):
        self._stop.set()
        if self.thread.ident is not None:
            self.thread.join()

    def cleanup(self):
        self.path.unlink(missing_ok=True)
        self.directory.rmdir()
