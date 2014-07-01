(ns topologies.ebm ;; This MUST be in the form topologies.<name> and cannot contain special characters.
  (:require [spa.services :refer [js py]]
            [flatland.protobuf.core :refer :all]
            [plumbing.core :refer :all]
            [clojure.tools.logging :as log]
            [cheshire.core :as json])
  (:import  [spa.SpaDoc$Document]))

;; The topology MUST be defined and MUST be compilable by prismatic graph.
;; The input to the topology is the Ring request, by convention called source.
;; We only return the sink to the client.
;; Make sure sink returns a valid Ring response
;; You MAY define custom serialization / deserialization, as none is done by default.
;; See the [Ring Spec](https://github.com/ring-clojure/ring/blob/master/SPEC)

(def Document (protodef ebm.spa.SpaDoc$Document))

(defn update-vals [map vals f]
  (reduce #(update-in % [%2] f) map vals))

(defn compensate-offset
  [mappings pages]
  (map (fn [m]
         (let [page-offset (:offset (nth pages (:page-index m)))
               subtract (fn [el] {:lower (- (:lower el) page-offset)
                                 :upper (- (:upper el) page-offset)})]
           (update-vals m [:interval :range] subtract))) mappings))

(defn collapse-annotations
  [marginalis doc]
  (let [get-mapping-field (memoize (fn [key] ((keyword key) doc)))
        get-node (memoize (fn [key index] (nth (get-mapping-field key) index)))
        get-node-by-element (memoize (fn [el] (nth (:nodes doc) (:node-index el))))
        annotations (:annotations marginalis)
        mappings (map :mapping annotations)
        nodes (map (fn [m] (:elements (get-node (:key m) (:index m)))) mappings)
        new-mapping (map (fn [ann] (compensate-offset
                                   (map (fn [el] (merge el (get-node-by-element el))) ann)
                                   (:pages doc))) nodes)]
    (map (fn [a b] (assoc (into {} a) :mapping b)) annotations new-mapping)))

(defn collapse-references
  [doc]
  (let [marginalia (:marginalia doc)
        new-annotations (map #(collapse-annotations % doc) marginalia)]
    {:marginalia (map #(assoc (into {} %1) :annotations %2) marginalia new-annotations)}))

(def topology
  {:source        (fnk [body] (.bytes body))
   :pdf           (fnk [source] (js "ebm/document_parser.js" source :timeout 4000))
   :doc           (fnk [pdf] (py "ebm.document_tokenizer" pdf :timeout 10000))
   :risk-of-bias  (fnk [doc] (py "ebm.risk_of_bias" doc :timeout 10000))
   :sink          (fnk [risk-of-bias] (json/encode (collapse-references (protobuf-load Document risk-of-bias))))})
