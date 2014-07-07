(ns spa.topologies
  (:require
   [clojure.tools.logging :as log]
   [clojure.java.io :as io]
   [clojure.string :only [join split replace] :as s]
   [clojure.core.async :as async :refer [go <! >!]]
   [clojure.core.async.impl.protocols :as async-protocols]
   [plumbing.fnk.pfnk :as pfnk]
   [plumbing.fnk.schema :as schema :include-macros true]
   [plumbing.core :as plumbing :include-macros true]
   [plumbing.graph :as graph :include-macros true]))

(def ^:private get-var-in-resource-ns
  (fn [ns sym]
    (let [path (str (s/replace ns "." "/") "/" sym ".clj")
          f (io/as-file (io/resource path))]
      (when (not (nil? f))
        (load-file (.getAbsolutePath f))
        (when-let [s (find-var (symbol (str ns "/" sym)))]
          (var-get s))))))

(defn ^:private get-topology
  [name]
  (get-var-in-resource-ns (str "topologies." name) "topology"))

(defn ^:private asyncify
  "Take a fnk f and return an async version by wrapping non-channel
  return values in a channel"
  [f]
  (pfnk/fn->fnk
   (fn [m]
     (let [v (f m)]
       (if (satisfies? async-protocols/ReadPort v)
         v
         (go v))))
   (pfnk/io-schemata f)))

(defn async-compile
  "From https://github.com/Prismatic/plumbing/blob/master/src/plumbing/graph_async.cljx

   Compile a hierarchical graph with (some) async fnks into an channel that
   contains the computed graph once completed.

   Each fnk can perform async operations by returning a channel that contains
   its node value once completed.

   Each node function will be evaluated as its dependencies have been fully
   computed."
  [g]
  (if (fn? g)
    (asyncify g)
    (let [g (graph/->graph (plumbing/map-vals async-compile g))
          req-ks (schema/required-toplevel-keys (pfnk/input-schema g))
          edges (concat
                 (for [[k v] g
                       parent-k (filter g (keys (pfnk/input-schema v)))]
                   [parent-k k])
                 (for [k (keys g)]
                   [k ::done]))
          child-map (->> edges
                         (group-by first)
                         (plumbing/map-vals #(set (map second %))))
          parent-map (->> edges
                          (group-by second)
                          (plumbing/map-vals #(set (map first %))))]
      (pfnk/fn->fnk
       (fn [m]
         (let [missing-keys (seq (remove #(contains? m %) req-ks))]
           (schema/assert-iae (empty? missing-keys)
                              "Missing top-level keys in graph input: %s"
                              (set missing-keys)))
         (let [result (async/chan)
               remaining-parents (atom parent-map)
               results (atom m)
               run-node (fn run-node [k]
                          (go
                           (if (= ::done k)
                             (>! result (select-keys @results (keys g)))
                             (let [f (g k)
                                   r (<! (f (select-keys @results (keys (pfnk/input-schema f)))))]
                               (swap! results assoc k r)
                               (doseq [c (child-map k)]
                                 (when (empty? (c (swap! remaining-parents
                                                         update-in [c]
                                                         disj k)))
                                   (run-node c)))))))]
           (doseq [k (keys g)]
             (when (empty? (parent-map k))
               (run-node k)))
           result))
       (pfnk/io-schemata g)))))

(defn available?
  [name]
  (not (nil? (get-topology name))))

(def require-graph
  (memoize
   (fn [name]
     (async-compile (get-topology name)))))

(defn process
  "Processes the payload by the topology defined by name.

  Each topology is defined in a folder in `resources/topologies` This
  folder must contain a file called `topology.clj` that must contain a
  var `topology` which is a compilable by Prismatic Graph.
  Throws an IllegalArgumentException if the folder, file, or var could not be found.
  The name of the folder corresponds to the name argument of this function.

  This graph (topology) is compiled and cached the first time process
  is called.  A call to process will return a core.async channel that
  will have the final result on the queue when all the tasks are finished."
  [name payload]
  (if (available? name)
    (let [topology (require-graph name)]
      (topology payload))
    (throw (IllegalArgumentException. (str "could not find topology: " name)))))
