from abc import ABCMeta, abstractmethod

class AbstractFilter(object):
    __metaclass__ = ABCMeta

    @abstractmethod
    def handler(self, payload):
        pass
