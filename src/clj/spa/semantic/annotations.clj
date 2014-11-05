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
(def insert-highlight-fragment (get-query "insert-highlight-fragment"))
(def insert-description-fragment (get-query "insert-description-fragment"))
(def insert-concept-fragment (get-query "insert-concept-fragment"))

(defn uuid-iri [] (URI. (str "urn:uuid:" (uuid))))
(defn iri-with-base [type] (URI. (str (:base-uri env) type "/")))

(defn document-iri [project-id document-id]
  (URI. (str (iri-with-base "documents") "projects/" project-id "/documents/" document-id)))
(defn project-iri [project-id]
  (URI. (str (iri-with-base "projects") project-id)))
(defn concept-iri [concept-name]
  (URI. (str (iri-with-base "concepts") concept-name)))

(defn select-document
  [project-id document-id]
  (sparql/result->clj
   (sparql/select
    (:sparql-query env)
    select-query
    {"project"(project-iri project-id)
     "documentRegex" (str "^" (document-iri project-id document-id))})))

(defn- insert-concept-query
  [project-id concept-name label]
  (sparql/query-with-bindings
   insert-concept-fragment
   {"project" (project-iri project-id)
    "concept" (concept-iri concept-name)
    "label" label}))

(defn- insert-highlight-query
  ([project-id document-id concept quote suffix prefix]
     (let [document (document-iri project-id document-id)]
       (sparql/query-with-bindings
        insert-highlight-fragment
        {"project" (project-iri project-id)
         "document" document
         "annotation" (uuid-iri)
         "concept" concept
         "target" (URI. (str document "#" (uuid)))
         "selector" (uuid-iri)
         "prefix" prefix
         "suffix" suffix
         "quote" quote})))
  ([project-id document-id concept quote]
     (insert-highlight-query project-id document-id concept quote "" "")))

(defn- insert-description-query
  [project-id document-id concept description]
  (sparql/query-with-bindings
   insert-description-fragment
   {"project" (project-iri project-id)
    "document" (document-iri document-id)
    "annotation" (uuid-iri)
    "concept" concept
    "descriptionBody" (uuid-iri)
    "description" description}))

(defn insert-document
  [project-id document-id marginalia])


;; This is extremely stupid, but it will simply throw out everything and insert new stuff
(defn update-document
  [project-id document-id marginalia])
