(ns topologies.ebm ;; This MUST be in the form topologies.<name> and cannot contain special characters.
  (:require [spa.services :refer [call]])
  (:use plumbing.core))

;; The topology MUST be defined and MUST be compilable by prismatic graph.
;; The input to the topology is the Ring request, by convention called source.
;; We only return the sink to the client.
;; Make sure sing returns a valid Ring response
;; You MAY define custom serialization / deserialization, as none is done by default.
;; See the [Ring Spec](https://github.com/ring-clojure/ring/blob/master/SPEC)

(def py (partial call :python))
(def js (partial call :node))


(defn merge-marginalia [doc]
  "merges marginalia with the node mappings and nodes"
  doc)

(def to-response (comp merge-marginalia))

(def topology
  {:source        (fnk [body] (slurp body))
   :pdf           (fnk [source] (js "ebm/document_parser.js" source))
   :doc           (fnk [pdf] (py "ebm.document_tokenizer" pdf))
   :risk-of-bias  (fnk [doc] (py "ebm.risk_of_bias" doc))
   :sink          (fnk [risk-of-bias] (to-response risk-of-bias))
   })
