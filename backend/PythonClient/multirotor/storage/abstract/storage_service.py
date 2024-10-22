from abc import ABC, abstractmethod

class StorageServiceInterface(ABC):
    """Interface for cloud storage services."""
    
    @abstractmethod
    def upload_to_service(self, file_name, content, content_type='text/plain'):
        """
        Uploads a file to the cloud storage service.
        """
        pass
