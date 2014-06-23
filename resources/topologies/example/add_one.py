import sys
sys.path.append('../../multilang/python')
from abstract_handler import AbstractHandler

class Handler(AbstractHandler):
    title = "Add one"

    def __init__(self):
        # Setup here
        print "Hello, I'm adding one"

    def handle(self, input):
        return str(int(input) + 1)
