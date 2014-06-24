import sys, logging, time
sys.path.append('../../multilang/python')

from functools import wraps
from build.gen import document_pb2

log = logging.getLogger(__name__)

from abc import ABCMeta, abstractmethod
from abstract_handler import AbstractHandler

def timethis(func):
    '''
    Decorator that reports the execution time.
    '''
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        log.debug("call to {} took {} seconds".format(func.__name__, end-start))
        return result
    return wrapper

class DocumentHandler(AbstractHandler):
    __metaclass__ = ABCMeta

    @timethis
    def handle(self, payload):
        document = document_pb2.Document()
        document.ParseFromString(payload)
        result = self.handle_document(document)
        return result.SerializeToString()

    @abstractmethod
    def handle_document(self, document):
        pass
