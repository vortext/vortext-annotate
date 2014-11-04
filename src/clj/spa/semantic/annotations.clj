(ns spa.semantic.annotations
  (:require
   [clojure.java.io :as io]
   [environ.core :refer [env]]
   [spa.semantic.sparql :as sparql])
  (:import [java.net URI URL]))

(defn uuid [] (str (java.util.UUID/randomUUID)))

(defn get-query
  [name]
  (slurp (io/file (io/resource (str "sparql/" name ".sparql")))))

(def select-query (get-query "select-document"))
(def insert-annotation-fragment (get-query "insert-annotation-fragment"))
(def insert-description-fragment (get-query "insert-description-fragment"))

(defn uuid-iri []
  (URI. (str "urn:uuid:" (uuid))))

(defn iri-with-base
  [type]
  (URI. (str (:base-uri env) type "/" document-id)))

(defn document-iri [document-id] (iri-with-base "documents"))
(defn project-iri [document-id] (iri-with-base "projects"))

(defn select-document
  [project-id document-id]
  (let [document-iri (document-iri document-id)
        project-iri (project-iri project-id)
        bindings {"project" project-iri
                  "_document" document-iri}]
    (sparql/result->clj (sparql/select (:sparql-query env) select-query bindings))))

(defn insert-document
  [project-id document-id marginalia])

(defn update-document
  [project-id document-id marginalia])
