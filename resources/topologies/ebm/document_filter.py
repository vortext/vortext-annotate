import json

import sys, glob
sys.path.append('../../multilang/python')


from abc import ABCMeta, abstractmethod
from abstract_filter import AbstractFilter


class DocumentFilter(AbstractFilter):
    __metaclass__ = ABCMeta

    def run(self, payload):
        try:
            document = json.loads(payload)
            result = self.filter(document)
            return json.dumps(result, ensure_ascii=False)
        except Exception as e:
            return json.dumps({"cause": str(e)})

    @abstractmethod
    def filter(self, document):
        pass
