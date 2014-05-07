(ns spa.topologies
  (:require
   [spa.services :refer [call]]
   [plumbing.core :refer :all]
   [environ.core :refer :all]
   [clojure.tools.logging :as log]
   [clojure.java.io :as io]
   [clojure.tools.reader :as r]
   [plumbing.graph :as graph]))

(defn- topology-resource
  [name]
  (io/resource (str "topologies/" name "/topology.clj")))

(def make-graph
  (memoize
   (fn [name]
     (let [topology-string  (slurp (topology-resource name))
           topology (eval (r/read-string topology-string))]
       (graph/eager-compile topology)))))

(defn available?
  [name]
  (not (nil? (topology-resource name))))

(defn process
  [name payload]
  (if (available? name)
    (let [topology (make-graph name)]
      (into {} (topology payload)))
    (do
      (log/warn "Could not find a toplogy for" name)
      nil)))
