import json

import sys
sys.path.append('../../multilang/python')
import logging
log = logging.getLogger(__name__)


from abc import ABCMeta, abstractmethod
from abstract_filter import AbstractFilter


class DocumentFilter(AbstractFilter):
    __metaclass__ = ABCMeta

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
