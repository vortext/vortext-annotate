(ns topologies.example ;; This MUST be in the form topologies.<name> and cannot contain special characters.
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

(def topology
  {:source        (fnk [body] (slurp body))
   :incremented   (fnk [source] (py "example.add_one" source))
   :doubled       (fnk [incremented] (js "example/multiply.js" incremented))
   :sink          (fnk [doubled] (str "result:" doubled))
   })
