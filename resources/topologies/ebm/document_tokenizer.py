import logging, re
log = logging.getLogger(__name__)

from document_handler import DocumentHandler
from interval_tree import IntervalTree
from nltk.tokenize.punkt import PunktSentenceTokenizer

class Interval:
    def __init__(self, lower, upper):
        self.lower = lower
        self.upper = upper

    def get_begin(self):
        return self.lower

    def get_end(self):
        return self.upper

    def __hash__(self):
        return 31 * self.upper + self.lower

    def __eq__(self, other):
        return (other.lower, other.upper) == (self.lower, self.upper)

class OverlappingIntervals:
    def __init__(self, intervals):
        self.T = IntervalTree(intervals)
        self.H = dict((obj, index) for index, obj in enumerate(intervals))

    def overlap_indices(self, bounds):
        nodes = self.T.search(bounds[0], bounds[1])
        idxs = [self.H[node] for node in nodes]
        return map(lambda idx,node: {"index": idx, "range": (node.lower, node.upper)}, idxs, nodes)

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
            element.node_index = node["index"]
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
        overlap = OverlappingIntervals([Interval(n.interval.lower, n.interval.upper) for n in nodes])

        for sentence_span in sentence_spans:
            sentence_nodes = overlap.overlap_indices(sentence_span)
            sentence_mapping = document.sentences.add()

            self.add_mapping(sentence_mapping, sentence_nodes, sentence_span)

            sentence = text[sentence_span[0]:sentence_span[1]]

            # Add word mappings
            # for m in self.word_token_pattern.finditer(sentence):
            #     word_span = m.span()
            #     # Add sentence offset
            #     word_nodes = overlap.overlap_indices([x+sentence_span[0] for x in word_span])

            #     word_mapping = document.words.add()
            #     self.add_mapping(word_mapping, word_nodes, word_span)

        return document
