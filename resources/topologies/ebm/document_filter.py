import json

import sys
sys.path.append('../../multilang/python')
import logging
from functools import wraps
import time
log = logging.getLogger(__name__)

from abc import ABCMeta, abstractmethod
from abstract_filter import AbstractFilter
from collections import namedtuple

def timethis(func):
    '''
    Decorator that reports the execution time.
    '''
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        log.debug("call to {} took {}".format(func.__name__, end-start))
        return result
    return wrapper

class DocumentFilter(AbstractFilter):
    __metaclass__ = ABCMeta

    @timethis
    def run(self, payload):
        try:
            document = json.loads(payload)
            result = self.filter(document)
            return json.dumps(result, ensure_ascii=True)
        except Exception as e:
            return json.dumps({"cause": str(e)}, ensure_ascii=True)

    @abstractmethod
    def filter(self, document):
        pass
