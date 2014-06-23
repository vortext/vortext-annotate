import logging, copy, sys, re
log = logging.getLogger(__name__)

from document_handler import DocumentHandler

from nltk.tokenize.punkt import *
from functools import wraps
from itertools import izip

class OverlappingIntervals():
    """
    maintains a list of start, end tuples
    and calculates overlaps
    """
    def __init__(self, intervals):
        """
        takes intervals = list of (start, end) tuples and sorts them
        """
        self.intervals = sorted(intervals)

    def _is_overlapping(self, i1, i2):
        return i2[0] < i1[1] and i1[0] < i2[1]

    def overlap(self, bounds):
        """
        bounds = (start, end) tuple
        returns all overlapping bounds
        WARNING returns range by value
        """
        return [interval for interval[:] in self.intervals if self._is_overlapping(interval, bounds)]

    def overlap_indices(self, bounds):
        """
        return the 0 indexed positions and bounds of overlapping bounds
        WARNING returns range by value
        """
        return [{"node": index, "range": interval[:]} for index, interval in enumerate(self.intervals) if self._is_overlapping(interval, bounds)]

class Handler(DocumentHandler):
    title = "Tokenizer"

    def __init__(self):
        log.info("constructing %s" % (self.title))

        self.word_token_pattern = re.compile(r"(?u)\b\w\w+\b")
        self.sentence_tokenizer = PunktSentenceTokenizer()

    def handle_document(self, document):
        text = document["text"]
        nodes = document["nodes"]
        pages = document["pages"]

        sentence_spans = self.sentence_tokenizer.span_tokenize(text)
        overlap = OverlappingIntervals([node["interval"] for node in nodes])

        sentence_mappings = []
        word_mappings = []
        for sentence_span in sentence_spans:
            sentence_nodes = overlap.overlap_indices(sentence_span)
            sentence_nodes[0]["range"][0] = sentence_span[0]
            sentence_nodes[-1]["range"][1] = sentence_span[1]

            sentence = text[sentence_span[0]:sentence_span[1]]
            sentence_overlap = OverlappingIntervals([node["range"] for node in sentence_nodes])

            # Add word mappings
            for m in self.word_token_pattern.finditer(sentence):
                word_span = m.span()
                # Add sentence offset
                word_nodes = sentence_overlap.overlap_indices([x+sentence_span[0] for x in word_span])

                word_nodes[0]["range"][0] = word_span[0]
                word_nodes[-1]["range"][1] = word_span[1]

                word_mappings += [word_nodes]
            sentence_mappings += [sentence_nodes]

        document.update({
            "mapping": {
                "sentences": sentence_mappings,
                "words": word_mappings
            }})

        return document
