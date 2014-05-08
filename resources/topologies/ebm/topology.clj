(ns topologies.ebm ;; This MUST be in the form topologies.<name>
  (:require [spa.services :refer [call]])
  (:use plumbing.core))

;; The topology MUST be defined and MUST be compilable by prismatic graph
;; The input to the topology is the raw HTTP POST payload, by convention called source
;; We only return the sink to the client. Make sure that all relevant results are present and it's in a format understood
;; You MAY define custom serialization / deserialization

(def py (partial call :python))
(def js (partial call :node))

(def topology
  {:source (fnk [body] (slurp body))
   :pdf (fnk [source] (js "ebm/document_parser.js" source))
   :sink   (fnk [pdf] (py "ebm.word_tokenizer" pdf))
   })
