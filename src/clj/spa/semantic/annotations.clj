(ns spa.semantic.annotations
  (:require
   [clojure.java.io :as io]
   [environ.core :refer [env]]
   [spa.semantic.sparql :as sparql])
  (:import [java.net URI URL]))

(def select-query
  (slurp (io/file (io/resource "sparql/select-document.sparql"))))

(defn uuid [] (str (java.util.UUID/randomUUID)))

(defn document-iri
  [document-id]
  (URI. (str (:base-uri env) "documents/" document-id)))

(defn project-iri
  [project-id]
  (URI. (str (:base-uri env) "projects/" project-id)))

(defn select-document
  [project-id document-id]
  (let [document-iri (document-iri document-id)
        project-iri (project-iri project-id)
        bindings {"projectGraphIri" project-iri
                  "documentIri" document-iri}]
    (sparql/result->clj (sparql/select (:sparql-query env) select-query bindings))))

(defn update-document
  [project-id document-id annotations])
