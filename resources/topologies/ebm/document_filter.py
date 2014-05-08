import json

import sys, glob
sys.path.append('../../multilang/python')


from abc import ABCMeta, abstractmethod
from abstract_filter import AbstractFilter


class DocumentFilter(AbstractFilter):
    __metaclass__ = ABCMeta

    def run(self, payload):
        document = json.loads(payload)
        result = self.filter(document)
        return json.dumps(result, ensure_ascii=False)


    @abstractmethod
    def filter(self, payload):
        pass
