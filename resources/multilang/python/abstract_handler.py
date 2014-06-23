from abc import ABCMeta, abstractmethod

class AbstractHandler(object):
    __metaclass__ = ABCMeta

    @abstractmethod
    def handle(self, payload):
        pass
