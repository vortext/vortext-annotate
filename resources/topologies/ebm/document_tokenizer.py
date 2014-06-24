import logging, re
log = logging.getLogger(__name__)

from document_handler import DocumentHandler
from nltk.tokenize.punkt import PunktSentenceTokenizer

class OverlappingIntervals():
    """
    Maintains a list of start, end tuples and calculates overlaps.
    """
    def __init__(self, intervals):
        """
        Takes intervals = list of (start, end) tuples and sorts them.
        """
        self.intervals = sorted(intervals)

    def _is_overlapping(self, i1, i2):
        return i2[0] < i1[1] and i1[0] < i2[1]

    def overlap_indices(self, bounds):
        """
        Return the 0 indexed positions and bounds of overlapping bounds.
        FIXME: we can stop iterating when interval[1] > bounds[0] (or use an segment/interval tree)
        """
        return [{"index": index, "range": interval} for index, interval in enumerate(self.intervals) if self._is_overlapping(interval, bounds)]

class Handler(DocumentHandler):
    title = "Tokenizer"

    def __init__(self):
        log.info("constructing %s" % (self.title))

        self.word_token_pattern = re.compile(r"(?u)\b\w\w+\b")
        self.sentence_tokenizer = PunktSentenceTokenizer()

    def add_mapping(self, mapping, nodes, span):
        last = len(nodes) - 1
        for i, node in enumerate(nodes):
            element = mapping.elements.add()
            element.nodeIndex = node["index"]
            element.range.lower = node["range"][0] if i != 0 else span[0]
            element.range.upper = node["range"][1] if i != last else span[1]

    def handle_document(self, document):
        """
        Adds sentence and word mappings to the document by tokenizing the full text,
        this allows the client-side to figure out where to position the sentence and word annotations.
        """
        text = document.text
        nodes = document.nodes
        pages = document.pages

        sentence_spans = self.sentence_tokenizer.span_tokenize(text)
        overlap = OverlappingIntervals([(n.interval.lower, n.interval.upper) for n in nodes])

        for sentence_span in sentence_spans:
            sentence_nodes = overlap.overlap_indices(sentence_span)
            sentence_mapping = document.sentences.add()

            self.add_mapping(sentence_mapping, sentence_nodes, sentence_span)

            sentence = text[sentence_span[0]:sentence_span[1]]
            sentence_overlap = OverlappingIntervals([node["range"] for node in sentence_nodes])

            # Add word mappings
            for m in self.word_token_pattern.finditer(sentence):
                word_span = m.span()
                # Add sentence offset
                word_nodes = sentence_overlap.overlap_indices([x+sentence_span[0] for x in word_span])

                word_mapping = document.words.add()
                self.add_mapping(word_mapping, word_nodes, word_span)

        return document
