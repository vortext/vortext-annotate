import logging
logger = logging.getLogger(__name__)

from document_filter import DocumentFilter

class Filter(DocumentFilter):
    title = "Word Tokenizer"

    def __init__(self):
        logger.info("constructing %s" % (self.title))

    def filter(self, payload):
        return {"count": len(payload)} # Some result

if __name__ == '__main__':
    Filter().run("")
