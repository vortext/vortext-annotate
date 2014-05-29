(ns topologies.ebm ;; This MUST be in the form topologies.<name> and cannot contain special characters.
  (:require [spa.services :refer [call]]
            [cheshire.core :as json]
            [clojure.tools.logging :as log]
            [clojure.java.io :as io])
  (:use plumbing.core))

;; The topology MUST be defined and MUST be compilable by prismatic graph.
;; The input to the topology is the Ring request, by convention called source.
;; We only return the sink to the client.
;; Make sure sink returns a valid Ring response
;; You MAY define custom serialization / deserialization, as none is done by default.
;; See the [Ring Spec](https://github.com/ring-clojure/ring/blob/master/SPEC)

(def py (partial call :python))
(def js (partial call :node))

(defn collapse-annotations
  "merges marginalia with the node mappings and nodes"
  [marginalia nodes mapping]
  (map (fn [{:strs [annotations] :as m}]
         (let [new-annotations
               (map (fn [{{:strs [field index]} "mapping" :as a}]
                      (let [mapped (get-in mapping [field index])
                            nodes (map #(nth nodes (get % "node")) mapped)]
                        (assoc a "mapping" (map merge mapped nodes)))) annotations)]
           (assoc-in m ["annotations"] new-annotations))
         ) marginalia))

(defn document-output [doc]
  (let [{:strs [marginalia nodes mapping pages]} doc
        marginalia (collapse-annotations marginalia nodes mapping)]
    {:pages pages :marginalia marginalia}))

(def to-response (comp json/encode document-output json/decode)) ; right-to-left

(def topology
  {:source        (fnk [body] (.bytes body))
   :pdf           (fnk [source] (js "ebm/document_parser.js" source))
   :doc           (fnk [pdf] (py "ebm.document_tokenizer" pdf))
   :risk-of-bias  (fnk [doc] (py "ebm.risk_of_bias" doc))
   :sink          (fnk [risk-of-bias] (to-response risk-of-bias))
   })
