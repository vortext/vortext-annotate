
import logging
logger = logging.getLogger(__name__)

from document_filter import DocumentFilter

class Filter(DocumentFilter):
    title = "Sentence Tokenizer"

    def __init__(self):
        logger.info("constructing %s" % (self.title))

    def filter(self, payload):
        return {"echo": payload} # Some modified payload

if __name__ == '__main__':
    Filter().run("")
