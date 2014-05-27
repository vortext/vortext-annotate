import sys
sys.path.append('../../multilang/python')
from abstract_filter import AbstractFilter

class Filter(AbstractFilter):
    title = "Add one"

    def __init__(self):
        # Setup here
        print "Hello, I'm adding one"

    def run(self, input):
        return str(int(input) + 1)
