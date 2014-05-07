(ns spa.topologies
  (:require
   [clojure.tools.logging :as log]
   [clojure.java.io :as io]
   [clojure.string :only [join split replace] :as s]
   [plumbing.graph :as graph]))

(def get-var
  (memoize
   (fn [ns sym]
     (let [path (str (s/replace ns "." "/") "/" sym ".clj")
           f (io/as-file (io/resource path))]
       (when (not (nil? f))
         (load-string (slurp f))
         (if-let [s (find-var (symbol (str ns "/" sym)))]
           (var-get s)
           nil))))))

(defn get-topology
  [name]
  (get-var (str "topologies." name) "topology"))

(def make-graph
  (memoize
   (fn [name]
     (graph/lazy-compile (get-topology name)))))

(defn available?
  [name]
  (not (nil? (get-topology name))))

(defn process
  [name payload]
  (if (available? name)
    (let [topology (make-graph name)]
      (:sink (topology payload)))
    (throw (IllegalArgumentException. (str "could not find topology " name)))))
