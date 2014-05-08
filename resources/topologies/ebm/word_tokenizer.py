import logging, copy
log = logging.getLogger(__name__)

from document_filter import DocumentFilter

class Filter(DocumentFilter):
    title = "Word Tokenizer"

    def __init__(self):
        log.info("constructing %s" % (self.title))

    def filter(self, document):
        return {"abba": document,
                "count": len(document)}

if __name__ == '__main__':
    Filter().run("")
