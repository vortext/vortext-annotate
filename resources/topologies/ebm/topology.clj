(ns topologies.ebm ;; This MUST be in the form topologies.<name> and cannot contain special characters.
  (:require [spa.services :refer [js py]]
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

(defn update-vals [map vals f]
  (reduce #(update-in % [%2] f) map vals))

(defn compensate-offset
  [mappings pages]
  (map (fn [m]
         (let [page-offset (get (nth pages (get m "pageIndex")) "offset")
               subtract (fn [el] (map #(- % page-offset) el))]
           (update-vals m ["interval" "range"] subtract))) mappings))

(defn collapse-annotations
  "merges marginalia with the node mappings and nodes
   compensates for page offest"
  [marginalia nodes mapping pages]
  (map (fn [{:strs [annotations] :as m}]
         (let [new-annotations
               (map (fn [{{:strs [field index]} "mapping" :as a}]
                      (let [mapped (get-in mapping [field index])
                            nodes (map #(nth nodes (get % "node")) mapped)
                            new-mapping (map merge mapped nodes)]
                        (assoc a "mapping" (compensate-offset new-mapping pages)))) annotations)]
           (assoc-in m ["annotations"] new-annotations))
         ) marginalia))

(defn document-output [{:strs [marginalia nodes mapping pages]}]
  {:marginalia (collapse-annotations marginalia nodes mapping pages)})

(def to-response (comp json/encode document-output json/decode)) ; right-to-left

(def topology
  {:source        (fnk [body] (.bytes body))
   :pdf           (fnk [source] (js "ebm/document_parser.js" source))
   :doc           (fnk [pdf] (py "ebm.document_tokenizer" pdf))
   :risk-of-bias  (fnk [doc] (py "ebm.risk_of_bias" doc :timeout 10000))
   :sink          (fnk [risk-of-bias] (to-response risk-of-bias))
   })
