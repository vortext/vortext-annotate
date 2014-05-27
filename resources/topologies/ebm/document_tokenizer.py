import logging, copy, sys
log = logging.getLogger(__name__)

from document_filter import DocumentFilter

from nltk.tokenize.punkt import *
from functools import wraps
from itertools import izip

# custom adaptations of the nltk tokenizers to suit scientific article parsing
class CustomLanguageVars(PunktLanguageVars):
    _re_non_word_chars = r"(?:[?!)\";}\]\*:@\'\({\[=\.])" # added =
    """Characters that cannot appear within words"""

    _re_word_start = r"[^\(\"\`{\[:;&\#\*@\)}\]\-,=]" # added =
    """Excludes some characters from starting word tokens"""

class newPunktWordTokenizer(TokenizerI):
    """
    taken from new version of NLTK 3.0 alpha
    to allow for span tokenization of words
    (current full version does not allow this)
    """
    def __init__(self, lang_vars=CustomLanguageVars()):
        self._lang_vars = lang_vars


    def tokenize(self, text):
        return self._lang_vars.word_tokenize(text)

    def span_tokenize(self, text):
        """
        Given a text, returns a list of the (start, end) spans of words
        in the text.
        """
        return [(sl.start, sl.stop) for sl in self._slices_from_text(text)]

    def _slices_from_text(self, text):
        last_break = 0
        contains_no_words = True
        for match in self._lang_vars._word_tokenizer_re().finditer(text):
            contains_no_words = False
            context = match.group()
            yield slice(match.start(), match.end())
            if contains_no_words:
                yield slice(0, 0) # matches PunktSentenceTokenizer's functionality


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
        return [{"index": index, "range": interval[:]} for index, interval in enumerate(self.intervals) if self._is_overlapping(interval, bounds)]

class Filter(DocumentFilter):
    title = "Tokenizer"

    def __init__(self):
        log.info("constructing %s" % (self.title))
        self.word_tokenizer = newPunktWordTokenizer()
        self.sentence_tokenizer = PunktSentenceTokenizer()

    def filter(self, document):
        text = document["text"]
        nodes = document["__nodes"]
        pages = document["__pages"]

        sentence_spans = self.sentence_tokenizer.span_tokenize(text)
        overlap = OverlappingIntervals([node["interval"] for node in nodes])

        sentence_mappings = []
        word_mappings = []
        for sentence_span in sentence_spans:
            sentence_nodes = overlap.overlap_indices(sentence_span)
            sentence_nodes[0]["range"][0] = sentence_span[0]
            sentence_nodes[-1]["range"][1] = sentence_span[1]

            sentence = text[sentence_span[0]:sentence_span[1]]
            word_spans = self.word_tokenizer.span_tokenize(sentence)
            sentence_overlap = OverlappingIntervals([node["range"] for node in sentence_nodes])

            # Add word mappings
            for word_span in word_spans:
                word_nodes = sentence_overlap.overlap_indices([x+sentence_span[0] for x in word_span])

                word_nodes[0]["range"][0] = word_span[0]
                word_nodes[-1]["range"][1] = word_span[1]

                word_mappings += [word_nodes]

            sentence_mappings += [sentence_nodes]


        document.update({
            "__mappings": {
                "sentences": sentence_mappings,
                "words": word_mappings
            }})

        return document

if __name__ == '__main__':
    with open(sys.argv[1], 'r') as f:
        contents = f.read()
        f = Filter()
        print f.run(contents)
