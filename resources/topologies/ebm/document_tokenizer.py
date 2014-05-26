import logging, copy, sys
log = logging.getLogger(__name__)

from document_filter import DocumentFilter

class Filter(DocumentFilter):
    title = "Tokenizer"

    def __init__(self):
        log.info("constructing %s" % (self.title))

    def filter(self, document):
        return {"abba": document,
                "count": len(document)}

if __name__ == '__main__':
    with open(sys.argv[1], 'r') as f:
        contents = f.read()
        print Filter().run(contents)
