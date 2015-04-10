(ns vortext.util
  (:require [clojure.string :as string]
            [clojure.walk :as walk]
            [clojure.java.shell :refer [sh]]))

(def last-commit (string/trim-newline (:out (sh "git" "rev-parse" "HEAD"))))

(defn breadcrumbs
  "Builds a vector of breadcrumbs from the uri and their associated names"
  [uri names]
  (let [uri-parts (drop 1 (clojure.string/split uri #"/"))
        crumbs (reductions (fn [mem val] (str mem "/" val)) uri-parts)]
    (map (fn [uri name] {:uri (str "/" uri) :name name}) crumbs names)))

(defn extend-deeply-with
  "Extends the maps in seq alpha of the form [[{} ...] [{} ...] ...]
  with the keys from beta of the form [{} ... {}]. alpha and beta must have the same length."
  [alpha beta]
  (map-indexed (fn [idx psi] (map (fn [omega] (merge (nth beta idx) omega)) psi)) alpha))
