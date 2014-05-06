import sys, glob
sys.path.append('../../multilang/python')

import logging
logger = logging.getLogger(__name__)

from AbstractFilter import AbstractFilter

class Filter(AbstractFilter):
    title = "Sentence Tokenizer"

    def __init__(self):
        logger.info("constructing %s" % (self.title))

    def run(self, payload):
        return {"response": "Gotcha %s" % (payload)}

if __name__ == '__main__':
    Filter().run("")
