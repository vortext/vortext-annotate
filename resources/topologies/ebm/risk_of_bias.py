import logging, copy, sys, uuid, os
log = logging.getLogger(__name__)

from document_handler import DocumentHandler
import cPickle as pickle
import sklearn

# FIXME: there should be a better way to modularize this code
sys.path.append(os.path.abspath("resources/topologies/ebm/"))
import quality3

class Handler(DocumentHandler):
    CORE_DOMAINS = ["Random sequence generation", "Allocation concealment", "Blinding of participants and personnel",
                    "Blinding of outcome assessment", "Incomplete outcome data", "Selective reporting"]

    title = "Risk of Bias"

    def load_models(self, filename):
        with open(filename, 'rb') as f:
            data = pickle.load(f)
        return data

    def __init__(self):
        script_dir = os.path.dirname(__file__) #<-- absolute dir the script is in
        rel_path = "models/quality_models.pck"
        models_file = os.path.join(script_dir, rel_path)

        log.info("%s: loading models: %s" % (self.title, models_file))
        self.doc_models, self.doc_vecs, self.sent_models, self.sent_vecs = self.load_models(models_file)
        log.info("%s: done loading models" % (self.title))


    def add_annotation(self, marginalis, type, index, label=1, content=None):
        annotation = marginalis.annotations.add()
        annotation.label = label
        annotation.content = content
        for mapping in mappings:
            m = annotation.mappings.add()
            m.key = type
            m.index = index

    def handle_document(self, document):
        """
        Adds sentence annotations and document predictions for all
        Risk of Bias core domains to the document as marginalia.
        """

        # first get sentence indices in full text
        sent_indices = [(s[0].range.lower, s[-1].range.upper) for s in document.sentences]
        # then the strings (for internal use only)
        sent_text = [document.text[start:end] for start, end in sent_indices]
        sent_text_dict = dict(zip(sent_indices, sent_text))

        output = []
        sent_preds_by_domain = []
        doc_preds = {}
        for test_domain, doc_model, doc_vec, sent_model, sent_vec in zip(self.CORE_DOMAINS, self.doc_models, self.doc_vecs, self.sent_models, self.sent_vecs):
            marginalis = document.marginalia.add()
            marginalis.title = test_domain

            ####
            ## PART ONE - get the predicted sentences with risk of bias information
            ####
            X_sents = sent_vec.transform(sent_text)
            pred_sents = [int(x_i) for x_i in sent_model.predict(X_sents)]

            positive_sents = [(index, sent) for index, (sent, pred) in enumerate(zip(sent_text, pred_sents)) if pred == 1]

            for index, sent in positive_sents:
                self.add_annotation(marginalis, "sentences", index, content=sent)

            ####
            ## PART TWO - integrate summarized and full text, then predict the document class
            ####
            summary_text = " ".join([sent for index, sent in positive_sents])

            doc_vec.builder_clear()
            doc_vec.builder_add_docs([document["text"]])
            doc_vec.builder_add_docs([summary_text], prefix="high-prob-sent-")

            X_doc = doc_vec.builder_transform()

            document_prediction = "low" if doc_model.predict(X_doc)[0] == 1 else "uncertain"
            template_text = "**Overall risk of bias prediction**: %s <br> **Supporting sentences**: %s"
            marginalis.description = template_text % (document_prediction, len(positive_sents) or "*none*")

        return document
