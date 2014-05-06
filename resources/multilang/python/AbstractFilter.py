from abc import ABCMeta, abstractmethod

class AbstractFilter(object):
    __metaclass__ = ABCMeta

    @abstractmethod
    def run(self, payload):
        pass
