#
#   pipeline.py
#
#   N.B. predictive modelling requires a trained model in pickle form:
#   - get `quality_models.pck` from `Dropbox/cochranetech/quality-prediction-results/models`
#   - put in the `models/` directory
#

from abstract_pipeline import Pipeline
import pdb
from indexnumbers import swap_num

# custom tokenizers based on NLTK
from tokenizers import word_tokenizer, sent_tokenizer

import collections

import cPickle as pickle

import quality3
import sklearn

import logging
logger = logging.getLogger(__name__)

import pprint
pp = pprint.PrettyPrinter(indent=2)

####
# bcw -- imports for sample size prediction
import sample_size_pipeline

<<<<<<< HEAD
=======
import subprocess
# MALLET_PATHS = "/Users/bwallace/dev/eclipse-workspace/mallet/bin/:/Users/bwallace/dev/eclipse-workspace/mallet/lib/mallet-deps.jar"
# JAVA_PATH = "/usr/bin/java"

MALLET_PATHS = "/Users/iain/Code/java/mallet/class/:/Users/iain/Code/java/mallet/lib/mallet-deps.jar"
JAVA_PATH = "/usr/bin/java"


def load_sample_size_model_and_vect(vect_path, model_path=None):
    model, vect = None, None

    if not model_path is None:
        with open(model_path, 'rb') as model_f:
            model = pickle.load(model_f)


    with open(vect_path, 'rb') as vect_f:
        vect = pickle.load(vect_f)

    return vect, model

class TxPipeline(Pipeline):
    '''
    '''
    pipeline_title = "TX"

    def __init__(self, crf_model_path="models/tx/crf.model.mallet"):
        #logger.info("%s: loading models" % (self.pipeline_title))
        self.vectorizer, self.clf = load_sample_size_model_and_vect(
                                        'models/tx/crf.vectorizer.pickle')
        self.crf_model_path = crf_model_path
        logger.info("assuming trained CRF is @ %s" % self.crf_model_path)
        logger.info("%s: done loading models" % (self.pipeline_title))

        

    def predict(self, full_text):
        tx_pipeline = sample_size_pipeline.bilearnPipeline(full_text, swap_numbers=False)
        tx_pipeline.generate_features()
        features = tx_pipeline.get_features(flatten=True)
        mallet_str = TxPipeline.to_mallet(self.vectorizer.transform(features))
        mallet_input_file = "models/tx/crf.tmp.mallet"
        with open(mallet_input_file, 'wb') as out_f:
            out_f.write(mallet_str)
        
        predictions, errors = TxPipeline.mallet_predict(
                mallet_input_file, self.crf_model_path)
        predictions = [int(pred.strip()) for pred in predictions.split("\n") if pred.strip()!='']
        tx_words = tx_pipeline.get_words(flatten=True)
    
        predicted_txs = []
        tx_row = {}
        tx_row["annotations"] = []
           # [{"span": matched_span,  "sentence": predicted, "label": 1}]

        word_tok = word_tokenizer.span_tokenize(full_text)
        pdb.set_trace()
        
        cur_start = -1
        in_tx = False 
        cur_span_txt = ""
        for span_index, span in enumerate(word_tok):
            start, end = span
            if predictions[span_index] > 0:
                if not in_tx:
                    cur_start = start 
                    cur_span_txt = tx_words[span_index]
                    in_tx = True
                else:
                    # already 'within a treatment'
                    cur_span_txt += " " + tx_words[span_index]

            elif in_tx:
                # then this is the end of a predicted block
                predicted_txs.append(cur_span_txt)
                #pdb.set_trace()
                #{"span": matched_span,  "sentence": predicted, "label": 1
                tx_row["annotations"].append({
                        "span": (cur_start, end-1),  
                        "label": 1
                    })
                cur_span_txt = "" # clear
                in_tx = False
            # otherwise we just move along

        tx_row["name"] = "treatments"
        #pdb.set_trace()
        return [tx_row]

    '''
    CRF via Mallet
    '''
    @staticmethod
    def to_mallet(X):
        to_lbl = lambda bool_y: "1" if bool_y else "-1"
        mallet_out = []

        # all nonzero features
        # X represents a single abstract
        # X_i is word i in said abstract
        for x_i in X:
            #pdb.set_trace()
            x_features = x_i.nonzero()[1] # we only care for the columns

            cur_str = " ".join(
                    [str(f_j) for f_j in x_features])
            
            mallet_out.append(cur_str.lstrip() + "\n")
        
        mallet_out.append("\n") # blank line separating instances
        mallet_str = "".join(mallet_out)
        return mallet_str

    @staticmethod
    def mallet_predict(test_f, mallet_model_path):
        full_test_path = os.path.join(test_f)
        print "making predictions for instances @ "
        p = subprocess.Popen([JAVA_PATH, '-Xmx2g', '-cp', 
                               MALLET_PATHS, 'cc.mallet.fst.SimpleTagger',
                               "--model-file", mallet_model_path, 
                               full_test_path,
                               ], stdout=subprocess.PIPE)
        
        predictions, errors = p.communicate()
        return predictions, errors
>>>>>>> 1b257ee... updates

