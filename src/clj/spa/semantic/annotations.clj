(ns spa.semantic.annotations
  (:require
   [clojure.java.io :as io]
   [environ.core :refer [env]]
   [spa.semantic.sparql :as sparql])
  (:import [java.net URI URL URLEncoder]))

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

(defn document-iri [^Number project-id document-id]
  (URI. (str (iri-with-base "documents") "projects/" project-id "/documents/" document-id)))
(defn project-iri [^Number project-id]
  (URI. (str (iri-with-base "projects") project-id)))
(defn concept-iri [^String concept-name]
  (URI. (str (iri-with-base "concepts") (URLEncoder/encode concept-name))))

(defn select-document
  [project-id document-id]
  (sparql/result->clj
   (sparql/select
    (:sparql-query env)
    select-query
    {"project"(project-iri project-id)
     "documentRegex" (str "^" (document-iri project-id document-id))})))

(defn- insert-concept-query
  [project-id concept-iri label]
  (sparql/query-with-bindings
   insert-concept-fragment
   {"project" (project-iri project-id)
    "concept" concept-iri
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
    "document" (document-iri project-id document-id)
    "annotation" (uuid-iri)
    "concept" concept
    "descriptionBody" (uuid-iri)
    "description" description}))

(defn insert-concepts
  [project-id concepts]
  (let [queries
        (map (fn [concept] (insert-concept-query project-id (concept-iri concept) concept)) concepts)]
    (sparql/update (:sparql-update env) queries)))

(defn insert-document
  [project-id document-id marginalia])

(defn update-document
  [project-id document-id marginalia])

;; This mangles the SPARQL result into something understood in the rest of the application
;; It's a bit of a hack and I probably need to rethink this.
(defn- to-marginalis
  [mem obj]
  (let [concept (get-in obj [:concept :value])
        label (get-in obj [:conceptLabel :value])
        current (get mem label)
        description (get-in obj [:description :value] (:description current))
        annotation {:target (get-in obj [:target :value])
                    :content (get-in obj [:quote :value])}
        next {:title label
              :concept concept
              :description description
              :annotations
              (if-not (some nil? (vals annotation))
                (conj (get current :annotations []) annotation)
                (get current :annotations []))}]
    (assoc mem label next)))

(defn results->client-json
  [results]
  {:marginalia
   (vals (reduce (fn [mem obj] (to-marginalis mem obj)) {} (get-in results [:results :bindings])))})
