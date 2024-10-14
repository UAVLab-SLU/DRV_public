from PythonClient.multirotor.monitor.abstract.storage_service import StorageServiceInterface
from google.cloud import storage

class GCSStorageService(StorageServiceInterface):
    """Concrete class of StorageServiceInterface, used for uploading GSC"""

    def uploadToService(self, file_name, content):
        """Uploads a file to the GCS bucket."""
        blob = self.bucket.blob(f'reports/{file_name}')
        blob.upload_from_string(content)
        print(f"File {file_name} uploaded to GCS.")