class SampleSizePipeline(Pipeline):
    """
    @TODO
    """
    pipeline_title = "Sample Size"
    def __init__(self):
        logger.info("%s: loading models" % (self.pipeline_title))
        self.vectorizer, self.clf = self.load_sample_size_model_and_vect(
                                    'models/sample_size/sample_size_vectorizer_ft.pickle',
                                    'models/sample_size/sample_size_predictor_ft.pickle')
        logger.info("%s: done loading models" % (self.pipeline_title))


    def load_sample_size_model_and_vect(self, vect_path, model_path):
        model, vect = None, None
        with open(model_path, 'rb') as model_f:
            model = pickle.load(model_f)

        with open(vect_path, 'rb') as vect_f:
            vect = pickle.load(vect_f)

        return vect, model

    @staticmethod
    def integer_filter(w):
        return w['num'] == True

    def predict(self, full_text):
        ss_pipeline = sample_size_pipeline.bilearnPipeline(full_text)
        ss_pipeline.generate_features()
        features = ss_pipeline.get_features(filter=SampleSizePipeline.integer_filter, flatten=True)
        X = self.vectorizer.transform(features)
        preds = self.clf.decision_function(X)
        sl_words = ss_pipeline.get_words(filter=SampleSizePipeline.integer_filter, flatten=True)
        predicted_i = preds.argmax()
        predicted = sl_words[predicted_i]
        print "predicted sample size: %s" % predicted

        '''
        So this is kind of hacky. The deal is that we need to
        get the spans for the predicted sample size. To this
        end, I rely on the span_tokenizer (below), but then I need
        to match up the predicted token (sample size) with these
        spans.
        '''
        word_tok = word_tokenizer.span_tokenize(full_text)
        for span in word_tok:
            start, end = span
            cur_word = swap_num(full_text[start:end])
            if predicted == cur_word:
                logger.debug("sample size predictor -- matched %s for prediction %s" % (
                        cur_word, predicted))
                matched_span = span
                break
        else:
            # then we failed to match the prediction token?!
            # @TODO handle better?
            logger.warn("ahhhh failed to match sample size prediction")
            matched_span = []


        ss_row = {
            "name": "Sample Size",
            "document": "**Predicted sample size:** %s" % (predicted)
        }
        ss_row["annotations"] = [{"span": matched_span,  "sentence": predicted, "label": 1}]

        return [ss_row]


class RiskOfBiasPipeline(Pipeline):
    """
    Predicts risk of bias document class + relevant sentences
    """
    pipeline_title = "Risk of Bias"

    #from tokenizer import tag_words
    CORE_DOMAINS = ["Random sequence generation", "Allocation concealment", "Blinding of participants and personnel",
                    "Blinding of outcome assessment", "Incomplete outcome data", "Selective reporting"]

    def __init__(self):
        logger.info("%s: loading models" % (self.pipeline_title))
        self.doc_models, self.doc_vecs, self.sent_models, self.sent_vecs = self.load_models('models/quality_models.pck')
        logger.info("%s: done loading models" % (self.pipeline_title))

    def load_models(self, filename):
        with open(filename, 'rb') as f:
            data = pickle.load(f)
        return data

    def predict(self, full_text):

        logger.debug("starting prediction code")
        # first get sentence indices in full text
        sent_indices = sent_tokenizer.span_tokenize(full_text)

        # then the strings (for internal use only)
        sent_text = [full_text[start:end] for start, end in sent_indices]
        sent_text_dict = dict(zip(sent_indices, sent_text))

        output = []

        sent_preds_by_domain = [] # will rejig this later to make a list of dicts
        doc_preds = {}

        for test_domain, doc_model, doc_vec, sent_model, sent_vec in zip(self.CORE_DOMAINS, self.doc_models, self.doc_vecs, self.sent_models, self.sent_vecs):

            domain_row = {"name": test_domain}

            ####
            ## PART ONE - get the predicted sentences with risk of bias information
            ####

            # vectorize the sentences
            X_sents = sent_vec.transform(sent_text)


            # get predicted 1 / -1 for the sentences
            # bcw -- addint type conversion patch for numpy.int64 weirdness
            pred_sents = [int(x_i) for x_i in sent_model.predict(X_sents)]
            sent_preds_by_domain.append(pred_sents) # save them for later highlighting

            # for internal feature generation, get the sentences which are predicted 1
            positive_sents = [sent for sent, pred in zip(sent_text, pred_sents) if pred==1]
            positive_spans = [span for span, pred in zip(sent_indices, pred_sents) if pred==1]


            domain_row["annotations"] = [{"span": span, "sentence": sent, "label": 1} for span, sent in zip(positive_spans, positive_sents)]

            # make a single string per doc
            summary_text = " ".join(positive_sents)


            ####
            ##  PART TWO - integrate summarized and full text, then predict the document class
            ####

            doc_vec.builder_clear()
            doc_vec.builder_add_docs([full_text])
            doc_vec.builder_add_docs([summary_text], prefix="high-prob-sent-")

            X_doc = doc_vec.builder_transform()

            # change the -1s to 0s for now (TODO: improve on this)
            # done because the viewer has three classes, and we're only predicting two here
            document_prediction = "low" if doc_model.predict(X_doc)[0] == 1 else "unknown"
            template_text = "**Overall risk of bias prediction**: %s <br> **Supporting sentences**: %s"
            domain_row["document"] = template_text % (document_prediction, len(domain_row["annotations"]) or "*none*")

            output.append(domain_row)

        return output
